from pydantic import BaseModel, Field
from typing import Optional

class BucketAllocation(BaseModel):
    rent: float = 0.0
    savings: float = 0.0
    investing: float = 0.0
    emergency: float = 0.0


class UserSettings(BaseModel):
    instant_percentage: float = Field(0.5, ge=0, le=1)
    max_wait_time_minutes: int = 30
    risk_level: str = "safe"

class UserState(BaseModel):
    user_id: str

    total_salary_received: float = 0.0

    instant_bucket: float = 0.0
    optimised_bucket: float = 0.0

    allocation: BucketAllocation = BucketAllocation()
    settings: UserSettings = UserSettings()

    def available_balance(self) -> float:
        return self.instant_bucket




