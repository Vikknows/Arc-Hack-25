from __future__ import annotations

from dataclasses import dataclass # Used for defining simple classes for data without __init__
from datetime import datetime # Used to track when deposits happen
from enum import Enum # Used for MarketCondition (GOOD/OK/BAD)
from typing import Dict, Optional # Used for Type hints: Dict[str, float] - (value can also be None)

class MarketCondition(str, Enum):
    GOOD = "GOOD"
    OK = "OK"
    BAD = "BAD"

    """
    Using an enum with three possible values: GOOD/OK/BAD.
    Use this in optimisation logic to decide how aggresively to convert money from optimised to instant.
    Enums give autocompletion, safety and clearer code instead of passing raw strings.
    """

@dataclass
class UserSettings:
    instant_percent: float # The fraction of each salary that should be available immediately.
    max_wait_seconds: int # The time a user is willing to wait for optimisation (in seconds)
    rent_weight: float = 0.5 # The share of converted funds that go to rent
    savings_weight: float = 0.3 # The share of converted funds that go to savings.
    investing_weight: float = 0.2 # The share of converted funds that go to investing

    def normalise_bucket_weights(self):
        """
        Ensures the weights add up to 1.0 or 100% to protect us if weird values are set.
        """
        total = self.rent_weight + self.savings_weight + self.investing_weight

        if total <= 0:
            self.rent_weight = 0.5
            self.savings_weight = 0.3
            self.investing_weight = 0.2
            return

        self.rent_weight /= total
        self.savings_weight /= total
        self.investing_weight /= total

@dataclass
class UserState:
    """
    Represents current situation for one user in the optimiser.
    """

    instant_available: float = 0.0 # Represents how much USDC they can use right nowe
    optimised_pending: float = 0.0 # Represents how much is still waiting in the optimised lane
    
    # Represents allocations of converted funds
    rent_bucket: float = 0.0
    savings_bucket: float = 0.0
    investing_bucket: float = 0.0

    # Represents time tracking for optimisation logic
    last_deposit_time: Optional[datetime] = None
    total_salary_received: float = 0.0

    # Rpresents FX Comparison compared to the idea of converting everything instantly
    baseline_fx_rate: Optional[float] = None
    extra_gained_vs_instant: float = 0.0
