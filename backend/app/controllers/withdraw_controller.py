from fastapi import APIRouter
from pydantic import BaseModel
from state.withdraw import withdraw_service

withdraw_router = APIRouter(prefix="/withdraw", tags=["Withdraw"])

class WithdrawRequest(BaseModel):
    amount: float

@withdraw_router.post("")

def withdraw(payload: WithdrawRequest, user_id: str = "demo-user"):
    return withdraw_service.withdraw(user_id, payload.amount)

