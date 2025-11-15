"""
WithdrawService
---------------
Withdraws from the user's instant bucket.
"""

from .user_state import default_user_state

class WithdrawService:

    def __init__(self, state = default_user_state):
        self.state = state

    def withdraw(self, user_id: str, amount: float):
        if amount <= 0:
            raise ValueError("withdrawal must be positive")
        self.state.withdraw(user_id, amount)

        return {"status": "success",
                 "amount": amount
        }

withdraw_service = WithdrawService()
