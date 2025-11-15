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

def _update_baseline_fx_rate(state: UserState, deposit_amount: float, fx_rate_at_deposit: float):
    """
    Maintain a weighted average baseline FX rate across multiple deposits.
    This lets us estimate what happens if everything was converted instantly at deposit time.
    """

    if deposit_amount <= 0:
        return
    if state.baseline_fx_rate is None or state.total_salary_received <= 0:
        state.baseline_fx_rate = fx_rate_at_deposit
        return
    
    previous_total = state.total_salary_received
    previous_rate = state.baseline_fx_rate
    new_total = previous_total + deposit_amount

    weighted_rate = ((previous_rate * previous_total) + (fx_rate_at_deposit * deposit_amount)) / new_total
    state.baseline_fx_rate = weighted_rate

def _allocate_to_buckets(amount: float, settings: UserSettings, state: UserState):
    """
    Allocate a converted amount into rent/savings/investing buckets, according to user preferences.
    """

    if amount <= 0:
        return
    
    settings.normalise_bucket_weights()

    state.rent_bucket += amount * settings.rent_weight
    state.savings_bucket += amount * settings.savings_weight
    state.investing_bucket += amount * settings.investing_weight

def _update_fx_gain(state: UserState, converted_amount: float, current_fx_rate: float):
    """
    Estimate the extra value the user gained vs converting instantly
    """

    if converted_amount <= 0:
        return
    if state.baseline_fx_rate is None:
        return
    
    extra = converted_amount * (current_fx_rate - state.baseline_fx_rate)
    state.extra_gained_vs_instant += extra

def state_to_dict(state: UserState):
    """
    Turn the state object into a dictionary for JSON responses.
    """
    return {
        "instantAvailable": state.instant_available,
        "optimisedPending": state.optimised_pending,
        "rentBucket": state.rent_bucket,
        "savingsBucket": state.savings_bucket,
        "investingBucket": state.investing_bucket,
        "totalSalaryReceived": state.total_salary_received,
        "extraGainedVsInstant": state.extra_gained_vs_instant,
        "baselineFxRate": state.baseline_fx_rate if state.baseline_fx_rate is not None else 0.0,
    }

def allocate_salary(amount: float, settings: UserSettings, state: UserState, fx_rate_at_deposit: float):
    """
    Handle a new salary deposit:
    - Split into instant vs optimised parts
    - Update baseline FX rate and totals
    """

    if amount <= 0:
        return {
            "deposited": 0.0,
            "converted_this_run": 0.0,
            **state_to_dict(state),
        }
    
    now = datetime.utcnow()
    state.last_deposit_time = now

    # Update total salary and baseline FX
    state.total_salary_received += amount
    _update_baseline_fx_rate(state, deposit_amount=amount, fx_rate_at_deposit=fx_rate_at_deposit)

    # Split into instant and optimised
    instant_amount = amount * settings.instant_percent
    optimised_amount = amount - instant_amount


    state.instant_available += instant_amount
    state.optimised_pending += optimised_amount

    return {
        "deposited": amount,
        "converted_this_run": 0.0,
        **state_to_dict(state),
    }

def optimisation_tick(
    settings: UserSettings,
    state: UserState,
    market_condition: MarketCondition,
    current_fx_rate: float,
    now: datetime = None,
):
    """
    Run an optimisation step:
    - Decide how much of the optimised amount to convert
    - Based on market condition and max wait time
    """

    if now is None:
        now = datetime.utcnow()

    # If no deposit yet or nothing to optimise, do nothing
    if state.last_deposit_time is None or state.optimised_pending <= 0:
        return {
            "deposited": 0.0,
            "converted_this_run": 0.0,
            **state_to_dict(state),
        }

    time_since_deposit = (now - state.last_deposit_time).total_seconds()
    max_wait = settings.max_wait_seconds

    # Decide what fraction to convert
    if time_since_deposit >= max_wait:
        # Max wait time reached: convert everything
        convert_fraction = 1.0
    else:
        # Otherwise decide based on market condition
        if market_condition == MarketCondition.GOOD:
            convert_fraction = 0.5  # convert 50% of remaining
        elif market_condition == MarketCondition.OK:
            convert_fraction = 0.2  # convert 20% of remaining
        else:  # BAD
            convert_fraction = 0.0  # convert nothing

    amount_to_convert = state.optimised_pending * convert_fraction

    # Update balances
    state.optimised_pending -= amount_to_convert
    state.instant_available += amount_to_convert

    # Allocate to buckets and update FX gain
    _allocate_to_buckets(amount_to_convert, settings, state)
    _update_fx_gain(state, converted_amount=amount_to_convert, current_fx_rate=current_fx_rate)

    return {
        "deposited": 0.0,
        "converted_this_run": amount_to_convert,
        **state_to_dict(state),
    }


def override_convert_now(settings: UserSettings, state: UserState, current_fx_rate: float):
    """
    User presses a button to convert everything now:
    - ignore conditions and max wait
    - move all optimised funds to instant
    """

    amount_to_convert = state.optimised_pending

    if amount_to_convert <= 0:
        return {
            "deposited": 0.0,
            "converted_this_run": 0.0,
            **state_to_dict(state),
        }
    
    state.optimised_pending = 0.0
    state.instant_available += amount_to_convert

    _allocate_to_buckets(amount_to_convert, settings, state)
    _update_fx_gain(state, converted_amount=amount_to_convert, current_fx_rate=current_fx_rate)

    return {
        "deposited": 0.0,
        "converted_this_run": amount_to_convert,
        **state_to_dict(state),
    }

if __name__ == "__main__":
    # Quick manual test to see behaviour in the terminal
    settings = UserSettings(
        instant_percent=0.4,          # 40% instant, 60% optimised
        max_wait_seconds=24 * 3600,   # 1 day
    )
    state = UserState()

    print("=== New salary deposit ===")
    resp = allocate_salary(
        amount=1000.0,
        settings=settings,
        state=state,
        fx_rate_at_deposit=1.00,
    )
    print(resp)

    print("\n=== Optimisation tick with GOOD market ===")
    resp = optimisation_tick(
        settings=settings,
        state=state,
        market_condition=MarketCondition.GOOD,
        current_fx_rate=1.02,
    )
    print(resp)

    print("\n=== User override: convert everything now ===")
    resp = override_convert_now(
        settings=settings,
        state=state,
        current_fx_rate=1.01,
    )
    print(resp)
