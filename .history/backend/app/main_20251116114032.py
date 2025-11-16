from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


from app.services.routing_service import (
    UserSettings,
    UserState,
    allocate_salary,
    optimisation_tick,
    override_convert_now,
    MarketCondition,
    state_to_dict,
)
from app.services.circle_wallets_service import get_crosspay_wallet_metadata

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# Simple in-memory state (fine for a hackathon)
# -------------------------------------------------
settings = UserSettings(
    instant_percent=0.4,        # default 40% instant
    max_wait_seconds=24 * 3600, # default 1 day wait
)

state = UserState()


# -------------------------------------------------
# Request models
# -------------------------------------------------
class DepositRequest(BaseModel):
    amount: float
    fx_rate_at_deposit: float

    # optional overrides for settings
    instant_percent: float | None = None
    max_wait_seconds: int | None = None
    rent_weight: float | None = None
    savings_weight: float | None = None
    investing_weight: float | None = None


class OptimiseRequest(BaseModel):
    market_condition: MarketCondition
    current_fx_rate: float


# -------------------------------------------------
# Routes
# -------------------------------------------------

@app.get("/api/circle/wallet")
def get_circle_wallet():
    """
    Used by frontend to show the Circle dev-controlled wallet
    backing CrossPay.
    """
    return get_crosspay_wallet_metadata()


@app.get("/api/state")
def get_current_state():
    """
    Return current balances and buckets for UI charts.
    """
    return state_to_dict(state)


@app.post("/api/salary/deposit")
def deposit_salary(req: DepositRequest):
    """
    Called when a new salary arrives.
    - Optionally updates user settings from the request
    - Splits amount into instant vs optimised
    - Updates buckets and FX baseline
    """

    # Update settings if overrides are provided
    if req.instant_percent is not None:
        settings.instant_percent = req.instant_percent
    if req.max_wait_seconds is not None:
        settings.max_wait_seconds = req.max_wait_seconds
    if req.rent_weight is not None:
        settings.rent_weight = req.rent_weight
    if req.savings_weight is not None:
        settings.savings_weight = req.savings_weight
    if req.investing_weight is not None:
        settings.investing_weight = req.investing_weight

    return allocate_salary(
        amount=req.amount,
        settings=settings,
        state=state,
        fx_rate_at_deposit=req.fx_rate_at_deposit,
    )


@app.post("/api/optimise")
def run_optimisation(req: OptimiseRequest):
    """
    Called when:
    - your backend "tick" runs, or
    - the user clicks an 'optimise now' button (market-aware)
    """
    return optimisation_tick(
        settings=settings,
        state=state,
        market_condition=req.market_condition,
        current_fx_rate=req.current_fx_rate,
    )


@app.post("/api/override")
def override_convert_all():
    """
    Called when the user hits 'convert everything now'.
    Ignores market condition and wait time.
    """
    # for demo, you can treat FX as 1.0 or let frontend send it later
    current_fx_rate = 1.0

    return override_convert_now(
        settings=settings,
        state=state,
        current_fx_rate=current_fx_rate,
    )
