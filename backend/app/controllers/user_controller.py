from fastapi import APIRouter
from state.user_state import default_user_state

user_router =  APIRouter(prefix = "/user", tags=["User"])

@user_router.get("/state")

def get_user_state(user_id: str = "demo-user"):

    return default_user_state.get_state(user_id)


