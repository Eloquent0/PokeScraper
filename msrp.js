// ============================================================
// MSRP REFERENCE TABLE
// Real-world prices for the products this user actively tracks.
// Keys are normalized product identifiers (lowercase, alpha+space only).
// ============================================================

const MSRP_TABLE = {

  // ── Single-headliner ex Boxes ($22) ─────────────────────────
  // 1 promo + 1 oversize + 4 packs.
  "mega latias ex":                          { msrp: 22.00, type: "ex_box", set: "Mega Evolution" },
  "mega kangaskhan ex":                      { msrp: 22.00, type: "ex_box", set: "Mega Evolution" },
  "mega venusaur ex":                        { msrp: 22.00, type: "ex_box", set: "Mega Evolution" },
  "hops zacian ex":                          { msrp: 22.00, type: "ex_box", set: "Journey Together" },
  "iron valiant ex":                         { msrp: 22.00, type: "ex_box", set: "Temporal Forces" },
  "ursaluna ex":                             { msrp: 22.00, type: "ex_box", set: "Twilight Masquerade" },
  "team rockets mewtwo ex":                  { msrp: 22.00, type: "ex_box", set: "Destined Rivals" },
  "team rocket mewtwo ex":                   { msrp: 22.00, type: "ex_box", set: "Destined Rivals" },
  "charizard ex":                            { msrp: 22.00, type: "ex_box", set: "Obsidian Flames" },
  "mew ex":                                  { msrp: 22.00, type: "ex_box", set: "Pokémon 151" },
  "mewtwo ex":                               { msrp: 22.00, type: "ex_box", set: "Pokémon 151" },
  "greninja ex":                             { msrp: 22.00, type: "ex_box", set: "Twilight Masquerade" },
  "hydreigon ex":                            { msrp: 22.00, type: "ex_box", set: "Twilight Masquerade" },
  "iono bellibolt ex":                       { msrp: 22.00, type: "ex_box", set: "Twilight Masquerade" },
  "terapagos ex":                            { msrp: 22.00, type: "ex_box", set: "Stellar Crown" },
  "walking wake ex":                         { msrp: 22.00, type: "ex_box", set: "Temporal Forces" },
  "iron leaves ex":                          { msrp: 22.00, type: "ex_box", set: "Temporal Forces" },

  // ── Dual-headliner ex Boxes ($50) ───────────────────────────
  "black kyurem melmetal ex":                { msrp: 50.00, type: "ex_box_dual", set: "Dual Headliner" },
  "black kyurem ex melmetal ex":             { msrp: 50.00, type: "ex_box_dual", set: "Dual Headliner" },
  "archaludon reshiram ex":                  { msrp: 50.00, type: "ex_box_dual", set: "Dual Headliner" },
  "archaludon ex reshiram ex":               { msrp: 50.00, type: "ex_box_dual", set: "Dual Headliner" },
  "salamence reshiram ex":                   { msrp: 50.00, type: "ex_box_dual", set: "Mega Evolution" },
  "salamence ex reshiram ex":                { msrp: 50.00, type: "ex_box_dual", set: "Mega Evolution" },
  "lugia latias ex":                         { msrp: 50.00, type: "ex_box_dual", set: "Destined Rivals" },
  "lugia ex latias ex":                      { msrp: 50.00, type: "ex_box_dual", set: "Destined Rivals" },

  // ── 5-pack Tins ($27) — named after sets ───────────────────
  "paradox destinies tin":                   { msrp: 27.00, type: "tin_5pack", set: "Paradox Destinies" },
  "azure legends tin":                       { msrp: 27.00, type: "tin_5pack", set: "Azure Legends" },
  "team rocket tin":                         { msrp: 27.00, type: "tin_5pack", set: "Destined Rivals" },
  "team rockets tin":                        { msrp: 27.00, type: "tin_5pack", set: "Destined Rivals" },

  // ── 3-pack Tins ($15) — Poké Ball line ──────────────────────
  "poke ball tin":                           { msrp: 15.00, type: "tin", set: "Misc" },
  "great ball tin":                          { msrp: 15.00, type: "tin", set: "Misc" },
  "ultra ball tin":                          { msrp: 15.00, type: "tin", set: "Misc" },
  "premier ball tin":                        { msrp: 15.00, type: "tin", set: "Misc" },
  "master ball tin":                         { msrp: 15.00, type: "tin", set: "Misc" },
  "repeat ball tin":                         { msrp: 15.00, type: "tin", set: "Misc" },
  "dive ball tin":                           { msrp: 15.00, type: "tin", set: "Misc" },
  "luxury ball tin":                         { msrp: 15.00, type: "tin", set: "Misc" },
  "quick ball tin":                          { msrp: 15.00, type: "tin", set: "Misc" },
  "moon ball tin":                           { msrp: 15.00, type: "tin", set: "Misc" },

  // ── Mini Tins ($10) — 2 packs + art card ───────────────────
  "mini tin":                                { msrp: 10.00, type: "mini_tin", set: "Misc" },
  "pokemon mini tin":                        { msrp: 10.00, type: "mini_tin", set: "Misc" },

  // ── Collector Chests (lunchbox-style) ─────────────────────
  "collector chest":                         { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "collectors chest":                        { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "fall collector chest":                    { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "summer collector chest":                  { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "winter collector chest":                  { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "holiday collector chest":                 { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "collector chest 2025":                    { msrp: 49.99, type: "collector_chest", set: "Misc" },
  "collector chest 2024":                    { msrp: 29.99, type: "collector_chest", set: "Misc" },
  "collector chest 2023":                    { msrp: 24.99, type: "collector_chest", set: "Misc" },
};

// Aliases — common seller-title variants mapped to canonical keys above.
const MSRP_ALIASES = {
  // ex Box variants
  "mega latias ex box":                      "mega latias ex",
  "mega latias ex premium collection":       "mega latias ex",
  "mega kangaskhan ex box":                  "mega kangaskhan ex",
  "mega kangaskhan ex premium collection":   "mega kangaskhan ex",
  "mega venusaur ex box":                    "mega venusaur ex",
  "mega venusaur ex premium collection":     "mega venusaur ex",
  "hops zacian ex box":                      "hops zacian ex",
  "hop zacian ex box":                       "hops zacian ex",
  "iron valiant ex box":                     "iron valiant ex",
  "iron valiant ex premium collection":      "iron valiant ex",
  "ursaluna ex box":                         "ursaluna ex",
  "ursaluna ex premium collection":          "ursaluna ex",
  "mewtwo ex box":                           "mewtwo ex",
  "mewtwo ex premium collection":            "mewtwo ex",
  "team rocket mewtwo ex box":               "team rocket mewtwo ex",
  "team rockets mewtwo ex box":              "team rockets mewtwo ex",
  "team rocket mewtwo ex premium collection": "team rocket mewtwo ex",
  "charizard ex box":                        "charizard ex",
  "charizard ex premium collection":         "charizard ex",
  "mew ex box":                              "mew ex",
  "mew ex premium collection":               "mew ex",
  "greninja ex box":                         "greninja ex",
  "greninja ex premium collection":          "greninja ex",
  "hydreigon ex box":                        "hydreigon ex",
  "hydreigon ex premium collection":         "hydreigon ex",
  "iono bellibolt ex box":                   "iono bellibolt ex",
  "iono bellibolt ex premium collection":    "iono bellibolt ex",
  "terapagos ex box":                        "terapagos ex",
  "terapagos ex premium collection":         "terapagos ex",
  "walking wake ex box":                     "walking wake ex",
  "walking wake ex premium collection":      "walking wake ex",
  "iron leaves ex box":                      "iron leaves ex",
  "iron leaves ex premium collection":       "iron leaves ex",

  // Dual-headliner ex Box variants
  "black kyurem and melmetal ex":            "black kyurem ex melmetal ex",
  "black kyurem ex melmetal ex box":         "black kyurem ex melmetal ex",
  "black kyurem melmetal premium collection": "black kyurem ex melmetal ex",
  "archaludon and reshiram ex":              "archaludon ex reshiram ex",
  "archaludon ex reshiram ex box":           "archaludon ex reshiram ex",
  "archaludon reshiram premium collection":  "archaludon ex reshiram ex",
  "salamence and reshiram ex":               "salamence ex reshiram ex",
  "salamence ex reshiram ex box":            "salamence ex reshiram ex",
  "lugia and latias ex":                     "lugia ex latias ex",
  "lugia ex latias ex box":                  "lugia ex latias ex",

  // 5-pack tin variants
  "pokemon paradox destinies tin":           "paradox destinies tin",
  "pokemon azure legends tin":               "azure legends tin",
  "pokemon team rocket tin":                 "team rocket tin",
  "pokemon team rockets tin":                "team rockets tin",

  // 3-pack tin variants
  "pokemon poke ball tin":                   "poke ball tin",
  "pokemon great ball tin":                  "great ball tin",
  "pokemon ultra ball tin":                  "ultra ball tin",

  // Collector Chest variants
  "pokemon collector chest":                 "collector chest",
  "pokemon collectors chest":                "collectors chest",
  "pokemon tcg collector chest":             "collector chest",
};

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

const FREE_SHIPPING_THRESHOLDS = {
  tcgplayer: 35.00,
  ebay:      null,
  mercari:   null,
};