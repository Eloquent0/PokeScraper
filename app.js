// ============================================================
// PokéDeal — Main App Logic
// ============================================================

// ── Config ───────────────────────────────────────────────────
// The eBay proxy endpoint (Modal). After `modal deploy proxy.py`,
// Modal prints a URL ending in `.modal.run` — paste the /search
// URL here. Example:
//   https://yourname--pokedeal-ebay-proxy-ebayproxy-search.modal.run
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
    // Strip seller-noise words (factory sealed, brand new, x1, lot of, etc.)
    // so titles like "Charizard ex Premium Collection FACTORY SEALED NEW IN HAND"
    // normalize to the same key as the MSRP entry.
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
    .replace(/(?<!booster )\bbox\b(?=\s|$)/gi, "")  // strip trailing "box" except in "booster box"
    .replace(/\bx\d+\b/gi, "")                // x1, x2 quantity markers
    .replace(/\blot of \d+\b/gi, "")          // "lot of 2", "lot of 3"
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
  // resolve alias
  if (MSRP_ALIASES[s]) s = MSRP_ALIASES[s];
  return s;
}

function lookupMsrp(normalizedName) {
  // exact match
  if (MSRP_TABLE[normalizedName]) return MSRP_TABLE[normalizedName];
  // partial match
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
  // Exclude singles / graded cards
  const singleKeywords = ["psa", "bgs", "cgc", "graded", "holo card", "reverse holo", "/165", "/091", "nm/m ", "lp ", " ex card", " v card", "pack fresh", "raw card", "single card"];
  if (singleKeywords.some(k => t.includes(k))) return false;
  // Must have a sealed-product keyword
  const sealedKeywords = [
    "booster box", "etb", "elite trainer", "booster bundle", "blister",
    "tin", "mini tin", "collector chest", "collectors chest",
    "premium collection", "ex box", "ex premium",
    "sealed", "factory sealed"
  ];
  return sealedKeywords.some(k => t.includes(k));
}

// ── Score a listing ──────────────────────────────────────────
function scoreListing(listing) {
  const { landedCost, msrp } = listing;
  if (!msrp) return null;
  const pctAbove = ((landedCost - msrp) / msrp) * 100;
  listing.pctAboveMsrp = pctAbove;
  // Score: 100 = at MSRP, 0 = 50%+ above, negative = below MSRP (steal)
  listing.dealScore = Math.max(0, Math.round(100 - pctAbove * 2));
  listing.dealTier = pctAbove <= 0    ? "steal"
                   : pctAbove <= 10   ? "hot"
                   : pctAbove <= 20   ? "good"
                   : pctAbove <= 40   ? "fair"
                   : "overpriced";
  return listing;
}

// ── Build listing object ─────────────────────────────────────
// NOTE: We intentionally do NOT store any eBay user data (e.g. seller
// usernames). The app only persists item/listing/price data, which keeps
// us eligible to opt out of eBay Marketplace Account Deletion notifications.
function buildListing({ title, price, shipping, source, url, condition, imageUrl }) {
  const normalized = normalizeName(title);
  const msrpData   = lookupMsrp(normalized);
  const shippingCost = (shipping === null || shipping === undefined)
    ? (SHIPPING_ESTIMATES[source] || 5.99)
    : Number(shipping);
  const landedCost = Number(price) + shippingCost;
  const listing = {
    id: Math.random().toString(36).slice(2),
    title,
    normalizedName: normalized,
    source,
    url,
    price: Number(price),
    shipping: shippingCost,
    shippingFree: shippingCost === 0,
    shippingEstimated: (shipping === null || shipping === undefined),
    landedCost,
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
// Calls the Modal proxy, which holds the eBay credentials server-side,
// does the OAuth token exchange, and returns item/listing data only.
// No API key is ever handled by the browser.
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

// ── Demo / mock data (used when proxy not configured) ────────
function getMockListings(query) {
  const q = query.toLowerCase();
  const mockData = [
    { title: "Surging Sparks Booster Box Sealed Pokemon TCG", price: 155.00, shipping: 0,    source: "ebay" },
    { title: "Surging Sparks Booster Box Factory Sealed",     price: 162.00, shipping: 4.99, source: "ebay" },
    { title: "Surging Sparks ETB Elite Trainer Box Sealed",   price: 52.99,  shipping: 0,    source: "tcgplayer" },
    { title: "Surging Sparks ETB Sealed New",                 price: 55.00,  shipping: 3.99, source: "mercari" },
    { title: "Prismatic Evolutions ETB Sealed",               price: 89.99,  shipping: 0,    source: "ebay" },
    { title: "Prismatic Evolutions Booster Bundle Sealed",    price: 28.00,  shipping: 4.99, source: "mercari" },
    { title: "Paradox Rift Booster Box Sealed Pokemon",       price: 129.99, shipping: 0,    source: "ebay" },
    { title: "Pokemon 151 ETB Elite Trainer Box Sealed",      price: 58.00,  shipping: 5.99, source: "whatnot" },
    { title: "Temporal Forces Booster Bundle Sealed",         price: 21.99,  shipping: 0,    source: "tcgplayer" },
    { title: "Stellar Crown ETB Sealed New",                  price: 48.00,  shipping: 0,    source: "ebay" },
    { title: "Prismatic Evolutions Super Premium Collection Sealed", price: 120.00, shipping: 0, source: "ebay" },
    { title: "Journey Together Booster Box Sealed",           price: 148.00, shipping: 6.99, source: "lgs" },
  ];

  return mockData
    .filter(m => {
      if (!q || q.length < 2) return true;
      return m.title.toLowerCase().includes(q) ||
             normalizeName(m.title).includes(q);
    })
    .map(m => buildListing(m));
}

// ── Main search ──────────────────────────────────────────────
async function doSearch() {
  const query = document.getElementById("searchInput").value.trim();
  setStatus("Scanning…");

  let results = [];

  // Try eBay via proxy
  const ebayResults = await searchEbay(query);
  results = results.concat(ebayResults);

  // If proxy not configured or no results, use demo data
  if (results.length === 0) {
    if (!EBAY_PROXY_URL || EBAY_PROXY_URL.startsWith("PASTE_")) {
      showNotification("No proxy configured — showing demo data. Set EBAY_PROXY_URL to search live.", "info");
    }
    results = getMockListings(query);
  }

  // Add any manually imported listings
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
    if (l.uncertain) return true; // keep uncertain ones for review
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

    const pctLabel = l.pctAboveMsrp !== null
      ? (l.pctAboveMsrp <= 0 ? `${Math.abs(l.pctAboveMsrp.toFixed(1))}% BELOW MSRP 🔥` : `+${l.pctAboveMsrp.toFixed(1)}% above MSRP`)
      : "MSRP unknown";

    const shippingLabel = l.shippingFree
      ? '<span class="free-ship">FREE SHIPPING</span>'
      : `<span class="ship-cost">${l.shippingEstimated ? "~" : ""}$${l.shipping.toFixed(2)} shipping</span>`;

    const tierBadge = {
      steal:      '<span class="tier-badge steal">🔥 STEAL</span>',
      hot:        '<span class="tier-badge hot">⚡ HOT DEAL</span>',
      good:       '<span class="tier-badge good">✓ GOOD</span>',
      fair:       '<span class="tier-badge fair">◎ FAIR</span>',
      overpriced: '<span class="tier-badge over">✗ OVERPRICED</span>',
      unknown:    '<span class="tier-badge unknown">? REVIEW</span>',
    }[l.dealTier] || "";

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

    card.innerHTML = `
      <div class="card-top">
        <span class="source-tag src-${l.source}">${sourceIcon}</span>
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
          <span class="listed-price">$${l.price.toFixed(2)}</span>
          ${shippingLabel}
        </div>
        <div class="landed-row">
          <span class="landed-label">LANDED</span>
          <span class="landed-cost">$${l.landedCost.toFixed(2)}</span>
        </div>
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
    alert.innerHTML = `
      <span class="alert-icon">${l.dealTier === "steal" ? "🔥" : "⚡"}</span>
      <span class="alert-text"><strong>${escHtml(truncate(l.title, 50))}</strong> — $${l.landedCost.toFixed(2)} landed (${l.pctAboveMsrp <= 0 ? Math.abs(l.pctAboveMsrp.toFixed(1)) + "% BELOW" : "+" + l.pctAboveMsrp.toFixed(1) + "% above"} MSRP)</span>
      <a ${l.url && l.url !== "#" ? `href="${l.url}" target="_blank"` : `href="#" onclick="event.preventDefault()"`} class="alert-cta">VIEW →</a>
      <button class="alert-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(alert);
  });
}

// ── CSV Export ───────────────────────────────────────────────
function exportCsv() {
  if (!filteredListings.length) { showNotification("No listings to export.", "warn"); return; }
  const headers = ["Title","Source","Set","Type","Condition","Price","Shipping","Landed Cost","MSRP","% Above MSRP","Deal Tier","URL","Shipping Estimated","Uncertain Match"];
  const rows = filteredListings.map(l => [
    `"${(l.title||"").replaceAll('"','""')}"`,
    l.source,
    `"${l.setName}"`,
    l.productType,
    l.condition,
    l.price.toFixed(2),
    l.shipping.toFixed(2),
    l.landedCost.toFixed(2),
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

  // Type filter tags
  document.querySelectorAll(".tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTypeFilter = btn.dataset.type;
      applyFiltersAndRender();
      updateStats();
    });
  });

  // Import modal
  document.getElementById("importUrlBtn").addEventListener("click", () => {
    document.getElementById("importModal").style.display = "flex";
  });
  document.getElementById("importModalClose").addEventListener("click", () => closeModal("importModal"));
  document.getElementById("importSubmit").addEventListener("click", submitManualImport);
  document.getElementById("importModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal("importModal"); });

  // NOTE: The "eBay API Key" modal has been removed. Credentials now live
  // server-side in the Modal proxy; the browser never handles an API key.
  // If your index.html still has #ebayApiBtn / #ebayModal elements, you can
  // delete them — they are no longer wired up here.

  // Load demo data on start
  allListings = getMockListings("");
  applyFiltersAndRender();
  updateStats();
  checkAlerts();
  document.getElementById("lastUpdated").textContent = "Demo data loaded";
});