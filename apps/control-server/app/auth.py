import os
from typing import Optional

from fastapi import Header, HTTPException


def _valid_keys() -> Optional[set]:
    raw = os.getenv("CONTROL_API_KEYS", "").strip()
    if not raw:
        return None
    return {k.strip() for k in raw.split(",") if k.strip()}


async def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    keys = _valid_keys()
    if keys is None:
        return
    if not x_api_key or x_api_key not in keys:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
