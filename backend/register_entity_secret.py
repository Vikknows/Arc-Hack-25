import os
import certifi  # NEW: fix SSL verification on macOS
from circle.web3 import utils

# ---------------------------------------------------------
# HARD-CODED FOR SETUP – DO NOT COMMIT THIS FILE TO GITHUB
# ---------------------------------------------------------

# Use certifi's CA bundle so HTTPS to api.circle.com works
os.environ["SSL_CERT_FILE"] = certifi.where()

CIRCLE_API_KEY = "TEST_API_KEY:75f913693ef58dcb1c07ed0ca61553f1:0c7866c1a3160fbccde384f74ef103b6"

# Entity secret you already have
ENTITY_SECRET = "acece31b2796974eebb1ea56d2cd9564d43baef6b638831583041b1bb87cfcd0"

# Folder where Circle will drop the recovery JSON file
RECOVERY_DIR_NAME = "entity_secret_recovery"  # folder, NOT a file name


def main():
    print("=== Registering Entity Secret with Circle ===")
    print("Using API Key:", CIRCLE_API_KEY)
    print("Entity Secret:", ENTITY_SECRET)

    # 1. Make sure the directory exists
    os.makedirs(RECOVERY_DIR_NAME, exist_ok=True)
    recovery_dir = os.path.abspath(RECOVERY_DIR_NAME)

    print("Recovery directory:", recovery_dir)
    print()

    # 2. Register the secret; Circle will write a file into this directory
    utils.register_entity_secret_ciphertext(
        api_key=CIRCLE_API_KEY,
        entity_secret=ENTITY_SECRET,
        recoveryFileDownloadPath=recovery_dir,
    )

    print("=== SUCCESS ===")
    print("Entity Secret has been registered with Circle.")
    print("A recovery file has been saved inside:", recovery_dir)
    print("Store both the entity secret and that file somewhere safe.")


if __name__ == "__main__":
    main()
