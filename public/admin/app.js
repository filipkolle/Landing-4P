/* Finance 4P · Super Admin portal
 * Samo bere agregirane podatke prek admin_* funkcij v Supabase. Vsa preverjanja vlog so na strežniku (glej sql/admin_portal.sql).
 * Portal nikoli ne prikazuje zneskov, transakcij, kategorij ali opomb uporabnikov. */

const SUPABASE_URL = "https://tuhwjjrflcnkqekyvjaf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aHdqanJmbGNua3Fla3l2amFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzk4NDQsImV4cCI6MjA4Nzk1NTg0NH0.idyWdkO47WJeX707MyqaexsEQ74hRDTiI4PVNesXAY8";

const TEAL = "#0b7a75", INDIGO = "#4440c8", BROWN = "#8a4b08", SLATE = "#334155";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storageKey: "4p-admin-auth", flowType: "pkce", detectSessionInUrl: true, persistSession: true },
});

/* ---------- Pomočniki ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (v) => new Intl.NumberFormat("sl-SI").format(Number(v) || 0);
const pctOf = (n, total) => (total > 0 ? Math.round((100 * n) / total) : 0);

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return "—";
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}
function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function ago(v) {
  if (!v) return "—";
  const days = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
  if (days <= 0) return "Danes";
  if (days === 1) return "Včeraj";
  return `Pred ${days} dnevi`;
}
function pill(text, tone) { return `<span class="pill ${tone}">${esc(text)}</span>`; }
function mono(t) { return `<span class="mono">${esc(t)}</span>`; }
function strong(t) { return `<strong>${esc(t)}</strong>`; }

/* ---------- Gradniki (vrnejo HTML) ---------- */
function kpis(title, chipText, chipTone, tiles) {
  return `<section class="card span">
    <div class="card-head row"><h2>${esc(title)}</h2>${pill(chipText, chipTone)}</div>
    <div class="tiles">${tiles.map((t) => `<div class="tile"><span class="l">${esc(t.l)}</span><span class="v">${esc(t.v)}</span><span class="d ${t.tone || ""}">${esc(t.d || "")}</span></div>`).join("")}</div>
  </section>`;
}
function bars(title, sub, items, color) {
  const rows = items.map((i) => `<div class="bar-row"><div class="bar-top"><span>${esc(i.label)}</span><span>${esc(i.val)}</span></div><div class="track"><div class="fill" style="width:${Math.max(0, Math.min(100, i.pct))}%;background:${i.color || color}"></div></div></div>`).join("");
  return `<section class="card"><div class="card-head"><h2>${esc(title)}</h2><span class="sub">${esc(sub || "")}</span></div><div class="bars">${rows || '<span class="sub">Ni podatkov.</span>'}</div></section>`;
}
function cols(title, sub, data, labels, color) {
  const max = Math.max(1, ...data);
  const items = data.map((v, i) => `<div class="col"><span class="cv">${esc(v)}</span><div class="cb" style="height:${Math.max(4, Math.round((v / max) * 120))}px;background:${color}"></div><span class="cl">${esc(labels[i])}</span></div>`).join("");
  return `<section class="card"><div class="card-head"><h2>${esc(title)}</h2><span class="sub">${esc(sub || "")}</span></div><div class="cols">${items}</div></section>`;
}
function note(title, text) {
  return `<section class="note span"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5b6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path><path d="M9 12l2 2 4-4"></path></svg><div><b>${esc(title)}</b><span>${esc(text)}</span></div></section>`;
}
/* cells: html nizi (že escapani), cols: [[naslov, širina], ...] */
function table(title, sub, colDefs, rows, opts = {}) {
  const tpl = colDefs.map((c) => c[1]).join(" ");
  const min = opts.minW || "720px";
  const head = `<div class="trow head" style="grid-template-columns:${tpl}">${colDefs.map((c) => `<div>${esc(c[0])}</div>`).join("")}</div>`;
  const body = rows.length
    ? rows.map((r) => `<div class="trow" style="grid-template-columns:${tpl}">${r.map((c) => `<div>${c}</div>`).join("")}</div>`).join("")
    : `<div class="empty">${esc(opts.empty || "Ni podatkov.")}</div>`;
  return `<section class="card flush span"><div class="card-head"><h2>${esc(title)}</h2><span class="sub">${esc(sub || "")}</span></div>${opts.toolbar || ""}<div class="tscroll"><div style="min-width:${min}">${head}${body}</div></div>${opts.footer || ""}</section>`;
}
function emptyState(title, text) {
  return `<section class="card span"><div class="card-head"><h2>${esc(title)}</h2><span class="sub">${esc(text)}</span></div></section>`;
}
function heat(p) {
  if (p === null || p === undefined) return `<span class="heat" style="color:#5b6572">—</span>`;
  return `<span class="heat" style="background:rgba(11,122,117,${(0.06 + (p / 100) * 0.5).toFixed(2)})">${p} %</span>`;
}

/* ---------- Oznake ---------- */
const SECTION_LABELS = {
  expenses: "Odhodki", incomes: "Prihodki", work_logs: "Delovne ure", paid: "Označena izplačila", sources: "Viri dohodka",
  budgets: "Proračuni po kategorijah", fixed: "Stalni stroški", subs: "Naročnine", assets: "Premoženje", liabs: "Obveznosti",
  purposes: "Stroškovni plan", employer: "Povezan z delodajalcem",
};
const GUIDE_LABELS = {
  "4p_private_mode": "Zasebni način", "4p_mark_paid": "Označi izplačano", "4p_work_time": "Delovni čas", "4p_expense": "Vnos odhodka", "4p_income": "Vnos prihodka",
  "4p_budget": "Proračuni", "4p_fixed_costs": "Stalni stroški", "4p_initial_balance": "Začetno stanje", "4p_history": "Zgodovina", "4p_analytics": "Analitika",
  "4p_schedule_plan": "Planiranje izmen", "4p_shift_to_log": "Izmena v ure", "4p_calendar_sync": "Sinhronizacija koledarja", "4p_dashboard_widgets": "Gradniki nadzorne plošče",
  "4p_pdf_report": "PDF poročilo", "4p_expense_plan": "Stroškovni plan", "4p_net_worth": "Neto vrednost", "4p_employer": "Delodajalec",
  "4p_add_income_category": "Nova kategorija prihodka", "4p_edit_expense_category": "Urejanje kategorije", work_log_entry: "Vnos ur", work_download_report: "Prenos poročila",
  work_view_analytics: "Analitika dela", finance_expense: "Finance: odhodek", finance_income: "Finance: prihodek", finance_fixed_costs: "Finance: stalni stroški",
  finance_fixed_incomes: "Finance: stalni prihodki", finance_initial_balance: "Finance: začetno stanje", finance_view_analytics: "Finance: analitika",
};
const LINK_STATUS = { approved: ["Potrjena", "green"], invited: ["Vabilo poslano", "amber"], pending: ["Čaka odobritev", "amber"], rejected: ["Zavrnjena", "gray"], disconnected: ["Prekinjena", "gray"] };
const GDPR_TYPE = { deletion: "Izbris računa", access: "Dostop do podatkov", export: "Izvoz podatkov" };
const GDPR_STATUS = { new: "Novo", in_progress: "V obdelavi", done: "Dokončano", rejected: "Zavrnjeno" };
const ROLE_LABEL = { super_admin: "Super admin", support: "Podpora", viewer: "Bralec" };

/* ---------- Navigacija ---------- */
const NAV = [
  { key: "overview", label: "Pregled", caption: "Skupni kazalniki", dot: "#ffffff", accent: "#12161c", title: "Pregled", sub: "Kazalniki obeh svetov, prikazani ločeno.", scope: ["Oba sveta", "gray"], tabs: [["main", "Pregled"]] },
  { key: "app", label: "Aplikacija Finance 4P", caption: "Posamezni uporabniki", dot: "#3fc1b8", accent: TEAL, title: "Aplikacija Finance 4P", sub: "Uporabniki aplikacije: prikaz uporabe, ne vsebine financ.", scope: ["Svet 1 · uporabniki aplikacije", "teal"],
    tabs: [["users", "Uporabniki"], ["features", "Uporaba funkcij"], ["onboarding", "Onboarding in vodič"], ["retention", "Retention"], ["health", "Tehnično zdravje"]] },
  { key: "dash", label: "Dashboard 4P", caption: "Delodajalci", dot: "#8b88f2", accent: INDIGO, title: "Dashboard 4P", sub: "Delodajalci in uporaba njihovega dashboarda.", scope: ["Svet 2 · delodajalci", "indigo"],
    tabs: [["employers", "Delodajalci"], ["usage", "Uporaba"], ["onboarding", "Onboarding delodajalcev"]] },
  { key: "links", label: "Povezave", caption: "Aplikacija ↔ dashboard", dot: "#f0a95a", accent: BROWN, title: "Povezave", sub: "Edino mesto, kjer se svetova srečata: delodajalec ↔ zaposleni.", scope: ["Most", "brown"], tabs: [["list", "Povezave"], ["issues", "Težave"]] },
  { key: "platform", label: "Platforma", caption: "GDPR, podpora, sistem", dot: "#a9b2bf", accent: SLATE, title: "Platforma", sub: "GDPR, podpora, varnost in zdravje sistema.", scope: ["Skupno", "gray"],
    tabs: [["gdpr", "GDPR", ["super_admin", "support"]], ["support", "Podpora", ["super_admin", "support"]], ["audit", "Audit log", ["super_admin"]], ["admins", "Admin računi", ["super_admin"]], ["system", "Sistem"]] },
];

const S = { recovery: false, session: null, me: null, route: { sec: "overview", tab: "main" }, token: 0, usersQuery: "", usersRows: [], usersTotal: 0 };

function allowedTabs(sec) {
  return sec.tabs.filter((t) => !t[2] || t[2].includes(S.me.role));
}

function parseHash() {
  const [, sec, tab] = (location.hash || "").split("/");
  const navItem = NAV.find((n) => n.key === sec) || NAV[0];
  const tabs = allowedTabs(navItem);
  const t = tabs.find((x) => x[0] === tab) || tabs[0];
  return { sec: navItem.key, tab: t[0] };
}
function go(sec, tab) { location.hash = `#/${sec}/${tab}`; }

/* ---------- API ---------- */
async function rpc(name, args) {
  const { data, error } = await sb.rpc(name, args || {});
  if (error) { const e = new Error(error.message || "Napaka"); e.code = error.code; throw e; }
  return data;
}

/* ---------- Zasloni: prijava, zavrnjen dostop ---------- */
function brandMark() { return `<div class="brand-mark" aria-hidden="true">4P</div>`; }

function renderLogin(message, info) {
  $("#root").innerHTML = `<div class="center-screen"><form class="gate" id="loginForm">
    ${brandMark()}
    <div><h1>Super Admin</h1><p class="muted" style="margin-top:6px;font-size:14px">Finance 4P · interni portal. Dostop samo za pooblaščene skrbnike.</p></div>
    <label class="field">E-pošta<input class="input" type="email" id="loginEmail" autocomplete="username" required /></label>
    <label class="field">Geslo<input class="input" type="password" id="loginPass" autocomplete="current-password" required /></label>
    <button class="btn primary" id="loginBtn" type="submit">Prijava</button>
    <button class="linkbtn" id="forgotBtn" type="button">Pozabljeno geslo</button>
    ${message ? `<p class="error-text" role="alert">${esc(message)}</p>` : ""}
    ${info ? `<p class="muted" style="font-size:13px" role="status">${esc(info)}</p>` : ""}
  </form></div>`;
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn"); btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $("#loginEmail").value.trim(), password: $("#loginPass").value });
    if (error) { renderLogin("Napačna e-pošta ali geslo."); return; }
    boot();
  });
  $("#forgotBtn").addEventListener("click", async () => {
    const email = $("#loginEmail").value.trim();
    if (!email) { renderLogin("Najprej vpiši e-pošto."); return; }
    await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin/` });
    renderLogin(null, "Če račun obstaja, je povezava za nastavitev gesla poslana na tvojo e-pošto.");
  });
}

function renderNewPassword(message) {
  $("#root").innerHTML = `<div class="center-screen"><form class="gate" id="pwForm">
    ${brandMark()}
    <div><h1>Novo geslo</h1><p class="muted" style="margin-top:6px;font-size:14px">Nastavi geslo za prijavo v admin portal (vsaj 10 znakov).</p></div>
    <label class="field">Novo geslo<input class="input" type="password" id="newPass" autocomplete="new-password" minlength="10" required /></label>
    <button class="btn primary" type="submit">Shrani geslo</button>
    ${message ? `<p class="error-text" role="alert">${esc(message)}</p>` : ""}
  </form></div>`;
  $("#pwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { error } = await sb.auth.updateUser({ password: $("#newPass").value });
    if (error) { renderNewPassword(error.message); return; }
    S.recovery = false;
    boot();
  });
}

function renderDenied(email) {
  $("#root").innerHTML = `<div class="center-screen"><div class="gate">
    ${brandMark()}
    <div><h1>Dostop zavrnjen</h1><p class="muted" style="margin-top:6px;font-size:14px">Račun ${esc(email || "")} nima admin pravic.</p></div>
    <button class="btn" id="outBtn" type="button">Odjava</button>
  </div></div>`;
  $("#outBtn").addEventListener("click", signOut);
}

async function signOut() {
  await sb.auth.signOut();
  S.session = null; S.me = null;
  renderLogin();
}

/* ---------- Ogrodje ---------- */
function renderShell() {
  const nav = NAV.filter((n) => allowedTabs(n).length).map((n) => `<button type="button" data-nav="${n.key}"><span class="dot" style="background:${n.dot}"></span><span><span class="nl">${esc(n.label)}</span><span class="nc">${esc(n.caption)}</span></span></button>`).join("");
  $("#root").innerHTML = `<div class="shell">
    <aside class="sidebar">
      <div class="brand">${brandMark()}<div><div class="brand-name">Finance 4P</div><div class="brand-sub">Super Admin</div></div></div>
      <nav class="nav" aria-label="Glavna navigacija">${nav}</nav>
      <div class="legend"><b>Ločitev svetov</b>
        <div><i style="background:#3fc1b8"></i>Uporabniki aplikacije</div>
        <div><i style="background:#8b88f2"></i>Delodajalci (dashboard)</div>
        <div><i style="background:#f0a95a"></i>Povezave (most)</div></div>
      <div class="me"><div class="av">${esc((S.me.email || "?")[0].toUpperCase())}</div>
        <div><div class="who">${esc(S.me.email)}</div><div class="role">${esc(ROLE_LABEL[S.me.role] || S.me.role)}</div></div>
        <button type="button" id="signOutBtn">Odjava</button></div>
    </aside>
    <main class="main" id="main">
      <header class="page-head"><div><div class="title-row"><h1 id="pgTitle"></h1><span id="pgScope"></span></div><p id="pgSub"></p></div>
        <span class="chip" id="chipHost">admin.finance4p.com/admin</span></header>
      <div class="tabs" id="tabs" role="tablist" aria-label="Podsekcije"></div>
      <div class="grid" id="content"></div>
      <p class="footer">Portal prikazuje uporabo, ne vsebine uporabnikovih financ. Vpogledi v osebne podatke se beležijo v audit log.</p>
    </main></div>`;
  $("#signOutBtn").addEventListener("click", signOut);
  document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => {
    const sec = NAV.find((n) => n.key === b.dataset.nav);
    go(sec.key, allowedTabs(sec)[0][0]);
  }));
}

function paintChrome() {
  const sec = NAV.find((n) => n.key === S.route.sec);
  document.querySelectorAll("[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === sec.key));
  $("#pgTitle").textContent = sec.title;
  $("#pgSub").textContent = sec.sub;
  $("#pgScope").innerHTML = pill(sec.scope[0], sec.scope[1]);
  const tabs = allowedTabs(sec);
  $("#tabs").innerHTML = sec.key === "overview" ? "" : tabs.map((t) => {
    const active = t[0] === S.route.tab;
    return `<button type="button" class="tab ${active ? "active" : ""}" role="tab" aria-selected="${active}" data-tab="${t[0]}" ${active ? `style="background:${sec.accent};border-color:${sec.accent}"` : ""}>${esc(t[1])}</button>`;
  }).join("");
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => go(sec.key, b.dataset.tab)));
  document.title = `${sec.title} · Finance 4P Super Admin`;
}

/* ---------- Pogledi ---------- */
const VIEWS = {};

VIEWS["overview.main"] = async () => {
  const d = await rpc("admin_overview");
  const a = d.app, e = d.dash, al = d.alerts;
  const diff = a.new_7d - a.new_prev_7d;
  const labels = d.weeks.map((w) => w.week);
  const alerts = [];
  if (al.gdpr_open > 0) alerts.push([`${al.gdpr_open} odprtih GDPR zahtevkov${al.gdpr_next_due ? `, najbližji rok ${fmtDate(al.gdpr_next_due)}` : ""}`, pill("Platforma", "gray"), pill("Pomembno", "amber")]);
  if (al.feedback_7d > 0) alerts.push([`${al.feedback_7d} novih sporočil podpore v zadnjih 7 dneh`, pill("Platforma", "gray"), pill("Preveri", "amber")]);
  if (al.old_pending_invites > 0) alerts.push([`${al.old_pending_invites} vabil čaka na odgovor več kot 7 dni`, pill("Povezave", "brown"), pill("Preveri", "amber")]);
  if (al.employers_no_link > 0) alerts.push([`${al.employers_no_link} delodajalcev brez povezanega zaposlenega (registrirani več kot 5 dni)`, pill("Dashboard", "indigo"), pill("Info", "gray")]);
  return [
    kpis("Aplikacija Finance 4P", "Uporabniki aplikacije", "teal", [
      { l: "Uporabniki skupaj", v: num(a.total), d: `${num(a.new_7d)} novih v 7 dneh` },
      { l: "Novi (7 dni)", v: num(a.new_7d), d: `${diff >= 0 ? "+" : ""}${diff} glede na prejšnji teden`, tone: diff >= 0 ? "up" : "down" },
      { l: "Aktivni v tednu (WAU)", v: num(a.wau), d: `${pctOf(a.wau, a.total)} % uporabnikov` },
      { l: "Aktivni v mesecu (MAU)", v: num(a.mau), d: `${pctOf(a.mau, a.total)} % uporabnikov` },
      { l: "Dokončan onboarding", v: `${pctOf(a.onboarded, a.total)} %`, d: `${num(a.onboarded)} od ${num(a.total)}` },
    ]),
    kpis("Dashboard 4P", "Delodajalci", "indigo", [
      { l: "Delodajalci skupaj", v: num(e.employers), d: `${num(e.employers_new_7d)} novih v 7 dneh` },
      { l: "Aktivni (30 dni)", v: num(e.active_30d), d: `${pctOf(e.active_30d, e.employers)} % delodajalcev` },
      { l: "Povezani zaposleni", v: num(e.connected_employees), d: "potrjene povezave" },
      { l: "Objavljene izmene (30 dni)", v: num(e.shifts_30d), d: "ustvarili delodajalci" },
    ]),
    cols("Registracije v aplikaciji", "Novi uporabniki po tednih", d.weeks.map((w) => w.users), labels, TEAL),
    cols("Registracije delodajalcev", "Novi delodajalci po tednih", d.weeks.map((w) => w.employers), labels, INDIGO),
    table("Opozorila", "Stvari, ki zahtevajo tvojo pozornost", [["Opozorilo", "1fr"], ["Svet", "150px"], ["Nujnost", "110px"]], alerts.map((r) => r.map((c, i) => (i === 0 ? esc(c) : c))), { minW: "560px", empty: "Trenutno ni opozoril." }),
  ];
};

function usersToolbar() {
  return `<form class="toolbar" id="usersSearch"><input class="input grow" id="usersQ" type="search" placeholder="Išči po ID-ju ali e-pošti" aria-label="Iskanje uporabnikov" value="${esc(S.usersQuery)}" /><button class="btn small" type="submit">Išči</button></form>`;
}
function usersTable() {
  const canOpen = ["super_admin", "support"].includes(S.me.role);
  const rows = S.usersRows.map((u) => [
    mono(u.id.slice(0, 8)), esc(u.email), esc(u.provider), esc(fmtDate(u.created_at)), esc(ago(u.last_sign_in_at)),
    esc(u.connected ? "Da" : "Ne"), u.status === "active" ? pill("Aktiven", "green") : pill("Neaktiven", "amber"),
    canOpen ? `<button class="btn small" type="button" data-open-user="${esc(u.id)}">Odpri</button>` : "",
  ]);
  const more = S.usersRows.length < S.usersTotal ? `<div style="padding:14px 20px"><button class="btn small" type="button" id="usersMore">Naloži več</button></div>` : "";
  return table("Uporabniki aplikacije", `Prikazano ${num(S.usersRows.length)} od ${num(S.usersTotal)} · delodajalci niso všteti`, [
    ["ID", "100px"], ["E-pošta (maskirana)", "1.3fr"], ["Prijava", "0.7fr"], ["Registracija", "0.9fr"], ["Zadnja prijava", "1fr"], ["Z delodajalcem", "0.8fr"], ["Status", "110px"], ["", "80px"],
  ], rows, { minW: "960px", toolbar: usersToolbar(), empty: "Ni zadetkov.", footer: more });
}
async function loadUsers(reset) {
  if (reset) { S.usersRows = []; }
  const d = await rpc("admin_users_list", { p_search: S.usersQuery || null, p_limit: 50, p_offset: S.usersRows.length });
  S.usersTotal = d.total;
  S.usersRows = S.usersRows.concat(d.rows);
}
VIEWS["app.users"] = async () => {
  await loadUsers(true);
  return [
    note("Zasebnost uporabnikov", "Portal kaže samo podatke o računu in uporabi. Zneskov, transakcij, kategorij in opomb ne prikazuje. E-pošta je maskirana in se razkrije šele ob odprtju uporabnika (vpogled se zapiše v audit log)."),
    usersTable(),
  ];
};

VIEWS["app.features"] = async () => {
  const d = await rpc("admin_feature_usage");
  const t = d.total;
  const sections = d.sections.map((s) => ({ label: SECTION_LABELS[s.key] || s.key, val: `${pctOf(s.n, t)} % (${num(s.n)})`, pct: pctOf(s.n, t) })).sort((x, y) => y.pct - x.pct);
  const guide = d.guide.map((g) => ({ label: GUIDE_LABELS[g.key] || g.key, val: `${pctOf(g.n, t)} % (${num(g.n)})`, pct: pctOf(g.n, t) })).slice(0, 14);
  const paths = d.paths.map((p) => ({ label: p.key === "—" ? "Brez izbire" : `Pot ${p.key}`, val: `${pctOf(p.n, t)} % (${num(p.n)})`, pct: pctOf(p.n, t) }));
  return [
    bars("Sprejetost funkcij", `Delež uporabnikov (skupaj ${num(t)}), ki je funkcijo kdaj uporabil. Šteje obstoj vnosa, ne vsebina.`, sections, TEAL),
    bars("Koraki vodiča", "Delež uporabnikov, ki je korak vodiča opravil", guide, TEAL),
    bars("Pot onboardinga", "Izbira v onboardingu (oznake A, B, C kot so shranjene v bazi)", paths, TEAL),
  ];
};

VIEWS["app.onboarding"] = async () => {
  const f = await rpc("admin_funnel");
  const t = f.registered;
  const steps = [["Registracija", f.registered], ["Dokončan onboarding", f.onboarded], ["Prvi vnos (odhodek, prihodek ali ure)", f.first_entry], ["Vodič: zasebni način", f.private_mode], ["Označeno prvo izplačilo", f.first_paid]];
  return [
    bars("Lijak: od registracije do prvega izplačila", "Vsi uporabniki aplikacije do danes", steps.map((s) => ({ label: s[0], val: `${num(s[1])} (${pctOf(s[1], t)} %)`, pct: pctOf(s[1], t) })), TEAL),
    note("Opomba", "Lijak temelji na obstoju vnosov in zabeleženih korakov vodiča. Časovno natančen lijak (npr. prvi vnos v 24 urah) bo mogoč, ko aplikacija začne pošiljati dogodke v tabelo analytics_events."),
  ];
};

VIEWS["app.retention"] = async () => {
  const d = await rpc("admin_retention");
  const rows = d.cohorts.filter((c) => c.users > 0).map((c) => [strong(c.week), esc(c.users), heat(c.d1), heat(c.d7), heat(c.d30)]);
  const i = d.inactive;
  return [
    table("Retention po kohortah", "Delež uporabnikov, katerih zadnja prijava je vsaj 1, 7 ali 30 dni po registraciji (približek)", [["Teden registracije", "1fr"], ["Uporabniki", "1fr"], ["D1", "1fr"], ["D7", "1fr"], ["D30", "1fr"]], rows, { minW: "520px", empty: "Še ni dovolj podatkov." }),
    table("Neaktivni uporabniki", "Brez prijave dlje kot 14 dni", [["Obdobje neaktivnosti", "1fr"], ["Št. uporabnikov", "1fr"], ["Delež vseh", "1fr"]], [
      ["14 do 29 dni", i.d14_29], ["30 do 59 dni", i.d30_59], ["60 dni ali več", i.d60],
    ].map((r) => [esc(r[0]), esc(num(r[1])), esc(`${pctOf(r[1], i.total)} %`)]), { minW: "460px" }),
    note("Opomba", "Retention je približek, ker Supabase hrani samo zadnjo prijavo. Natančen bo, ko bo aplikacija pošiljala dogodke v tabelo analytics_events."),
  ];
};

VIEWS["app.health"] = async () => [
  emptyState("Tehnično zdravje še ni na voljo", "Za crashe, verzije aplikacije in platforme (iOS/Android) mora aplikacija pošiljati dogodke z oznako platforme in verzije v tabelo analytics_events (naslednja faza). Tabela že obstaja."),
];

VIEWS["dash.employers"] = async () => {
  const d = await rpc("admin_employers_list");
  const st = { active: pill("Aktiven", "green"), inactive: pill("Neaktiven", "amber"), waiting: pill("Čaka na povezavo", "gray") };
  const rows = d.rows.map((r) => [strong(r.company), esc(r.email), esc(fmtDate(r.created_at)), esc(r.employees), esc(r.shifts_30d), esc(ago(r.last_login_at)), st[r.status]]);
  return [table("Delodajalci", `Skupaj ${num(d.total)}`, [["Podjetje", "1.3fr"], ["Kontakt (maskiran)", "1.2fr"], ["Registracija", "0.9fr"], ["Zaposleni", "0.7fr"], ["Izmene (30 dni)", "0.8fr"], ["Zadnja prijava", "1fr"], ["Status", "150px"]], rows, { minW: "900px", empty: "Ni delodajalcev." }),
    note("Opomba", "Prikazano je samo, kaj delodajalec uporablja. Osebnih financ zaposlenih portal ne prikaže.")];
};

VIEWS["dash.usage"] = async () => {
  const d = await rpc("admin_employer_usage");
  const n = d.employers, a = d.adoption, t = d.totals_30d;
  const items = [["Načrtovanje izmen", a.shifts], ["Vabila zaposlenim", a.invites], ["Odprte izmene", a.open], ["Naloge pri izmenah", a.tasks]];
  const okPct = t.invites ? `${pctOf(t.invites_ok, t.invites)} %` : "—";
  return [
    bars("Uporaba funkcij dashboarda", `Delež delodajalcev (skupaj ${num(n)}), ki je funkcijo uporabil v 30 dneh`, items.map((i) => ({ label: i[0], val: `${num(i[1])} od ${num(n)} (${pctOf(i[1], n)} %)`, pct: pctOf(i[1], n) })), INDIGO),
    table("Aktivnost v 30 dneh", "Skupaj za vse delodajalce", [["Kazalnik", "1.4fr"], ["Vrednost", "0.8fr"]], [
      ["Objavljene izmene", num(t.shifts)], ["Ustvarjene odprte izmene", num(t.open_shifts)], ["Prijave na odprte izmene", num(t.open_signups)],
      ["Naloge pri izmenah", num(t.tasks)], ["Poslana vabila zaposlenim", num(t.invites)], ["Delež sprejetih vabil", okPct],
    ].map((r) => [esc(r[0]), strong(r[1])]), { minW: "420px" }),
  ];
};

VIEWS["dash.onboarding"] = async () => {
  const d = await rpc("admin_employer_usage");
  const f = d.funnel, t = f.registered;
  const steps = [["Registracija", f.registered], ["Prva povezava z zaposlenim", f.linked], ["Prva objavljena izmena", f.shift], ["Izmene 3 tedne zapored (zadnjih 28 dni)", f.steady]];
  const stage = { link: "Prva povezava z zaposlenim", shift: "Prva objavljena izmena" };
  return [
    bars("Lijak delodajalca", "Od registracije do rednega delovanja", steps.map((s) => ({ label: s[0], val: `${num(s[1])} (${pctOf(s[1], t)} %)`, pct: pctOf(s[1], t) })), INDIGO),
    table("Delodajalci, ki se zatikajo", "Registrirani več kot 5 dni, a brez naslednjega koraka", [["Podjetje", "1.2fr"], ["Zatakne se pri", "1.2fr"], ["Dni od registracije", "1fr"]], d.stuck.map((s) => [strong(s.company), esc(stage[s.stage]), esc(s.days)]), { minW: "460px", empty: "Nihče se ne zatika." }),
  ];
};

VIEWS["links.list"] = async () => {
  const d = await rpc("admin_links");
  const rows = d.rows.map((r) => { const s = LINK_STATUS[r.status] || [r.status, "gray"]; return [strong(r.company || "—"), mono(r.user), pill(s[0], s[1]), esc(r.initiated_by === "employer" ? "Delodajalec" : r.initiated_by === "employee" ? "Zaposleni" : "Migracija"), esc(fmtDate(r.created_at)), esc(fmtDate(r.responded_at))]; });
  return [
    kpis("Povezave delodajalec ↔ zaposleni", "Most med svetovi", "brown", [
      { l: "Aktivne povezave", v: num(d.approved), d: `${num(d.linked_users)} povezanih uporabnikov` },
      { l: "Čakajoča vabila", v: num(d.waiting), d: `${num(d.waiting_old)} starejših od 7 dni`, tone: d.waiting_old ? "down" : "" },
      { l: "Uporabniki z delodajalcem", v: `${pctOf(d.linked_users, d.app_users)} %`, d: `${num(d.linked_users)} od ${num(d.app_users)}` },
      { l: "Prekinjene / zavrnjene", v: `${num(d.disconnected)} / ${num(d.rejected)}`, d: "skupaj do danes" },
    ]),
    table("Zadnje povezave", "Zadnjih 100 · uporabnik prikazan s skrajšanim ID-jem", [["Delodajalec", "1.2fr"], ["Uporabnik", "100px"], ["Status", "140px"], ["Sprožil", "1fr"], ["Ustvarjeno", "1fr"], ["Odgovor", "1fr"]], rows, { minW: "820px", empty: "Ni povezav." }),
  ];
};
VIEWS["links.issues"] = async () => {
  const d = await rpc("admin_links");
  const rows = [
    ["Neodgovorjena vabila (več kot 7 dni)", d.waiting_old, "Opomnik delodajalcu prek Breva"],
    ["Zavrnjene povezave", d.rejected, "Brez ukrepa, spremljaj"],
    ["Prekinjene povezave", d.disconnected, "Brez ukrepa"],
    ["Dvojne aktivne povezave (isti delodajalec in uporabnik)", d.duplicates, "Preveri in združi"],
  ].map((r) => [strong(r[0]), r[1] > 0 ? pill(String(r[1]), r[0].startsWith("Neodgov") || r[0].startsWith("Dvojne") ? "amber" : "gray") : esc("0"), esc(r[2])]);
  return [table("Težave pri povezovanju", "Stvari za čiščenje ali opomnik", [["Težava", "1.6fr"], ["Št.", "0.5fr"], ["Predlagan ukrep", "1.4fr"]], rows, { minW: "640px" })];
};

function gdprRows(list) {
  const canEdit = ["super_admin", "support"].includes(S.me.role);
  return list.map((g) => {
    const overdue = g.status !== "done" && g.status !== "rejected" && new Date(g.due_at) < new Date(Date.now() + 7 * 86400000);
    const sel = `<select class="input" data-gdpr-status="${esc(g.id)}" aria-label="Status zahtevka" ${canEdit ? "" : "disabled"}>${Object.entries(GDPR_STATUS).map(([k, v]) => `<option value="${k}" ${k === g.status ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
    return [strong(GDPR_TYPE[g.type] || g.type), mono(g.user_ref), esc(fmtDate(g.received_at)), overdue ? pill(fmtDate(g.due_at), "red") : esc(fmtDate(g.due_at)), sel, esc(g.note || "")];
  });
}
VIEWS["platform.gdpr"] = async () => {
  const list = await rpc("admin_gdpr_list");
  const form = `<form class="form" id="gdprForm">
    <label>Uporabnik (ID ali oznaka)<input class="input" name="user_ref" required maxlength="200" /></label>
    <label>Tip<select class="input" name="type">${Object.entries(GDPR_TYPE).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select></label>
    <label>Prejeto<input class="input" type="date" name="received" value="${new Date().toISOString().slice(0, 10)}" required /></label>
    <label>Opomba<input class="input" name="note" maxlength="1000" /></label>
    <button class="btn primary" type="submit">Dodaj zahtevek</button></form>`;
  return [
    table("GDPR zahtevki", "Rok za odgovor: 30 dni od prejema. Zahtevke vpisuješ ročno, ko prispejo na info@finance4p.com.", [["Tip", "1.2fr"], ["Uporabnik", "120px"], ["Prejeto", "1fr"], ["Rok", "1fr"], ["Status", "150px"], ["Opomba", "1.2fr"]], gdprRows(list), { minW: "820px", empty: "Ni zahtevkov.", toolbar: form }),
  ];
};
VIEWS["platform.support"] = async () => {
  const list = await rpc("admin_support_list", { p_limit: 100 });
  return [table("Sporočila podpore", "Povratne informacije iz aplikacije (tabela feedbacks). Branje se zabeleži v audit log.", [["Prejeto", "130px"], ["Uporabnik", "100px"], ["Sporočilo", "3fr"]], list.map((f) => [esc(fmtDateTime(f.created_at)), mono(f.user), esc(f.content)]), { minW: "620px", empty: "Ni sporočil." })];
};
VIEWS["platform.audit"] = async () => {
  const list = await rpc("admin_audit_list", { p_limit: 200 });
  return [table("Dnevnik dejanj (audit log)", "Vsak vpogled v osebne podatke in vsaka sprememba v portalu", [["Čas", "150px"], ["Admin", "1.2fr"], ["Dejanje", "1fr"], ["Tarča", "1.4fr"], ["Podrobnosti", "1fr"]], list.map((a) => [mono(fmtDateTime(a.created_at)), esc(a.admin || "—"), strong(a.action), mono(`${a.target_type || ""} ${a.target_id ? a.target_id.slice(0, 8) : ""}`.trim() || "—"), esc(a.details ? JSON.stringify(a.details) : "")]), { minW: "780px", empty: "Dnevnik je prazen." })];
};
VIEWS["platform.admins"] = async () => {
  const list = await rpc("admin_admins_list");
  return [
    table("Admin računi", "Ločen dostop prek tabele admin_users, ne ista prijava kot uporabniki", [["Račun", "1.6fr"], ["Vloga", "1fr"], ["Dodan", "1fr"], ["Zadnja prijava", "1fr"]], list.map((a) => [strong(a.email), esc(ROLE_LABEL[a.role] || a.role), esc(fmtDate(a.created_at)), esc(ago(a.last_sign_in_at))]), { minW: "620px" }),
    table("Vloge (RBAC)", "Preverjanje poteka na strežniku v vsaki funkciji", [["Vloga", "1fr"], ["Dostop", "2.2fr"]], [
      ["Super admin", "Vse, vključno z audit logom in seznamom adminov"], ["Podpora", "Uporabniki, GDPR zahtevki in sporočila podpore"], ["Bralec", "Samo agregatni kazalniki"],
    ].map((r) => [strong(r[0]), esc(r[1])]), { minW: "520px" }),
    note("Dodajanje adminov", "Nove admine dodaš z SQL ukazom v Supabase (vstavek v tabelo admin_users). Upravljanje iz portala je predvideno v naslednji fazi."),
  ];
};
VIEWS["platform.system"] = async () => {
  const t0 = performance.now();
  const d = await rpc("admin_system");
  const ms = Math.round(performance.now() - t0);
  return [
    table("Povezava z bazo", "Meritev odziva funkcije admin_system", [["Kazalnik", "1.4fr"], ["Vrednost", "1fr"]], [
      ["Odziv Supabase", pill(`${ms} ms`, ms < 800 ? "green" : "amber")], ["Čas strežnika", esc(fmtDateTime(d.server_time))],
    ].map((r) => [esc(r[0]), r[1]]), { minW: "420px" }),
    table("Tabele", "Število vrstic v glavnih tabelah", [["Tabela", "1.4fr"], ["Vrstic", "1fr"]], d.tables.map((x) => [mono(x.name), esc(num(x.n))]), { minW: "420px" }),
  ];
};

/* ---------- Usmerjanje in izris ---------- */
async function render() {
  S.route = parseHash();
  paintChrome();
  const content = $("#content");
  const token = ++S.token;
  content.innerHTML = `<p class="muted span">Nalaganje…</p>`;
  try {
    const blocks = await VIEWS[`${S.route.sec}.${S.route.tab}`]();
    if (token !== S.token) return;
    content.innerHTML = blocks.map((b) => (b.includes('class="card') || b.includes('class="note') ? b : `<div class="span">${b}</div>`)).join("");
    bindView();
  } catch (err) {
    if (token !== S.token) return;
    content.innerHTML = `<section class="card span"><div class="card-head"><h2>Napaka pri nalaganju</h2><span class="sub">${esc(err.message === "not_admin" ? "Nimaš dostopa do tega pogleda." : err.message)}</span></div></section>`;
  }
}

function bindView() {
  const f = $("#usersSearch");
  if (f) f.addEventListener("submit", async (e) => { e.preventDefault(); S.usersQuery = $("#usersQ").value.trim(); await refreshUsers(); });
  const more = $("#usersMore");
  if (more) more.addEventListener("click", async () => { await loadUsers(false); await refreshUsersTable(); });
  document.querySelectorAll("[data-open-user]").forEach((b) => b.addEventListener("click", () => openUser(b.dataset.openUser)));
  const gf = $("#gdprForm");
  if (gf) gf.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(gf);
    try { await rpc("admin_gdpr_create", { p_user_ref: fd.get("user_ref"), p_type: fd.get("type"), p_received: fd.get("received"), p_note: fd.get("note") || null }); render(); }
    catch (err) { alert(err.message); }
  });
  document.querySelectorAll("[data-gdpr-status]").forEach((s) => s.addEventListener("change", async () => {
    try { await rpc("admin_gdpr_set_status", { p_id: s.dataset.gdprStatus, p_status: s.value }); render(); } catch (err) { alert(err.message); }
  }));
}

async function refreshUsers() { await loadUsers(true); await refreshUsersTable(); }
async function refreshUsersTable() {
  const old = $("#content .card.flush");
  if (!old) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = usersTable();
  old.replaceWith(wrap.firstElementChild);
  bindView();
  const q = $("#usersQ");
  if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

/* ---------- Modal: podrobnosti uporabnika ---------- */
function closeModal() { $("#modalRoot").innerHTML = ""; document.removeEventListener("keydown", onEsc); }
function onEsc(e) { if (e.key === "Escape") closeModal(); }
async function openUser(id) {
  $("#modalRoot").innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="Podrobnosti uporabnika"><p class="muted">Nalaganje…</p></div></div>`;
  document.addEventListener("keydown", onEsc);
  try {
    const u = await rpc("admin_user_detail", { p_id: id });
    const c = u.counts;
    $("#modalRoot").innerHTML = `<div class="overlay" id="ovl"><div class="modal" role="dialog" aria-modal="true" aria-label="Podrobnosti uporabnika">
      <div class="modal-head"><div><h2>${esc(u.name || "Uporabnik")}</h2><p class="muted" style="font-size:13px;margin-top:4px">Vpogled je zabeležen v audit log.</p></div><button class="btn small" type="button" id="closeModal">Zapri</button></div>
      <dl class="kv">
        <dt>ID</dt><dd class="mono">${esc(u.id)}</dd><dt>E-pošta</dt><dd>${esc(u.email)}</dd><dt>Prijava</dt><dd>${esc(u.provider)}</dd>
        <dt>Registracija</dt><dd>${esc(fmtDate(u.created_at))}</dd><dt>Zadnja prijava</dt><dd>${esc(fmtDateTime(u.last_sign_in_at))}</dd>
        <dt>Onboarding</dt><dd>${u.onboarded ? "Dokončan" : "Ni dokončan"}${u.onboarding_path ? ` (pot ${esc(u.onboarding_path)})` : ""}</dd>
        <dt>Odhodki (št.)</dt><dd>${num(c.expenses)}</dd><dt>Prihodki (št.)</dt><dd>${num(c.incomes)}</dd><dt>Vnosi ur (št.)</dt><dd>${num(c.work_logs)}</dd>
        <dt>Viri dohodka</dt><dd>${num(c.income_sources)}</dd><dt>Proračuni</dt><dd>${num(c.budgets)}</dd><dt>Povezave z delodajalci</dt><dd>${num(c.connections)}</dd>
      </dl>
      <p class="muted" style="font-size:12px">Prikazana so samo števila vnosov. Zneskov in vsebine ni.</p></div></div>`;
    $("#closeModal").addEventListener("click", closeModal);
    $("#ovl").addEventListener("click", (e) => { if (e.target.id === "ovl") closeModal(); });
  } catch (err) {
    $("#modalRoot").innerHTML = `<div class="overlay" id="ovl"><div class="modal"><h2>Napaka</h2><p class="error-text">${esc(err.message)}</p><button class="btn small" type="button" id="closeModal">Zapri</button></div></div>`;
    $("#closeModal").addEventListener("click", closeModal);
  }
}

/* ---------- Zagon ---------- */
async function boot() {
  try {
    const { data } = await sb.auth.getSession();
    S.session = data.session;
    if (location.search.includes("code=")) history.replaceState(null, "", location.pathname + location.hash);
    if (S.recovery) { renderNewPassword(); return; }
    if (!S.session) { renderLogin(); return; }
    let me;
    try { me = await rpc("admin_whoami"); } catch (e) { me = null; }
    if (!me || !me.role) { renderDenied(S.session.user.email); return; }
    S.me = me;
    renderShell();
    if (!S.listening) { window.addEventListener("hashchange", render); S.listening = true; }
    await render();
  } catch (err) {
    renderLogin(err.message);
  }
}
sb.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") { S.recovery = true; renderNewPassword(); }
  if (event === "SIGNED_OUT") { S.session = null; S.me = null; renderLogin(); }
});
boot();
