// ============================================================
// MSRP REFERENCE TABLE
// Targets: ex Premium Collections, 5-pack/3-pack tins, mini tins,
// Collector Chests (lunchbox-style).
// Keys are normalized product identifiers (lowercase, alpha+space only).
// ============================================================

const MSRP_TABLE = {

  // ── ex Premium Collections (1 promo + oversize + ~4-8 packs) ──
  // Most recent line: $39.99 base, $49.99 for double-headliners.
  "charizard ex premium collection":              { msrp: 39.99, type: "ex_premium_collection", set: "Obsidian Flames" },
  "mew ex premium collection":                    { msrp: 34.99, type: "ex_premium_collection", set: "Pokémon 151" },
  "mewtwo ex premium collection":                 { msrp: 34.99, type: "ex_premium_collection", set: "Pokémon 151" },
  "paldean fates ex premium collection":          { msrp: 49.99, type: "ex_premium_collection", set: "Paldean Fates" },
  "iono bellibolt ex premium collection":         { msrp: 39.99, type: "ex_premium_collection", set: "Twilight Masquerade" },
  "hydreigon ex premium collection":              { msrp: 39.99, type: "ex_premium_collection", set: "Twilight Masquerade" },
  "greninja ex premium collection":               { msrp: 39.99, type: "ex_premium_collection", set: "Twilight Masquerade" },
  "iron leaves ex premium collection":            { msrp: 39.99, type: "ex_premium_collection", set: "Temporal Forces" },
  "walking wake ex premium collection":           { msrp: 39.99, type: "ex_premium_collection", set: "Temporal Forces" },
  "salamence ex reshiram ex premium collection":  { msrp: 49.99, type: "ex_premium_collection", set: "Mega Evolution" },
  "lugia ex latias ex premium collection":        { msrp: 49.99, type: "ex_premium_collection", set: "Destined Rivals" },
  "mega venusaur ex premium collection":          { msrp: 39.99, type: "ex_premium_collection", set: "Mega Evolution" },
  "mega kangaskhan ex premium collection":        { msrp: 39.99, type: "ex_premium_collection", set: "Mega Evolution" },
  "mega kangaskhan ex box":                       { msrp: 39.99, type: "ex_premium_collection", set: "Mega Evolution" },
  "terapagos ex premium collection":              { msrp: 39.99, type: "ex_premium_collection", set: "Stellar Crown" },

  // ── Standard Poké Ball Tins (3-pack, 2025 line) ─────────────
  // Each tin = 3 booster packs + coin/promo. $24.99 MSRP retail.
  "poke ball tin":                                { msrp: 24.99, type: "tin", set: "Misc" },
  "great ball tin":                               { msrp: 24.99, type: "tin", set: "Misc" },
  "ultra ball tin":                               { msrp: 24.99, type: "tin", set: "Misc" },
  "premier ball tin":                             { msrp: 24.99, type: "tin", set: "Misc" },
  "repeat ball tin":                              { msrp: 24.99, type: "tin", set: "Misc" },
  "master ball tin":                              { msrp: 24.99, type: "tin", set: "Misc" },
  "dive ball tin":                                { msrp: 24.99, type: "tin", set: "Misc" },
  "luxury ball tin":                              { msrp: 24.99, type: "tin", set: "Misc" },
  "quick ball tin":                               { msrp: 24.99, type: "tin", set: "Misc" },
  "moon ball tin":                                { msrp: 24.99, type: "tin", set: "Misc" },

  // ── Mini Tins ──────────────────────────────────────────────
  // 2 packs + art card. $9.99 MSRP.
  "mini tin":                                     { msrp: 9.99,  type: "mini_tin", set: "Misc" },
  "pokemon mini tin":                             { msrp: 9.99,  type: "mini_tin", set: "Misc" },

  // ── Collector Chests (lunchbox-style metal tins) ────────────
  // Annual release, $29.99 historically, current 2025 release $49.99.
  "collector chest":                              { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "collectors chest":                             { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "fall collector chest":                         { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "summer collector chest":                       { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "winter collector chest":                       { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "holiday collector chest":                      { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "collector chest 2025":                         { msrp: 49.99, type: "collector_chest", set: "Misc" },
  "collector chest 2024":                         { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "collector chest 2023":                         { msrp: 24.99, type: "collector_chest", set: "Misc" },
};

// Aliases — map common seller-title variants to canonical keys above.
// Sellers write the same product 20 different ways; we catch the common ones.
const MSRP_ALIASES = {
  // ex Premium Collection naming variants
  "charizard ex box":                       "charizard ex premium collection",
  "charizard ex collection":                "charizard ex premium collection",
  "mew ex box":                             "mew ex premium collection",
  "mewtwo ex box":                          "mewtwo ex premium collection",
  "paldean fates premium collection":       "paldean fates ex premium collection",
  "salamence reshiram premium collection":  "salamence ex reshiram ex premium collection",
  "salamence ex reshiram ex collection":    "salamence ex reshiram ex premium collection",
  "lugia latias premium collection":        "lugia ex latias ex premium collection",
  "lugia ex latias ex collection":          "lugia ex latias ex premium collection",
  "mega venusaur premium collection":       "mega venusaur ex premium collection",
  "mega venusaur ex collection":            "mega venusaur ex premium collection",
  "mega kangaskhan premium collection":     "mega kangaskhan ex premium collection",
  "mega kangaskhan collection":             "mega kangaskhan ex premium collection",
  "terapagos premium collection":           "terapagos ex premium collection",
  "iono bellibolt premium collection":      "iono bellibolt ex premium collection",
  "iron leaves premium collection":         "iron leaves ex premium collection",
  "walking wake premium collection":        "walking wake ex premium collection",

  // Tin naming variants
  "pokemon poke ball tin":                  "poke ball tin",
  "pokemon great ball tin":                 "great ball tin",
  "pokemon ultra ball tin":                 "ultra ball tin",
  "pokemon premier ball tin":               "premier ball tin",
  "pokemon repeat ball tin":                "repeat ball tin",

  // Collector Chest naming variants
  "pokemon collector chest":                "collector chest",
  "pokemon collectors chest":               "collectors chest",
  "pokemon tcg collector chest":            "collector chest",
};

// Shipping estimates by source when not listed
const SHIPPING_ESTIMATES = {
  ebay:      4.99,
  mercari:   4.99,
  tcgplayer: 3.99,
  whatnot:   5.99,
  tiktok:    3.99,
  lgs:       6.99,
  other:     5.99,
  manual:    5.99,
};

// Free shipping thresholds (for reference; not used in matching)
const FREE_SHIPPING_THRESHOLDS = {
  tcgplayer: 35.00,
  ebay:      null,
  mercari:   null,
};