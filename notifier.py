# ============================================================
# PokéDeal — Notifier (Modal cron app)
# ------------------------------------------------------------
# Runs every 15 minutes. For each search in WATCHLIST:
#   1. Hits eBay's Browse API sorted by newly-listed
#   2. Applies the same normalize / MSRP / quantity / scoring
#      logic as the frontend, in Python
#   3. Skips listings already notified about (Modal Dict)
#   4. Posts Discord embeds for listings within +25% of MSRP
#
# Required secrets (create both before deploying):
#   modal secret create ebay-credentials EBAY_CLIENT_ID=... EBAY_CLIENT_SECRET=...
#   modal secret create discord-webhook  DISCORD_WEBHOOK_URL=...
#
# Deploy:
#   modal deploy notifier.py
# Test one run manually (without waiting for cron):
#   modal run notifier.py::run_notifier
# ============================================================

import base64
import re
import time

import modal

app = modal.App("pokedeal-notifier")

image = modal.Image.debian_slim(python_version="3.12").pip_install("httpx")

# Modal Dict — persistent KV store, survives across cron runs.
# Used to track which listing IDs we've already notified about.
seen_listings = modal.Dict.from_name("pokedeal-seen-listings", create_if_missing=True)

# ── Tuning knobs ─────────────────────────────────────────────
WATCHLIST = [
    "mini tin",
    "collector chest",
    "mega latias ex box",
    "mega kangaskhan ex box",
    "hops zacian ex box",
    "mewtwo ex box",
    "iron valiant ex box",
    "ursaluna ex box",
    "black kyurem melmetal ex box",
    "archaludon reshiram ex box",
    "paradox destinies tin",
    "azure legends tin",
    "team rocket tin",
]
THRESHOLD_PCT_ABOVE_MSRP = 25.0   # notify if per-item landed cost is ≤ MSRP * 1.25
MAX_NOTIFS_PER_RUN = 5            # hard cap so a flood can't spam your phone
SEEN_TTL_SECONDS = 14 * 24 * 3600 # forget a listing ID after 14 days
EBAY_API_QUOTA_RESERVE = 100      # leave headroom for the live-search proxy

EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
EBAY_BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope"

# ── MSRP table — kept in sync with frontend msrp.js ──────────
# (Python copy. If you change one, change both. Yes, this is annoying;
# acceptable for a hobby project.)
MSRP_TABLE = {
    # ex Boxes — single headliner ($22)
    "mega latias ex":                {"msrp": 22.00, "type": "ex_box",         "set": "Mega Evolution"},
    "mega kangaskhan ex":            {"msrp": 22.00, "type": "ex_box",         "set": "Mega Evolution"},
    "mega venusaur ex":              {"msrp": 22.00, "type": "ex_box",         "set": "Mega Evolution"},
    "hops zacian ex":                {"msrp": 22.00, "type": "ex_box",         "set": "Journey Together"},
    "iron valiant ex":               {"msrp": 22.00, "type": "ex_box",         "set": "Temporal Forces"},
    "ursaluna ex":                   {"msrp": 22.00, "type": "ex_box",         "set": "Twilight Masquerade"},
    "team rockets mewtwo ex":        {"msrp": 22.00, "type": "ex_box",         "set": "Destined Rivals"},
    "team rocket mewtwo ex":         {"msrp": 22.00, "type": "ex_box",         "set": "Destined Rivals"},
    "charizard ex":                  {"msrp": 22.00, "type": "ex_box",         "set": "Obsidian Flames"},
    "mew ex":                        {"msrp": 22.00, "type": "ex_box",         "set": "Pokémon 151"},
    "mewtwo ex":                     {"msrp": 22.00, "type": "ex_box",         "set": "Pokémon 151"},
    "greninja ex":                   {"msrp": 22.00, "type": "ex_box",         "set": "Twilight Masquerade"},
    "hydreigon ex":                  {"msrp": 22.00, "type": "ex_box",         "set": "Twilight Masquerade"},
    "iono bellibolt ex":             {"msrp": 22.00, "type": "ex_box",         "set": "Twilight Masquerade"},
    "terapagos ex":                  {"msrp": 22.00, "type": "ex_box",         "set": "Stellar Crown"},
    "walking wake ex":               {"msrp": 22.00, "type": "ex_box",         "set": "Temporal Forces"},
    "iron leaves ex":                {"msrp": 22.00, "type": "ex_box",         "set": "Temporal Forces"},
    # Dual-headliner ($50)
    "black kyurem melmetal ex":      {"msrp": 50.00, "type": "ex_box_dual",    "set": "Dual Headliner"},
    "black kyurem ex melmetal ex":   {"msrp": 50.00, "type": "ex_box_dual",    "set": "Dual Headliner"},
    "archaludon reshiram ex":        {"msrp": 50.00, "type": "ex_box_dual",    "set": "Dual Headliner"},
    "archaludon ex reshiram ex":     {"msrp": 50.00, "type": "ex_box_dual",    "set": "Dual Headliner"},
    "salamence reshiram ex":         {"msrp": 50.00, "type": "ex_box_dual",    "set": "Mega Evolution"},
    "salamence ex reshiram ex":      {"msrp": 50.00, "type": "ex_box_dual",    "set": "Mega Evolution"},
    "lugia latias ex":               {"msrp": 50.00, "type": "ex_box_dual",    "set": "Destined Rivals"},
    "lugia ex latias ex":            {"msrp": 50.00, "type": "ex_box_dual",    "set": "Destined Rivals"},
    # 5-pack tins ($27)
    "paradox destinies tin":         {"msrp": 27.00, "type": "tin_5pack",      "set": "Paradox Destinies"},
    "azure legends tin":             {"msrp": 27.00, "type": "tin_5pack",      "set": "Azure Legends"},
    "team rocket tin":               {"msrp": 27.00, "type": "tin_5pack",      "set": "Destined Rivals"},
    "team rockets tin":              {"msrp": 27.00, "type": "tin_5pack",      "set": "Destined Rivals"},
    # 3-pack tins ($15)
    "poke ball tin":                 {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "great ball tin":                {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "ultra ball tin":                {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "premier ball tin":              {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "master ball tin":               {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "repeat ball tin":               {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "dive ball tin":                 {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    "luxury ball tin":               {"msrp": 15.00, "type": "tin",            "set": "Misc"},
    # Mini tins ($10)
    "mini tin":                      {"msrp": 10.00, "type": "mini_tin",       "set": "Misc"},
    "pokemon mini tin":              {"msrp": 10.00, "type": "mini_tin",       "set": "Misc"},
    # Collector Chests
    "collector chest":               {"msrp": 29.99, "type": "collector_chest", "set": "Misc"},
    "collectors chest":              {"msrp": 29.99, "type": "collector_chest", "set": "Misc"},
    "collector chest 2025":          {"msrp": 49.99, "type": "collector_chest", "set": "Misc"},
    "collector chest 2024":          {"msrp": 29.99, "type": "collector_chest", "set": "Misc"},
}

MSRP_ALIASES = {
    # ex Box variants
    "mega latias ex box":                       "mega latias ex",
    "mega kangaskhan ex box":                   "mega kangaskhan ex",
    "mega venusaur ex box":                     "mega venusaur ex",
    "hops zacian ex box":                       "hops zacian ex",
    "iron valiant ex box":                      "iron valiant ex",
    "ursaluna ex box":                          "ursaluna ex",
    "mewtwo ex box":                            "mewtwo ex",
    "team rocket mewtwo ex box":                "team rocket mewtwo ex",
    "team rockets mewtwo ex box":               "team rockets mewtwo ex",
    "charizard ex box":                         "charizard ex",
    "mew ex box":                               "mew ex",
    "greninja ex box":                          "greninja ex",
    "hydreigon ex box":                         "hydreigon ex",
    "terapagos ex box":                         "terapagos ex",
    "walking wake ex box":                      "walking wake ex",
    "iron leaves ex box":                       "iron leaves ex",
    "iono bellibolt ex box":                    "iono bellibolt ex",
    # Dual variants
    "black kyurem and melmetal ex":             "black kyurem ex melmetal ex",
    "black kyurem ex melmetal ex box":          "black kyurem ex melmetal ex",
    "archaludon and reshiram ex":               "archaludon ex reshiram ex",
    "archaludon ex reshiram ex box":            "archaludon ex reshiram ex",
    "salamence and reshiram ex":                "salamence ex reshiram ex",
    "lugia and latias ex":                      "lugia ex latias ex",
    # Tin variants
    "pokemon paradox destinies tin":            "paradox destinies tin",
    "pokemon azure legends tin":                "azure legends tin",
    "pokemon team rocket tin":                  "team rocket tin",
    "pokemon poke ball tin":                    "poke ball tin",
    "pokemon great ball tin":                   "great ball tin",
    "pokemon ultra ball tin":                   "ultra ball tin",
    # Chest variants
    "pokemon collector chest":                  "collector chest",
}

EBAY_SHIPPING_FALLBACK = 4.99

# ── Title normalization (mirrors app.js normalizeName) ───────
_NOISE_PATTERNS = [
    re.compile(r"pokémon|pokemon", re.I),
    re.compile(r"trading card game|tcg", re.I),
    re.compile(r"elite trainer box", re.I),  # → "etb"
    re.compile(r"\bfactory sealed\b", re.I),
    re.compile(r"\bbrand new\b", re.I),
    re.compile(r"\bnew sealed\b", re.I),
    re.compile(r"\bin hand\b", re.I),
    re.compile(r"\bsealed\b", re.I),
    re.compile(r"\bnew\b", re.I),
    re.compile(r"\bfactory\b", re.I),
    re.compile(r"\bofficial\b", re.I),
    re.compile(r"\bauthentic\b", re.I),
    re.compile(r"\bdisplay\b", re.I),
]
_BARE_BOX_RE = re.compile(r"(?<!booster )\bbox\b(?=\s|$)", re.I)
_XN_RE = re.compile(r"\bx\d+\b", re.I)
_LOT_RE = re.compile(r"\blot of \d+\b", re.I)
_NONWORD_RE = re.compile(r"[^\w\s]")
_APOS_S_RE = re.compile(r"\b(\w+?)'s\b", re.I)   # "rocket's" → "rockets"
_PREMIUM_SUFFIX_RE = re.compile(r"\s*premium collection\s*$", re.I)


def normalize_name(raw: str) -> str:
    if not raw:
        return ""
    s = raw.lower()
    # Handle apostrophe-s BEFORE stripping non-word chars, so "rocket's" → "rockets" not "rocket s"
    s = _APOS_S_RE.sub(r"\1s", s)
    s = _NOISE_PATTERNS[2].sub("etb", s)  # elite trainer box → etb
    for pat in _NOISE_PATTERNS:
        if pat.pattern in ("elite trainer box",):
            continue
        s = pat.sub("", s)
    s = _BARE_BOX_RE.sub("", s)
    s = _XN_RE.sub("", s)
    s = _LOT_RE.sub("", s)
    s = _NONWORD_RE.sub(" ", s)
    s = re.sub(r"\s+", " ", s).strip()
    # Drop trailing "premium collection" so ex Box variants alias cleanly
    s = _PREMIUM_SUFFIX_RE.sub("", s).strip()
    if s in MSRP_ALIASES:
        s = MSRP_ALIASES[s]
    return s


def lookup_msrp(normalized: str):
    if not normalized:
        return None
    if normalized in MSRP_TABLE:
        return MSRP_TABLE[normalized]
    for key, val in MSRP_TABLE.items():
        if normalized in key or key in normalized:
            return val
    return None


# ── Quantity detection (mirrors app.js detectQuantity) ───────
_LOT_PHRASE = re.compile(r"\b(lot of|set of|bundle of)\b", re.I)
_XN_QTY    = re.compile(r"\bx\s?\d+\b|\b\d+\s?x\b", re.I)
_PK_QTY    = re.compile(r"\b\d+\s?(pk|pack)\b", re.I)
_MIXED     = re.compile(r"(\band\b|\+| with )", re.I)
_QTY_PATTERNS = [
    re.compile(r"\blot of (\d{1,3})\b", re.I),
    re.compile(r"\bset of (\d{1,3})\b", re.I),
    re.compile(r"\bbundle of (\d{1,3})\b", re.I),
    re.compile(r"\(\s*(\d{1,3})\s*\)"),
    re.compile(r"\bx\s?(\d{1,3})\b", re.I),
    re.compile(r"\b(\d{1,3})\s?x\b", re.I),
    re.compile(r"\b(\d{1,3})\s?[- ]?(?:pack|pk)s?\b", re.I),
]


def detect_quantity(raw_title: str) -> int:
    if not raw_title:
        return 1
    t = raw_title.lower()
    has_lot = bool(_LOT_PHRASE.search(t) or _XN_QTY.search(t) or _PK_QTY.search(t))
    if has_lot and _MIXED.search(t):
        return 1
    for pat in _QTY_PATTERNS:
        m = pat.search(t)
        if not m:
            continue
        n = int(m.group(1))
        if n < 2 or n > 50:
            continue
        match_str = m.group(0)
        # "N pack(s)" inside any product where packs are the CONTENTS,
        # not a count of products. Booster boxes (36 packs inside), Premium
        # Collections / ex Boxes / Collector Chests (4 packs inside),
        # tins (3 or 5 packs inside), booster bundles (6 packs inside).
        if "pack" in match_str and any(x in t for x in (
            "booster box",
            "premium collection", "ex box", "ex premium",
            "collector chest", "collectors chest",
            "tin",
            "booster bundle",
        )):
            continue
        return n
    return 1


# ── eBay OAuth + Browse search ───────────────────────────────
def get_ebay_token() -> str:
    import os
    import httpx
    cid = os.environ["EBAY_CLIENT_ID"]
    csec = os.environ["EBAY_CLIENT_SECRET"]
    basic = base64.b64encode(f"{cid}:{csec}".encode()).decode()
    r = httpx.post(
        EBAY_OAUTH_URL,
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials", "scope": EBAY_SCOPE},
        timeout=15.0,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def ebay_search_newest(token: str, query: str):
    """Return a list of newly-listed sealed items for the query.

    Sorted newest first. Capped at 25 results per query — newer ones
    matter, older ones we've already seen in prior runs."""
    import httpx
    r = httpx.get(
        EBAY_BROWSE_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            "Content-Type": "application/json",
        },
        params={
            "q": f"{query} sealed pokemon",
            "limit": "25",
            "sort": "newlyListed",
            "filter": "conditionIds:{1000|1500},buyingOptions:{FIXED_PRICE}",
        },
        timeout=20.0,
    )
    r.raise_for_status()
    return r.json().get("itemSummaries", [])


# ── Sealed-product filter (mirrors app.js isSealedProduct) ───
_SINGLE_KW = ["psa", "bgs", "cgc", "graded", "holo card", "reverse holo",
              "/165", "/091", "nm/m ", "lp ", " ex card", " v card",
              "pack fresh", "raw card", "single card"]
_SEALED_KW = ["booster box", "etb", "elite trainer", "booster bundle", "blister",
              "tin", "mini tin", "collector chest", "collectors chest",
              "premium collection", "ex box", "ex premium",
              "sealed", "factory sealed"]


def is_sealed_product(title: str) -> bool:
    if not title:
        return False
    t = title.lower()
    if any(k in t for k in _SINGLE_KW):
        return False
    return any(k in t for k in _SEALED_KW)


# ── Score a listing ──────────────────────────────────────────
def score_listing(item: dict):
    """Returns a notification dict, or None if not notify-worthy."""
    title = item.get("title", "")
    if not is_sealed_product(title):
        return None

    norm = normalize_name(title)
    msrp_data = lookup_msrp(norm)
    if not msrp_data:
        return None   # uncertain match → don't notify

    qty = detect_quantity(title)
    price_raw = item.get("price", {}).get("value")
    if not price_raw:
        return None
    total_price = float(price_raw)

    ship_opts = item.get("shippingOptions") or []
    if ship_opts and ship_opts[0].get("shippingCost", {}).get("value") is not None:
        total_shipping = float(ship_opts[0]["shippingCost"]["value"])
    else:
        total_shipping = EBAY_SHIPPING_FALLBACK

    total_landed = total_price + total_shipping
    per_landed = total_landed / qty
    msrp = msrp_data["msrp"]
    pct_above = ((per_landed - msrp) / msrp) * 100.0

    if pct_above > THRESHOLD_PCT_ABOVE_MSRP:
        return None

    tier = ("steal" if pct_above <= 0
            else "hot" if pct_above <= 10
            else "good" if pct_above <= 20
            else "fair")

    return {
        "item_id":     item.get("itemId") or item.get("legacyItemId") or item.get("itemWebUrl"),
        "title":       title,
        "url":         item.get("itemWebUrl", ""),
        "image_url":   (item.get("image") or {}).get("imageUrl"),
        "quantity":    qty,
        "per_landed":  per_landed,
        "total_landed": total_landed,
        "msrp":        msrp,
        "set_name":    msrp_data["set"],
        "pct_above":   pct_above,
        "tier":        tier,
    }


# ── Discord embed ────────────────────────────────────────────
TIER_COLOR = {
    "steal": 0x2ED573,   # green
    "hot":   0xFFCB05,   # yellow
    "good":  0x00D4AA,   # teal
    "fair":  0x9FA3B8,   # neutral
}


def post_discord(webhook_url: str, n: dict):
    import httpx

    pct = n["pct_above"]
    pct_label = f"{abs(pct):.1f}% BELOW MSRP 🔥" if pct <= 0 else f"+{pct:.1f}% above MSRP"
    qty_note = f" (×{n['quantity']} lot, ${n['total_landed']:.2f} total)" if n["quantity"] > 1 else ""

    embed = {
        "title": n["title"][:240],
        "url": n["url"],
        "color": TIER_COLOR.get(n["tier"], 0xFFCB05),
        "fields": [
            {"name": "Landed (per item)", "value": f"${n['per_landed']:.2f}{qty_note}", "inline": True},
            {"name": "MSRP",              "value": f"${n['msrp']:.2f}",                 "inline": True},
            {"name": "vs MSRP",           "value": pct_label,                            "inline": True},
            {"name": "Set",               "value": n["set_name"],                        "inline": True},
            {"name": "Tier",              "value": n["tier"].upper(),                    "inline": True},
        ],
    }
    if n.get("image_url"):
        embed["thumbnail"] = {"url": n["image_url"]}

    r = httpx.post(
        webhook_url,
        json={"username": "PokéDeal", "embeds": [embed]},
        timeout=10.0,
    )
    if r.status_code >= 400:
        print(f"discord post failed: {r.status_code} {r.text}")


# ── Modal Dict housekeeping ─────────────────────────────────
def gc_seen():
    """Remove seen-listing entries older than SEEN_TTL_SECONDS."""
    now = time.time()
    expired = []
    for k in list(seen_listings.keys()):
        try:
            if now - float(seen_listings[k]) > SEEN_TTL_SECONDS:
                expired.append(k)
        except (TypeError, ValueError, KeyError):
            expired.append(k)
    for k in expired:
        try:
            del seen_listings[k]
        except KeyError:
            pass
    if expired:
        print(f"gc: pruned {len(expired)} expired listing IDs")


# ── Main entry point ────────────────────────────────────────
@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("ebay-credentials"),
        modal.Secret.from_name("discord-webhook"),
    ],
    schedule=modal.Cron("*/15 * * * *"),
    timeout=240,
)
def run_notifier():
    """Main entry. Runs every 15 minutes via cron, or manually via
    `modal run notifier.py::run_notifier`."""
    import os

    webhook = os.environ["DISCORD_WEBHOOK_URL"]
    token = get_ebay_token()
    notified_this_run = 0
    found_candidates = 0

    for query in WATCHLIST:
        if notified_this_run >= MAX_NOTIFS_PER_RUN:
            print(f"hit MAX_NOTIFS_PER_RUN={MAX_NOTIFS_PER_RUN}; stopping early")
            break
        try:
            items = ebay_search_newest(token, query)
        except Exception as e:
            print(f"query '{query}' failed: {e}")
            continue

        for item in items:
            scored = score_listing(item)
            if not scored:
                continue
            found_candidates += 1

            iid = scored["item_id"]
            if not iid:
                continue
            if iid in seen_listings:
                continue

            try:
                post_discord(webhook, scored)
                seen_listings[iid] = str(time.time())
                notified_this_run += 1
                print(f"notified: ${scored['per_landed']:.2f} {scored['tier']} — {scored['title'][:60]}")
            except Exception as e:
                print(f"discord post failed for {iid}: {e}")

            if notified_this_run >= MAX_NOTIFS_PER_RUN:
                break

    print(f"run done: queries={len(WATCHLIST)} candidates={found_candidates} notified={notified_this_run}")

    # Housekeeping: every ~96 runs (≈ once/day at 15min cadence), prune old IDs.
    # Cheap approximation — just GC on a random-ish trigger.
    if int(time.time()) % 96 < 1:
        gc_seen()