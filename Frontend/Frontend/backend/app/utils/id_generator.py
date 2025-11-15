import uuid

def generate_id(prefix: str = "") -> str:
    """
    Generates a unique ID string.
    Optionally adds a prefix (e.g., tx_123...).
    """
    unique = uuid.uuid4().hex
    return f"{prefix}_{unique}" if prefix else unique
