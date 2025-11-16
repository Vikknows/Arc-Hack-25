from fastapi import APIRouter
from app.controllers import optimisation_controller

router = APIRouter()

@router.get("/status")
def optimisation_status():
    return optimisation_controller.get_status()

