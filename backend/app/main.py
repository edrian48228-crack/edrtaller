from __future__ import annotations

import os
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Annotated

from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from PIL import Image, UnidentifiedImageError
from magic_hour import Client

API_KEY = os.getenv("MAGIC_HOUR_API_KEY", "").strip()
ACCESS_USER = os.getenv("SPRITE_LAB_ACCESS_USER", "spritelab").strip()
ACCESS_PASSWORD = os.getenv("SPRITE_LAB_ACCESS_PASSWORD", "").strip()
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
MAX_ACTIVE_JOBS = int(os.getenv("MAX_ACTIVE_JOBS", "1"))
BASE_DIR = Path(os.getenv("SPRITE_LAB_DATA_DIR", "/tmp/sprite-lab"))
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

app = FastAPI(title="SPRITE LAB private backend", version="0.2.0")
security = HTTPBasic()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

_jobs: dict[str, dict] = {}
_lock = Lock()


def require_access(credentials: Annotated[HTTPBasicCredentials, Depends(security)]):
    if not ACCESS_PASSWORD:
        raise HTTPException(status_code=503, detail="El servidor no tiene configurada la contraseña privada.")
    user_ok = secrets.compare_digest(credentials.username, ACCESS_USER)
    pass_ok = secrets.compare_digest(credentials.password, ACCESS_PASSWORD)
    if not (user_ok and pass_ok):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.", headers={"WWW-Authenticate": "Basic"})
    return credentials.username


def set_job(job_id: str, **values):
    with _lock:
        if job_id in _jobs:
            _jobs[job_id].update(values)


def active_jobs() -> int:
    with _lock:
        return sum(job["status"] in {"queued", "processing"} for job in _jobs.values())


def make_video(job_id: str, image_path: Path, prompt: str, model: str, duration: int, resolution: str):
    job_output = OUTPUT_DIR / job_id
    job_output.mkdir(parents=True, exist_ok=True)
    try:
        set_job(job_id, status="processing")
        client = Client(token=API_KEY)
        result = client.v1.image_to_video.generate(
            assets={"image_file_path": str(image_path)},
            end_seconds=float(duration),
            style={"prompt": prompt},
            audio=False,
            model=model,
            name=f"SPRITE LAB {job_id[:8]}",
            resolution=resolution,
            wait_for_completion=True,
            download_outputs=True,
            download_directory=str(job_output),
        )
        paths = getattr(result, "downloaded_paths", None) or []
        candidates = [Path(p) for p in paths if str(p).lower().endswith((".mp4", ".mov", ".webm"))]
        if not candidates:
            candidates = [p for p in job_output.iterdir() if p.is_file() and p.suffix.lower() in {".mp4", ".mov", ".webm"}]
        if not candidates:
            raise RuntimeError("La generación terminó pero no se encontró el vídeo descargado.")
        video = max(candidates, key=lambda p: p.stat().st_mtime)
        final_name = f"{job_id}{video.suffix.lower()}"
        final_path = job_output / final_name
        if video.resolve() != final_path.resolve():
            video.replace(final_path)
        set_job(job_id, status="complete", video_filename=final_name)
    except Exception as exc:
        # No exponer trazas, cabeceras ni información de autenticación al navegador.
        set_job(job_id, status="error", error=f"Magic Hour devolvió un error ({type(exc).__name__}). Comprueba la clave y el saldo API en el panel privado.")
    finally:
        image_path.unlink(missing_ok=True)


@app.get("/health")
def health():
    return {"ok": True, "service": "sprite-lab-api", "version": "0.2.0"}


@app.post("/api/v1/videos", status_code=202)
async def create_video(
    background: BackgroundTasks,
    _: Annotated[str, Depends(require_access)],
    image: Annotated[UploadFile, File(...)],
    prompt: Annotated[str, Form(...)],
    model: Annotated[str, Form()] = "ltx-2.5",
    duration_seconds: Annotated[int, Form()] = 5,
    resolution: Annotated[str, Form()] = "480p",
):
    if not API_KEY:
        raise HTTPException(status_code=503, detail="Falta configurar MAGIC_HOUR_API_KEY en el servidor.")
    if active_jobs() >= max(1, MAX_ACTIVE_JOBS):
        raise HTTPException(status_code=429, detail="Ya hay una generación en curso. Espera a que termine.")
    if image.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(status_code=415, detail="Formato no admitido. Usa PNG, JPG o WebP.")
    if model not in {"ltx-2.5", "wan-2.2"}:
        raise HTTPException(status_code=400, detail="Motor no admitido en esta versión.")
    if duration_seconds != 5:
        raise HTTPException(status_code=400, detail="La primera versión limita la generación a 5 segundos para controlar el coste.")
    if resolution != "480p":
        raise HTTPException(status_code=400, detail="La primera versión usa 480p.")
    prompt = prompt.strip()
    if not prompt or len(prompt) > 4000:
        raise HTTPException(status_code=400, detail="El prompt debe contener entre 1 y 4000 caracteres.")

    job_id = str(uuid.uuid4())
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}[image.content_type]
    image_path = UPLOAD_DIR / f"{job_id}{ext}"
    max_bytes = max(1, MAX_UPLOAD_MB) * 1024 * 1024
    data = await image.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"La imagen supera el límite de {MAX_UPLOAD_MB} MB.")
    image_path.write_bytes(data)
    try:
        with Image.open(image_path) as img:
            img.verify()
    except (UnidentifiedImageError, OSError):
        image_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida.")

    with _lock:
        _jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "model": model,
            "duration_seconds": duration_seconds,
            "resolution": resolution,
            "error": None,
            "video_filename": None,
        }
    background.add_task(make_video, job_id, image_path, prompt, model, duration_seconds, resolution)
    return {"job_id": job_id, "status": "queued"}


@app.get("/api/v1/videos/{job_id}")
def video_status(job_id: str, _: Annotated[str, Depends(require_access)]):
    with _lock:
        job = dict(_jobs[job_id]) if job_id in _jobs else None
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado. El servicio pudo reiniciarse; vuelve a consultar el panel.")
    if job["status"] == "complete":
        job["video_url"] = f"/api/v1/videos/{job_id}/download"
    return job


@app.get("/api/v1/videos/{job_id}/download")
def download_video(job_id: str, _: Annotated[str, Depends(require_access)]):
    with _lock:
        job = dict(_jobs[job_id]) if job_id in _jobs else None
    if not job or job["status"] != "complete" or not job.get("video_filename"):
        raise HTTPException(status_code=404, detail="El vídeo todavía no está disponible.")
    path = OUTPUT_DIR / job_id / job["video_filename"]
    if not path.is_file():
        raise HTTPException(status_code=404, detail="El archivo ya no está disponible. Descárgalo cuando termine la generación.")
    media = "video/mp4" if path.suffix == ".mp4" else "video/webm"
    return FileResponse(path, media_type=media, filename=f"sprite-lab-{job_id}{path.suffix}")
