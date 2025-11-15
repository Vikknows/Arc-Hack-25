"""
SalaryService
-------------
Handles:
- salary deposits
- automatic splitting into instant + optimisation
"""

from typing import Dict
from .user_state import default_user_state

class SalaryService:

    def __init__(self, state = default_user_state):
        self.state = state
    
    def deposit_salary(self, user_id: str, amount: float) -> Dict:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        
        split = self.state.apply_salary_split(user_id, amount)

        return {
            "status": "ok",
            "deposited": amount,
            "instant_bucket": split["instant"],
            "optimised_bucket": split["optimised"],
        }
    

salary_service = SalaryService()
