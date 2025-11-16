
from utils import log_event

class GatewayService:
    def __init__(self):
        pass

    def get_total_usdc(self):
        
        result = {
            "ethereum": 1500.0,
            "solana": 500.0,
            "avalanche": 350.0,
            "total": 1500.0 + 500.0 + 350.0
        }

        log_event("[Gateway] Returning USDC breakdown across chains")

        return result

    # Template for real Circle integration
    def get_total_usdc_real(self):
        
        raise NotImplementedError("Real Gateway API integration not implemented.")
