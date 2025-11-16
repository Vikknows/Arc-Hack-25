from fastapi import APIRouter
from pydantic import BaseModel
from app.controllers import salary_controller

router = APIRouter()

class SalaryDeposit(BaseModel):
    amount: float

@router.post("/deposit")
def deposit_salary(payload: SalaryDeposit):
    return salary_controller.deposit_salary(payload.amount)

from fastapi import APIRouter
from pydantic import BaseModel
from app.controllers import salary_controller

router = APIRouter()

class SalaryDeposit(BaseModel):
    amount: float

@router.post("/deposit")
def deposit_salary(payload: SalaryDeposit):
    return salary_controller.deposit_salary(payload.amount)
