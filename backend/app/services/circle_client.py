import os
import certifi
from dotenv import load_dotenv

from circle.web3 import utils
from circle.web3 import developer_controlled_wallets

# -------------------------------------------------
# Load .env so env variables are available
# -------------------------------------------------
# This will look for a .env file in the current working directory
# (backend/) when you run uvicorn from there.
load_dotenv()

# Ensure SSL works on macOS
os.environ["SSL_CERT_FILE"] = certifi.where()

CIRCLE_API_KEY = os.getenv("CIRCLE_API_KEY")
ENTITY_SECRET = os.getenv("ENTITY_SECRET")

if not CIRCLE_API_KEY or not ENTITY_SECRET:
    raise RuntimeError("Missing CIRCLE_API_KEY or ENTITY_SECRET in environment variables.")


def get_circle_client():
    """
    Returns a configured Circle developer-controlled wallets client,
    using the registered entity secret.
    """
    client = utils.init_developer_controlled_wallets_client(
        api_key=CIRCLE_API_KEY,
        entity_secret=ENTITY_SECRET,
    )
    return client


def get_wallets_api():
    client = get_circle_client()
    return developer_controlled_wallets.WalletsApi(client)
