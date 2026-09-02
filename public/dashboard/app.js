// Supabase Config & State
const SUPABASE_DEFAULT_URL = "https://tuhwjjrflcnkqekyvjaf.supabase.co";
const SUPABASE_DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aHdqanJmbGNua3Fla3l2amFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzk4NDQsImV4cCI6MjA4Nzk1NTg0NH0.idyWdkO47WJeX707MyqaexsEQ74hRDTiI4PVNesXAY8";

const SLO_MONTH_NAMES = [
  "Januar", "Februar", "Marec", "April", "Maj", "Junij",
  "Julij", "Avgust", "September", "Oktober", "November", "December"
];

// Current active date (defaults to August 2026)
let currentDate = new Date(2026, 7, 1);

const state = {
  companyName: localStorage.getItem("4p_company_name") || "Moje podjetje",
  supabaseUrl: localStorage.getItem("4p_supabase_url") || SUPABASE_DEFAULT_URL,
  supabaseKey: localStorage.getItem("4p_supabase_key") || SUPABASE_DEFAULT_KEY,
  currentUser: null,
  activeView: "overview",
  calendarMode: "month", // "month" | "week"
  calendarDate: new Date(2026, 7, 1),
  calSectorFilter: "all",
  calEmployeeFilter: "all",
  scheduleMode: "month", // "month" | "week"
  scheduleDate: new Date(2026, 7, 1),
  scheduleSectorFilter: "all",
  scheduleEmployeeFilter: "all",
  scheduleShifts: JSON.parse(localStorage.getItem("4p_schedule_shifts") || "null"),
  sectors: [],
  jobs: [],
  employees: [],
  workLogs: [],
  rawLogs: [],
  incomeSources: [],
  approvedRequests: [],
  userProfiles: new Map(),
  pendingRequests: [],
  customStatuses: JSON.parse(localStorage.getItem("4p_custom_statuses") || '["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"]'),
  employeeCustomStatuses: JSON.parse(localStorage.getItem("4p_employee_statuses") || '{}'),
  supabaseConnected: false,
};

const currency = new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" });
const number = new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 });

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let supabaseClient = null;
let realtimeChannel = null;
let pollingInterval = null;

// Initialize Supabase Client & Auth
async function initSupabase() {
  if (window.supabase && state.supabaseUrl && state.supabaseKey) {
    try {
      supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
      testConnection();
      setupAuthListeners();
      await checkInitialSession();
    } catch (err) {
      console.warn("Supabase init error:", err);
      updateConnectionStatus(false);
    }
  } else {
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(online) {
  state.supabaseConnected = online;
  const statusEl = $("#connectionStatus");
  if (statusEl) {
    statusEl.className = `status-pill ${online ? "online" : "offline"}`;
    statusEl.innerHTML = `<span class="status-dot"></span> ${online ? "Povezava vzpostavljena" : "Ni povezave"}`;
  }
}

async function testConnection() {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from("workplace_requests").select("id").limit(1);
    if (!error) {
      updateConnectionStatus(true);
    } else {
      updateConnectionStatus(false);
    }
  } catch (err) {
    updateConnectionStatus(false);
  }
}

// --------------------------------------------------------------------------
// Auth System
// --------------------------------------------------------------------------
async function checkInitialSession() {
  if (!supabaseClient) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleAuthState(session);
  } catch (e) {
    console.log("Session check info:", e);
    handleAuthState(null);
  }
}

function setupAuthListeners() {
  if (!supabaseClient) return;
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth state change:", event);
    handleAuthState(session);
  });
}

async function syncEmployerProfile(user, companyNameOverride = null) {
  if (!supabaseClient || !user) return;
  try {
    const companyName =
      companyNameOverride ||
      user.user_metadata?.company_name ||
      localStorage.getItem("4p_company_name") ||
      "Moje podjetje";

    const { error } = await supabaseClient
      .from("employer_profiles")
      .upsert(
        {
          id: user.id,
          company_name: companyName,
          email: user.email,
          role: "employer",
          last_login_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.log("employer_profiles sync note:", error.message);
    } else {
      console.log("employer_profiles successfully updated for:", user.email);
    }
  } catch (e) {
    console.log("employer_profiles exception:", e);
  }
}

async function handleAuthState(session, companyNameOverride = null) {
  const authScreen = $("#authScreen");
  const appShell = $("#appShell");

  if (session && session.user) {
    state.currentUser = session.user;
    state.companyName = companyNameOverride || session.user.user_metadata?.company_name || localStorage.getItem("4p_company_name") || "Moje podjetje";
    
    if (companyNameOverride) {
      localStorage.setItem("4p_company_name", companyNameOverride);
    }

    if (authScreen) authScreen.hidden = true;
    if (appShell) appShell.hidden = false;

    if ($("#sidebarCompany")) $("#sidebarCompany").textContent = state.companyName;
    if ($("#sidebarUserEmail")) $("#sidebarUserEmail").textContent = session.user.email;

    await syncEmployerProfile(session.user, state.companyName);

    setupRealtimeListeners();
    loadAllData();
  } else {
    state.currentUser = null;
    if (authScreen) authScreen.hidden = false;
    if (appShell) appShell.hidden = true;
  }
}

// Auth UI Tab Switching
$("#tabLogin")?.addEventListener("click", () => {
  $("#tabLogin").classList.add("active");
  $("#tabSignup").classList.remove("active");
  $("#loginForm").hidden = false;
  $("#signupForm").hidden = true;
  hideAuthAlerts();
});

$("#tabSignup")?.addEventListener("click", () => {
  $("#tabSignup").classList.add("active");
  $("#tabLogin").classList.remove("active");
  $("#signupForm").hidden = false;
  $("#loginForm").hidden = true;
  hideAuthAlerts();
});

function hideAuthAlerts() {
  const loginAlert = $("#loginAlert");
  const signupAlert = $("#signupAlert");
  if (loginAlert) { loginAlert.hidden = true; loginAlert.textContent = ""; }
  if (signupAlert) { signupAlert.hidden = true; signupAlert.textContent = ""; }
}

function showAuthAlert(formType, message, isError = true) {
  const alertEl = $(`#${formType}Alert`);
  if (!alertEl) return;
  alertEl.className = `auth-alert ${isError ? "error" : "success"}`;
  alertEl.textContent = message;
  alertEl.hidden = false;
}

// Login Form Submit
$("#loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthAlerts();
  if (!supabaseClient) {
    showAuthAlert("login", "Povezava s strežnikom ni na voljo. Preverite nastavitve.");
    return;
  }

  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  const submitBtn = $("#loginSubmitBtn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Prijavljam...";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
        showAuthAlert("login", "Prijave ni bilo mogoče dokončati (napačno geslo ali nepotrjen e-naslov). V Supabase Auth -> Providers -> Email izklopite 'Confirm email'.");
      } else {
        showAuthAlert("login", `Napaka pri prijavi: ${error.message}`);
      }
    } else {
      await handleAuthState(data.session);
    }
  } catch (err) {
    showAuthAlert("login", "Prišlo je do nepredvidene napake. Poskusite znova.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Prijavi se v Dashboard";
  }
});

// Signup Form Submit
$("#signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthAlerts();
  if (!supabaseClient) {
    showAuthAlert("signup", "Povezava s strežnikom ni na voljo.");
    return;
  }

  const companyName = $("#signupCompanyName").value.trim();
  const email = $("#signupEmail").value.trim();
  const password = $("#signupPassword").value;
  const passwordConfirm = $("#signupPasswordConfirm").value;
  const submitBtn = $("#signupSubmitBtn");

  if (!companyName || !email || !password) {
    showAuthAlert("signup", "Prosimo, izpolnite vsa polja.");
    return;
  }

  if (password !== passwordConfirm) {
    showAuthAlert("signup", "Gesli se ne ujemata. Prosimo, preverite vnos.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Obdelujem registracijo...";

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
        },
      },
    });

    if (error) {
      // If user already exists in Finance4P mobile app, log them in with this password and register employer profile
      if (error.message.includes("already registered") || error.message.includes("User already exists")) {
        const loginRes = await supabaseClient.auth.signInWithPassword({ email, password });
        if (loginRes.data && loginRes.data.session) {
          localStorage.setItem("4p_company_name", companyName);
          await handleAuthState(loginRes.data.session, companyName);
          return;
        } else {
          showAuthAlert("signup", "Ta e-naslov je že registriran v Finance4P. Geslo se ne ujema z vašim obstoječim računom. Vnesite pravo geslo ali se prijavite v zavihku 'Prijava'.");
        }
      } else {
        showAuthAlert("signup", `Napaka pri registraciji: ${error.message}`);
      }
    } else if (data && data.user) {
      localStorage.setItem("4p_company_name", companyName);

      // Save to employer_profiles
      await syncEmployerProfile(data.user, companyName);

      // If session is returned, log in right away
      if (data.session) {
        await handleAuthState(data.session, companyName);
      } else {
        const loginRes = await supabaseClient.auth.signInWithPassword({ email, password });
        if (loginRes.data && loginRes.data.session) {
          await handleAuthState(loginRes.data.session, companyName);
        } else {
          showAuthAlert("signup", "Račun podjetja je bil ustvarjen in zabeležen! V Supabase Auth -> Providers -> Email izklopite 'Confirm email' za takojšnjo prijavo.", false);
        }
      }
    }
  } catch (err) {
    showAuthAlert("signup", "Prišlo je do napake pri registraciji.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Ustvari račun podjetja";
  }
});

// Logout
$("#logoutBtn")?.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  handleAuthState(null);
});

// --------------------------------------------------------------------------
// Data Fetching & Syncing
// --------------------------------------------------------------------------
async function loadAllData() {
  await fetchWorkplaces();
  await fetchUserProfiles();
  await fetchPendingRequests();
  const approvedReqs = await fetchApprovedRequests();
  const sources = await fetchIncomeSources();
  const logs = await fetchWorkLogs();
  syncEmployeesAndLogs(approvedReqs, sources, logs);
  renderAll();
}

async function fetchWorkplaces() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from("workplaces").select("*");
    if (!error && Array.isArray(data)) {
      state.sectors = [];
      state.jobs = [];
      const sectorMap = new Map();

      data.forEach((wp) => {
        const sectorNameVal = wp.sector_name || wp.name || "Splošno";
        const sectorIdVal = wp.id || slugify(sectorNameVal);
        if (!sectorMap.has(sectorIdVal)) {
          sectorMap.set(sectorIdVal, {
            id: sectorIdVal,
            name: sectorNameVal,
            color: wp.sector_color || "#56829d",
            notes: wp.sector_notes || "",
            code: wp.join_code || wp.code || generateSectorCode(),
          });
        }
        state.jobs.push({
          id: wp.id,
          title: wp.name,
          sectorId: sectorIdVal,
          code: wp.join_code,
        });
      });

      state.sectors = Array.from(sectorMap.values());
    }
  } catch (e) {
    console.log("Info: workplaces table sync", e);
  }
}

async function fetchUserProfiles() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from("user_profiles").select("*");
    if (!error && Array.isArray(data)) {
      state.userProfiles.clear();
      data.forEach((p) => {
        state.userProfiles.set(p.id, p.name || p.full_name || "Neznan uporabnik");
      });
    }
  } catch (e) {
    console.log("Info: user_profiles sync", e);
  }
}

async function fetchApprovedRequests() {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from("workplace_requests")
      .select("*, workplaces(*)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      state.approvedRequests = data;
      return data;
    }
  } catch (e) {
    console.log("Info: approved requests sync", e);
  }
  return [];
}

async function fetchIncomeSources() {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from("income_sources").select("*");
    if (!error && Array.isArray(data)) {
      state.incomeSources = data;
      return data;
    }
  } catch (e) {
    console.log("Info: income_sources sync", e);
  }
  return [];
}

async function fetchWorkLogs() {
  if (!supabaseClient) return [];
  try {
    const { data: logs, error } = await supabaseClient
      .from("work_logs")
      .select("*")
      .order("date", { ascending: false });

    if (!error && Array.isArray(logs)) {
      state.workLogs = logs;
      return logs;
    }
  } catch (e) {
    console.log("Info: work_logs sync", e);
  }
  return [];
}

// 2. Real-time Listener & Polling for workplace_requests and work_logs
function setupRealtimeListeners() {
  if (!supabaseClient) return;

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  try {
    realtimeChannel = supabaseClient
      .channel("workplace_requests_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workplace_requests" },
        async () => {
          await loadAllData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_logs" },
        async () => {
          await loadAllData();
        }
      )
      .subscribe();
  } catch (err) {
    console.warn("Realtime subscription error:", err);
  }

  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    if (state.currentUser) {
      await loadAllData();
    }
  }, 5000);
}

// 3. Fetch and Display Pending Requests
async function fetchPendingRequests() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from("workplace_requests")
      .select("*, workplaces(*)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      state.pendingRequests = data;
      renderPendingRequestsNotification();
    }
  } catch (e) {
    console.log("Info: workplace_requests sync", e);
  }
}

function renderPendingRequestsNotification() {
  const container = $("#requestsNotificationArea");
  if (!container) return;

  if (state.pendingRequests.length === 0) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = state.pendingRequests
    .map((req) => {
      const userName = req.user_name || state.userProfiles.get(req.user_id) || "Uporabnik";
      const workplaceName = req.workplaces?.name || req.workplace_name || "delovnim mestom";
      const sectorNameText = req.workplaces?.sector_name ? ` (${req.workplaces.sector_name})` : "";

      return `
        <div class="request-banner" id="request-${req.id}">
          <div class="request-content-wrap">
            <div class="request-icon">🔔</div>
            <p class="request-text">
              <strong>${userName}</strong> se želi povezati z delovnim mestom <strong>${workplaceName}${sectorNameText}</strong>
            </p>
          </div>
          <div class="request-actions">
            <button class="btn-approve" onclick="handleRequestApproval('${req.id}', 'approved')" type="button">Odobri</button>
            <button class="btn-deny" onclick="handleRequestApproval('${req.id}', 'denied')" type="button">Zavrni</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// 4. Update request status (approved / denied)
window.handleRequestApproval = async function (requestId, newStatus) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient
      .from("workplace_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      alert(`Napaka pri posodobitvi zahteve: ${error.message}`);
    } else {
      state.pendingRequests = state.pendingRequests.filter((r) => r.id !== requestId);
      renderPendingRequestsNotification();
      await loadAllData();
    }
  } catch (e) {
    console.error("Error approving/denying request:", e);
  }
};

// 5. Strictly synchronize ONLY approved users and their workplace-specific work logs
function syncEmployeesAndLogs(approvedReqs, sources, logs) {
  const empMap = new Map();

  // Create lookups for our company's sectors
  const sectorByCode = new Map();
  const sectorByIdMap = new Map();
  const myWorkplaceIds = new Set(state.sectors.map((s) => s.id));
  const myJoinCodes = new Set(state.sectors.map((s) => s.code));

  state.sectors.forEach((sec) => {
    sectorByCode.set(sec.code, sec);
    sectorByIdMap.set(sec.id, sec);
  });

  // Map each income_source ID to its exact sector (Strict 1-to-1 code binding)
  const sourceToSectorMap = new Map();
  sources.forEach((src) => {
    let matchedSector = null;
    if (src.workplace_id && sectorByIdMap.has(src.workplace_id)) {
      matchedSector = sectorByIdMap.get(src.workplace_id);
    } else if (src.join_code && sectorByCode.has(src.join_code)) {
      matchedSector = sectorByCode.get(src.join_code);
    }

    if (matchedSector) {
      sourceToSectorMap.set(src.id, {
        sectorId: matchedSector.id,
        sectorName: matchedSector.name,
        sectorCode: matchedSector.code,
        color: matchedSector.color || "#56829d",
        hourlyRate: Number(src.hourly_rate) || 15,
        jobName: src.name || matchedSector.name,
        workplaceId: src.workplace_id || matchedSector.id,
      });

      const userId = src.user_id;
      if (userId) {
        const userStatus = state.employeeCustomStatuses?.[userId] || "Zaposlen";
        if (!empMap.has(userId)) {
          const userName = state.userProfiles.get(userId) || "Zaposleni";
          empMap.set(userId, {
            id: userId,
            name: userName,
            status: userStatus,
            sectors: {},
            hours: {},
            travelExpenses: {},
            earnings: {},
            paid: {},
          });
        }

        const emp = empMap.get(userId);
        if (emp) {
          emp.status = userStatus;
        }
        if (!emp.sectors[matchedSector.id]) {
          emp.sectors[matchedSector.id] = {
            sectorId: matchedSector.id,
            sectorName: matchedSector.name,
            sectorCode: matchedSector.code,
            color: matchedSector.color || "#56829d",
            rate: Number(src.hourly_rate) || 15,
            jobName: src.name || matchedSector.name,
            hours: {},
            travelExpenses: {},
            earnings: {},
            paid: {},
          };
        }
      }
    }
  });

  // Also include approved requests
  approvedReqs.forEach((req) => {
    const userId = req.user_id;
    if (!userId) return;

    const wp = req.workplaces || state.jobs.find((j) => j.id === req.workplace_id) || {};
    const matchedSector =
      state.sectors.find((s) => s.id === req.workplace_id || s.name === wp.sector_name || s.id === wp.sectorId) ||
      state.sectors[0];

    if (!matchedSector) return;

    const userStatus = state.employeeCustomStatuses?.[userId] || "Zaposlen";
    if (!empMap.has(userId)) {
      const userName = req.user_name || state.userProfiles.get(userId) || "Zaposleni";
      empMap.set(userId, {
        id: userId,
        name: userName,
        status: userStatus,
        sectors: {},
        hours: {},
        travelExpenses: {},
        earnings: {},
        paid: {},
      });
    }

    const emp = empMap.get(userId);
    if (emp) {
      emp.status = userStatus;
    }
    if (req.user_name && emp.name === "Zaposleni") {
      emp.name = req.user_name;
    }

    if (!emp.sectors[matchedSector.id]) {
      emp.sectors[matchedSector.id] = {
        sectorId: matchedSector.id,
        sectorName: matchedSector.name,
        sectorCode: matchedSector.code,
        color: matchedSector.color || "#56829d",
        rate: 15,
        jobName: wp.name || matchedSector.name,
        hours: {},
        travelExpenses: {},
        earnings: {},
        paid: {},
      };
    }
  });

  // Process work_logs: STRICTLY assign logs to the matching sector ONLY
  state.rawLogs = [];
  logs.forEach((log) => {
    const userId = log.user_id;
    if (!empMap.has(userId)) return;

    // Find the exact sector for this work log
    let matchedSectorInfo = null;
    if (log.source_id && sourceToSectorMap.has(log.source_id)) {
      matchedSectorInfo = sourceToSectorMap.get(log.source_id);
    } else if (log.workplace_id && sectorByIdMap.has(log.workplace_id)) {
      const sec = sectorByIdMap.get(log.workplace_id);
      matchedSectorInfo = {
        sectorId: sec.id,
        sectorName: sec.name,
        sectorCode: sec.code,
        color: sec.color || "#56829d",
        hourlyRate: 15,
      };
    }

    // STRICT ISOLATION: if this work log does not belong to any of this company's sectors, ignore it completely
    if (!matchedSectorInfo) return;

    const targetSectorId = matchedSectorInfo.sectorId;
    const emp = empMap.get(userId);

    // Ensure the employee sector entry exists
    if (!emp.sectors[targetSectorId]) {
      emp.sectors[targetSectorId] = {
        sectorId: targetSectorId,
        sectorName: matchedSectorInfo.sectorName,
        sectorCode: matchedSectorInfo.sectorCode,
        color: matchedSectorInfo.color || "#56829d",
        rate: matchedSectorInfo.hourlyRate || 15,
        jobName: matchedSectorInfo.jobName || matchedSectorInfo.sectorName,
        hours: {},
        travelExpenses: {},
        earnings: {},
        paid: {},
      };
    }

    const secEntry = emp.sectors[targetSectorId];
    const dateStr = log.date || log.created_at;
    if (!dateStr) return;
    const cleanDate = dateStr.slice(0, 10);
    const monthKey = cleanDate.slice(0, 7); // "YYYY-MM"

    const h = Number(log.hours || 0);
    const travel = Number(log.travel_expenses || 0);
    const fixedRate = Number(secEntry.rate) || Number(matchedSectorInfo.hourlyRate) || 15;
    
    // Base work earnings + travel expenses
    let totalLogEarnings = Number(log.earnings || 0);
    if (totalLogEarnings === 0 && h > 0) {
      totalLogEarnings = (h * fixedRate) + travel;
    }

    // 1. Add strictly to the specific sector breakdown
    secEntry.hours[monthKey] = (secEntry.hours[monthKey] || 0) + h;
    secEntry.travelExpenses[monthKey] = (secEntry.travelExpenses[monthKey] || 0) + travel;
    secEntry.earnings[monthKey] = (secEntry.earnings[monthKey] || 0) + totalLogEarnings;
    // secEntry.rate remains fixed from income_sources!

    if (log.is_paid === false) {
      secEntry.paid[monthKey] = false;
    } else if (secEntry.paid[monthKey] === undefined) {
      secEntry.paid[monthKey] = true;
    }

    // 2. Add to overall employee monthly totals
    emp.hours[monthKey] = (emp.hours[monthKey] || 0) + h;
    emp.travelExpenses[monthKey] = (emp.travelExpenses[monthKey] || 0) + travel;
    emp.earnings[monthKey] = (emp.earnings[monthKey] || 0) + totalLogEarnings;
    if (log.is_paid === false) {
      emp.paid[monthKey] = false;
    } else if (emp.paid[monthKey] === undefined) {
      emp.paid[monthKey] = true;
    }

    // 3. Save into rawLogs for daily calendar breakdown
    state.rawLogs.push({
      id: log.id,
      userId: userId,
      userName: emp.name,
      sectorId: targetSectorId,
      sectorName: matchedSectorInfo.sectorName,
      sectorCode: matchedSectorInfo.sectorCode,
      color: matchedSectorInfo.color || "#56829d",
      date: cleanDate,
      hours: h,
      travelExpenses: travel,
      earnings: totalLogEarnings,
      startTime: log.start_time || "",
      endTime: log.end_time || "",
      note: log.note || "",
      isPaid: log.is_paid !== false,
      rate: fixedRate, // Fixed rate from income_sources
    });
  });

  state.employees = Array.from(empMap.values());
}

// Helpers
function formatSectorCount(count) {
  if (count === 1) return "1 sektor";
  if (count === 2) return "2 sektorja";
  if (count === 3 || count === 4) return `${count} sektorji`;
  return `${count} sektorjev`;
}

function formatEmployeeCount(count) {
  if (count === 1) return "1 zaposlen";
  if (count === 2) return "2 zaposlena";
  if (count === 3 || count === 4) return `${count} zaposleni`;
  return `${count} zaposlenih`;
}

function activeMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = String(month + 1).padStart(2, "0");
  return {
    key: `${year}-${monthStr}`,
    label: `${SLO_MONTH_NAMES[month]} ${year}`,
    year,
    month,
  };
}

function sectorById(id) {
  return state.sectors.find((sector) => sector.id === id);
}

function sectorName(id) {
  return sectorById(id)?.name ?? "Brez sektorja";
}

function generateSectorCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const existingCodes = new Set(state.sectors.map((s) => s.code));

  let code = "";
  let attempts = 0;
  do {
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const d1 = digits[Math.floor(Math.random() * digits.length)];
    const d2 = digits[Math.floor(Math.random() * digits.length)];
    const d3 = digits[Math.floor(Math.random() * digits.length)];
    const d4 = digits[Math.floor(Math.random() * digits.length)];
    code = `${l1}${l2}${d1}${d2}${d3}${d4}`;
    attempts++;
    if (attempts > 10000) break;
  } while (existingCodes.has(code));

  return code;
}

function initials(name) {
  if (!name) return "--";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function employeeMonth(employee, specificSectorId = null) {
  const monthKey = activeMonth().key;
  if (specificSectorId && employee.sectors?.[specificSectorId]) {
    const sec = employee.sectors[specificSectorId];
    const hours = sec.hours?.[monthKey] ?? 0;
    const travelExpenses = sec.travelExpenses?.[monthKey] ?? 0;
    const earnings = sec.earnings?.[monthKey] ?? (hours * (sec.rate ?? 15) + travelExpenses);
    const paid = sec.paid?.[monthKey] ?? (hours === 0 && travelExpenses === 0 ? true : false);
    return { hours, travelExpenses, earnings, paid, rate: sec.rate ?? 15 };
  }

  const hours = employee.hours?.[monthKey] ?? 0;
  const travelExpenses = employee.travelExpenses?.[monthKey] ?? 0;
  const earnings = employee.earnings?.[monthKey] ?? (hours * 15 + travelExpenses);
  const paid = employee.paid?.[monthKey] ?? (hours === 0 && travelExpenses === 0 ? true : false);

  const sectorList = Object.values(employee.sectors || {});
  const rate = sectorList.length > 0 ? sectorList[0].rate : 15;
  const rates = sectorList.map((s) => ({ sectorName: s.sectorName, rate: s.rate }));

  return { hours, travelExpenses, earnings, paid, rate, rates };
}

function formatHourlyRate(month, employee) {
  if (month.rates && month.rates.length > 1) {
    const uniqueRates = [...new Set(month.rates.map((r) => r.rate))];
    if (uniqueRates.length === 1) {
      return `${currency.format(uniqueRates[0])}/h`;
    }
    return month.rates.map((r) => `${r.sectorName}: ${currency.format(r.rate)}/h`).join("<br/>");
  }
  return `${currency.format(month.rate || 15)}/h`;
}

function currentTotals() {
  return state.employees.reduce(
    (totals, employee) => {
      const month = employeeMonth(employee);
      totals.hours += month.hours;
      totals.travelExpenses = (totals.travelExpenses || 0) + (month.travelExpenses || 0);
      totals.earnings += month.earnings;
      totals.unpaid += month.paid ? 0 : month.earnings;
      return totals;
    },
    { hours: 0, travelExpenses: 0, earnings: 0, unpaid: 0 }
  );
}

// Strict calculation: each sector only receives the hours and earnings belonging strictly to it!
function sectorStats(sectorId) {
  const monthKey = activeMonth().key;
  let count = 0;
  let totalHours = 0;
  let totalTravel = 0;
  let totalEarnings = 0;
  let totalUnpaid = 0;
  let paidEmployeesCount = 0;

  const sectorEmployees = state.employees.filter((employee) => Boolean(employee.sectors?.[sectorId]));
  count = sectorEmployees.length;

  sectorEmployees.forEach((employee) => {
    const sec = employee.sectors[sectorId];
    const hours = sec.hours?.[monthKey] ?? 0;
    const travel = sec.travelExpenses?.[monthKey] ?? 0;
    const earnings = sec.earnings?.[monthKey] ?? (hours * (sec.rate ?? 15) + travel);

    // Calculate whether this employee's work in this sector is paid
    const secLogs = state.rawLogs.filter(
      (l) => l.userId === employee.id && l.sectorId === sectorId && l.date.startsWith(monthKey)
    );
    let isPaid = false;
    if (secLogs.length > 0) {
      const secUnpaid = secLogs.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.earnings, 0);
      isPaid = secUnpaid === 0;
    } else {
      isPaid = sec.paid?.[monthKey] ?? (hours === 0 && travel === 0 ? true : false);
    }

    totalHours += hours;
    totalTravel += travel;
    totalEarnings += earnings;
    if (!isPaid) {
      totalUnpaid += earnings;
    } else {
      paidEmployeesCount += 1;
    }
  });

  const paidPercentage = count > 0 ? Math.round((paidEmployeesCount / count) * 100) : 100;

  return {
    employees: count,
    paidEmployees: paidEmployeesCount,
    paidPercentage,
    hours: totalHours,
    travelExpenses: totalTravel,
    earnings: totalEarnings,
    unpaid: totalUnpaid,
  };
}

function paidChip(paid) {
  return `<span class="chip ${paid ? "" : "warning"}">${paid ? "Izplačano" : "Ni izplačano"}</span>`;
}

function sectorBadgeHTML(sector, showCode = false) {
  if (!sector) return `<span class="chip neutral">Brez sektorja</span>`;
  const color = sector.color || "#56829d";
  const name = sector.name || sector.sectorName || "Sektor";
  const code = sector.code || sector.sectorCode || "";
  return `
    <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">
      <span class="sector-color-dot" style="background-color: ${color};"></span>
      ${name}${showCode && code ? ` · ${code}` : ""}
    </span>
  `;
}

function renderEmployeeSectorsList(employeeSectors, showCode = false) {
  if (!employeeSectors || employeeSectors.length === 0) {
    return `<span class="chip neutral">Brez sektorja</span>`;
  }

  if (employeeSectors.length <= 2) {
    return `<div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">${employeeSectors.map((s) => sectorBadgeHTML(s, showCode)).join("")}</div>`;
  }

  const visibleSectors = employeeSectors.slice(0, 2);
  const remainingSectors = employeeSectors.slice(2);
  const remainingCount = remainingSectors.length;

  return `
    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
      ${visibleSectors.map((s) => sectorBadgeHTML(s, showCode)).join("")}
      <div class="sector-more-badge-wrap" onclick="event.stopPropagation();">
        <span class="sector-more-badge">+${remainingCount}</span>
        <div class="sector-more-popover">
          <div class="sector-more-popover-title">Ostali sektorji (${remainingCount})</div>
          <div class="sector-more-popover-list">
            ${remainingSectors.map((s) => sectorBadgeHTML(s, false)).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function employeeRow(employee, compact = false, specificSectorId = null) {
  const month = employeeMonth(employee, specificSectorId);
  const travelDisplay = month.travelExpenses > 0 ? currency.format(month.travelExpenses) : `<span style="color: var(--muted);">-</span>`;
  const rateDisplay = formatHourlyRate(month, employee);
  const statusBadge = `<span class="chip ${month.paid ? "" : "warning"}">${month.paid ? "Izplačano" : "Ni izplačano"}</span>`;

  if (compact) {
    const paidControl = `
      <label class="paid-toggle" onclick="event.stopPropagation();">
        <input type="checkbox" data-paid-id="${employee.id}" ${month.paid ? "checked" : ""} />
        ${paidChip(month.paid)}
      </label>
    `;
    return `
      <tr class="clickable-employee-row" onclick="openEmployeeDetail('${employee.id}')">
        <td><div class="person"><span class="avatar">${initials(employee.name)}</span><strong>${employee.name}</strong></div></td>
        <td>${employee.status || "Zaposlen"}</td>
        <td>${number.format(month.hours)} h</td>
        <td>${rateDisplay}</td>
        <td>${travelDisplay}</td>
        <td><strong>${currency.format(month.earnings)}</strong></td>
        <td>${paidControl}</td>
      </tr>
    `;
  }

  // Display badges for sectors with max 2 visible and +X hover popover
  const employeeSectors = Object.values(employee.sectors || {});
  const sectorBadgesHTML = renderEmployeeSectorsList(employeeSectors, false);

  return `
    <tr class="clickable-employee-row" onclick="openEmployeeDetail('${employee.id}')">
      <td><div class="person"><span class="avatar">${initials(employee.name)}</span><strong>${employee.name}</strong></div></td>
      <td>${sectorBadgesHTML}</td>
      <td>${number.format(month.hours)} h</td>
      <td>${travelDisplay}</td>
      <td><strong>${currency.format(month.earnings)}</strong></td>
      <td>${statusBadge}</td>
    </tr>
  `;
}

function renderOverview() {
  const totals = currentTotals();
  $("#activeMonth").textContent = activeMonth().label;
  $("#totalHours").textContent = `${number.format(totals.hours)} h`;
  $("#totalEarnings").textContent = currency.format(totals.earnings);
  $("#unpaidTotal").textContent = currency.format(totals.unpaid);
  $("#employeeCount").textContent = state.employees.length;
  $("#sectorCount").textContent = formatSectorCount(state.sectors.length);

  const sidebarStats = $("#sidebarStats");
  if (sidebarStats) {
    sidebarStats.textContent = `${formatSectorCount(state.sectors.length)} · ${formatEmployeeCount(state.employees.length)}`;
  }

  if (state.sectors.length === 0) {
    $("#overviewSectorList").innerHTML = `<p class="empty-state">Ni vnesenih sektorjev.</p>`;
  } else {
    $("#overviewSectorList").innerHTML = state.sectors
      .map((sector) => {
        const stats = sectorStats(sector.id);
        const color = sector.color || "#56829d";
        const paidPct = stats.paidPercentage;
        const isFull = paidPct === 100;
        return `
          <article class="sector-row">
            <div>
              <div class="sector-title-wrap">
                <span class="sector-color-dot" style="background-color: ${color};"></span>
                <h3>${sector.name}</h3>
                <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">${sector.code}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
                <p style="margin: 0;">${formatEmployeeCount(stats.employees)} · ${number.format(stats.hours)} h</p>
                <span style="font-size: 11px; font-weight: 700; color: ${isFull ? '#10b981' : (paidPct > 0 ? 'var(--primary-dark)' : 'var(--muted)')};">
                  ${paidPct}% izplačanih zaposlenih (${stats.paidEmployees}/${stats.employees})
                </span>
              </div>
              <div class="progress" title="${paidPct}% zaposlenih izplačanih (${stats.paidEmployees}/${stats.employees})">
                <span style="width: ${paidPct}%; background-color: ${isFull ? '#10b981' : color};"></span>
              </div>
            </div>
            <div class="amount">${currency.format(stats.earnings)}</div>
          </article>
        `;
      })
      .join("");
  }

  const unpaidEmployees = state.employees.filter((employee) => !employeeMonth(employee).paid && employeeMonth(employee).earnings > 0);
  if (unpaidEmployees.length === 0) {
    $("#payrollList").innerHTML = `<p class="empty-state">Vsa izplačila za ta mesec so urejena.</p>`;
  } else {
    $("#payrollList").innerHTML = unpaidEmployees
      .slice(0, 5)
      .map((employee) => {
        const month = employeeMonth(employee);
        const secNames = Object.values(employee.sectors || {}).map((s) => s.sectorName).join(", ") || "Zaposleni";
        return `
          <article class="payroll-row">
            <div>
              <h3>${employee.name}</h3>
              <p>${secNames} · ${number.format(month.hours)} h</p>
            </div>
            <div class="amount">${currency.format(month.earnings)}</div>
          </article>
        `;
      })
      .join("");
  }

  if (state.employees.length === 0) {
    $("#overviewTable").innerHTML = `<tr><td colspan="6" class="empty-cell">Ni registriranih zaposlenih</td></tr>`;
  } else {
    $("#overviewTable").innerHTML = state.employees.map((employee) => employeeRow(employee)).join("");
  }
}

function renderSectors() {
  if (state.sectors.length === 0) {
    $("#sectorCards").innerHTML = `<p class="empty-state">Ni ustvarjenih sektorjev. Kliknite gumb <strong>+ Dodaj sektor</strong> zgoraj za ustvarjanje prvega sektorja.</p>`;
  } else {
    $("#sectorCards").innerHTML = state.sectors
      .map((sector) => {
        const stats = sectorStats(sector.id);
        const color = sector.color || "#56829d";
        const notesHtml = sector.notes ? `<p class="sector-notes">${sector.notes}</p>` : "";
        return `
          <article class="sector-card" style="border-top: 4px solid ${color};">
            <div>
              <div class="sector-card-header">
                <div class="sector-title-wrap">
                  <span class="sector-color-dot" style="background-color: ${color};"></span>
                  <h3>${sector.name}</h3>
                </div>
                <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">${sector.code}</span>
              </div>
              <p>${activeMonth().label}</p>
              ${notesHtml}
            </div>
            <div class="sector-stats">
              <div><strong>${stats.employees}</strong><span>Zaposleni</span></div>
              <div><strong>${number.format(stats.hours)}</strong><span>Ure</span></div>
              <div><strong>${currency.format(stats.earnings)}</strong><span>Zaslužek</span></div>
            </div>
            <button class="ghost-button" data-sector-id="${sector.id}" type="button">Odpri sektor</button>
          </article>
        `;
      })
      .join("");
  }
}

function renderEmployees() {
  const search = $("#employeeSearch")?.value.toLowerCase() ?? "";
  const sectorFilterVal = $("#sectorFilter")?.value ?? "all";
  const filtered = state.employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(search);
    const matchesSector = sectorFilterVal === "all" || Boolean(employee.sectors?.[sectorFilterVal]);
    return matchesSearch && matchesSector;
  });

  const monthKey = activeMonth().key;

  if (filtered.length === 0) {
    $("#employeesTable").innerHTML = `<tr><td colspan="3" class="empty-cell">${state.employees.length === 0 ? "Baza zaposlenih je prazna" : "Noben zaposleni ne ustreza iskanju"}</td></tr>`;
  } else {
    $("#employeesTable").innerHTML = filtered
      .map((employee) => {
        const employeeSectors = Object.values(employee.sectors || {});
        const sectorBadgesHTML = renderEmployeeSectorsList(employeeSectors, false);
        const status = employee.status || "Zaposlen";

        // Calculate payment progress for this employee in active month
        const empMonthLogs = state.rawLogs.filter((l) => l.userId === employee.id && l.date.startsWith(monthKey));
        const totalHours = empMonthLogs.reduce((sum, l) => sum + l.hours, 0);
        const monthInfo = employeeMonth(employee);
        const totalEarnings = empMonthLogs.length > 0 ? empMonthLogs.reduce((sum, l) => sum + l.earnings, 0) : monthInfo.earnings;
        const paidEarnings = empMonthLogs.length > 0 ? empMonthLogs.filter((l) => l.isPaid).reduce((sum, l) => sum + l.earnings, 0) : (monthInfo.paid ? totalEarnings : 0);
        
        let paidPercent = 100;
        if (totalEarnings > 0) {
          paidPercent = Math.round((paidEarnings / totalEarnings) * 100);
        } else if (totalHours > 0) {
          paidPercent = monthInfo.paid ? 100 : 0;
        } else {
          paidPercent = 100;
        }

        const isFull = paidPercent === 100 && totalEarnings > 0;
        const isZeroEarnings = totalEarnings === 0 && totalHours === 0;

        return `
          <tr class="clickable-employee-row" onclick="openEmployeeDetail('${employee.id}')">
            <td>
              <div class="person">
                <span class="avatar">${initials(employee.name)}</span>
                <strong>${employee.name}</strong>
                <span class="chip" style="background: var(--primary-light); color: var(--primary-dark); font-weight: 700; font-size: 11px; padding: 3px 9px; margin-left: 6px;">● ${status}</span>
              </div>
            </td>
            <td style="min-width: 220px; vertical-align: middle;">
              <div class="emp-progress-cell" style="display: flex; flex-direction: column; gap: 4px; max-width: 220px;">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
                  <span style="font-weight: 700; color: ${isZeroEarnings ? 'var(--muted)' : (isFull ? '#10b981' : (paidPercent > 0 ? 'var(--primary-dark)' : 'var(--muted)'))};">
                    ${isZeroEarnings ? 'Ni zabeleženih ur' : `${paidPercent}% izplačano`}
                  </span>
                  <span style="font-size: 11px; color: var(--muted); font-weight: 600;">
                    ${currency.format(paidEarnings)} / ${currency.format(totalEarnings)}
                  </span>
                </div>
                <div class="progress" style="margin-top: 0; height: 6px; background: #e2e8f0;" title="${isZeroEarnings ? 'Brez zabeleženih ur v tem mesecu' : `${paidPercent}% izplačano (${currency.format(paidEarnings)} od ${currency.format(totalEarnings)})`}">
                  <span style="width: ${paidPercent}%; background-color: ${isZeroEarnings ? 'var(--line)' : (isFull ? '#10b981' : 'var(--primary)')};"></span>
                </div>
              </div>
            </td>
            <td style="text-align: right; padding-right: 24px; vertical-align: middle;">
              <div style="display: inline-flex; align-items: center; gap: 10px;">
                ${sectorBadgesHTML}
                <span style="color: var(--muted); font-size: 18px; line-height: 1; margin-left: 4px;">›</span>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // If a specific employee profile is open, update their detail view
  if (state.selectedEmployeeId) {
    renderEmployeeDetail(state.selectedEmployeeId);
  }
}

// ==========================================================================
// Employee Detail View Management
// ==========================================================================
window.openEmployeeDetail = function (employeeId) {
  state.selectedEmployeeId = employeeId;
  switchView("employees");
  const listContainer = $("#employeesListContainer");
  const detailContainer = $("#employeeDetailContainer");
  if (listContainer) listContainer.hidden = true;
  if (detailContainer) detailContainer.hidden = false;
  renderEmployeeDetail(employeeId);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.closeEmployeeDetail = function () {
  state.selectedEmployeeId = null;
  const listContainer = $("#employeesListContainer");
  const detailContainer = $("#employeeDetailContainer");
  if (listContainer) listContainer.hidden = false;
  if (detailContainer) detailContainer.hidden = true;
  renderEmployees();
};

function renderEmployeeDetail(employeeId) {
  const employee = state.employees.find((e) => e.id === employeeId);
  if (!employee) return;

  const monthObj = activeMonth();
  const monthKey = monthObj.key;
  const monthLabel = monthObj.label;

  // Header info
  if ($("#empDetailAvatar")) $("#empDetailAvatar").textContent = initials(employee.name);
  if ($("#empDetailName")) $("#empDetailName").textContent = employee.name;
  if ($("#empDetailMonthPill")) $("#empDetailMonthPill").textContent = monthLabel;

  const employeeSectors = Object.values(employee.sectors || {});
  const sectorBadgesHTML = renderEmployeeSectorsList(employeeSectors, false);

  const availableStatuses = state.customStatuses && state.customStatuses.length > 0
    ? state.customStatuses
    : ["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"];

  if (!availableStatuses.includes(employee.status)) {
    availableStatuses.push(employee.status);
  }

  const statusOptions = availableStatuses
    .map((st) => `<option value="${st}" ${employee.status === st ? "selected" : ""}>● ${st}</option>`)
    .join("");

  const statusDropdownHTML = `
    <div class="emp-status-badge-dropdown">
      <select class="emp-status-select-chip" onchange="handleEmployeeStatusChange('${employee.id}', this.value)" title="Kliknite za spremembo statusa zaposlenega">
        ${statusOptions}
      </select>
    </div>
  `;

  if ($("#empDetailBadges")) {
    $("#empDetailBadges").innerHTML = `
      ${statusDropdownHTML}
      ${sectorBadgesHTML}
    `;
  }

  // Find all work logs for this employee in this active month
  const empMonthLogs = state.rawLogs.filter((l) => l.userId === employeeId && l.date.startsWith(monthKey));
  const totalHours = empMonthLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalTravel = empMonthLogs.reduce((sum, l) => sum + (l.travelExpenses || 0), 0);
  const totalEarnings = empMonthLogs.reduce((sum, l) => sum + l.earnings, 0);
  const unpaidAmount = empMonthLogs.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.earnings, 0);

  if ($("#empDetailTotalHours")) $("#empDetailTotalHours").textContent = `${number.format(totalHours)} h`;
  if ($("#empDetailHourlyRate")) {
    const rates = employeeSectors.map((s) => s.rate || 15);
    const uniqueRates = [...new Set(rates)];
    $("#empDetailHourlyRate").textContent =
      uniqueRates.length === 1
        ? `${currency.format(uniqueRates[0])}/h`
        : employeeSectors.map((s) => `${s.sectorName}: ${currency.format(s.rate || 15)}/h`).join(" · ");
  }
  if ($("#empDetailTravel")) $("#empDetailTravel").textContent = currency.format(totalTravel);
  if ($("#empDetailTotalEarnings")) $("#empDetailTotalEarnings").textContent = currency.format(totalEarnings);
  if ($("#empDetailUnpaid")) {
    $("#empDetailUnpaid").textContent = currency.format(unpaidAmount);
    $("#empDetailUnpaid").style.color = unpaidAmount > 0 ? "var(--amber)" : "var(--primary-dark)";
  }

  // Sector breakdown cards
  const sectorCardsContainer = $("#empSectorCardsContainer");
  if (sectorCardsContainer) {
    if (employeeSectors.length === 0) {
      sectorCardsContainer.innerHTML = `<p class="empty-state">Zaposleni ni povezan z nobenim sektorjem.</p>`;
    } else {
      sectorCardsContainer.innerHTML = employeeSectors
        .map((sec) => {
          const color = sec.color || "#56829d";
          const secLogs = empMonthLogs.filter((l) => l.sectorId === sec.sectorId);
          const secHours = secLogs.reduce((sum, l) => sum + l.hours, 0);
          const secTravel = secLogs.reduce((sum, l) => sum + (l.travelExpenses || 0), 0);
          const secEarnings = secLogs.reduce((sum, l) => sum + l.earnings, 0);
          const secPaid = secLogs.filter((l) => l.isPaid).reduce((sum, l) => sum + l.earnings, 0);
          const secUnpaid = secLogs.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.earnings, 0);
          const isPaid = (secHours > 0 || secTravel > 0) ? secUnpaid === 0 : true;
          const rate = sec.rate || 15; // EXACT RATE FROM INCOME_SOURCES!

          let paidPct = 100;
          if (secEarnings > 0) {
            paidPct = Math.round((secPaid / secEarnings) * 100);
          } else if (secHours > 0) {
            paidPct = isPaid ? 100 : 0;
          } else {
            paidPct = 100;
          }

          const isFull = paidPct === 100 && secEarnings > 0;
          const isZero = secEarnings === 0 && secHours === 0;

          return `
            <article class="emp-sector-card" style="border-top: 4px solid ${color};">
              <div class="emp-sector-card-top">
                <div>
                  <div class="sector-title-wrap">
                    <span class="sector-color-dot" style="background-color: ${color};"></span>
                    <h3 style="margin: 0; font-size: 16px;">${sec.sectorName}</h3>
                  </div>
                  <p class="emp-sector-job-name">${sec.jobName || sec.sectorName}</p>
                </div>
                <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">${sec.sectorCode}</span>
              </div>

              <div class="emp-sector-metrics-grid">
                <div class="emp-sector-stat">
                  <p>Ure</p>
                  <strong>${number.format(secHours)} h</strong>
                </div>
                <div class="emp-sector-stat">
                  <p>Postavka</p>
                  <strong>${currency.format(rate)}/h</strong>
                </div>
                <div class="emp-sector-stat">
                  <p>Potni stroški</p>
                  <strong style="color: var(--ink);">${currency.format(secTravel)}</strong>
                </div>
                <div class="emp-sector-stat">
                  <p>Zaslužek</p>
                  <strong style="color: var(--primary-dark);">${currency.format(secEarnings)}</strong>
                </div>
              </div>

              <div class="progress" style="margin: 0; height: 6px; background: #e2e8f0;" title="${isZero ? 'Brez zabeleženih ur' : `${paidPct}% izplačano (${currency.format(secPaid)} od ${currency.format(secEarnings)})`}">
                <span style="width: ${paidPct}%; background-color: ${isZero ? 'var(--line)' : (isFull ? '#10b981' : color)};"></span>
              </div>

              <div class="emp-sector-footer">
                ${
                  isZero
                    ? `<span style="color: var(--muted); font-weight: 600;">Ni zabeleženih ur</span>`
                    : `<span style="color: ${isFull ? '#10b981' : 'var(--ink)'}; font-weight: 700;">${paidPct}% izplačano <span style="color: var(--muted); font-weight: 600; font-size: 11px;">(${currency.format(secPaid)} / ${currency.format(secEarnings)})</span></span>`
                }
                <span class="chip ${isPaid ? "" : "warning"}">${isPaid ? "Izplačano" : "Za izplačilo"}</span>
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  // Daily Work Logs Table
  const dailyLogsTable = $("#empDailyLogsTable");
  if (dailyLogsTable) {
    if (empMonthLogs.length === 0) {
      dailyLogsTable.innerHTML = `<tr><td colspan="9" class="empty-cell">V tem mesecu (${monthLabel}) še ni zabeleženih delovnih ur za tega zaposlenega</td></tr>`;
    } else {
      const sortedLogs = [...empMonthLogs].sort((a, b) => b.date.localeCompare(a.date));
      dailyLogsTable.innerHTML = sortedLogs
        .map((log) => {
          const color = log.color || "#56829d";
          const timeInterval = log.startTime && log.endTime ? `${log.startTime} – ${log.endTime}` : "Čas ni specificiran";
          const parts = log.date.split("-");
          const formattedDate = parts.length === 3 ? `${parseInt(parts[2], 10)}. ${SLO_MONTH_NAMES[parseInt(parts[1], 10) - 1].toLowerCase()} ${parts[0]}` : log.date;
          const travelDisplay = (log.travelExpenses || 0) > 0 ? currency.format(log.travelExpenses) : `<span style="color: var(--muted);">-</span>`;
          const paidControl = `
            <label class="paid-toggle" onclick="event.stopPropagation();">
              <input type="checkbox" data-log-paid-id="${log.id}" ${log.isPaid ? "checked" : ""} />
              ${paidChip(log.isPaid)}
            </label>
          `;

          return `
            <tr>
              <td><strong>${formattedDate}</strong></td>
              <td>
                <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">
                  <span class="sector-color-dot" style="background-color: ${color};"></span>
                  ${log.sectorName}
                </span>
              </td>
              <td>${timeInterval}</td>
              <td><strong>${number.format(log.hours)} h</strong></td>
              <td>${currency.format(log.rate)}/h</td>
              <td>${travelDisplay}</td>
              <td><strong style="color: var(--primary-dark);">${currency.format(log.earnings)}</strong></td>
              <td>${log.note ? `<em>${log.note}</em>` : `<span style="color: var(--muted);">-</span>`}</td>
              <td>${paidControl}</td>
            </tr>
          `;
        })
        .join("");
    }
  }
}

function renderSettings() {
  if ($("#companyName")) $("#companyName").value = state.companyName;
  if ($("#accountEmail")) $("#accountEmail").value = state.currentUser?.email || "";
  if ($("#sidebarCompany")) $("#sidebarCompany").textContent = state.companyName || "Moje podjetje";

  if (state.sectors.length === 0) {
    $("#jobCodeList").innerHTML = `
      <div class="empty-sectors-card">
        <p class="empty-state" style="margin-bottom: 12px;">Trenutno nimate ustvarjenega nobenega sektorja.</p>
        <button type="button" class="primary-button" onclick="openSectorModalDialog()" style="font-size: 13px; padding: 8px 14px;">+ Ustvari prvi sektor</button>
      </div>
    `;
  } else {
    $("#jobCodeList").innerHTML = `
      <div class="settings-sectors-list">
        ${state.sectors
          .map((sector) => {
            const color = sector.color || "#56829d";
            return `
              <article class="job-code-row">
                <div class="job-code-info">
                  <div class="sector-title-wrap">
                    <span class="sector-color-dot" style="background-color: ${color};"></span>
                    <strong style="font-size: 15px;">${sector.name}</strong>
                  </div>
                  ${sector.notes ? `<p class="job-code-note">${sector.notes}</p>` : ""}
                </div>
                <div class="job-code-actions">
                  <button class="copy-code" type="button" title="Kliknite za kopiranje kode" onclick="navigator.clipboard.writeText('${sector.code}')">${sector.code}</button>
                  <button class="delete-sector-btn" onclick="handleDeleteSector('${sector.id}', '${sector.name.replace(/'/g, "\\'")}', '${sector.code}')" type="button" title="Izbriši sektor">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <span>Izbriši</span>
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  // Render Custom Statuses List
  renderCustomStatuses();
}

function renderCustomStatuses() {
  const container = $("#customStatusList");
  if (!container) return;

  const statuses = state.customStatuses || ["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"];
  if (statuses.length === 0) {
    container.innerHTML = `<p class="empty-state" style="padding: 12px 0;">Ni ustvarjenih statusov.</p>`;
    return;
  }

  container.innerHTML = statuses
    .map((st) => {
      const isDefault = st === "Zaposlen";
      return `
        <div class="custom-status-chip-item">
          <span class="custom-status-dot"></span>
          <span>${st}</span>
          ${
            !isDefault
              ? `<button type="button" class="delete-status-btn" onclick="handleDeleteCustomStatus('${st.replace(/'/g, "\\'")}')" title="Odstrani status">✕</button>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

window.handleAddCustomStatus = function (statusName) {
  const trimmed = statusName.trim();
  if (!trimmed) return;
  if (!state.customStatuses) state.customStatuses = ["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"];
  if (!state.customStatuses.includes(trimmed)) {
    state.customStatuses.push(trimmed);
    localStorage.setItem("4p_custom_statuses", JSON.stringify(state.customStatuses));
    renderCustomStatuses();
    if (state.selectedEmployeeId) {
      renderEmployeeDetail(state.selectedEmployeeId);
    }
  }
};

window.handleDeleteCustomStatus = function (statusName) {
  if (!state.customStatuses) return;
  state.customStatuses = state.customStatuses.filter((s) => s !== statusName);
  localStorage.setItem("4p_custom_statuses", JSON.stringify(state.customStatuses));
  renderCustomStatuses();
  if (state.selectedEmployeeId) {
    renderEmployeeDetail(state.selectedEmployeeId);
  }
};

window.handleEmployeeStatusChange = function (employeeId, newStatus) {
  if (!state.employeeCustomStatuses) state.employeeCustomStatuses = {};
  state.employeeCustomStatuses[employeeId] = newStatus;
  localStorage.setItem("4p_employee_statuses", JSON.stringify(state.employeeCustomStatuses));

  const emp = state.employees.find((e) => e.id === employeeId);
  if (emp) {
    emp.status = newStatus;
  }
  renderAll();
};

// Delete Sector Permanently from Database
window.handleDeleteSector = async function (sectorId, sectorName, sectorCode) {
  const confirmed = confirm(`Ali ste prepričani, da želite dokončno izbrisati sektor "${sectorName}" (${sectorCode}) iz baze podatkov?`);
  if (!confirmed) return;

  // 1. Optimistic removal from state
  state.sectors = state.sectors.filter((s) => s.id !== sectorId && s.code !== sectorCode);
  state.jobs = state.jobs.filter((j) => j.sectorId !== sectorId && j.code !== sectorCode);
  renderAll();

  // 2. Permanent deletion from Supabase
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from("workplaces")
        .delete()
        .or(`id.eq.${sectorId},join_code.eq.${sectorCode}`);

      if (error) {
        console.error("Napaka pri izbrisu sektorja:", error);
        alert(`Napaka pri izbrisu sektorja iz baze: ${error.message}`);
      } else {
        await loadAllData();
      }
    } catch (e) {
      console.error("Exception pri izbrisu sektorja:", e);
    }
  }
};

function renderFilters() {
  const sectorOptions = `
    <option value="all">Vsi sektorji</option>
    ${state.sectors.map((sector) => `<option value="${sector.id}">${sector.name} (${sector.code})</option>`).join("")}
  `;
  if ($("#sectorFilter")) $("#sectorFilter").innerHTML = sectorOptions;
  if ($("#calSectorFilter")) $("#calSectorFilter").innerHTML = sectorOptions;

  const employeeOptions = `
    <option value="all">Vsi zaposleni</option>
    ${state.employees.map((emp) => `<option value="${emp.id}">${emp.name}</option>`).join("")}
  `;
  if ($("#calEmployeeFilter")) $("#calEmployeeFilter").innerHTML = employeeOptions;
}

function renderSectorDetail(sectorId) {
  const sector = state.sectors.find((item) => item.id === sectorId);
  if (!sector) return;

  const stats = sectorStats(sector.id);
  const color = sector.color || "#56829d";
  $("#sectorDetail").hidden = false;
  $("#sectorDetailTitle").innerHTML = `
    <span class="sector-title-wrap">
      <span class="sector-color-dot" style="background-color: ${color};"></span>
      ${sector.name}
      <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">${sector.code}</span>
    </span>
  `;
  $("#sectorDetailSubtitle").textContent = `${formatEmployeeCount(stats.employees)} · ${number.format(stats.hours)} h · ${currency.format(stats.earnings)}${stats.travelExpenses > 0 ? ` (vključuje ${currency.format(stats.travelExpenses)} potnih stroškov)` : ""}${sector.notes ? ` · ${sector.notes}` : ""}`;

  const sectorEmployees = state.employees.filter((employee) => Boolean(employee.sectors?.[sector.id]));
  if (sectorEmployees.length === 0) {
    $("#sectorDetailRows").innerHTML = `<tr><td colspan="7" class="empty-cell">V tem sektorju še ni zabeleženih ur za ta mesec</td></tr>`;
  } else {
    $("#sectorDetailRows").innerHTML = sectorEmployees
      .map((employee) => employeeRow(employee, true, sector.id))
      .join("");
  }
}

// ==========================================================================
// Calendar Component (Tedenski & Mesečni koledar ur)
// ==========================================================================
const SLO_DAY_NAMES = ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"];
const SLO_DAY_HEADERS = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];

function formatSloDateString(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  const dayName = SLO_DAY_NAMES[dateObj.getDay()];
  return `${dayName}, ${d}. ${SLO_MONTH_NAMES[m].toLowerCase()} ${y}`;
}

function getWeekBoundaries(dateObj) {
  const d = new Date(dateObj);
  const day = (d.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    days.push(dayDate);
  }

  const sunday = days[6];
  return { monday, sunday, days };
}

function renderCalendar() {
  const container = $("#calendarContainer");
  if (!container) return;

  const activeMode = state.calendarMode || "month";
  const calDate = state.calendarDate || new Date(currentDate);

  // Update Toggle Button active states
  $$(".cal-toggle-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.calMode === activeMode);
  });

  // Filter logs by selected sector and employee
  let filteredLogs = [...state.rawLogs];
  if (state.calSectorFilter && state.calSectorFilter !== "all") {
    filteredLogs = filteredLogs.filter((l) => l.sectorId === state.calSectorFilter);
  }
  if (state.calEmployeeFilter && state.calEmployeeFilter !== "all") {
    filteredLogs = filteredLogs.filter((l) => l.userId === state.calEmployeeFilter);
  }

  let periodLabel = "";
  let periodLogsForSummary = [];

  if (activeMode === "month") {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    periodLabel = `${SLO_MONTH_NAMES[month]} ${year}`;
    $("#calPeriodTitle").textContent = periodLabel;
    renderCalendarMonthView(container, calDate, filteredLogs);
    periodLogsForSummary = state.rawLogs.filter((l) => l.date.startsWith(monthKey));
  } else {
    const { monday, sunday, days } = getWeekBoundaries(calDate);
    const mStr = `${monday.getDate()}. ${SLO_MONTH_NAMES[monday.getMonth()].slice(0, 3)}.`;
    const sStr = `${sunday.getDate()}. ${SLO_MONTH_NAMES[sunday.getMonth()].slice(0, 3)}. ${sunday.getFullYear()}`;
    periodLabel = `${mStr} – ${sStr}`;
    $("#calPeriodTitle").textContent = periodLabel;
    renderCalendarWeekView(container, days, filteredLogs);

    const monDateStr = monday.toISOString().slice(0, 10);
    const sunDateStr = sunday.toISOString().slice(0, 10);
    periodLogsForSummary = state.rawLogs.filter((l) => l.date >= monDateStr && l.date <= sunDateStr);
  }

  // Render Employee Breakdown Summary Table under the calendar
  renderCalendarEmployeeSummary(periodLabel, periodLogsForSummary);
}

function renderCalendarEmployeeSummary(periodLabel, periodLogs) {
  const summaryTable = $("#calEmployeeSummaryTable");
  if (!summaryTable) return;

  $("#calSummaryTitle").textContent = `Obračun po zaposlenih (${periodLabel})`;

  // Filter employees if specific employee or sector filter is active
  let targetEmployees = [...state.employees];
  if (state.calEmployeeFilter && state.calEmployeeFilter !== "all") {
    targetEmployees = targetEmployees.filter((e) => e.id === state.calEmployeeFilter);
  }
  if (state.calSectorFilter && state.calSectorFilter !== "all") {
    targetEmployees = targetEmployees.filter((e) => Boolean(e.sectors?.[state.calSectorFilter]));
  }

  if (targetEmployees.length === 0) {
    summaryTable.innerHTML = `<tr><td colspan="8" class="empty-cell">Ni zaposlenih za izbrani filter</td></tr>`;
    return;
  }

  summaryTable.innerHTML = targetEmployees
    .map((employee) => {
      // Find logs of this employee for this period (optionally filtered by sector)
      let empLogs = periodLogs.filter((l) => l.userId === employee.id);
      if (state.calSectorFilter && state.calSectorFilter !== "all") {
        empLogs = empLogs.filter((l) => l.sectorId === state.calSectorFilter);
      }

      const totalHours = empLogs.reduce((sum, l) => sum + l.hours, 0);
      const totalTravel = empLogs.reduce((sum, l) => sum + (l.travelExpenses || 0), 0);
      const totalEarnings = empLogs.reduce((sum, l) => sum + l.earnings, 0);
      const unpaidEarnings = empLogs.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.earnings, 0);
      const isAllPaid = (totalHours > 0 || totalTravel > 0) ? unpaidEarnings === 0 : true;

      const employeeSectors = Object.values(employee.sectors || {});
      const sectorBadgesHTML = renderEmployeeSectorsList(employeeSectors, false);

      const rateDisplay = formatHourlyRate({ rate: employeeSectors[0]?.rate || 15, rates: employeeSectors.map((s) => ({ sectorName: s.sectorName, rate: s.rate })) }, employee);
      const travelDisplay = totalTravel > 0 ? currency.format(totalTravel) : `<span style="color: var(--muted);">-</span>`;

      return `
        <tr>
          <td><div class="person"><span class="avatar">${initials(employee.name)}</span><strong>${employee.name}</strong></div></td>
          <td>${sectorBadgesHTML}</td>
          <td><strong>${number.format(totalHours)} h</strong></td>
          <td>${rateDisplay}</td>
          <td>${travelDisplay}</td>
          <td><strong>${currency.format(totalEarnings)}</strong></td>
          <td>
            <strong style="color: ${unpaidEarnings > 0 ? "var(--amber)" : "var(--primary-dark);"}">
              ${currency.format(unpaidEarnings)}
            </strong>
          </td>
          <td>
            <span class="chip ${isAllPaid ? "" : "warning"}">
              ${isAllPaid ? "Izplačano" : "Za izplačilo"}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderCalendarMonthView(container, dateObj, logs) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Index logs by date "YYYY-MM-DD"
  const logsByDate = new Map();
  logs.forEach((log) => {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date).push(log);
  });

  let html = `<div class="cal-month-grid">`;

  // Headers PON - NED
  SLO_DAY_HEADERS.forEach((header) => {
    html += `<div class="cal-month-day-header">${header}</div>`;
  });

  // Previous month padding days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const prevMonthStr = String(month === 0 ? 12 : month).padStart(2, "0");
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${prevMonthStr}-${String(prevDayNum).padStart(2, "0")}`;
    const dayLogs = logsByDate.get(dateStr) || [];
    const totalDayHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);

    html += `
      <div class="cal-month-cell outside-month" onclick="openDayDetailModal('${dateStr}')">
        <div class="cal-cell-top">
          <span class="cal-day-num">${prevDayNum}</span>
          ${totalDayHours > 0 ? `<span class="cal-day-hours-badge">${number.format(totalDayHours)} h</span>` : ""}
        </div>
      </div>
    `;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dateStr = `${year}-${monthStr}-${String(d).padStart(2, "0")}`;
    const dayLogs = logsByDate.get(dateStr) || [];
    const totalDayHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
    const isToday = dateStr === todayStr;

    let shiftsHtml = "";
    if (dayLogs.length > 0) {
      const visibleLogs = dayLogs.slice(0, 3);
      shiftsHtml = visibleLogs
        .map((log) => {
          const color = log.color || "#56829d";
          const timeText = log.startTime && log.endTime ? ` (${log.startTime}-${log.endTime})` : "";
          return `
            <div class="cal-shift-pill" title="${log.userName} · ${log.sectorName} · ${log.hours}h${log.note ? ` (${log.note})` : ""}">
              <span class="cal-shift-pill-dot" style="background-color: ${color};"></span>
              <span class="cal-shift-emp">${log.userName}</span>
              <span class="cal-shift-hrs">${number.format(log.hours)}h</span>
            </div>
          `;
        })
        .join("");

      if (dayLogs.length > 3) {
        shiftsHtml += `<div class="cal-more-shifts">+${dayLogs.length - 3} več</div>`;
      }
    }

    html += `
      <div class="cal-month-cell ${isToday ? "is-today" : ""}" onclick="openDayDetailModal('${dateStr}')">
        <div class="cal-cell-top">
          <span class="cal-day-num" style="${totalDayHours > 0 ? "color: var(--primary-dark);" : ""}">${d}</span>
          ${totalDayHours > 0 ? `<span class="cal-day-hours-badge">${number.format(totalDayHours)} h</span>` : ""}
        </div>
        <div class="cal-cell-shifts">
          ${shiftsHtml}
        </div>
      </div>
    `;
  }

  // Next month padding days to round up full grid (35 or 42 cells)
  const totalCells = firstDayOfWeek + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthStr = String(month === 11 ? 1 : month + 2).padStart(2, "0");
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${nextMonthStr}-${String(d).padStart(2, "0")}`;
    const dayLogs = logsByDate.get(dateStr) || [];
    const totalDayHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);

    html += `
      <div class="cal-month-cell outside-month" onclick="openDayDetailModal('${dateStr}')">
        <div class="cal-cell-top">
          <span class="cal-day-num">${d}</span>
          ${totalDayHours > 0 ? `<span class="cal-day-hours-badge">${number.format(totalDayHours)} h</span>` : ""}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function renderCalendarWeekView(container, days, logs) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Index logs by date
  const logsByDate = new Map();
  logs.forEach((log) => {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date).push(log);
  });

  let html = `<div class="cal-week-grid">`;

  days.forEach((dayDate, idx) => {
    const y = dayDate.getFullYear();
    const m = String(dayDate.getMonth() + 1).padStart(2, "0");
    const d = String(dayDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const dayLogs = logsByDate.get(dateStr) || [];
    const totalDayHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
    const isToday = dateStr === todayStr;

    let shiftsHtml = "";
    if (dayLogs.length === 0) {
      shiftsHtml = `<div class="cal-empty-day-placeholder">Ni vpisanih ur</div>`;
    } else {
      shiftsHtml = dayLogs
        .map((log) => {
          const color = log.color || "#56829d";
          const timeInterval = log.startTime && log.endTime ? `${log.startTime} – ${log.endTime}` : "Čas ni specificiran";
          return `
            <article class="cal-week-shift-card" onclick="openDayDetailModal('${dateStr}')">
              <div class="cal-week-shift-header">
                <span class="avatar" style="width: 28px; height: 28px; font-size: 11px;">${initials(log.userName)}</span>
                <div style="min-width: 0; flex: 1;">
                  <strong style="font-size: 13px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${log.userName}</strong>
                  <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35; font-size: 10px; padding: 1px 6px;">
                    <span class="sector-color-dot" style="background-color: ${color}; width: 6px; height: 6px;"></span>
                    ${log.sectorName}
                  </span>
                </div>
              </div>

              <div class="cal-shift-time-badge">
                <span>🕒</span>
                <span>${timeInterval}</span>
              </div>

              <div class="cal-shift-stats-row">
                <span class="cal-shift-hours-text">⚡ ${number.format(log.hours)} h</span>
                <span class="cal-shift-earnings-text">${currency.format(log.earnings)}</span>
              </div>

              ${log.note ? `<div class="cal-shift-note-box">💬 ${log.note}</div>` : ""}

              <div>
                <span class="chip ${log.isPaid ? "" : "warning"}" style="font-size: 10px; min-height: 20px; padding: 2px 6px;">
                  ${log.isPaid ? "Izplačano" : "Ni izplačano"}
                </span>
              </div>
            </article>
          `;
        })
        .join("");
    }

    html += `
      <div class="cal-week-col ${isToday ? "is-today" : ""}">
        <div class="cal-week-header">
          <span class="cal-week-day-name">${SLO_DAY_HEADERS[idx]}</span>
          <div class="cal-week-date-row">
            <span class="cal-week-date-num">${dayDate.getDate()}. ${SLO_MONTH_NAMES[dayDate.getMonth()].slice(0, 3)}</span>
            ${totalDayHours > 0 ? `<span class="cal-week-hours-badge">${number.format(totalDayHours)} h</span>` : ""}
          </div>
        </div>
        <div class="cal-week-body">
          ${shiftsHtml}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// Modal for detailed daily log view
window.openDayDetailModal = function (dateStr) {
  const modal = $("#dayDetailModal");
  if (!modal) return;

  const dayLogs = state.rawLogs.filter((l) => l.date === dateStr);
  const formattedDate = formatSloDateString(dateStr);
  const totalHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalEarnings = dayLogs.reduce((sum, l) => sum + l.earnings, 0);

  $("#dayDetailModalTitle").textContent = formattedDate;
  $("#dayDetailModalSubtitle").textContent = `${dayLogs.length} ${dayLogs.length === 1 ? "vnos" : "vnosov"} · ${number.format(totalHours)} h · ${currency.format(totalEarnings)}`;

  const contentEl = $("#dayDetailModalContent");
  if (dayLogs.length === 0) {
    contentEl.innerHTML = `<p class="empty-state" style="padding: 24px;">Za ta dan ni zabeleženih delovnih ur v nobenem sektorju.</p>`;
  } else {
    contentEl.innerHTML = dayLogs
      .map((log) => {
        const color = log.color || "#56829d";
        const timeInterval = log.startTime && log.endTime ? `${log.startTime} – ${log.endTime}` : "Celodnevno / Čas ni vpisan";
        return `
          <article class="day-detail-shift-card">
            <div class="day-detail-shift-top">
              <div class="person">
                <span class="avatar">${initials(log.userName)}</span>
                <div>
                  <strong style="font-size: 15px;">${log.userName}</strong>
                  <div style="margin-top: 4px;">
                    <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35;">
                      <span class="sector-color-dot" style="background-color: ${color};"></span>
                      ${log.sectorName} · ${log.sectorCode}
                    </span>
                  </div>
                </div>
              </div>
              <label class="paid-toggle" onclick="event.stopPropagation();">
                <input type="checkbox" data-log-paid-id="${log.id}" ${log.isPaid ? "checked" : ""} />
                ${paidChip(log.isPaid)}
              </label>
            </div>

            <div class="day-detail-grid">
              <div class="day-detail-stat">
                <p>Delovni čas</p>
                <strong>${timeInterval}</strong>
              </div>
              <div class="day-detail-stat">
                <p>Število ur</p>
                <strong>${number.format(log.hours)} h</strong>
              </div>
              <div class="day-detail-stat">
                <p>Urna postavka</p>
                <strong>${currency.format(log.rate)}/h</strong>
              </div>
              <div class="day-detail-stat">
                <p>Potni stroški</p>
                <strong>${currency.format(log.travelExpenses || 0)}</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--line);">
              <div style="font-size: 13px; color: var(--ink);">
                ${log.note ? `<strong>Opomba:</strong> <em>${log.note}</em>` : `<span style="color: var(--muted);">Brez opomb</span>`}
              </div>
              <div style="font-size: 16px; font-weight: 800; color: var(--primary-dark);">
                ${currency.format(log.earnings)}
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.hidden = false;
  }
};

// ==========================================================================
// Urnik (Shift Scheduler) Implementation
// ==========================================================================
function initDefaultScheduleShifts() {
  if (!state.scheduleShifts || state.scheduleShifts.length === 0) {
    const emp = state.employees[0] || { id: "emp_1", name: "Filip Kolle" };
    const sec1 = state.sectors[0] || { id: "sec_1", name: "Postojna", color: "#56829d" };
    const sec2 = state.sectors[1] || { id: "sec_2", name: "Divino", color: "#0284c7" };
    const sec3 = state.sectors[2] || { id: "sec_3", name: "Mokrice", color: "#7c3aed" };

    state.scheduleShifts = [
      {
        id: "shift_1",
        userId: emp.id,
        userName: emp.name,
        sectorId: sec1.id,
        sectorName: sec1.name,
        color: sec1.color || "#56829d",
        date: "2026-08-08",
        startTime: "08:00",
        endTime: "16:00",
        hours: 8,
        note: "Dopoldanska izmena",
      },
      {
        id: "shift_2",
        userId: emp.id,
        userName: emp.name,
        sectorId: sec2.id,
        sectorName: sec2.name,
        color: sec2.color || "#0284c7",
        date: "2026-08-14",
        startTime: "14:00",
        endTime: "22:00",
        hours: 8,
        note: "Strežba terasa",
      },
      {
        id: "shift_3",
        userId: emp.id,
        userName: emp.name,
        sectorId: sec3.id,
        sectorName: sec3.name,
        color: sec3.color || "#7c3aed",
        date: "2026-08-23",
        startTime: "08:00",
        endTime: "16:00",
        hours: 8,
        note: "Glavna izmena",
      },
      {
        id: "shift_4",
        userId: emp.id,
        userName: emp.name,
        sectorId: sec3.id,
        sectorName: sec3.name,
        color: sec3.color || "#7c3aed",
        date: "2026-08-28",
        startTime: "08:00",
        endTime: "17:00",
        hours: 9,
        note: "Priprava in delo",
      },
    ];
    localStorage.setItem("4p_schedule_shifts", JSON.stringify(state.scheduleShifts));
  }
}

function renderSchedule() {
  const container = $("#scheduleContainer");
  if (!container) return;

  initDefaultScheduleShifts();

  const activeMode = state.scheduleMode || "month";
  const schedDate = state.scheduleDate || new Date(currentDate);

  // Update Toggle Button active states
  $$("[data-schedule-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.scheduleMode === activeMode);
  });

  // Render Sector Pills (Delovna mesta)
  renderScheduleSectorPills();

  // Populate Employee Filter Dropdown
  const empSelect = $("#scheduleEmployeeFilter");
  if (empSelect) {
    const currentVal = state.scheduleEmployeeFilter || "all";
    empSelect.innerHTML = `
      <option value="all" ${currentVal === "all" ? "selected" : ""}>Vsi zaposleni</option>
      ${state.employees
        .map((e) => `<option value="${e.id}" ${currentVal === e.id ? "selected" : ""}>${e.name}</option>`)
        .join("")}
    `;
  }

  // Filter Shifts
  let filteredShifts = [...(state.scheduleShifts || [])];
  if (state.scheduleSectorFilter && state.scheduleSectorFilter !== "all") {
    filteredShifts = filteredShifts.filter((s) => s.sectorId === state.scheduleSectorFilter);
  }
  if (state.scheduleEmployeeFilter && state.scheduleEmployeeFilter !== "all") {
    filteredShifts = filteredShifts.filter((s) => s.userId === state.scheduleEmployeeFilter);
  }

  let periodShifts = [];

  if (activeMode === "month") {
    const year = schedDate.getFullYear();
    const month = schedDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const periodLabel = `${SLO_MONTH_NAMES[month]} ${year}`;
    if ($("#schedulePeriodTitle")) $("#schedulePeriodTitle").textContent = periodLabel;
    renderScheduleMonthView(container, schedDate, filteredShifts);
    periodShifts = filteredShifts.filter((s) => s.date.startsWith(monthKey));
  } else {
    const { monday, sunday, days } = getWeekBoundaries(schedDate);
    const mStr = `${monday.getDate()}. ${SLO_MONTH_NAMES[monday.getMonth()].slice(0, 3)}.`;
    const sStr = `${sunday.getDate()}. ${SLO_MONTH_NAMES[sunday.getMonth()].slice(0, 3)}. ${sunday.getFullYear()}`;
    const periodLabel = `${mStr} – ${sStr}`;
    if ($("#schedulePeriodTitle")) $("#schedulePeriodTitle").textContent = periodLabel;
    renderScheduleWeekView(container, days, filteredShifts);

    const monDateStr = monday.toISOString().slice(0, 10);
    const sunDateStr = sunday.toISOString().slice(0, 10);
    periodShifts = filteredShifts.filter((s) => s.date >= monDateStr && s.date <= sunDateStr);
  }

  // Update Summary Stats
  const totalHours = periodShifts.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
  const totalShiftsCount = periodShifts.length;
  const uniqueEmps = new Set(periodShifts.map((s) => s.userId)).size;

  if ($("#scheduleTotalHours")) $("#scheduleTotalHours").textContent = `${number.format(totalHours)} h`;
  if ($("#scheduleTotalShifts")) $("#scheduleTotalShifts").textContent = totalShiftsCount;
  if ($("#scheduleActiveEmployees")) $("#scheduleActiveEmployees").textContent = uniqueEmps;
}

function renderScheduleSectorPills() {
  const container = $("#scheduleSectorPills");
  if (!container) return;

  if (state.sectors.length === 0) {
    container.innerHTML = `<span style="font-size: 12px; color: var(--muted);">Ni delovnih mest</span>`;
    return;
  }

  if (state.sectors.length === 1) {
    const sec = state.sectors[0];
    const color = sec.color || "#56829d";
    container.innerHTML = `
      <div class="schedule-sector-pill active">
        <span class="schedule-sector-pill-dot" style="background-color: ${color};"></span>
        <span>${sec.name}</span>
      </div>
    `;
    return;
  }

  const activeSector = state.scheduleSectorFilter || "all";
  let html = `
    <button type="button" class="schedule-sector-pill ${activeSector === "all" ? "active" : ""}" onclick="setScheduleSectorFilter('all')">
      <span>Vsa delovna mesta</span>
    </button>
  `;

  state.sectors.forEach((sec) => {
    const color = sec.color || "#56829d";
    const isActive = activeSector === sec.id;
    html += `
      <button type="button" class="schedule-sector-pill ${isActive ? "active" : ""}" onclick="setScheduleSectorFilter('${sec.id}')">
        <span class="schedule-sector-pill-dot" style="background-color: ${color};"></span>
        <span>${sec.name}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

window.setScheduleSectorFilter = function (sectorId) {
  state.scheduleSectorFilter = sectorId;
  renderSchedule();
};

function renderScheduleMonthView(container, dateObj, shifts) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1);
  const startDayIndex = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const shiftsByDate = new Map();
  shifts.forEach((shift) => {
    if (!shiftsByDate.has(shift.date)) shiftsByDate.set(shift.date, []);
    shiftsByDate.get(shift.date).push(shift);
  });

  let html = `<div class="cal-month-grid">`;
  SLO_DAY_HEADERS.forEach((dayHeader) => {
    html += `<div class="cal-month-day-header">${dayHeader}</div>`;
  });

  // Previous month trailing days
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    html += `
      <div class="schedule-month-cell outside-month">
        <div class="schedule-cell-top">
          <span class="cal-day-num">${dayNum}</span>
        </div>
      </div>
    `;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayShifts = shiftsByDate.get(dateStr) || [];
    const totalDayHours = dayShifts.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    const isToday = dateStr === todayStr;

    let shiftsHtml = "";
    if (dayShifts.length > 0) {
      shiftsHtml = dayShifts
        .map((s) => {
          const color = s.color || "#56829d";
          return `
            <div class="schedule-shift-chip" style="border-left-color: ${color};" onclick="event.stopPropagation(); openShiftModal('${s.id}')" title="Kliknite za urejanje izmene">
              <div class="schedule-shift-chip-top">
                <span class="schedule-shift-chip-emp">${s.userName}</span>
                <span class="schedule-shift-chip-time">${s.startTime}–${s.endTime}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span class="schedule-shift-chip-sector" style="color: ${color};">● ${s.sectorName}</span>
                <span style="font-size: 10px; font-weight: 700; color: var(--ink);">${number.format(s.hours)}h</span>
              </div>
              ${s.note ? `<span style="font-size: 10px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.note}</span>` : ""}
            </div>
          `;
        })
        .join("");
    }

    html += `
      <div class="schedule-month-cell ${isToday ? "is-today" : ""}" onclick="openShiftModal(null, '${dateStr}')">
        <div class="schedule-cell-top">
          <span class="cal-day-num">${d}</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            ${totalDayHours > 0 ? `<span class="cal-day-hours-badge">${number.format(totalDayHours)} h</span>` : ""}
            <button type="button" class="schedule-quick-add-btn" onclick="event.stopPropagation(); openShiftModal(null, '${dateStr}')" title="Dodaj izmeno za ta dan">+</button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto;">
          ${shiftsHtml}
        </div>
      </div>
    `;
  }

  // Next month trailing days
  const totalCells = startDayIndex + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    html += `
      <div class="schedule-month-cell outside-month">
        <div class="schedule-cell-top">
          <span class="cal-day-num">${n}</span>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function renderScheduleWeekView(container, days, shifts) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const shiftsByDate = new Map();
  shifts.forEach((shift) => {
    if (!shiftsByDate.has(shift.date)) shiftsByDate.set(shift.date, []);
    shiftsByDate.get(shift.date).push(shift);
  });

  let html = `<div class="cal-week-grid">`;

  days.forEach((dayDate, idx) => {
    const y = dayDate.getFullYear();
    const m = String(dayDate.getMonth() + 1).padStart(2, "0");
    const d = String(dayDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const dayShifts = shiftsByDate.get(dateStr) || [];
    const totalDayHours = dayShifts.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    const isToday = dateStr === todayStr;

    let shiftsHtml = "";
    if (dayShifts.length === 0) {
      shiftsHtml = `<div class="cal-empty-day-placeholder" style="padding: 18px 8px; font-size: 11px;">Ni načrtovanih izmen</div>`;
    } else {
      shiftsHtml = dayShifts
        .map((s) => {
          const color = s.color || "#56829d";
          return `
            <article class="schedule-week-shift-card" style="border-left-color: ${color};" onclick="openShiftModal('${s.id}')">
              <div class="schedule-week-shift-emp-row">
                <div class="schedule-week-shift-emp">
                  <span class="avatar" style="width: 26px; height: 26px; font-size: 10px;">${initials(s.userName)}</span>
                  <span>${s.userName}</span>
                </div>
                <span class="schedule-week-shift-time-badge">
                  ${s.startTime} – ${s.endTime}
                </span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 2px;">
                <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35; font-size: 10px; padding: 1px 6px;">
                  <span class="sector-color-dot" style="background-color: ${color}; width: 6px; height: 6px;"></span>
                  ${s.sectorName}
                </span>
                <strong style="font-size: 12px; color: var(--ink);">${number.format(s.hours)} ur</strong>
              </div>

              ${s.note ? `<div class="cal-shift-note-box" style="margin-top: 2px; font-size: 11px;">${s.note}</div>` : ""}
            </article>
          `;
        })
        .join("");
    }

    html += `
      <div class="cal-week-col ${isToday ? "is-today" : ""}">
        <div class="cal-week-header">
          <span class="cal-week-day-name">${SLO_DAY_HEADERS[idx]}</span>
          <div class="cal-week-date-row">
            <span class="cal-week-date-num">${dayDate.getDate()}. ${SLO_MONTH_NAMES[dayDate.getMonth()].slice(0, 3)}</span>
            ${totalDayHours > 0 ? `<span class="cal-week-hours-badge">${number.format(totalDayHours)} h</span>` : ""}
          </div>
        </div>
        <div class="cal-week-body" style="display: flex; flex-direction: column; gap: 8px;">
          ${shiftsHtml}
          <button type="button" class="schedule-week-add-btn" onclick="openShiftModal(null, '${dateStr}')">
            <span>+</span> Dodaj izmeno
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// Modal open/close and presets for Shift Planner
window.openShiftModal = function (shiftId = null, defaultDate = null, defaultSectorId = null) {
  const modal = $("#shiftModal");
  if (!modal) return;

  const titleEl = $("#shiftModalTitle");
  const form = $("#shiftModalForm");
  const idInput = $("#modalShiftId");
  const empSelect = $("#modalShiftEmployee");
  const secSelect = $("#modalShiftSector");
  const dateInput = $("#modalShiftDate");
  const startInput = $("#modalShiftStartTime");
  const endInput = $("#modalShiftEndTime");
  const noteInput = $("#modalShiftNote");
  const deleteBtn = $("#deleteShiftBtn");

  // Populate Employee Select
  empSelect.innerHTML = `
    <option value="">Izberite zaposlenega...</option>
    ${state.employees
      .map((e) => `<option value="${e.id}">${e.name}</option>`)
      .join("")}
  `;

  // Populate Sector Select
  secSelect.innerHTML = `
    <option value="">Izberite sektor...</option>
    ${state.sectors
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("")}
  `;

  if (shiftId) {
    // Edit Mode
    const shift = (state.scheduleShifts || []).find((s) => s.id === shiftId);
    if (!shift) return;

    if (titleEl) titleEl.textContent = "Uredi izmeno na urniku";
    if (idInput) idInput.value = shift.id;
    if (empSelect) empSelect.value = shift.userId;
    if (secSelect) secSelect.value = shift.sectorId;
    if (dateInput) dateInput.value = shift.date;
    if (startInput) startInput.value = shift.startTime || "08:00";
    if (endInput) endInput.value = shift.endTime || "16:00";
    if (noteInput) noteInput.value = shift.note || "";
    if (deleteBtn) deleteBtn.style.display = "inline-flex";
  } else {
    // Add Mode
    if (titleEl) titleEl.textContent = "Dodaj zaposlenega na urnik";
    if (idInput) idInput.value = "";
    if (empSelect) {
      empSelect.value = state.employees.length > 0 ? state.employees[0].id : "";
    }
    if (secSelect) {
      if (defaultSectorId && defaultSectorId !== "all") {
        secSelect.value = defaultSectorId;
      } else if (state.scheduleSectorFilter && state.scheduleSectorFilter !== "all") {
        secSelect.value = state.scheduleSectorFilter;
      } else if (state.sectors.length > 0) {
        secSelect.value = state.sectors[0].id;
      }
    }
    if (dateInput) {
      if (defaultDate) {
        dateInput.value = defaultDate;
      } else {
        const d = state.scheduleDate || currentDate;
        dateInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      }
    }
    if (startInput) startInput.value = "08:00";
    if (endInput) endInput.value = "16:00";
    if (noteInput) noteInput.value = "";
    if (deleteBtn) deleteBtn.style.display = "none";
  }

  updateShiftDurationDisplay();

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.hidden = false;
  }
};

window.closeShiftModal = function () {
  const modal = $("#shiftModal");
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.hidden = true;
  }
};

function updateShiftDurationDisplay() {
  const start = $("#modalShiftStartTime")?.value;
  const end = $("#modalShiftEndTime")?.value;
  const dur = calculateShiftDuration(start, end);
  const durEl = $("#shiftCalcDuration");
  if (durEl) durEl.textContent = `${number.format(dur)} ur`;
}

function calculateShiftDuration(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
}

window.setShiftPreset = function (startTime, endTime) {
  const startInput = $("#modalShiftStartTime");
  const endInput = $("#modalShiftEndTime");
  if (startInput) startInput.value = startTime;
  if (endInput) endInput.value = endTime;
  updateShiftDurationDisplay();
};

window.handleDeleteShiftModal = function () {
  const id = $("#modalShiftId")?.value;
  if (!id) return;
  if (confirm("Ali ste prepričani, da želite izbrisati to izmeno z urnika?")) {
    state.scheduleShifts = (state.scheduleShifts || []).filter((s) => s.id !== id);
    localStorage.setItem("4p_schedule_shifts", JSON.stringify(state.scheduleShifts));
    closeShiftModal();
    renderSchedule();
  }
};

function renderAll() {
  initDefaultScheduleShifts();
  renderOverview();
  renderSectors();
  renderFilters();
  renderEmployees();
  renderCalendar();
  renderSchedule();
  renderSettings();
  renderPendingRequestsNotification();
}

function switchView(view) {
  state.activeView = view;
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  $(`#${view}View`)?.classList.add("active");
  $(`[data-view="${view}"]`)?.classList.add("active");
  
  const viewTitle = $(`[data-view="${view}"] span:last-child`)?.textContent || "Dashboard";
  $("#pageTitle").textContent = viewTitle;

  const addSectorBtn = $("#openSectorModal");
  const pageDesc = $("#pageDescription");

  const topbarMonthSwitcher = $(".month-switcher");
  if (topbarMonthSwitcher) {
    topbarMonthSwitcher.style.display = (view === "calendar" || view === "schedule") ? "none" : "flex";
  }

  if (view === "sectors") {
    if (addSectorBtn) addSectorBtn.style.display = "inline-flex";
    if (pageDesc) {
      pageDesc.textContent = "Ustvari sektorje in spremljaj rezultate za vsak del podjetja.";
      pageDesc.style.display = "block";
    }
  } else if (view === "schedule") {
    if (addSectorBtn) addSectorBtn.style.display = "none";
    if (pageDesc) {
      pageDesc.textContent = "Ustvarjanje in prilagajanje urnika delovnih izmen po delovnih mestih.";
      pageDesc.style.display = "block";
    }
    renderSchedule();
  } else if (view === "calendar") {
    if (addSectorBtn) addSectorBtn.style.display = "none";
    if (pageDesc) {
      pageDesc.textContent = "Dnevni pregled zabeleženih ur zaposlenih v tedenskem in mesečnem pogledu.";
      pageDesc.style.display = "block";
    }
    renderCalendar();
  } else {
    if (addSectorBtn) addSectorBtn.style.display = "none";
    if (pageDesc) pageDesc.style.display = "none";
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Modal and color picker management
const sectorModal = $("#sectorModal");
const modalColorInput = $("#modalSectorColor");
const selectedColorHex = $("#selectedColorHex");
const colorSwatches = $$(".color-swatch");

function setSelectedColor(color) {
  if (modalColorInput) modalColorInput.value = color;
  if (selectedColorHex) selectedColorHex.textContent = color.toUpperCase();
  colorSwatches.forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color.toLowerCase() === color.toLowerCase());
  });
}

colorSwatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    setSelectedColor(swatch.dataset.color);
  });
});

if (modalColorInput) {
  modalColorInput.addEventListener("input", (e) => {
    setSelectedColor(e.target.value);
  });
}

function openSectorModalDialog() {
  $("#modalSectorName").value = "";
  $("#modalSectorNotes").value = "";
  setSelectedColor("#56829d");
  if (typeof sectorModal.showModal === "function") {
    sectorModal.showModal();
  } else {
    sectorModal.setAttribute("open", "");
  }
}

function closeSectorModalDialog() {
  if (typeof sectorModal.close === "function") {
    sectorModal.close();
  } else {
    sectorModal.removeAttribute("open");
  }
}

$("#openSectorModal")?.addEventListener("click", openSectorModalDialog);
$("#closeSectorModal")?.addEventListener("click", closeSectorModalDialog);
$("#cancelSectorModal")?.addEventListener("click", closeSectorModalDialog);

sectorModal?.addEventListener("click", (event) => {
  if (event.target === sectorModal) {
    closeSectorModalDialog();
  }
});

// Create sector & workplace in Supabase
$("#sectorModalForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nameInput = $("#modalSectorName");
  const name = nameInput.value.trim();
  if (!name) return;

  const color = modalColorInput ? modalColorInput.value : "#56829d";
  const notes = $("#modalSectorNotes") ? $("#modalSectorNotes").value.trim() : "";
  const code = generateSectorCode();
  const id = `${slugify(name)}-${Date.now().toString(36)}`;

  // Optimistic instant UI update
  state.sectors.push({ id, name, color, notes, code });
  closeSectorModalDialog();
  renderAll();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("workplaces").insert([
        {
          name: name,
          sector_name: name,
          sector_color: color,
          sector_notes: notes,
          join_code: code,
        },
      ]).select();

      if (error) {
        console.error("Supabase insert workplace error:", error);
        alert(`Napaka pri shranjevanju sektorja v bazo: ${error.message}`);
      } else {
        await loadAllData();
      }
    } catch (e) {
      console.log("Supabase insert exception:", e);
    }
  }
});

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) switchView(nav.dataset.view);

  const sectorButton = event.target.closest("[data-sector-id]");
  if (sectorButton) renderSectorDetail(sectorButton.dataset.sectorId);
});

document.addEventListener("change", async (event) => {
  // 1. Toggle single daily work log payment status
  const logPaidToggle = event.target.closest("[data-log-paid-id]");
  if (logPaidToggle) {
    const logId = logPaidToggle.dataset.logPaidId;
    const isPaid = logPaidToggle.checked;

    const targetLog = state.rawLogs.find((l) => l.id === logId);
    if (targetLog) {
      targetLog.isPaid = isPaid;
      const monthKey = targetLog.date.slice(0, 7);
      const emp = state.employees.find((e) => e.id === targetLog.userId);

      if (emp) {
        const empMonthLogs = state.rawLogs.filter((l) => l.userId === emp.id && l.date.startsWith(monthKey));
        const allEmpPaid = empMonthLogs.every((l) => l.isPaid);
        if (!emp.paid) emp.paid = {};
        emp.paid[monthKey] = allEmpPaid;

        if (emp.sectors && emp.sectors[targetLog.sectorId]) {
          const secMonthLogs = empMonthLogs.filter((l) => l.sectorId === targetLog.sectorId);
          const allSecPaid = secMonthLogs.every((l) => l.isPaid);
          if (!emp.sectors[targetLog.sectorId].paid) emp.sectors[targetLog.sectorId].paid = {};
          emp.sectors[targetLog.sectorId].paid[monthKey] = allSecPaid;
        }
      }
    }

    renderAll();

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from("work_logs")
          .update({ is_paid: isPaid })
          .eq("id", logId);

        if (error) {
          console.error("Napaka pri shranjevanju statusa izplačila vnosa:", error);
        }
      } catch (err) {
        console.error("Exception pri posodobitvi is_paid:", err);
      }
    }
    return;
  }

  // 2. Toggle entire employee monthly payout status
  const paidToggle = event.target.closest("[data-paid-id]");
  if (paidToggle) {
    const empId = paidToggle.dataset.paidId;
    const isPaid = paidToggle.checked;
    const monthKey = activeMonth().key;
    const employee = state.employees.find((item) => item.id === empId);
    if (!employee) return;

    if (!employee.paid) employee.paid = {};
    employee.paid[monthKey] = isPaid;

    // Update all rawLogs for this employee in the active month
    const empMonthLogs = state.rawLogs.filter((l) => l.userId === empId && l.date.startsWith(monthKey));
    empMonthLogs.forEach((l) => {
      l.isPaid = isPaid;
    });

    Object.values(employee.sectors || {}).forEach((sec) => {
      if (!sec.paid) sec.paid = {};
      sec.paid[monthKey] = isPaid;
    });

    renderAll();

    if (supabaseClient && empMonthLogs.length > 0) {
      try {
        const logIds = empMonthLogs.map((l) => l.id);
        const { error } = await supabaseClient
          .from("work_logs")
          .update({ is_paid: isPaid })
          .in("id", logIds);

        if (error) {
          console.error("Napaka pri skupinskem shranjevanju izplačila:", error);
        }
      } catch (err) {
        console.error("Exception pri skupinskem is_paid:", err);
      }
    }
  }
});

// Unlimited Month Navigation
$("#prevMonth")?.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderAll();
});

$("#nextMonth")?.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderAll();
});

$("#closeSectorDetail")?.addEventListener("click", () => {
  $("#sectorDetail").hidden = true;
});

$("#employeeSearch")?.addEventListener("input", renderEmployees);
$("#sectorFilter")?.addEventListener("change", renderEmployees);

// Save Company Profile Settings Form
$("#companyForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const alertEl = $("#accountAlert");
  const newCompanyName = $("#companyName").value.trim();
  if (!newCompanyName) return;

  state.companyName = newCompanyName;
  localStorage.setItem("4p_company_name", newCompanyName);

  if (state.currentUser) {
    await syncEmployerProfile(state.currentUser, newCompanyName);
  }

  if (alertEl) {
    alertEl.className = "auth-alert success";
    alertEl.textContent = "Podatki podjetja so bili uspešno posodobljeni.";
    alertEl.hidden = false;
    setTimeout(() => { alertEl.hidden = true; }, 4000);
  }

  renderSettings();
  renderOverview();
});

// Add Custom Status Form
$("#addStatusForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#newStatusInput");
  if (input && input.value.trim()) {
    handleAddCustomStatus(input.value.trim());
    input.value = "";
  }
});

// Update Password Form
$("#passwordForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const alertEl = $("#passwordAlert");
  const newPassword = $("#newPassword").value;
  const confirmPassword = $("#confirmNewPassword").value;

  if (newPassword !== confirmPassword) {
    if (alertEl) {
      alertEl.className = "auth-alert error";
      alertEl.textContent = "Gesli se ne ujemata. Prosimo, preverite vnos.";
      alertEl.hidden = false;
    }
    return;
  }

  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (alertEl) {
        alertEl.className = "auth-alert error";
        alertEl.textContent = `Napaka pri posodobitvi gesla: ${error.message}`;
        alertEl.hidden = false;
      }
    } else {
      $("#newPassword").value = "";
      $("#confirmNewPassword").value = "";
      if (alertEl) {
        alertEl.className = "auth-alert success";
        alertEl.textContent = "Geslo računa je bilo uspešno posodobljeno.";
        alertEl.hidden = false;
        setTimeout(() => { alertEl.hidden = true; }, 4000);
      }
    }
  } catch (err) {
    if (alertEl) {
      alertEl.className = "auth-alert error";
      alertEl.textContent = "Prišlo je do napake pri posodobitvi gesla.";
      alertEl.hidden = false;
    }
  }
});

// ==========================================================================
// Calendar Event Listeners & Controls
// ==========================================================================
$$(".cal-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.calendarMode = btn.dataset.calMode;
    renderCalendar();
  });
});

$("#calSectorFilter")?.addEventListener("change", (e) => {
  state.calSectorFilter = e.target.value;
  renderCalendar();
});

$("#calEmployeeFilter")?.addEventListener("change", (e) => {
  state.calEmployeeFilter = e.target.value;
  renderCalendar();
});

$("#calPrevBtn")?.addEventListener("click", () => {
  const d = new Date(state.calendarDate || currentDate);
  if (state.calendarMode === "week") {
    d.setDate(d.getDate() - 7);
  } else {
    d.setMonth(d.getMonth() - 1);
  }
  state.calendarDate = d;
  renderCalendar();
});

$("#calNextBtn")?.addEventListener("click", () => {
  const d = new Date(state.calendarDate || currentDate);
  if (state.calendarMode === "week") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  state.calendarDate = d;
  renderCalendar();
});

$("#calTodayBtn")?.addEventListener("click", () => {
  state.calendarDate = new Date();
  renderCalendar();
});

// Day detail modal close
const dayModal = $("#dayDetailModal");
$("#closeDayDetailModal")?.addEventListener("click", () => {
  if (dayModal) {
    if (typeof dayModal.close === "function") dayModal.close();
    else dayModal.hidden = true;
  }
});
$("#closeDayDetailModalBtn")?.addEventListener("click", () => {
  if (dayModal) {
    if (typeof dayModal.close === "function") dayModal.close();
    else dayModal.hidden = true;
  }
});

// Schedule Event Listeners & Controls
// ==========================================================================
$$("[data-schedule-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scheduleMode = btn.dataset.scheduleMode;
    renderSchedule();
  });
});

$("#scheduleEmployeeFilter")?.addEventListener("change", (e) => {
  state.scheduleEmployeeFilter = e.target.value;
  renderSchedule();
});

$("#schedulePrevBtn")?.addEventListener("click", () => {
  const d = new Date(state.scheduleDate || currentDate);
  if (state.scheduleMode === "week") {
    d.setDate(d.getDate() - 7);
  } else {
    d.setMonth(d.getMonth() - 1);
  }
  state.scheduleDate = d;
  renderSchedule();
});

$("#scheduleNextBtn")?.addEventListener("click", () => {
  const d = new Date(state.scheduleDate || currentDate);
  if (state.scheduleMode === "week") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  state.scheduleDate = d;
  renderSchedule();
});

$("#scheduleTodayBtn")?.addEventListener("click", () => {
  state.scheduleDate = new Date();
  renderSchedule();
});

$("#modalShiftStartTime")?.addEventListener("input", updateShiftDurationDisplay);
$("#modalShiftEndTime")?.addEventListener("input", updateShiftDurationDisplay);

$("#shiftModalForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const idInput = $("#modalShiftId");
  const empSelect = $("#modalShiftEmployee");
  const secSelect = $("#modalShiftSector");
  const dateInput = $("#modalShiftDate");
  const startInput = $("#modalShiftStartTime");
  const endInput = $("#modalShiftEndTime");
  const noteInput = $("#modalShiftNote");

  const userId = empSelect.value;
  const sectorId = secSelect.value;
  const date = dateInput.value;
  const startTime = startInput.value;
  const endTime = endInput.value;
  const note = noteInput.value.trim();

  if (!userId || !sectorId || !date || !startTime || !endTime) {
    alert("Prosimo, izpolnite vsa obvezna polja.");
    return;
  }

  const emp = state.employees.find((item) => item.id === userId);
  const sec = state.sectors.find((item) => item.id === sectorId);
  const userName = emp ? emp.name : "Zaposleni";
  const sectorName = sec ? sec.name : "Sektor";
  const color = sec ? sec.color || "#56829d" : "#56829d";
  const hours = calculateShiftDuration(startTime, endTime);

  const existingId = idInput.value;
  if (!state.scheduleShifts) state.scheduleShifts = [];

  if (existingId) {
    // Update existing shift
    const idx = state.scheduleShifts.findIndex((s) => s.id === existingId);
    if (idx !== -1) {
      state.scheduleShifts[idx] = {
        id: existingId,
        userId,
        userName,
        sectorId,
        sectorName,
        color,
        date,
        startTime,
        endTime,
        hours,
        note,
      };
    }
  } else {
    // Create new shift
    const newShift = {
      id: "shift_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      userId,
      userName,
      sectorId,
      sectorName,
      color,
      date,
      startTime,
      endTime,
      hours,
      note,
    };
    state.scheduleShifts.push(newShift);
  }

  localStorage.setItem("4p_schedule_shifts", JSON.stringify(state.scheduleShifts));
  closeShiftModal();
  renderSchedule();
});

// Back button from Employee Detail
$("#backToEmployeesList")?.addEventListener("click", () => {
  window.closeEmployeeDetail();
});

// Bootstrapping
initSupabase();
renderAll();
