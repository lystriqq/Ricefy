import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from app.models.rice_config import GenerateRequest
from app.services import generator, storage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["generation"])


class GenerateResponse(BaseModel):
    status: str
    download_url: str


def _get_supabase() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _set_status(client: Client, rice_id: str, status: str) -> None:
    client.table("rices").update({"status": status}).eq("id", rice_id).execute()


def _mark_failed(client: Client, rice_id: str) -> None:
    try:
        _set_status(client, rice_id, "failed")
    except Exception:
        logger.exception("Failed to mark rice %s as failed", rice_id)


@router.post("/generate", response_model=GenerateResponse)
def generate_rice_endpoint(request: GenerateRequest) -> GenerateResponse:
    client = _get_supabase()

    # 1. Verify ownership
    result = (
        client.table("rices")
        .select("id, status, user_id")
        .eq("id", request.rice_id)
        .eq("user_id", request.user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Rice not found or access denied")

    # 2. Verify status allows generation
    current_status = result.data[0]["status"]
    if current_status not in ("draft", "paid"):
        raise HTTPException(
            status_code=400,
            detail=f"Rice cannot be generated from status '{current_status}'",
        )

    # 3. Mark as generating
    _set_status(client, request.rice_id, "generating")
    logger.info("Rice %s → generating", request.rice_id)

    # 4. Generate → upload → return (storage.upload_zip sets status=ready in DB)
    try:
        zip_path = generator.generate_rice(request.config)
        download_url = storage.upload_zip(zip_path, request.rice_id)
        logger.info("Rice %s → ready, url=%s", request.rice_id, download_url)
        return GenerateResponse(status="ready", download_url=download_url)
    except Exception:
        logger.exception("Generation failed for rice %s", request.rice_id)
        _mark_failed(client, request.rice_id)
        raise HTTPException(status_code=500, detail="Generation failed")
