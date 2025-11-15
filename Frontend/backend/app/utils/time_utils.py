import time
from datetime import datetime

def current_timestamp() -> float:
    """Returns the current UNIX timestamp."""
    return time.time()

def now_iso() -> str:
    """Returns current UTC time in ISO 8601 format."""
    return datetime.utcnow().isoformat() + "Z"

