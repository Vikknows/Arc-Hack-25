import os
import certifi

from circle.web3 import utils
from circle.web3 import developer_controlled_wallets

# ---------------------------------------------------------
# SSL FIX so Circle HTTPS works on macOS
# ---------------------------------------------------------
os.environ["SSL_CERT_FILE"] = certifi.where()

# ---------------------------------------------------------
# Circle credentials (same as before)
# ---------------------------------------------------------
CIRCLE_API_KEY = "TEST_API_KEY:75f913693ef58dcb1c07ed0ca61553f1:0c7866c1a3160fbccde384f74ef103b6"
ENTITY_SECRET = "acece31b2796974eebb1ea56d2cd9564d43baef6b638831583041b1bb87cfcd0"

# Your wallet set ID from the previous step
WALLET_SET_ID = "c599a80e-be7a-5015-a524-9feb250ae0e8"


def main():
    print("=== Initialising Circle client for wallet creation ===")
    client = utils.init_developer_controlled_wallets_client(
        api_key=CIRCLE_API_KEY,
        entity_secret=ENTITY_SECRET,
    )

    wallets_api = developer_controlled_wallets.WalletsApi(client)

    # We’ll create one Smart Contract Account (SCA) on Polygon Amoy testnet
    create_req = developer_controlled_wallets.CreateWalletRequest.from_dict({
        "accountType": "SCA",
        "blockchains": ["MATIC-AMOY"],  # testnet chain
        "count": 1,
        "walletSetId": WALLET_SET_ID,
    })

    print("=== Creating wallet in wallet set ===")
    try:
        resp = wallets_api.create_wallet(create_req)
        print("\n=== Wallet Created Successfully ===")
        print(resp)

        # Try to extract wallet ID + address nicely
        try:
            wallets = resp.data.wallets
            # We requested count=1, so take the first wallet
            wallet = wallets[0].actual_instance
            print("\nWallet ID:", wallet.id)
            print("Blockchain:", wallet.blockchain)
            print("Address:", wallet.address)
        except Exception:
            print("\nCould not parse wallet ID/address cleanly, check the raw response above.")

    except developer_controlled_wallets.ApiException as e:
        print("Exception when calling WalletsApi->create_wallet: %s\n" % e)


if __name__ == "__main__":
    main()

