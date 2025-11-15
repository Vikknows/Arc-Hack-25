"""
OptimisationService
-------------------
Handles:
- tracking pending optimisation
- returning progress/status
- converting funds now
"""

import time
from typing import Dict
from .user_state import default_user_state

class OptimisationService:

    def __init__(self, state = default_user_state):
        self.state = state
    
    def get_status(self, user_id: str) -> Dict:
        user = self.state.get_state(user_id)
        opt = user["optimisation"]

        elapsed = time.time() - opt["last_update"]
        max_wait = user["settings"]["max_wait_time"] * 3600

        progress = min(1.0, elapsed / max_wait) if max_wait > 0 else 1.0

        return{
            "pending": opt["pending"],
            "converted": opt["converted"],
            "progress": progress,
            "time_left": max(0,max_wait - elapsed),
        }
    
    def convert_now(self, user_id: str,) -> Dict:
        user = self.state.get_state(user_id)
        pending = user["optimisation"]["pending"]

        if pending <= 0:
            return {"converted": 0}
        
        return self.state.convert_optimised(user_id,pending)
    
optimisation_service = OptimisationService()
