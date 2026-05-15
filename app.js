// ============================================================
// PokéDeal — Main App Logic
// ============================================================

// ── Config ───────────────────────────────────────────────────
const EBAY_PROXY_URL = "https://poketrovefinds--pokedeal-ebay-proxy-ebayproxy-search.modal.run";

// ── State ────────────────────────────────────────────────────
let allListings = [];
let filteredListings = [];
let activeTypeFilter = "all";

// ── Normalize product name ───────────────────────────────────
function normalizeName(raw) {
  let s = (raw || "").toLowerCase()
    .replace(/pokémon|pokemon/gi, "")
    .replace(/trading card game|tcg/gi, "")
    .replace(/elite trainer box/gi, "etb")
    .replace(/\bfactory sealed\b/gi, "")
    .replace(/\bbrand new\b/gi, "")
    .replace(/\bnew sealed\b/gi, "")
    .replace(/\bin hand\b/gi, "")
    .replace(/\bsealed\b/gi, "")
    .replace(/\bnew\b/gi, "")
    .replace(/\bfactory\b/gi, "")
    .replace(/\bofficial\b/gi, "")
    .replace(/\bauthentic\b/gi, "")
    .replace(/\bdisplay\b/gi, "")
    .replace(/(?<!booster )\bbox\b(?=\s|$)/gi, "")
    .replace(/\bx\d+\b/gi, "")
    .replace(/\blot of \d+\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
  if (MSRP_ALIASES[s]) s = MSRP_ALIASES[s];
  return s;
}

function lookupMsrp(normalizedName) {
  if (MSRP_TABLE[normalizedName]) return MSRP_TABLE[normalizedName];
  for (const key of Object.keys(MSRP_TABLE)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return MSRP_TABLE[key];
    }
  }
  return null;
}

function detectProductType(title) {
  const t = title.toLowerCase();
  if (t.includes("booster box"))                          return "booster_box";
  if (t.includes("etb") || t.includes("elite trainer"))   return "etb";
  if (t.includes("booster bundle") || t.includes("bundle")) return "booster_bundle";
  if (t.includes("collector chest") || t.includes("collectors chest")) return "collector_chest";
  if (t.includes("mini tin"))                             return "mini_tin";
  if (t.includes("ex premium collection") || t.includes("ex box") || t.includes("premium collection")) return "ex_premium_collection";
  if (t.includes("tin"))                                  return "tin";
  if (t.includes("blister"))                              return "blister";
  return "other";
}

function isSealedProduct(title) {
  const t = title.toLowerCase();
  const singleKeywords = ["psa", "bgs", "cgc", "graded", "holo card", "reverse holo", "/165", "/091", "nm/m ", "lp ", " ex card", " v card", "pack fresh", "raw card", "single card"];
  if (singleKeywords.some(k => t.includes(k))) return false;
  const sealedKeywords = [
    "booster box", "etb", "elite trainer", "booster bundle", "blister",
    "tin", "mini tin", "collector chest", "collectors chest",
    "premium collection", "ex box", "ex premium",
    "sealed", "factory sealed"
  ];
  return sealedKeywords.some(k => t.includes(k));
}

// ── Detect quantity from a listing title ─────────────────────
// Returns an integer >= 1. Returns 1 when no count is found or when
// it looks like a mixed lot. Ignores numbers that describe contents
// (e.g. "36 packs" inside a booster box title, "4 booster packs" inside
// a Premium Collection title).
function detectQuantity(rawTitle) {
  const title = (rawTitle || "").toLowerCase();

  // Reject mixed lots — "lot of 2 ETB and booster box", etc.
  const hasLotPhrase = /\b(lot of|set of|bundle of)\b/i.test(title) ||
                       /\bx\s?\d+\b|\b\d+\s?x\b/i.test(title) ||
                       /\b\d+\s?(pk|pack)\b/i.test(title);
  if (hasLotPhrase && /(\band\b|\+| with )/i.test(title)) return 1;

  const patterns = [
    /\blot of (\d{1,3})\b/i,
    /\bset of (\d{1,3})\b/i,
    /\bbundle of (\d{1,3})\b/i,
    /\(\s*(\d{1,3})\s*\)/,
    /\bx\s?(\d{1,3})\b/i,
    /\b(\d{1,3})\s?x\b/i,
    /\b(\d{1,3})\s?[- ]?(?:pack|pk)s?\b/i,
  ];

  for (const re of patterns) {
    const m = title.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      // Sanity bounds. 2..50 is the realistic range for sealed lots.
      if (n < 2 || n > 50) continue;

      // Reject content-description matches:
      //  - "36 pack" / "36 packs" inside a booster box (box contains packs)
      if (/booster box/.test(title) && /pack/.test(m[0])) continue;
      //  - "N pack(s)" inside a Premium Collection / Collector Chest /
      //    ex box (those are describing box contents, not lot quantity)
      if (/premium collection|collector chest|ex box|ex premium/.test(title) && /pack/.test(m[0])) continue;

      return n;
    }
  }

  return 1;
}

// ── Score a listing ──────────────────────────────────────────
function scoreListing(listing) {
  const { landedCost, msrp } = listing;
  if (!msrp) return null;
  const pctAbove = ((landedCost - msrp) / msrp) * 100;
  listing.pctAboveMsrp = pctAbove;
  listing.dealScore = Math.max(0, Math.round(100 - pctAbove * 2));
  listing.dealTier = pctAbove <= 0    ? "steal"
                   : pctAbove <= 10   ? "hot"
                   : pctAbove <= 20   ? "good"
                   : pctAbove <= 40   ? "fair"
                   : "overpriced";
  return listing;
}

// ── Build listing object ─────────────────────────────────────
// quantity > 1 → per-item math: price/shipping/landedCost are divided
// so all downstream scoring/sorting/filtering operates per unit.
function buildListing({ title, price, shipping, source, url, condition, imageUrl }) {
  const normalized = normalizeName(title);
  const msrpData   = lookupMsrp(normalized);
  const quantity   = detectQuantity(title);

  const totalPrice    = Number(price);
  const totalShipping = (shipping === null || shipping === undefined)
    ? (SHIPPING_ESTIMATES[source] || 5.99)
    : Number(shipping);
  const totalLanded   = totalPrice + totalShipping;

  const perPrice    = totalPrice / quantity;
  const perShipping = totalShipping / quantity;
  const perLanded   = totalLanded / quantity;

  const listing = {
    id: Math.random().toString(36).slice(2),
    title,
    normalizedName: normalized,
    source,
    url,
    quantity,
    // Per-item amounts (default for scoring & display)
    price:        perPrice,
    shipping:     perShipping,
    landedCost:   perLanded,
    // Total amounts (what the listing actually charges)
    totalPrice,
    totalShipping,
    totalLanded,
    shippingFree:      totalShipping === 0,
    shippingEstimated: (shipping === null || shipping === undefined),
    msrp: msrpData?.msrp || null,
    msrpData,
    productType: msrpData?.type || detectProductType(title),
    setName: msrpData?.set || "Unknown",
    condition: condition || "New",
    imageUrl: imageUrl || null,
    uncertain: !msrpData,
    timestamp: Date.now(),
  };
  return msrpData ? scoreListing(listing) : { ...listing, pctAboveMsrp: null, dealScore: null, dealTier: "unknown" };
}

// ── eBay Search (via proxy) ──────────────────────────────────
async function searchEbay(query) {
  if (!EBAY_PROXY_URL || EBAY_PROXY_URL.startsWith("PASTE_")) {
    showNotification("eBay proxy URL not configured — showing demo data.", "info");
    return [];
  }
  setStatus("Searching eBay…");
  const endpoint = `${EBAY_PROXY_URL}?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      showNotification(`eBay proxy error: ${res.status}`, "error");
      return [];
    }
    const data = await res.json();
    const items = data.itemSummaries || [];
    return items
      .filter(item => isSealedProduct(item.title || ""))
      .map(item => buildListing({
        title:    item.title,
        price:    item.price?.value,
        shipping: item.shippingOptions?.[0]?.shippingCost?.value ?? null,
        source:   "ebay",
        url:      item.itemWebUrl,
        condition: item.condition,
        imageUrl: item.image?.imageUrl,
      }));
  } catch (err) {
    showNotification(`eBay search failed: ${err.message}`, "error");
    return [];
  }
}

// ── Main search ──────────────────────────────────────────────
async function doSearch() {
  const query = document.getElementById("searchInput").value.trim();
  setStatus("Scanning…");

  let results = [];

  const ebayResults = await searchEbay(query);
  results = results.concat(ebayResults);

  if (results.length === 0) {
    if (!EBAY_PROXY_URL || EBAY_PROXY_URL.startsWith("PASTE_")) {
      showNotification("No proxy configured — add EBAY proxy or client token to search live.", "info");
    } else {
      showNotification("No results found.", "info");
    }
  }

  const manualListings = allListings.filter(l => l.source === "manual");
  results = results.concat(manualListings);

  allListings = results;
  applyFiltersAndRender();
  updateStats();
  checkAlerts();
  document.getElementById("lastUpdated").textContent = "Updated " + new Date().toLocaleTimeString();
  setStatus("READY");
}

// ── Filter + Sort ────────────────────────────────────────────
function applyFiltersAndRender() {
  const threshold   = Number(document.getElementById("thresholdSlider").value);
  const sortBy      = document.getElementById("sortSelect").value;
  const sourceFilter = document.getElementById("sourceSelect").value;

  filteredListings = allListings.filter(l => {
    if (activeTypeFilter !== "all" && l.productType !== activeTypeFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    if (l.msrp && l.pctAboveMsrp > threshold) return false;
    if (l.uncertain) return true;
    return true;
  });

  filteredListings.sort((a, b) => {
    if (sortBy === "deal_score")      return (b.dealScore || 0) - (a.dealScore || 0);
    if (sortBy === "landed_cost")     return a.landedCost - b.landedCost;
    if (sortBy === "pct_above_msrp")  return (a.pctAboveMsrp ?? 999) - (b.pctAboveMsrp ?? 999);
    if (sortBy === "price")           return a.price - b.price;
    return 0;
  });

  renderResults(filteredListings);
}

// ── Render ───────────────────────────────────────────────────
function renderResults(listings) {
  const grid  = document.getElementById("resultsGrid");
  const empty = document.getElementById("emptyState");
  const statsBar = document.getElementById("statsBar");

  grid.innerHTML = "";

  if (!listings.length) {
    empty.style.display = "flex";
    statsBar.style.display = "none";
    return;
  }

  empty.style.display = "none";
  statsBar.style.display = "flex";

  listings.forEach(l => {
    const card = document.createElement("div");
    card.className = `listing-card tier-${l.dealTier}`;
    if (l.uncertain) card.classList.add("uncertain");
    if (l.quantity > 1) card.classList.add("multi-qty");

    const pctLabel = l.pctAboveMsrp !== null
      ? (l.pctAboveMsrp <= 0 ? `${Math.abs(l.pctAboveMsrp.toFixed(1))}% BELOW MSRP 🔥` : `+${l.pctAboveMsrp.toFixed(1)}% above MSRP`)
      : "MSRP unknown";

    const shippingLabel = l.shippingFree
      ? '<span class="free-ship">FREE SHIPPING</span>'
      : `<span class="ship-cost">${l.shippingEstimated ? "~" : ""}$${l.shipping.toFixed(2)} shipping${l.quantity > 1 ? "/ea" : ""}</span>`;

    const tierBadge = {
      steal:      '<span class="tier-badge steal">🔥 STEAL</span>',
      hot:        '<span class="tier-badge hot">⚡ HOT DEAL</span>',
      good:       '<span class="tier-badge good">✓ GOOD</span>',
      fair:       '<span class="tier-badge fair">◎ FAIR</span>',
      overpriced: '<span class="tier-badge over">✗ OVERPRICED</span>',
      unknown:    '<span class="tier-badge unknown">? REVIEW</span>',
    }[l.dealTier] || "";

    const qtyBadge = l.quantity > 1
      ? `<span class="qty-badge">×${l.quantity}</span>`
      : "";

    const sourceIcon = {
      ebay:      "eBay",
      tcgplayer: "TCG",
      mercari:   "Mrc",
      whatnot:   "Whn",
      tiktok:    "TkT",
      lgs:       "LGS",
      manual:    "URL",
      other:     "↗",
    }[l.source] || "↗";

    const landedLabel = l.quantity > 1 ? "$/ITEM" : "LANDED";

    const totalLine = l.quantity > 1
      ? `<div class="total-row">
           <span class="total-label">TOTAL ×${l.quantity}</span>
           <span class="total-cost">$${l.totalLanded.toFixed(2)}</span>
         </div>`
      : "";

    card.innerHTML = `
      <div class="card-top">
        <span class="source-tag src-${l.source}">${sourceIcon}</span>
        ${qtyBadge}
        ${tierBadge}
        ${l.uncertain ? '<span class="uncertain-tag">⚠ REVIEW</span>' : ""}
      </div>
      ${l.imageUrl ? `<img class="card-img" src="${l.imageUrl}" alt="${escHtml(l.title)}" loading="lazy">` : ""}
      <div class="card-body">
        <div class="card-title" title="${escHtml(l.title)}">${escHtml(truncate(l.title, 72))}</div>
        <div class="card-set">${escHtml(l.setName)} · ${formatType(l.productType)}</div>
        <div class="card-condition">${escHtml(l.condition)}</div>
      </div>
      <div class="card-pricing">
        <div class="price-row">
          <span class="listed-price">$${l.price.toFixed(2)}${l.quantity > 1 ? '<span class="per-item-suffix">/ea</span>' : ""}</span>
          ${shippingLabel}
        </div>
        <div class="landed-row">
          <span class="landed-label">${landedLabel}</span>
          <span class="landed-cost">$${l.landedCost.toFixed(2)}</span>
        </div>
        ${totalLine}
        ${l.msrp ? `
        <div class="msrp-row">
          <span class="msrp-label">MSRP $${l.msrp.toFixed(2)}</span>
          <span class="pct-label ${l.dealTier}">${pctLabel}</span>
        </div>
        <div class="deal-bar-wrap">
          <div class="deal-bar" style="width:${Math.min(100, l.dealScore || 0)}%"></div>
        </div>
        ` : '<div class="msrp-unknown">MSRP not in database — manual review</div>'}
      </div>
      <a class="card-cta" ${l.url && l.url !== "#" ? `href="${l.url}" target="_blank" rel="noopener noreferrer"` : `href="#" onclick="event.preventDefault();alert('Demo listing — configure the eBay proxy to see real links.')" `}>
        VIEW LISTING →
      </a>
    `;
    grid.appendChild(card);
  });
}

// ── Stats ─────────────────────────────────────────────────────
function updateStats() {
  const deals = filteredListings.filter(l => l.dealTier === "steal" || l.dealTier === "hot" || l.dealTier === "good");
  const best  = filteredListings.reduce((min, l) => l.landedCost < (min?.landedCost ?? Infinity) ? l : min, null);
  const msrpRef = best?.msrp;

  document.getElementById("statTotal").textContent  = filteredListings.length;
  document.getElementById("statDeals").textContent  = deals.length;
  document.getElementById("statBest").textContent   = best ? `$${best.landedCost.toFixed(2)}` : "—";
  document.getElementById("statMsrp").textContent   = msrpRef ? `$${msrpRef.toFixed(2)}` : "—";

  const hot = filteredListings.filter(l => l.dealTier === "steal" || l.dealTier === "hot");
  const alertStat = document.getElementById("alertStat");
  if (hot.length) {
    document.getElementById("statAlert").textContent = hot.length;
    alertStat.style.display = "flex";
  } else {
    alertStat.style.display = "none";
  }

  document.getElementById("statsBar").style.display = filteredListings.length ? "flex" : "none";
}

// ── Alerts ────────────────────────────────────────────────────
function checkAlerts() {
  const container = document.getElementById("alertsContainer");
  container.innerHTML = "";
  const hotDeals = filteredListings.filter(l => l.dealTier === "steal" || l.dealTier === "hot");
  hotDeals.slice(0, 3).forEach(l => {
    const alert = document.createElement("div");
    alert.className = "deal-alert";
    const qtyNote = l.quantity > 1 ? ` (×${l.quantity} lot, $${l.landedCost.toFixed(2)}/ea)` : "";
    alert.innerHTML = `
      <span class="alert-icon">${l.dealTier === "steal" ? "🔥" : "⚡"}</span>
      <span class="alert-text"><strong>${escHtml(truncate(l.title, 50))}</strong> — $${l.landedCost.toFixed(2)} landed${qtyNote} (${l.pctAboveMsrp <= 0 ? Math.abs(l.pctAboveMsrp.toFixed(1)) + "% BELOW" : "+" + l.pctAboveMsrp.toFixed(1) + "% above"} MSRP)</span>
      <a ${l.url && l.url !== "#" ? `href="${l.url}" target="_blank"` : `href="#" onclick="event.preventDefault()"`} class="alert-cta">VIEW →</a>
      <button class="alert-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(alert);
  });
}

// ── CSV Export ───────────────────────────────────────────────
function exportCsv() {
  if (!filteredListings.length) { showNotification("No listings to export.", "warn"); return; }
  const headers = ["Title","Source","Set","Type","Qty","Price/ea","Shipping/ea","Landed/ea","Total Price","Total Shipping","Total Landed","MSRP","% Above MSRP","Deal Tier","URL","Shipping Estimated","Uncertain Match"];
  const rows = filteredListings.map(l => [
    `"${(l.title||"").replaceAll('"','""')}"`,
    l.source,
    `"${l.setName}"`,
    l.productType,
    l.quantity,
    l.price.toFixed(2),
    l.shipping.toFixed(2),
    l.landedCost.toFixed(2),
    l.totalPrice.toFixed(2),
    l.totalShipping.toFixed(2),
    l.totalLanded.toFixed(2),
    l.msrp ? l.msrp.toFixed(2) : "",
    l.pctAboveMsrp !== null ? l.pctAboveMsrp.toFixed(1) : "",
    l.dealTier,
    l.url,
    l.shippingEstimated ? "yes" : "no",
    l.uncertain ? "yes" : "no",
  ].join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pokedeal_${Date.now()}.csv`;
  a.click();
}

// ── Manual Import ────────────────────────────────────────────
function submitManualImport() {
  const url      = document.getElementById("importUrlInput").value.trim();
  const price    = parseFloat(document.getElementById("importPrice").value);
  const shipping = document.getElementById("importShipping").value;
  const name     = document.getElementById("importName").value.trim();
  const source   = document.getElementById("importSource").value;

  if (!url || !price || !name) { showNotification("URL, price, and product name are required.", "warn"); return; }
  if (!isSealedProduct(name)) { showNotification("This doesn't look like a sealed product. Add keywords like 'booster box', 'ETB', etc.", "warn"); }

  const listing = buildListing({
    title:    name,
    price,
    shipping: shipping ? parseFloat(shipping) : null,
    source:   "manual",
    url,
    condition: "New",
  });

  allListings = [listing, ...allListings];
  applyFiltersAndRender();
  updateStats();
  checkAlerts();
  closeModal("importModal");
  showNotification("Listing added.", "success");
}

// ── Notifications ─────────────────────────────────────────────
function showNotification(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `notif notif-${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add("notif-show"), 10);
  setTimeout(() => { n.classList.remove("notif-show"); setTimeout(() => n.remove(), 300); }, 4000);
}

function setStatus(text) {
  document.getElementById("statusPill").textContent = `● ${text}`;
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// ── Helpers ───────────────────────────────────────────────────
function escHtml(s) {
  return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }
function formatType(t) {
  return {
    booster_box:            "Booster Box",
    etb:                    "ETB",
    booster_bundle:         "Bundle",
    tin:                    "Tin",
    mini_tin:               "Mini Tin",
    collector_chest:        "Collector Chest",
    ex_premium_collection:  "ex Premium Collection",
    blister:                "Blister",
    collection:             "Collection",
    other:                  "Other",
  }[t] || t;
}

// ── DOM Wiring ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("searchBtn").addEventListener("click", doSearch);
  document.getElementById("searchInput").addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });

  document.getElementById("thresholdSlider").addEventListener("input", e => {
    document.getElementById("thresholdVal").textContent = `+${e.target.value}% MSRP`;
    applyFiltersAndRender();
    updateStats();
  });

  document.getElementById("sortSelect").addEventListener("change", () => { applyFiltersAndRender(); updateStats(); });
  document.getElementById("sourceSelect").addEventListener("change", () => { applyFiltersAndRender(); updateStats(); });
  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);

  document.querySelectorAll(".tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTypeFilter = btn.dataset.type;
      applyFiltersAndRender();
      updateStats();
    });
  });

  document.getElementById("importUrlBtn").addEventListener("click", () => {
    document.getElementById("importModal").style.display = "flex";
  });
  document.getElementById("importModalClose").addEventListener("click", () => closeModal("importModal"));
  document.getElementById("importSubmit").addEventListener("click", submitManualImport);
  document.getElementById("importModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal("importModal"); });

  allListings = [];
  applyFiltersAndRender();
  updateStats();
  checkAlerts();
  document.getElementById("lastUpdated").textContent = "Ready";
});