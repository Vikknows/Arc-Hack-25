from fastapi import APIRouter
from pydantic import BaseModel
from state.settings import settings_service

settings_router = APIRouter(prefix="/user/settings", tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    instant_percent: int | None = None
    max_wait_time: int | None = None
    risk_level: int | None = None


@settings_router.post("")

def update_settings(payload: SettingsUpdateRequest, user_id: str = "demo-user"):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    return settings_service.update(user_id, updates)


