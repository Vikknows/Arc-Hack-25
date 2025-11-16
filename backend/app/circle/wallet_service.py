
import requests
from typing import Optional
from utils import log_event


class CircleWalletService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        
        # Demo-only mock storage
        self.mock_balance = 0.0


    def deposit(self, amount: float) -> bool:
        """Simulate adding USDC to the wallet."""
        self.mock_balance += amount
        log_event(f"[Circle Wallet] Deposited {amount} USDC")
        return True

    def withdraw(self, amount: float) -> bool:
        """Simulate removing USDC from the wallet."""
        if amount > self.mock_balance:
            log_event("[Circle Wallet] Withdraw failed: insufficient balance")
            return False

        self.mock_balance -= amount
        log_event(f"[Circle Wallet] Withdrawn {amount} USDC")
        return True

    def get_balance(self) -> float:
        """Return current wallet balance."""
        return self.mock_balance


    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def create_wallet_real(self):
        """
        Template for using the real Circle Wallet API.
        NOT used in the demo unless you plug in real API key + endpoints.
        """
        if not self.api_key:
            raise RuntimeError("Circle API key not set.")

        # Example endpoint — replace when using real Circle API docs
        response = requests.post(
            "https://api.circle.com/v1/wallets",
            headers=self._get_headers()
        )

        return response.json()
