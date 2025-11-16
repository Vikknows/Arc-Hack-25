from fastapi import APIRouter
from pydantic import BaseModel
from app.controllers import withdraw_controller

router = APIRouter()

class WithdrawRequest(BaseModel):
    amount: float

@router.post("/")
def withdraw(payload: WithdrawRequest):
    return withdraw_controller.withdraw(payload.amount)
