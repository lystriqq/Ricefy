import logging
import os
from pathlib import Path

from storage3.exceptions import StorageApiError
from supabase import Client, create_client

logger = logging.getLogger(__name__)

BUCKET = "rice-zips"
SIGNED_URL_TTL = 7 * 24 * 60 * 60  # 7 days


def _get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def _ensure_bucket(client: Client) -> None:
    try:
        client.storage.get_bucket(BUCKET)
    except StorageApiError:
        client.storage.create_bucket(BUCKET, options={"public": False})
        logger.info("Created Supabase Storage bucket '%s'", BUCKET)


def upload_zip(zip_path: Path, rice_id: str) -> str:
    """
    Upload *zip_path* to Supabase Storage (bucket: rice-zips), generate a
    7-day signed URL, update the rice row to status='ready' and zip_url=<url>,
    then delete the local file.  Returns the signed URL.

    The local zip is always deleted in the finally block; errors propagate to
    the caller.
    """
    client = _get_client()
    _ensure_bucket(client)

    storage_path = f"{rice_id}.zip"

    try:
        with open(zip_path, "rb") as fh:
            client.storage.from_(BUCKET).upload(
                path=storage_path,
                file=fh,
                file_options={"content-type": "application/zip"},
            )
        logger.info("Uploaded zip → %s/%s", BUCKET, storage_path)

        signed = client.storage.from_(BUCKET).create_signed_url(
            storage_path, SIGNED_URL_TTL
        )
        url: str = signed["signedURL"]
        logger.info("Signed URL generated (7 days): %s", url)

        client.table("rices").update(
            {"status": "ready", "zip_url": url, "zip_path": storage_path}
        ).eq("id", rice_id).execute()
        logger.info("Rice %s → status=ready", rice_id)

        return url
    finally:
        zip_path.unlink(missing_ok=True)
        logger.debug("Deleted local zip: %s", zip_path)
