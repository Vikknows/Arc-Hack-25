"""
UserStateStore
---------------
Keeps all user-related balances & settings in-memory for the demo.
A real version would plug into a DB (Postgres, Dynamo, etc).

State stored per user:
- salary:
    * total_received
    * instant_bucket
    * optimised_bucket
- allocations (rent/savings/investing/emergency)
- settings:
    * instant_percent (0–100)
    * max_wait_time
    * risk_level
"""

import time
from typing import Dict, Any

class userStateScore:

    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {}

    def ensure_user(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._users:
            self._users[user_id] = {
                "salary": {
                    "total_received": 0.0,
                    "instant_bucket": 0.0,
                    "optimised_bucket": 0.0,
                },
                "allocations": {
                    "rent": 0.4,
                    "savings": 0.2,
                    "investing": 0.3,
                    "emergency": 0.1,

                },
                "settings": {
                    "instant_percent": 30,
                    "max_wait_time": 24,
                    "risk_level": "safe",
                },
                "optimisation": {
                    "pending": 0.0,
                    "converted": 0.0,
                    "last_update": time.time(),
                }
            }
        return self._users[user_id]
    
    def get_state(self,user_id: str) -> dict[str, Any]:
        return self.ensure_user(user_id)
    
    def update_settings(self,user_id: str, new_settings: Dict[str, Any]):
        user = self.ensure_user(user_id)
        user["settings"].update(new_settings)
        return user["settings"]
    
    def apply_salary_split(self, user_id: str, amount: float) -> Dict[str, Any]:
        """splits salary into:
          -optimised buckets
          -instant buckets 
        based on user settings"""

        user = self.ensure_user(user_id)
        pct = user["settings"]["instant_percent"] / 100

        instant = amount * pct
        optimised = amount - instant

        user["salary"]["total_recevied"] += amount
        user["salary"]["instant_bucket"] += instant
        user["salary"]["optimised_bucket"] += optimised

        user["optimisation"]["pending"] += optimised

        return {"instant": instant,
                "optimised": optimised
        }

    def convert_optimised(self,user_id: str, amount: float):
        
        """Converts pending optimisation -> instantly available"""

        user = self.ensure_user(user_id)
        opt = user["optimisation"]
        
        opt["pending"] -= amount
        opt["converted"] += amount
        user["salary"]["instant_bucket"] += amount
        opt["last_update"] = time.time()

        return {"converted": amount,
                "pending_left": opt["spending"]
        }
    
    def withdraw(self,user_id: str,amount: float) -> bool:
        
        "Simple decrease in miney available from the instant bucket"

        user = self.ensure_user(user_id)
        available = user["salary"]["instant_bucket"]

        if amount > available:
            raise ValueError("Insufficient funds")
        
        user["salary"]["instant_bucket"] -= amount
        return True

default_user_state = userStateScore()


