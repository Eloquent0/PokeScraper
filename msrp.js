// ============================================================
// PokéDeal — Main App Logic
// ============================================================

// ── State ────────────────────────────────────────────────────
let allListings = [];
let filteredListings = [];
let activeTypeFilter = "all";
let ebayApiKey = localStorage.getItem("pokedeal_ebay_key") || null;

// ── Normalize product name ───────────────────────────────────
function normalizeName(raw) {
  let s = (raw || "").toLowerCase()
    .replace(/pokémon|pokemon/gi, "")
    .replace(/trading card game|tcg/gi, "")
    .replace(/elite trainer box/gi, "etb")
    .replace(/booster box/gi, "booster box")
    .replace(/booster bundle/gi, "booster bundle")
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
  if (t.includes("booster box"))        return "booster_box";
  if (t.includes("etb") || t.includes("elite trainer")) return "etb";
  if (t.includes("booster bundle") || t.includes("bundle")) return "booster_bundle";
  if (t.includes("tin"))                return "tin";
  if (t.includes("blister"))            return "blister";
  if (t.includes("collection") || t.includes("premium")) return "collection";
  return "other";
}

function isSealedProduct(title) {
  const t = title.toLowerCase();
  // Exclude singles
  const singleKeywords = ["psa", "bgs", "cgc", "graded", "holo card", "reverse holo", "/165", "/091", "nm/m ", "lp ", " ex card", " v card", "pack fresh", "raw card"];
  if (singleKeywords.some(k => t.includes(k))) return false;
  // Must have a sealed keyword
  const sealedKeywords = ["booster box", "etb", "elite trainer", "booster bundle", "blister", "tin", "collection box", "premium collection", "sealed", "factory sealed", "mini tin"];
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
function buildListing({ title, price, shipping, source, url, seller, condition, imageUrl }) {
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
    seller: seller || "—",
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

// ── eBay API Search ──────────────────────────────────────────
async function searchEbay(query) {
  if (!ebayApiKey) {
    showNotification("eBay API key not set. Click ⚙ eBay API Key to add one.", "warn");
    return [];
  }
  setStatus("Searching eBay…");
  const sealedQuery = `${query} sealed pokemon`;
  const endpoint = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(sealedQuery)}&category_ids=183454&limit=50&filter=conditionIds:{1000|1500},buyingOptions:{FIXED_PRICE}`;
  try {
    const res = await fetch(endpoint, {
      headers: {
        "Authorization": `Bearer ${ebayApiKey}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAYS-US",
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) {
      if (res.status === 401) showNotification("eBay API key invalid or expired.", "error");
      else showNotification(`eBay API error: ${res.status}`, "error");
      return [];
    }
    const data = await res.json();
    const items = data.itemSummaries || [];
    return items
      .filter(item => isSealedProduct(item.title))
      .map(item => buildListing({
        title:    item.title,
        price:    item.price?.value,
        shipping: item.shippingOptions?.[0]?.shippingCost?.value ?? null,
        source:   "ebay",
        url:      item.itemWebUrl,
        seller:   item.seller?.username,
        condition: item.condition,
        imageUrl: item.image?.imageUrl,
      }));
  } catch (err) {
    showNotification(`eBay search failed: ${err.message}`, "error");
    return [];
  }
}

// ── Demo / mock data (used when no API key) ──────────────────
function getMockListings(query) {
  const q = query.toLowerCase();
  const mockData = [
    { title: "Surging Sparks Booster Box Sealed Pokemon TCG", price: 155.00, shipping: 0,    source: "ebay",      url: "#", seller: "pokecarddeals99" },
    { title: "Surging Sparks Booster Box Factory Sealed",     price: 162.00, shipping: 4.99, source: "ebay",      url: "#", seller: "collector_vault" },
    { title: "Surging Sparks ETB Elite Trainer Box Sealed",   price: 52.99,  shipping: 0,    source: "tcgplayer", url: "#", seller: "TCGplayer" },
    { title: "Surging Sparks ETB Sealed New",                 price: 55.00,  shipping: 3.99, source: "mercari",   url: "#", seller: "cardflip_usa" },
    { title: "Prismatic Evolutions ETB Sealed",               price: 89.99,  shipping: 0,    source: "ebay",      url: "#", seller: "sealed_deals" },
    { title: "Prismatic Evolutions Booster Bundle Sealed",    price: 28.00,  shipping: 4.99, source: "mercari",   url: "#", seller: "poke_hunter_x" },
    { title: "Paradox Rift Booster Box Sealed Pokemon",       price: 129.99, shipping: 0,    source: "ebay",      url: "#", seller: "retropackstore" },
    { title: "Pokemon 151 ETB Elite Trainer Box Sealed",      price: 58.00,  shipping: 5.99, source: "whatnot",   url: "#", seller: "pokeseller_live" },
    { title: "Temporal Forces Booster Bundle Sealed",         price: 21.99,  shipping: 0,    source: "tcgplayer", url: "#", seller: "TCGplayer" },
    { title: "Stellar Crown ETB Sealed New",                  price: 48.00,  shipping: 0,    source: "ebay",      url: "#", seller: "packopener2024" },
    { title: "Prismatic Evolutions Super Premium Collection Sealed", price: 120.00, shipping: 0, source: "ebay",  url: "#", seller: "bigbox_deals" },
    { title: "Journey Together Booster Box Sealed",           price: 148.00, shipping: 6.99, source: "lgs",       url: "#", seller: "LocalGameStore" },
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

  // Try eBay API
  const ebayResults = await searchEbay(query);
  results = results.concat(ebayResults);

  // If no eBay key or no results, use demo data
  if (results.length === 0) {
    if (!ebayApiKey) showNotification("No eBay API key — showing demo data. Add your key to search live.", "info");
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
        <div class="card-seller">Seller: ${escHtml(l.seller)} · ${l.condition}</div>
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
      <a class="card-cta" href="${l.url}" target="_blank" rel="noopener noreferrer">
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
      <a href="${l.url}" target="_blank" class="alert-cta">VIEW →</a>
      <button class="alert-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(alert);
  });
}

// ── CSV Export ───────────────────────────────────────────────
function exportCsv() {
  if (!filteredListings.length) { showNotification("No listings to export.", "warn"); return; }
  const headers = ["Title","Seller","Source","Set","Type","Condition","Price","Shipping","Landed Cost","MSRP","% Above MSRP","Deal Tier","URL","Shipping Estimated","Uncertain Match"];
  const rows = filteredListings.map(l => [
    `"${(l.title||"").replaceAll('"','""')}"`,
    `"${l.seller}"`,
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
    seller:   "Manual Import",
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
  return { booster_box:"Booster Box", etb:"ETB", booster_bundle:"Bundle", tin:"Tin", blister:"Blister", collection:"Collection", other:"Other" }[t] || t;
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

  // eBay API modal
  document.getElementById("ebayApiBtn").addEventListener("click", () => {
    document.getElementById("ebayApiInput").value = ebayApiKey || "";
    document.getElementById("ebayModal").style.display = "flex";
  });
  document.getElementById("ebayModalClose").addEventListener("click", () => closeModal("ebayModal"));
  document.getElementById("ebayApiSave").addEventListener("click", () => {
    const key = document.getElementById("ebayApiInput").value.trim();
    if (!key) { showNotification("Enter a valid API key.", "warn"); return; }
    ebayApiKey = key;
    localStorage.setItem("pokedeal_ebay_key", key);
    closeModal("ebayModal");
    showNotification("eBay API key saved.", "success");
  });
  document.getElementById("ebayModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal("ebayModal"); });

  // Load demo data on start
  allListings = getMockListings("");
  applyFiltersAndRender();
  updateStats();
  checkAlerts();
  document.getElementById("lastUpdated").textContent = "Demo data loaded";
});