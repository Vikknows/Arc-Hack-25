from fastapi import APIRouter
from pydantic import BaseModel
from app.controllers import user_controller

router = APIRouter()

class UserSettingsUpdate(BaseModel):
    instant_percent: float
    max_wait_time: int
    risk_level: str | None = None
    buckets: dict

@router.get("/state")
def get_user_state():
    return user_controller.get_user_state()

@router.post("/settings")
def update_user_settings(payload: UserSettingsUpdate):
    return user_controller.update_user_settings(payload)

