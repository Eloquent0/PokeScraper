@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

/* ── Reset + Root ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0d0f14;
  --surface:   #13161e;
  --surface2:  #1a1e28;
  --border:    #252933;
  --border2:   #2e3340;
  --text:      #e2e8f0;
  --muted:     #6b7280;
  --muted2:    #9ca3af;
  --accent:    #f97316;
  --accent2:   #fb923c;
  --green:     #22c55e;
  --teal:      #2dd4bf;
  --purple:    #a78bfa;
  --yellow:    #eab308;
  --red:       #ef4444;
  --blue:      #60a5fa;
  --font-main: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius:    8px;
  --radius-sm: 4px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-main);
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}

.scanline-overlay {
  display: none;
}

/* ── Header ──────────────────────────────────────────────── */
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 20px;
  color: var(--accent);
}

.logo-text {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  letter-spacing: 0.05em;
}

.logo-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 6px;
  border: 1px solid var(--border2);
  border-radius: var(--radius-sm);
  background: var(--surface2);
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-pill {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--green);
  letter-spacing: 0.05em;
}

.last-updated {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

/* ── App Layout ──────────────────────────────────────────── */
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

/* ── Search Section ──────────────────────────────────────── */
.search-section {
  margin-bottom: 20px;
}

.search-wrap {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-right: none;
  border-radius: var(--radius) 0 0 var(--radius);
  padding: 10px 16px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms;
}

.search-input::placeholder { color: var(--muted); }
.search-input:focus { border-color: var(--accent); }

.search-btn {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #fff;
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 10px 24px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 150ms;
}

.search-btn:hover { background: var(--accent2); }
.search-btn-icon { font-size: 16px; }

.search-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-btn {
  background: var(--surface);
  border: 1px solid var(--border2);
  color: var(--muted2);
  border-radius: var(--radius-sm);
  padding: 5px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 150ms;
  letter-spacing: 0.02em;
}

.tag-btn:hover { border-color: var(--accent); color: var(--accent); }
.tag-btn.active { background: rgba(249,115,22,0.12); border-color: var(--accent); color: var(--accent); }

/* ── Controls Row ────────────────────────────────────────── */
.controls-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 160px;
}

.control-group:last-child {
  flex-direction: row;
  align-items: flex-end;
  flex: 0;
  gap: 8px;
}

.ctrl-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.threshold-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.threshold-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: var(--border2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.threshold-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
}

.threshold-val {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  white-space: nowrap;
  min-width: 80px;
}

.ctrl-select {
  background: var(--surface2);
  border: 1px solid var(--border2);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  width: 100%;
}

.ctrl-select:focus { border-color: var(--accent); }

.ctrl-btn {
  background: var(--surface2);
  border: 1px solid var(--border2);
  color: var(--muted2);
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms;
  letter-spacing: 0.03em;
}

.ctrl-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ── Stats Bar ───────────────────────────────────────────── */
.stats-bar {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.stat-item {
  flex: 1;
  background: var(--surface);
  padding: 16px 20px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item:last-child { border-right: none; }

.stat-num {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.alert-stat { background: rgba(249,115,22,0.06); }
.alert-num  { color: var(--accent); }

/* ── Alerts ──────────────────────────────────────────────── */
.alerts-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.deal-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--green);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 13px;
}

.deal-alert .alert-icon { font-size: 16px; flex-shrink: 0; }
.deal-alert .alert-text { flex: 1; color: var(--muted2); font-size: 12px; }
.deal-alert .alert-text strong { color: var(--text); }

.alert-cta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  text-decoration: none;
  border: 1px solid var(--accent);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  transition: background 150ms;
}

.alert-cta:hover { background: rgba(249,115,22,0.1); }

.alert-dismiss {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  flex-shrink: 0;
}

.alert-dismiss:hover { color: var(--text); }

/* ── Empty State ─────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.empty-icon { font-size: 36px; color: var(--muted); opacity: 0.4; }
.empty-title { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--muted2); letter-spacing: 0.05em; }
.empty-sub { font-size: 13px; color: var(--muted); text-align: center; max-width: 360px; }

.empty-sources {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

.empty-sources span {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  padding: 3px 8px;
  border: 1px solid var(--border2);
  border-radius: var(--radius-sm);
}

/* ── Results Grid ────────────────────────────────────────── */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

/* ── Listing Card ────────────────────────────────────────── */
.listing-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 150ms, transform 150ms;
  position: relative;
}

.listing-card:hover {
  border-color: var(--border2);
  transform: translateY(-1px);
}

.listing-card.tier-steal { border-left: 3px solid var(--green); }
.listing-card.tier-hot   { border-left: 3px solid var(--teal); }
.listing-card.tier-good  { border-left: 3px solid var(--blue); }
.listing-card.tier-fair  { border-left: 3px solid var(--yellow); }
.listing-card.tier-overpriced { border-left: 3px solid var(--muted); }
.listing-card.uncertain  { opacity: 0.85; }

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px 0;
}

.source-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.src-ebay      { background: rgba(247,184,2,0.12); color: #f7b802; border: 1px solid rgba(247,184,2,0.25); }
.src-tcgplayer { background: rgba(45,212,191,0.1); color: var(--teal); border: 1px solid rgba(45,212,191,0.25); }
.src-mercari   { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.25); }
.src-whatnot   { background: rgba(249,115,22,0.1); color: var(--accent); border: 1px solid rgba(249,115,22,0.25); }
.src-tiktok    { background: rgba(239,68,68,0.1); color: var(--red); border: 1px solid rgba(239,68,68,0.25); }
.src-lgs       { background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.25); }
.src-manual    { background: rgba(107,114,128,0.15); color: var(--muted2); border: 1px solid var(--border2); }

.tier-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.tier-badge.steal   { background: rgba(34,197,94,0.15);  color: var(--green);  border: 1px solid rgba(34,197,94,0.3); }
.tier-badge.hot     { background: rgba(45,212,191,0.12); color: var(--teal);   border: 1px solid rgba(45,212,191,0.3); }
.tier-badge.good    { background: rgba(96,165,250,0.12); color: var(--blue);   border: 1px solid rgba(96,165,250,0.3); }
.tier-badge.fair    { background: rgba(234,179,8,0.12);  color: var(--yellow); border: 1px solid rgba(234,179,8,0.3); }
.tier-badge.over    { background: rgba(107,114,128,0.1); color: var(--muted2); border: 1px solid var(--border2); }
.tier-badge.unknown { background: rgba(107,114,128,0.1); color: var(--muted);  border: 1px solid var(--border2); }

.uncertain-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--yellow);
  padding: 2px 6px;
  border: 1px solid rgba(234,179,8,0.3);
  border-radius: var(--radius-sm);
  background: rgba(234,179,8,0.08);
}

.card-img {
  width: 100%;
  height: 140px;
  object-fit: contain;
  background: var(--surface2);
  margin-top: 8px;
  padding: 8px;
}

.card-body {
  padding: 10px 12px 0;
  flex: 1;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
  margin-bottom: 4px;
}

.card-set {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted2);
  margin-bottom: 3px;
}

.card-seller {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}

.card-pricing {
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.listed-price {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.free-ship {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--green);
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.ship-cost {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted2);
}

.landed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landed-label {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.landed-cost {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--teal);
}

.msrp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.msrp-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}

.pct-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

.pct-label.steal   { color: var(--green); }
.pct-label.hot     { color: var(--teal); }
.pct-label.good    { color: var(--blue); }
.pct-label.fair    { color: var(--yellow); }
.pct-label.overpriced { color: var(--muted); }

.deal-bar-wrap {
  height: 3px;
  background: var(--border2);
  border-radius: 2px;
  overflow: hidden;
}

.deal-bar {
  height: 100%;
  background: var(--green);
  border-radius: 2px;
  transition: width 400ms ease;
}

.msrp-unknown {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  font-style: italic;
}

.card-cta {
  display: block;
  text-align: center;
  padding: 9px 12px;
  background: var(--surface2);
  border-top: 1px solid var(--border);
  color: var(--accent);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: background 150ms;
}

.card-cta:hover { background: rgba(249,115,22,0.1); }

/* ── Modals ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
  padding: 20px;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  width: 100%;
  max-width: 460px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.04em;
}

.modal-close {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  transition: color 150ms;
}

.modal-close:hover { color: var(--text); }

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-desc {
  font-size: 12px;
  color: var(--muted2);
  line-height: 1.6;
  margin-bottom: 8px;
}

.modal-desc a { color: var(--accent); }

.modal-input {
  background: var(--surface2);
  border: 1px solid var(--border2);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  width: 100%;
  outline: none;
  transition: border-color 150ms;
}

.modal-input::placeholder { color: var(--muted); }
.modal-input:focus { border-color: var(--accent); }

.modal-submit {
  background: var(--accent);
  border: none;
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 12px;
  letter-spacing: 0.04em;
  transition: background 150ms;
}

.modal-submit:hover { background: var(--accent2); }

/* ── Notifications ───────────────────────────────────────── */
.notif {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 300;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 200ms, transform 200ms;
  max-width: 320px;
}

.notif.notif-show { opacity: 1; transform: translateY(0); }
.notif-success { border-left: 3px solid var(--green); }
.notif-warn    { border-left: 3px solid var(--yellow); }
.notif-error   { border-left: 3px solid var(--red); }
.notif-info    { border-left: 3px solid var(--blue); }

/* ── Scrollbar ───────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .controls-row { flex-direction: column; }
  .results-grid { grid-template-columns: 1fr; }
  .stats-bar { flex-wrap: wrap; }
  .stat-item { min-width: 45%; }
}