"""
SettingsService
---------------
Updates user-defined configuration for:
- instant %
- max wait time
- risk level
"""

from typing import Dict
from .user_state import default_user_state

class SettingsService:

    def __init__(self, state = default_user_state):
        self.state = state
    
    def update(self, user_id: str, new_settings: Dict):
        return self.state.update_settings(user_id, new_settings)
    
settings_service = SettingsService()
