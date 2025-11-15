from pydantic import BaseModel, Field

class SalaryDepositRequest(BaseModel):
    new_total_salary: float
    instant_added: float
    optimised_added: float


class OptimisationStatus(BaseModel):
    pending_amount: float
    converted_amount: float
    time_remaining_seconds: int

class ConvertNowRequest(BaseModel):
    convert_all: bool

class ConvertNowResponse(BaseModel):
    convert_amount: float
    remaining_optimised: float
    new_instant_balance: float



class UpdateSettingRequest(BaseModel):
    instant_percentage: float | None = Field(None,ge=0,le=1)
    max_wait_time_minutes: int | None = None
    risk_level: str | None = None

class UpdateSettingResponse(BaseModel):
    updated: bool
    settings: dict



class WithdrawalsRequest(BaseModel):
    amount: float = Field(...,gt = 0)

class WithdrawResponse(BaseModel):
    success: bool
    withdrawn_amount: float
    new_balance: float

