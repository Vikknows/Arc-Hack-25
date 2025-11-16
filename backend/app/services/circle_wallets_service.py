import os
from .circle_client import get_wallets_api

CROSSPAY_WALLET_SET_ID = os.getenv("CROSSPAY_WALLET_SET_ID")
CROSSPAY_WALLET_ID = os.getenv("CROSSPAY_WALLET_ID")
CROSSPAY_WALLET_ADDRESS = os.getenv("CROSSPAY_WALLET_ADDRESS")


def get_crosspay_wallet_metadata():
    """
    Return the wallet info that frontend can display:
    - wallet id
    - address
    - chain (hard-code MATIC-AMOY for now)
    """
    return {
        "walletSetId": CROSSPAY_WALLET_SET_ID,
        "walletId": CROSSPAY_WALLET_ID,
        "address": CROSSPAY_WALLET_ADDRESS,
        "blockchain": "MATIC-AMOY",
    }


def fetch_crosspay_wallet_from_circle():
    """
    Optional: actually call Circle to confirm the wallet exists.

    This is mainly to prove to judges that we can hit Circle Wallets
    from our backend. You can call this in a debug route or in logs.
    """
    if not CROSSPAY_WALLET_ID:
        raise RuntimeError("CROSSPAY_WALLET_ID not set in env")

    wallets_api = get_wallets_api()
    resp = wallets_api.get_wallet(CROSSPAY_WALLET_ID)
    # You can log resp or return it raw
    return resp.to_dict()

