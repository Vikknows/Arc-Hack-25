from fastapi import APIRouter
from state.optimisation import optimisation_service

optimisation_router = APIRouter(prefix="/optimisation", tags=["Optimisation"])


@optimisation_router.get("/status")
def get_status(user_id: str = "demo-user"):
    return optimisation_service.get_status(user_id)

@optimisation_router.post("/convert/now")
def convert_now(user_id: str = "demo-user"):
    return optimisation_service.convert_now(user_id)

