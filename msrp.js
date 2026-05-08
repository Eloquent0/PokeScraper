// ============================================================
// MSRP REFERENCE TABLE
// Update these as new sets release.
// Keys are normalized product identifiers.
// ============================================================

const MSRP_TABLE = {

  // ── Booster Boxes ──────────────────────────────────────────
  "surging sparks booster box":           { msrp: 143.64, type: "booster_box", set: "Surging Sparks" },
  "stellar crown booster box":            { msrp: 143.64, type: "booster_box", set: "Stellar Crown" },
  "twilight masquerade booster box":      { msrp: 143.64, type: "booster_box", set: "Twilight Masquerade" },
  "temporal forces booster box":          { msrp: 143.64, type: "booster_box", set: "Temporal Forces" },
  "paradox rift booster box":             { msrp: 143.64, type: "booster_box", set: "Paradox Rift" },
  "obsidian flames booster box":          { msrp: 143.64, type: "booster_box", set: "Obsidian Flames" },
  "paldea evolved booster box":           { msrp: 143.64, type: "booster_box", set: "Paldea Evolved" },
  "scarlet violet base booster box":      { msrp: 143.64, type: "booster_box", set: "Scarlet & Violet Base" },
  "crown zenith booster box":             { msrp: 143.64, type: "booster_box", set: "Crown Zenith" },
  "silver tempest booster box":           { msrp: 107.52, type: "booster_box", set: "Silver Tempest" },
  "lost origin booster box":              { msrp: 107.52, type: "booster_box", set: "Lost Origin" },
  "astral radiance booster box":          { msrp: 107.52, type: "booster_box", set: "Astral Radiance" },
  "brilliant stars booster box":          { msrp: 107.52, type: "booster_box", set: "Brilliant Stars" },
  "151 booster box":                      { msrp: 143.64, type: "booster_box", set: "Pokémon 151" },
  "pokemon 151 booster box":              { msrp: 143.64, type: "booster_box", set: "Pokémon 151" },
  "journey together booster box":         { msrp: 143.64, type: "booster_box", set: "Journey Together" },
  "prismatic evolutions booster box":     { msrp: 143.64, type: "booster_box", set: "Prismatic Evolutions" },

  // ── Elite Trainer Boxes ────────────────────────────────────
  "surging sparks etb":                   { msrp: 49.99,  type: "etb", set: "Surging Sparks" },
  "stellar crown etb":                    { msrp: 49.99,  type: "etb", set: "Stellar Crown" },
  "twilight masquerade etb":              { msrp: 49.99,  type: "etb", set: "Twilight Masquerade" },
  "temporal forces etb":                  { msrp: 49.99,  type: "etb", set: "Temporal Forces" },
  "paradox rift etb":                     { msrp: 49.99,  type: "etb", set: "Paradox Rift" },
  "obsidian flames etb":                  { msrp: 49.99,  type: "etb", set: "Obsidian Flames" },
  "paldea evolved etb":                   { msrp: 49.99,  type: "etb", set: "Paldea Evolved" },
  "scarlet violet base etb":              { msrp: 49.99,  type: "etb", set: "Scarlet & Violet Base" },
  "151 etb":                              { msrp: 49.99,  type: "etb", set: "Pokémon 151" },
  "prismatic evolutions etb":             { msrp: 49.99,  type: "etb", set: "Prismatic Evolutions" },
  "journey together etb":                 { msrp: 49.99,  type: "etb", set: "Journey Together" },
  "crown zenith etb":                     { msrp: 49.99,  type: "etb", set: "Crown Zenith" },

  // ── Booster Bundles ────────────────────────────────────────
  "surging sparks booster bundle":        { msrp: 19.99,  type: "booster_bundle", set: "Surging Sparks" },
  "stellar crown booster bundle":         { msrp: 19.99,  type: "booster_bundle", set: "Stellar Crown" },
  "twilight masquerade booster bundle":   { msrp: 19.99,  type: "booster_bundle", set: "Twilight Masquerade" },
  "temporal forces booster bundle":       { msrp: 19.99,  type: "booster_bundle", set: "Temporal Forces" },
  "paradox rift booster bundle":          { msrp: 19.99,  type: "booster_bundle", set: "Paradox Rift" },
  "prismatic evolutions booster bundle":  { msrp: 19.99,  type: "booster_bundle", set: "Prismatic Evolutions" },
  "151 booster bundle":                   { msrp: 19.99,  type: "booster_bundle", set: "Pokémon 151" },

  // ── Tins ──────────────────────────────────────────────────
  "poke ball tin":                        { msrp: 19.99,  type: "tin", set: "Misc" },
  "great ball tin":                       { msrp: 19.99,  type: "tin", set: "Misc" },
  "ultra ball tin":                       { msrp: 19.99,  type: "tin", set: "Misc" },
  "mini tin":                             { msrp: 9.99,   type: "tin", set: "Misc" },
  "battle academy tin":                   { msrp: 19.99,  type: "tin", set: "Misc" },

  // ── Blisters ──────────────────────────────────────────────
  "3 pack blister":                       { msrp: 11.99,  type: "blister", set: "Misc" },
  "2 pack blister":                       { msrp: 8.99,   type: "blister", set: "Misc" },

  // ── Premium/Special Collections ───────────────────────────
  "prismatic evolutions super premium collection": { msrp: 99.99, type: "collection", set: "Prismatic Evolutions" },
  "prismatic evolutions premium collection":       { msrp: 59.99, type: "collection", set: "Prismatic Evolutions" },
  "charizard ex premium collection":               { msrp: 39.99, type: "collection", set: "Obsidian Flames" },
  "mew ex premium collection":                     { msrp: 34.99, type: "collection", set: "Pokémon 151" },
  "mewtwo ex premium collection":                  { msrp: 34.99, type: "collection", set: "Pokémon 151" },
};

// Aliases / alternate names that map to canonical keys
const MSRP_ALIASES = {
  "sv booster box":             "scarlet violet base booster box",
  "sv base set booster box":    "scarlet violet base booster box",
  "sv1 booster box":            "scarlet violet base booster box",
  "sv3 booster box":            "obsidian flames booster box",
  "sv4 booster box":            "paradox rift booster box",
  "sv5 booster box":            "temporal forces booster box",
  "sv6 booster box":            "twilight masquerade booster box",
  "sv7 booster box":            "stellar crown booster box",
  "sv8 booster box":            "surging sparks booster box",
  "elite trainer box":          "surging sparks etb",
  "pe etb":                     "prismatic evolutions etb",
  "pe booster bundle":          "prismatic evolutions booster bundle",
  "pe super premium":           "prismatic evolutions super premium collection",
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

// Free shipping thresholds
const FREE_SHIPPING_THRESHOLDS = {
  tcgplayer: 35.00,
  ebay:      null,   // varies by seller
  mercari:   null,
};