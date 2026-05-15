# ============================================================
# PokéDeal — eBay API Proxy (Modal)
# ------------------------------------------------------------
# Holds the eBay Dev ID + Cert ID server-side, performs the
# OAuth2 client-credentials token exchange, caches the access
# token until it expires, and exposes a single /search endpoint
# that the browser frontend calls.
#
# The browser NEVER sees any eBay credential.
#
# Deploy:   modal deploy proxy.py
# Dev/test: modal serve proxy.py
#
# Before deploying, create the secret (one time):
#   modal secret create ebay-credentials \
#       EBAY_CLIENT_ID=TylerSak-webscrap-PRD-xxxxxxxxx-xxxxxxxx \
#       EBAY_CLIENT_SECRET=PRD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#
# (Use the freshly-rotated Cert ID as EBAY_CLIENT_SECRET.)
# ============================================================

import base64
import time

import modal

app = modal.App("pokedeal-ebay-proxy")

image = modal.Image.debian_slim(python_version="3.12").pip_install(
    "fastapi[standard]",
    "httpx",
)

# eBay endpoints (production)
EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
EBAY_BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"

# Scope required for the Browse API
EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope"

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------
# DEV: "*" lets you test app.js from localhost or a file:// page.
# PROD: once you know where app.js is hosted, change this to that
#       exact origin, e.g. "https://pokedeal.netlify.app".
#       A single concrete origin is required if you ever send
#       credentials/cookies; "*" is fine for this token-free proxy
#       but tightening it is good hygiene.
ALLOWED_ORIGIN = "*"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


@app.cls(
    image=image,
    secrets=[modal.Secret.from_name("ebay-credentials")],
    min_containers=0,  # scale to zero when idle; set to 1 to kill cold starts
)
class EbayProxy:
    """Caches an eBay OAuth token on the container instance and
    reuses it across requests until shortly before it expires."""

    def __init__(self):
        self._token = None
        self._token_expires_at = 0.0  # unix timestamp

    def _get_token(self) -> str:
        """Return a valid access token, refreshing if needed."""
        import os

        # Reuse cached token if it has >60s of life left.
        if self._token and time.time() < self._token_expires_at - 60:
            return self._token

        client_id = os.environ["EBAY_CLIENT_ID"]
        client_secret = os.environ["EBAY_CLIENT_SECRET"]

        # Client-credentials grant: HTTP Basic auth with client_id:client_secret
        basic = base64.b64encode(
            f"{client_id}:{client_secret}".encode()
        ).decode()

        import httpx

        resp = httpx.post(
            EBAY_OAUTH_URL,
            headers={
                "Authorization": f"Basic {basic}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "client_credentials",
                "scope": EBAY_SCOPE,
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        payload = resp.json()

        self._token = payload["access_token"]
        # expires_in is seconds; eBay app tokens are typically ~2 hours
        self._token_expires_at = time.time() + float(payload["expires_in"])
        return self._token

    @modal.fastapi_endpoint(method="GET")
    def search(self, q: str = ""):
        """Search eBay for sealed Pokémon products.

        Called by the browser as:  GET <modal-url>/search?q=surging+sparks
        Returns the raw eBay itemSummaries payload (item/listing data only).
        """
        from fastapi.responses import JSONResponse

        if not q.strip():
            return JSONResponse(
                status_code=400,
                content={"error": "Missing 'q' query parameter."},
                headers=CORS_HEADERS,
            )

        try:
            token = self._get_token()
        except Exception as e:
            return JSONResponse(
                status_code=502,
                content={"error": f"eBay auth failed: {e}"},
                headers=CORS_HEADERS,
            )

        import httpx

        params = {
            "q": f"{q} sealed pokemon",
            "category_ids": "183454",
            "limit": "50",
            "filter": "conditionIds:{1000|1500},buyingOptions:{FIXED_PRICE}",
        }

        try:
            resp = httpx.get(
                EBAY_BROWSE_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
                    "Content-Type": "application/json",
                },
                params=params,
                timeout=20.0,
            )
        except Exception as e:
            return JSONResponse(
                status_code=502,
                content={"error": f"eBay request failed: {e}"},
                headers=CORS_HEADERS,
            )

        if resp.status_code != 200:
            return JSONResponse(
                status_code=resp.status_code,
                content={"error": f"eBay API error: {resp.status_code}"},
                headers=CORS_HEADERS,
            )

        data = resp.json()
        # Return only itemSummaries — listing/item data, no eBay user data
        # is forwarded. (eBay includes seller info in the raw payload; we
        # strip it here so it never even reaches the browser.)
        summaries = []
        for item in data.get("itemSummaries", []):
            summaries.append({
                "title": item.get("title"),
                "price": item.get("price"),
                "shippingOptions": item.get("shippingOptions"),
                "itemWebUrl": item.get("itemWebUrl"),
                "condition": item.get("condition"),
                "image": item.get("image"),
            })

        return JSONResponse(
            content={"itemSummaries": summaries},
            headers=CORS_HEADERS,
        )

    @modal.fastapi_endpoint(method="OPTIONS")
    def search_preflight(self):
        """Handle CORS preflight for the search endpoint."""
        from fastapi.responses import Response

        return Response(status_code=204, headers=CORS_HEADERS)