"""
AllocationService
-----------------
Allows changing user allocation percentages.
"""

from typing import Dict
from .user_state import default_user_state

class AllocationService:

    def __init__(self, state = default_user_state):
        self.state = state
    
    def update_allocations(self, user_id: str, new_alloc: Dict[str, float]):
        """
        Expects something like:
        { "rent": 0.4, "savings": 0.2, "investing": 0.3, "emergency": 0.1 }
        Must sum to ~1.0
        """
        
        if abs(sum(new_alloc.values()) - 1.0) > 0.001:
            raise ValueError("Allocations must sum to 1.0")
        
        user = self.state.get_state(user_id)
        user["allocations"] = new_alloc

        return new_alloc
    
allocation_service = AllocationService()

