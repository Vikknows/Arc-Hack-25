import os
import certifi

from circle.web3 import utils
from circle.web3 import developer_controlled_wallets

# ---------------------------------------------------------
# SSL FIX so Circle HTTPS works on macOS
# ---------------------------------------------------------
os.environ["SSL_CERT_FILE"] = certifi.where()

# ---------------------------------------------------------
# Circle credentials (you already have these working)
# ---------------------------------------------------------
CIRCLE_API_KEY = "TEST_API_KEY:75f913693ef58dcb1c07ed0ca61553f1:0c7866c1a3160fbccde384f74ef103b6"
ENTITY_SECRET = "acece31b2796974eebb1ea56d2cd9564d43baef6b638831583041b1bb87cfcd0"


def main():
    print("=== Initialising Circle Developer-Controlled Wallets client ===")
    client = utils.init_developer_controlled_wallets_client(
        api_key=CIRCLE_API_KEY,
        entity_secret=ENTITY_SECRET,
    )

    api = developer_controlled_wallets.WalletSetsApi(client)

    print("=== Creating Wallet Set: CrossPay Wallet Set ===")
    try:
        request = developer_controlled_wallets.CreateWalletSetRequest.from_dict({
            "name": "CrossPay Wallet Set",
        })

        response = api.create_wallet_set(request)
        print("\n=== Wallet Set Created Successfully ===")
        print(response)

        # Try to pull out the ID nicely
        try:
            wallet_set = response.data.wallet_set
            print("\nWallet Set ID:")
            print(wallet_set.actual_instance.id)
        except Exception:
            print("\nRaw response (inspect above for walletSet.id)")

    except developer_controlled_wallets.ApiException as e:
        print("Exception when calling WalletSetsApi->create_wallet_set: %s\n" % e)


if __name__ == "__main__":
    main()

