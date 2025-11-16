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
        total = self.rent_weight + self.savings_weight + self.investing_weight

        if total <= 0:
            self.rent_weight = 0.5
            self.savings_weight = 0.3
            self.investing_weight = 0.2