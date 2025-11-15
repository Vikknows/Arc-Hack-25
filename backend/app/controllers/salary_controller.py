from fastapi import APIRouter
from pydantic import BaseModel
from state.salary import salary_service

salary_router = APIRouter(prefix="/salary", tags=["Salary"])

class SalaryDepositRequest(BaseModel):
    amount: float

@salary_router.post("/deposit")
def deposit_salary(payload: SalaryDepositRequest,user_id: str = "demo-user"):
    return salary_service.deposit_salary(user_id, payload.amount)

