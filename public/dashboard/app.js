// Supabase Config & State
const SUPABASE_DEFAULT_URL = "https://tuhwjjrflcnkqekyvjaf.supabase.co";
const SUPABASE_DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aHdqanJmbGNua3Fla3l2amFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzk4NDQsImV4cCI6MjA4Nzk1NTg0NH0.idyWdkO47WJeX707MyqaexsEQ74hRDTiI4PVNesXAY8";

const SLO_MONTH_NAMES = [
  "Januar", "Februar", "Marec", "April", "Maj", "Junij",
  "Julij", "Avgust", "September", "Oktober", "November", "December"
];

// Current active date (defaults to August 2026)
let currentDate = new Date(2026, 7, 1);

function getUserStorageKey(key) {
  const uid = state.currentUser ? state.currentUser.id : "guest";
  return `4p_${uid}_${key}`;
}

const DEFAULT_SHIFT_PRESETS = [
  { id: "def-1", startTime: "06:00", endTime: "14:00", label: "" },
  { id: "def-2", startTime: "08:00", endTime: "16:00", label: "" },
  { id: "def-3", startTime: "14:00", endTime: "22:00", label: "" },
  { id: "def-4", startTime: "16:00", endTime: "00:00", label: "" },
  { id: "def-5", startTime: "09:00", endTime: "17:00", label: "" },
];

const state = {
  companyName: "Moje podjetje",
  supabaseUrl: localStorage.getItem("4p_supabase_url") || SUPABASE_DEFAULT_URL,
  supabaseKey: localStorage.getItem("4p_supabase_key") || SUPABASE_DEFAULT_KEY,
  currentUser: null,
  activeView: "overview",
  scheduleMode: "month", // "month" | "week"
  scheduleDate: new Date(2026, 7, 1),
  scheduleSectorFilter: "all",
  scheduleEmployeeFilter: "all",
  scheduleShifts: null,
  openShifts: [],
  shiftPresets: null,
  sectors: [],
  jobs: [],
  employees: [],
  workLogs: [],
  rawLogs: [],
  incomeSources: [],
  approvedRequests: [],
  userProfiles: new Map(),
  pendingRequests: [],
  customStatuses: ["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"],
  employeeCustomStatuses: {},
  employeeWorkTypes: {},
  externalEvents: [],
  showExternalEvents: true,
  supabaseConnected: false,
};

function clearUserState() {
  state.currentUser = null;
  state.companyName = "";
  state.sectors = [];
  state.jobs = [];
  state.employees = [];
  state.workLogs = [];
  state.rawLogs = [];
  state.incomeSources = [];
  state.approvedRequests = [];
  state.pendingRequests = [];
  state.scheduleShifts = null;
  state.shiftPresets = null;
  state.employeeCustomStatuses = {};
  state.employeeWorkTypes = {};
  state.externalEvents = [];
  state.showExternalEvents = true;
  state.customStatuses = ["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"];
  state.userProfiles.clear();

  if (realtimeChannel && supabaseClient) {
    try { supabaseClient.removeChannel(realtimeChannel); } catch (e) {}
    realtimeChannel = null;
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

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
      localStorage.getItem(getUserStorageKey("company_name")) ||
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

    // 1. Resolve company name for this specific employer
    let companyName = companyNameOverride;
    if (!companyName && supabaseClient) {
      try {
        const { data: ep } = await supabaseClient
          .from("employer_profiles")
          .select("company_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (ep && ep.company_name) {
          companyName = ep.company_name;
        }
      } catch (e) {}
    }

    if (!companyName) {
      companyName = localStorage.getItem(getUserStorageKey("company_name"));
    }

    if (!companyName) {
      const meta = session.user.user_metadata || {};
      companyName =
        meta.company_name ||
        meta.full_name ||
        meta.name ||
        session.user.email?.split("@")[0] ||
        "Moje podjetje";
    }

    state.companyName = companyName;
    localStorage.setItem(getUserStorageKey("company_name"), companyName);

    // 2. Load user-specific storage for shifts & statuses
    state.scheduleShifts = JSON.parse(
      localStorage.getItem(getUserStorageKey("schedule_shifts")) || "null"
    );
    state.customStatuses = JSON.parse(
      localStorage.getItem(getUserStorageKey("custom_statuses")) ||
        '["Zaposlen", "Študent", "Pogodbenik", "Poskusno delo"]'
    );
    state.employeeCustomStatuses = JSON.parse(
      localStorage.getItem(getUserStorageKey("employee_statuses")) || "{}"
    );
    state.employeeWorkTypes = JSON.parse(
      localStorage.getItem(getUserStorageKey("employee_work_types")) || "{}"
    );
    state.externalEvents = JSON.parse(
      localStorage.getItem(getUserStorageKey("external_cal_events")) || "[]"
    );
    state.showExternalEvents =
      localStorage.getItem(getUserStorageKey("show_external_cal")) !== "false";

    if (authScreen) authScreen.hidden = true;
    if (appShell) appShell.hidden = false;

    if ($("#sidebarCompany")) $("#sidebarCompany").textContent = state.companyName;
    if ($("#sidebarUserEmail")) $("#sidebarUserEmail").textContent = session.user.email;

    await syncEmployerProfile(session.user, state.companyName);

    setupRealtimeListeners();
    await loadAllData();
  } else {
    clearUserState();
    if (authScreen) authScreen.hidden = false;
    if (appShell) appShell.hidden = true;
  }
}

// Google OAuth Sign In
$("#googleAuthBtn")?.addEventListener("click", async () => {
  hideAuthAlerts();
  if (!supabaseClient) {
    showAuthAlert("login", "Povezava s strežnikom ni na voljo. Preverite nastavitve.");
    return;
  }

  const googleBtn = $("#googleAuthBtn");
  const originalHtml = googleBtn.innerHTML;
  googleBtn.disabled = true;
  googleBtn.innerHTML = `<span>Povezujem z Googlom...</span>`;

  try {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo,
      },
    });

    if (error) {
      showAuthAlert("login", `Napaka pri Google prijavi: ${error.message}`);
      googleBtn.disabled = false;
      googleBtn.innerHTML = originalHtml;
    }
  } catch (err) {
    showAuthAlert("login", "Prišlo je do napake pri Google prijavi. Poskusite znova.");
    googleBtn.disabled = false;
    googleBtn.innerHTML = originalHtml;
  }
});

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
          await handleAuthState(loginRes.data.session, companyName);
          return;
        } else {
          showAuthAlert("signup", "Ta e-naslov je že registriran v Finance4P. Geslo se ne ujema z vašim obstoječim računom. Vnesite pravo geslo ali se prijavite v zavihku 'Prijava'.");
        }
      } else {
        showAuthAlert("signup", `Napaka pri registraciji: ${error.message}`);
      }
    } else if (data && data.user) {
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
  clearUserState();
  handleAuthState(null);
});

// --------------------------------------------------------------------------
// Data Fetching & Syncing
// --------------------------------------------------------------------------
async function loadAllData() {
  if (!state.currentUser) return;
  await fetchWorkplaces();
  await fetchUserProfiles();
  await fetchPendingRequests();
  const approvedReqs = await fetchApprovedRequests();
  const sources = await fetchIncomeSources();
  const logs = await fetchWorkLogs();
  syncEmployeesAndLogs(approvedReqs, sources, logs);
  await fetchScheduleShifts();
  await fetchOpenShifts();
  await fetchShiftPresets();
  renderAll();
}

async function fetchWorkplaces() {
  if (!supabaseClient || !state.currentUser) return;
  try {
    const { data, error } = await supabaseClient.from("workplaces").select("*");
    if (!error && Array.isArray(data)) {
      state.sectors = [];
      state.jobs = [];
      const sectorMap = new Map();
      const currentUserId = state.currentUser.id;

      // Filter: Only keep workplaces belonging to this employer
      const myWorkplaces = data.filter((wp) => {
        if (wp.employer_id) {
          return wp.employer_id === currentUserId;
        }
        if (wp.sector_notes && wp.sector_notes.includes(`[emp:${currentUserId}]`)) {
          return true;
        }
        // Legacy fallback: for original creator Filip Kolle
        if (
          !wp.employer_id &&
          (!wp.sector_notes || !wp.sector_notes.includes("[emp:")) &&
          currentUserId === "e469c8c8-0678-49fd-917d-0f60b031d006"
        ) {
          return true;
        }
        return false;
      });

      myWorkplaces.forEach((wp) => {
        const cleanNotes = (wp.sector_notes || "").replace(/\[emp:[^\]]+\]\s*/g, "");
        const sectorNameVal = wp.sector_name || wp.name || "Splošno";
        const sectorIdVal = wp.id || slugify(sectorNameVal);
        if (!sectorMap.has(sectorIdVal)) {
          sectorMap.set(sectorIdVal, {
            id: sectorIdVal,
            name: sectorNameVal,
            color: wp.sector_color || "#56829d",
            notes: cleanNotes,
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
  if (!supabaseClient || !state.currentUser) return [];
  try {
    const { data, error } = await supabaseClient
      .from("workplace_requests")
      .select("*, workplaces(*)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      const myWorkplaceIds = new Set(state.sectors.map((s) => s.id));
      const myJoinCodes = new Set(state.sectors.map((s) => s.code));

      const filtered = data.filter((req) => {
        return (
          myWorkplaceIds.has(req.workplace_id) ||
          myJoinCodes.has(req.workplaces?.join_code)
        );
      });
      state.approvedRequests = filtered;
      return filtered;
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

async function fetchScheduleShifts() {
  if (!supabaseClient || !state.currentUser) return [];
  try {
    const { data, error } = await supabaseClient
      .from("schedule_shifts")
      .select("*")
      .eq("employer_id", state.currentUser.id)
      .order("date", { ascending: true });

    if (!error && Array.isArray(data)) {
      state.scheduleShifts = data.map((d) => {
        const sec = state.sectors.find((s) => s.id === d.workplace_id);
        const emp = state.employees.find((e) => e.id === d.user_id);
        const empName = emp ? emp.name : (state.userProfiles.get(d.user_id) || "Zaposleni");
        return {
          id: d.id,
          userId: d.user_id,
          userName: empName,
          sectorId: d.workplace_id,
          sectorName: sec?.name || "Delovno mesto",
          color: sec?.color || "#56829d",
          date: d.date,
          startTime: d.start_time,
          endTime: d.end_time,
          hours: Number(d.hours) || 0,
          note: d.note || "",
          openShiftId: d.open_shift_id || null,
        };
      });
      localStorage.setItem(getUserStorageKey("schedule_shifts"), JSON.stringify(state.scheduleShifts));
      return data;
    }
  } catch (e) {
    console.log("Info: schedule_shifts sync", e);
  }
  return [];
}

async function fetchOpenShifts() {
  if (!supabaseClient || !state.currentUser) return [];
  try {
    const { data, error } = await supabaseClient
      .from("open_shifts")
      .select("*, open_shift_signups(*)")
      .eq("employer_id", state.currentUser.id)
      .order("date", { ascending: true });

    if (!error && Array.isArray(data)) {
      state.openShifts = data.map((d) => {
        const sec = state.sectors.find((s) => s.id === d.workplace_id);
        const signups = d.open_shift_signups || [];
        return {
          id: d.id,
          isOpenShift: true,
          workplaceId: d.workplace_id,
          sectorId: d.workplace_id,
          sectorName: sec?.name || "Delovno mesto",
          color: sec?.color || "#f59e0b",
          date: d.date,
          startTime: d.start_time,
          endTime: d.end_time,
          hours: Number(d.hours) || 0,
          requiredSpots: Number(d.required_spots) || 1,
          note: d.note || "",
          signups: signups.map((su) => {
            const emp = state.employees.find((e) => e.id === su.user_id);
            return {
              id: su.id,
              userId: su.user_id,
              userName: su.user_name || emp?.name || state.userProfiles.get(su.user_id) || "Zaposleni",
              createdAt: su.created_at,
            };
          }),
        };
      });
      localStorage.setItem(getUserStorageKey("open_shifts"), JSON.stringify(state.openShifts));
      return state.openShifts;
    }
  } catch (e) {
    console.log("Info: open_shifts sync", e);
  }
  return [];
}

async function fetchShiftPresets() {
  if (!supabaseClient || !state.currentUser) {
    const cached = localStorage.getItem(getUserStorageKey("shift_presets"));
    state.shiftPresets = cached ? JSON.parse(cached) : [...DEFAULT_SHIFT_PRESETS];
    return state.shiftPresets;
  }
  try {
    const { data, error } = await supabaseClient
      .from("shift_presets")
      .select("*")
      .eq("employer_id", state.currentUser.id)
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        state.shiftPresets = data.map((d) => ({
          id: d.id,
          startTime: d.start_time,
          endTime: d.end_time,
          label: d.label || "",
        }));
      } else {
        const cached = localStorage.getItem(getUserStorageKey("shift_presets"));
        if (cached) {
          state.shiftPresets = JSON.parse(cached);
        } else {
          // Initialize default presets in state and database for new employer
          state.shiftPresets = DEFAULT_SHIFT_PRESETS.map((p) => ({
            ...p,
            id: crypto.randomUUID(),
          }));
          try {
            await supabaseClient.from("shift_presets").insert(
              state.shiftPresets.map((p) => ({
                id: p.id,
                employer_id: state.currentUser.id,
                start_time: p.startTime,
                end_time: p.endTime,
                label: p.label || null,
              }))
            );
          } catch (seedingErr) {
            console.warn("Seeding default shift presets warning:", seedingErr);
          }
        }
      }
      localStorage.setItem(getUserStorageKey("shift_presets"), JSON.stringify(state.shiftPresets));
      return state.shiftPresets;
    } else {
      if (error) console.log("shift_presets fetch note:", error.message);
      const cached = localStorage.getItem(getUserStorageKey("shift_presets"));
      state.shiftPresets = cached ? JSON.parse(cached) : [...DEFAULT_SHIFT_PRESETS];
    }
  } catch (err) {
    console.warn("fetchShiftPresets error:", err);
    const cached = localStorage.getItem(getUserStorageKey("shift_presets"));
    state.shiftPresets = cached ? JSON.parse(cached) : [...DEFAULT_SHIFT_PRESETS];
  }
  return state.shiftPresets;
}

// 2. Real-time Listener & Polling for workplace_requests, work_logs, schedule_shifts, open_shifts
function setupRealtimeListeners() {
  if (!supabaseClient) return;

  if (realtimeChannel) {
    try { supabaseClient.removeChannel(realtimeChannel); } catch (e) {}
    realtimeChannel = null;
  }

  try {
    realtimeChannel = supabaseClient
      .channel("workplace_requests_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workplace_requests" },
        async () => {
          if (state.currentUser) await loadAllData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_logs" },
        async () => {
          if (state.currentUser) await loadAllData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedule_shifts" },
        async () => {
          if (state.currentUser) {
            await fetchScheduleShifts();
            renderSchedule();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "open_shifts" },
        async () => {
          if (state.currentUser) {
            await fetchOpenShifts();
            renderSchedule();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "open_shift_signups" },
        async () => {
          if (state.currentUser) {
            await fetchOpenShifts();
            renderSchedule();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_presets" },
        async () => {
          if (state.currentUser) {
            await fetchShiftPresets();
            renderShiftModalPresets();
            renderShiftPresetsSettings();
          }
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

// 3. Fetch and Display Pending Requests (Scoped to Employer's Sectors)
async function fetchPendingRequests() {
  if (!supabaseClient || !state.currentUser) return;
  try {
    const { data, error } = await supabaseClient
      .from("workplace_requests")
      .select("*, workplaces(*)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      const myWorkplaceIds = new Set(state.sectors.map((s) => s.id));
      const myJoinCodes = new Set(state.sectors.map((s) => s.code));

      state.pendingRequests = data.filter((req) => {
        return (
          myWorkplaceIds.has(req.workplace_id) ||
          myJoinCodes.has(req.workplaces?.join_code)
        );
      });
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

  // 1. Process approved requests as the SOLE source of truth for active employment
  approvedReqs.forEach((req) => {
    const userId = req.user_id;
    if (!userId) return;

    const wp = req.workplaces || state.jobs.find((j) => j.id === req.workplace_id) || {};
    // Strict match: must match one of our company's sectors (NO FALLBACK to state.sectors[0])
    const matchedSector = state.sectors.find(
      (s) =>
        s.id === req.workplace_id ||
        (wp.join_code && s.code === wp.join_code) ||
        s.name === wp.sector_name ||
        s.id === wp.sectorId
    );

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
      if (req.user_name && emp.name === "Zaposleni") {
        emp.name = req.user_name;
      }
      if (!emp.sectors[matchedSector.id]) {
        emp.sectors[matchedSector.id] = {
          sectorId: matchedSector.id,
          sectorName: matchedSector.name,
          sectorCode: matchedSector.code,
          color: matchedSector.color || "#56829d",
          rate: 0,
          isFixed: false,
          netSalary: 0,
          jobName: wp.name || matchedSector.name,
          hours: {},
          travelExpenses: {},
          earnings: {},
          paid: {},
        };
      }
    }
  });

  // 2. Map income_sources: ONLY attach custom rate/title to users who have an approved sector!
  const sourceToSectorMap = new Map();
  sources.forEach((src) => {
    let matchedSector = null;
    if (src.workplace_id && sectorByIdMap.has(src.workplace_id)) {
      matchedSector = sectorByIdMap.get(src.workplace_id);
    } else if (src.join_code && sectorByCode.has(src.join_code)) {
      matchedSector = sectorByCode.get(src.join_code);
    }

    if (matchedSector && src.user_id) {
      const emp = empMap.get(src.user_id);
      const isFixed = src.type === "fixed";
      const srcRate = isFixed ? 0 : (Number(src.hourly_rate) || 0);

      if (emp && emp.sectors[matchedSector.id]) {
        emp.sectors[matchedSector.id].rate = srcRate;
        emp.sectors[matchedSector.id].isFixed = isFixed;
        emp.sectors[matchedSector.id].netSalary = Number(src.net_salary) || 0;
        if (src.name) {
          emp.sectors[matchedSector.id].jobName = src.name;
        }
      }

      sourceToSectorMap.set(src.id, {
        sectorId: matchedSector.id,
        sectorName: matchedSector.name,
        sectorCode: matchedSector.code,
        color: matchedSector.color || "#56829d",
        hourlyRate: srcRate,
        isFixed: isFixed,
        netSalary: Number(src.net_salary) || 0,
        jobName: src.name || matchedSector.name,
        workplaceId: src.workplace_id || matchedSector.id,
      });
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
        hourlyRate: 0,
        isFixed: false,
        netSalary: 0,
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
        rate: matchedSectorInfo.hourlyRate || 0,
        isFixed: matchedSectorInfo.isFixed || false,
        netSalary: matchedSectorInfo.netSalary || 0,
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
    const fixedRate = Number(secEntry.rate) || Number(matchedSectorInfo.hourlyRate) || 0;
    
    // Base work earnings + travel expenses
    let totalLogEarnings = Number(log.earnings || 0);
    if (totalLogEarnings === 0 && h > 0 && fixedRate > 0) {
      totalLogEarnings = (h * fixedRate) + travel;
    } else if (totalLogEarnings === 0 && travel > 0) {
      totalLogEarnings = travel;
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

// Helpers & Notifications
function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = "position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `dashboard-toast toast-${type}`;
  toast.style.cssText = `
    background: #1e293b;
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    gap: 8px;
    border-left: 4px solid ${type === "error" ? "#ef4444" : "#10b981"};
    pointer-events: auto;
    transition: all 200ms ease;
  `;

  const icon = type === "error" ? "⚠️" : "✓";
  toast.innerHTML = `<span style="color: ${type === "error" ? "#ef4444" : "#10b981"}; font-weight: bold;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 200);
  }, 3500);
}
window.showToast = showToast;

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

// --- Slovenski prazniki in nedelje ---
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDateString(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const slovenianHolidaysCache = new Map();

function getSlovenianHolidays(year) {
  if (slovenianHolidaysCache.has(year)) {
    return slovenianHolidaysCache.get(year);
  }

  const holidays = new Map();

  // Fiksni zakonsko dela prosti dnevi v RS
  holidays.set(`${year}-01-01`, "Novo leto");
  holidays.set(`${year}-01-02`, "Novo leto");
  holidays.set(`${year}-02-08`, "Prešernov dan");
  holidays.set(`${year}-04-27`, "Dan upora proti okupatorju");
  holidays.set(`${year}-05-01`, "Praznik dela");
  holidays.set(`${year}-05-02`, "Praznik dela");
  holidays.set(`${year}-06-25`, "Dan državnosti");
  holidays.set(`${year}-08-15`, "Marijino vnebovzetje");
  holidays.set(`${year}-10-31`, "Dan reformacije");
  holidays.set(`${year}-11-01`, "Dan spomina na mrtve");
  holidays.set(`${year}-12-25`, "Božič");
  holidays.set(`${year}-12-26`, "Dan samostojnosti in enotnosti");

  // Premakljivi dela prosti dnevi v RS
  const easter = getEasterSunday(year);
  const easterMonday = new Date(easter.getTime() + 86400000);
  const pentecost = new Date(easter.getTime() + 49 * 86400000);

  holidays.set(formatUtcDateString(easter), "Velika noč");
  holidays.set(formatUtcDateString(easterMonday), "Velikonočni ponedeljek");
  holidays.set(formatUtcDateString(pentecost), "Binkošti");

  slovenianHolidaysCache.set(year, holidays);
  return holidays;
}

function getSlovenianHolidayName(dateStr) {
  if (!dateStr) return null;
  const cleanDate = dateStr.slice(0, 10);
  const year = parseInt(cleanDate.slice(0, 4), 10);
  if (isNaN(year)) return null;
  const holidays = getSlovenianHolidays(year);
  return holidays.get(cleanDate) || null;
}

function isSunday(dateStr) {
  if (!dateStr) return false;
  const cleanDate = dateStr.slice(0, 10);
  const parts = cleanDate.split("-").map(Number);
  if (parts.length !== 3) return false;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return dt.getDay() === 0;
}

function formatSundayCount(count) {
  if (count === 1) return "1 nedelja";
  if (count === 2) return "2 nedelji";
  if (count === 3 || count === 4) return `${count} nedelje`;
  return `${count} nedelj`;
}

function formatHolidayCount(count) {
  if (count === 1) return "1 praznik";
  if (count === 2) return "2 praznika";
  if (count === 3 || count === 4) return `${count} prazniki`;
  return `${count} praznikov`;
}

// --- Izračun tedenskih nadur ---
function getMondayOfWeekKey(dateStr) {
  const parts = dateStr.slice(0, 10).split("-").map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = (dt.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const mon = new Date(dt);
  mon.setDate(dt.getDate() - day);
  const my = mon.getFullYear();
  const mm = String(mon.getMonth() + 1).padStart(2, "0");
  const md = String(mon.getDate()).padStart(2, "0");
  return `${my}-${mm}-${md}`;
}

function calculateEmployeeWeeklyOvertime(empAllLogs, weeklyThreshold) {
  // Združevanje po koledarskih tednih (ponedeljek - nedelja)
  const weeksMap = new Map();
  empAllLogs.forEach((log) => {
    if (!log.date) return;
    const weekKey = getMondayOfWeekKey(log.date);
    if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, []);
    weeksMap.get(weekKey).push(log);
  });

  const logOvertimeMap = new Map();

  weeksMap.forEach((weekLogs) => {
    // Kronološka razvrstitev znotraj tedna
    weekLogs.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });

    let cumulativeHours = 0;
    for (const log of weekLogs) {
      const prev = cumulativeHours;
      const logH = Number(log.hours) || 0;
      cumulativeHours += logH;

      let ot = 0;
      if (cumulativeHours <= weeklyThreshold) {
        ot = 0;
      } else if (prev < weeklyThreshold) {
        ot = cumulativeHours - weeklyThreshold;
      } else {
        ot = logH;
      }
      logOvertimeMap.set(log.id, Math.round(ot * 100) / 100);
    }
  });

  return logOvertimeMap;
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
    const earnings = sec.earnings?.[monthKey] ?? (hours * (sec.rate || 0) + travelExpenses);
    const paid = sec.paid?.[monthKey] ?? (hours === 0 && travelExpenses === 0 ? true : false);
    return { hours, travelExpenses, earnings, paid, rate: sec.rate || 0, isFixed: sec.isFixed, netSalary: sec.netSalary };
  }

  const hours = employee.hours?.[monthKey] ?? 0;
  const travelExpenses = employee.travelExpenses?.[monthKey] ?? 0;
  const sectorList = Object.values(employee.sectors || {});
  const defaultRate = sectorList.length > 0 ? (sectorList[0].rate || 0) : 0;
  const earnings = employee.earnings?.[monthKey] ?? (hours * defaultRate + travelExpenses);
  const paid = employee.paid?.[monthKey] ?? (hours === 0 && travelExpenses === 0 ? true : false);

  const rate = defaultRate;
  const isFixed = sectorList.length > 0 && sectorList.every((s) => s.isFixed);
  const rates = sectorList.map((s) => ({ sectorName: s.sectorName, rate: s.rate || 0, isFixed: s.isFixed }));

  return { hours, travelExpenses, earnings, paid, rate, rates, isFixed };
}

function formatHourlyRate(month, employee) {
  if (month.isFixed) {
    return `<span class="chip" style="font-size: 11px; padding: 2px 7px; background: #e0e7ff; color: #3730a3; font-weight: 700;">Polna zaposlitev</span>`;
  }
  if (month.rates && month.rates.length > 1) {
    const uniqueRates = [...new Set(month.rates.map((r) => r.rate))];
    if (uniqueRates.length === 1) {
      return uniqueRates[0] > 0 ? `${currency.format(uniqueRates[0])}/h` : `<span style="color: var(--muted);">-</span>`;
    }
    return month.rates
      .map((r) => `${r.sectorName}: ${r.isFixed ? "Polna zaposlitev" : (r.rate > 0 ? `${currency.format(r.rate)}/h` : "-")}`)
      .join("<br/>");
  }
  return month.rate > 0 ? `${currency.format(month.rate)}/h` : `<span style="color: var(--muted);">-</span>`;
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
    const earnings = sec.earnings?.[monthKey] ?? (hours * (sec.rate || 0) + travel);

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

  const currentWorkType = state.employeeWorkTypes?.[employee.id] || "full_time";
  const workTypeDropdownHTML = `
    <div class="emp-worktype-badge-dropdown">
      <select class="emp-worktype-select-chip" onchange="handleEmployeeWorkTypeChange('${employee.id}', this.value)" title="Kliknite za izbiro delovnega časa (polni / polovični)">
        <option value="full_time" ${currentWorkType === "full_time" ? "selected" : ""}>⏱ Polni čas (40h/teden)</option>
        <option value="part_time" ${currentWorkType === "part_time" ? "selected" : ""}>⏱ Polovični čas (20h/teden)</option>
      </select>
    </div>
  `;

  if ($("#empDetailBadges")) {
    $("#empDetailBadges").innerHTML = `
      ${statusDropdownHTML}
      ${workTypeDropdownHTML}
      ${sectorBadgesHTML}
    `;
  }

  // Find all work logs for this employee in this active month
  const empMonthLogs = state.rawLogs.filter((l) => l.userId === employeeId && l.date.startsWith(monthKey));
  const totalHours = empMonthLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalTravel = empMonthLogs.reduce((sum, l) => sum + (l.travelExpenses || 0), 0);
  const totalEarnings = empMonthLogs.reduce((sum, l) => sum + l.earnings, 0);
  const unpaidAmount = empMonthLogs.filter((l) => !l.isPaid).reduce((sum, l) => sum + l.earnings, 0);

  // --- Nedelje & Prazniki v izbranem mesecu ---
  const sundayLogs = empMonthLogs.filter((l) => isSunday(l.date));
  const sundayDates = new Set(sundayLogs.map((l) => l.date));
  const sundayCount = sundayDates.size;
  const sundayHours = sundayLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);

  const holidayLogs = empMonthLogs.filter((l) => Boolean(getSlovenianHolidayName(l.date)));
  const holidayDates = new Set(holidayLogs.map((l) => l.date));
  const holidayCount = holidayDates.size;
  const holidayHours = holidayLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);

  // --- Nadure (tedenski prag: 40h za polni ali 20h za polovični delovni čas) ---
  const weeklyThreshold = currentWorkType === "part_time" ? 20 : 40;
  const empAllLogs = state.rawLogs.filter((l) => l.userId === employeeId);
  const logOvertimeMap = calculateEmployeeWeeklyOvertime(empAllLogs, weeklyThreshold);

  let totalMonthOvertime = 0;
  empMonthLogs.forEach((l) => {
    totalMonthOvertime += logOvertimeMap.get(l.id) || 0;
  });

  if ($("#empDetailTotalHours")) $("#empDetailTotalHours").textContent = `${number.format(totalHours)} h`;
  if ($("#empDetailHourlyRate")) {
    const isAnyFixed = employeeSectors.some((s) => s.isFixed);
    if (isAnyFixed && employeeSectors.every((s) => s.isFixed)) {
      $("#empDetailHourlyRate").textContent = "Polna zaposlitev (fiksna plača)";
    } else {
      const rates = employeeSectors.map((s) => s.rate || 0);
      const uniqueRates = [...new Set(rates)];
      $("#empDetailHourlyRate").textContent =
        uniqueRates.length === 1
          ? (uniqueRates[0] > 0 ? `${currency.format(uniqueRates[0])}/h` : (isAnyFixed ? "Polna zaposlitev" : "-"))
          : employeeSectors.map((s) => `${s.sectorName}: ${s.isFixed ? "Polna zaposlitev" : (s.rate > 0 ? `${currency.format(s.rate)}/h` : "-")}`).join(" · ");
    }
  }
  if ($("#empDetailTravel")) $("#empDetailTravel").textContent = currency.format(totalTravel);
  if ($("#empDetailTotalEarnings")) $("#empDetailTotalEarnings").textContent = currency.format(totalEarnings);
  if ($("#empDetailUnpaid")) {
    $("#empDetailUnpaid").textContent = currency.format(unpaidAmount);
    $("#empDetailUnpaid").style.color = unpaidAmount > 0 ? "var(--amber)" : "var(--primary-dark)";
  }

  // Posodobitev kartic za Nedelje, Praznike in Nadure
  if ($("#empDetailSundays")) $("#empDetailSundays").textContent = formatSundayCount(sundayCount);
  if ($("#empDetailSundayHours")) $("#empDetailSundayHours").textContent = `${number.format(sundayHours)} h ob nedeljah`;

  if ($("#empDetailHolidays")) $("#empDetailHolidays").textContent = formatHolidayCount(holidayCount);
  if ($("#empDetailHolidayHours")) $("#empDetailHolidayHours").textContent = `${number.format(holidayHours)} h ob praznikih`;

  if ($("#empDetailOvertimeBadge")) {
    $("#empDetailOvertimeBadge").textContent = currentWorkType === "part_time" ? "20h / teden (polovični)" : "40h / teden (polni)";
  }
  if ($("#empDetailOvertime")) {
    $("#empDetailOvertime").textContent = `${number.format(totalMonthOvertime)} h`;
    $("#empDetailOvertime").style.color = totalMonthOvertime > 0 ? "#b45309" : "var(--ink)";
  }
  if ($("#empDetailOvertimeSub")) {
    $("#empDetailOvertimeSub").textContent = totalMonthOvertime > 0
      ? `Presežek nad ${weeklyThreshold}h/teden`
      : `Brez nadur (do ${weeklyThreshold}h/t)`;
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
          const rate = sec.rate || 0;

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
                  <strong>${sec.isFixed ? "Polna zaposlitev" : (rate > 0 ? `${currency.format(rate)}/h` : "-")}</strong>
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
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="chip ${isPaid ? "" : "warning"}">${isPaid ? "Izplačano" : "Za izplačilo"}</span>
                  <button type="button" onclick="handleDismissEmployee('${employee.id}', '${sec.sectorId}')" class="ghost-button" style="color: #ef4444; font-size: 11px; padding: 4px 8px; border: 1px solid #fecaca; border-radius: 6px; cursor: pointer;" title="Prekini povezavo in odstrani zaposlenega iz tega sektorja">Odstrani iz sektorja</button>
                </div>
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

          // Značke za slovenski praznik, nedeljo in nadure
          const holidayName = getSlovenianHolidayName(log.date);
          const isSun = isSunday(log.date);
          const otHours = logOvertimeMap.get(log.id) || 0;

          let badges = [];
          if (holidayName) {
            badges.push(`<span class="chip" style="background: #fef3c7; color: #b45309; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;" title="Slovenski dela prosti dan: ${holidayName}">🎉 ${holidayName}</span>`);
          }
          if (isSun) {
            badges.push(`<span class="chip" style="background: #e0f2fe; color: #0284c7; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;" title="Nedeljsko delo">Nedelja</span>`);
          }
          if (otHours > 0) {
            badges.push(`<span class="chip" style="background: #fee2e2; color: #b91c1c; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;" title="Tedenski presežek delovnih ur">+${number.format(otHours)} h nadure</span>`);
          }

          const badgesHTML = badges.length > 0 ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">${badges.join("")}</div>` : "";

          return `
            <tr>
              <td>
                <strong>${formattedDate}</strong>
                ${badgesHTML}
              </td>
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

  // Render Shift Presets List
  renderShiftPresetsSettings();
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
    localStorage.setItem(getUserStorageKey("custom_statuses"), JSON.stringify(state.customStatuses));
    renderCustomStatuses();
    if (state.selectedEmployeeId) {
      renderEmployeeDetail(state.selectedEmployeeId);
    }
  }
};

window.handleDeleteCustomStatus = function (statusName) {
  if (!state.customStatuses) return;
  state.customStatuses = state.customStatuses.filter((s) => s !== statusName);
  localStorage.setItem(getUserStorageKey("custom_statuses"), JSON.stringify(state.customStatuses));
  renderCustomStatuses();
  if (state.selectedEmployeeId) {
    renderEmployeeDetail(state.selectedEmployeeId);
  }
};

function renderShiftPresetsSettings() {
  const container = $("#shiftPresetsManageList");
  if (!container) return;

  const presets = state.shiftPresets || DEFAULT_SHIFT_PRESETS;
  if (presets.length === 0) {
    container.innerHTML = `<p class="empty-state" style="padding: 12px 0;">Trenutno nimate nastavljenih hitrih izbir izmene.</p>`;
    return;
  }

  container.innerHTML = presets
    .map((p) => {
      const dur = calculateShiftDuration(p.startTime, p.endTime);
      return `
        <article class="shift-preset-manage-item">
          <div class="shift-preset-item-info">
            <span class="shift-preset-badge">${p.startTime} – ${p.endTime}</span>
            ${p.label ? `<span class="shift-preset-label">${p.label}</span>` : ""}
            <span class="shift-preset-duration">(${number.format(dur)} ur)</span>
          </div>
          <button type="button" class="delete-preset-btn" onclick="handleDeleteShiftPreset('${p.id}')" title="Izbriši to hitro izbiro">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Izbriši</span>
          </button>
        </article>
      `;
    })
    .join("");
}

window.handleAddShiftPreset = async function (startTime, endTime, label) {
  if (!startTime || !endTime) return;
  const newPreset = {
    id: crypto.randomUUID(),
    startTime,
    endTime,
    label: (label || "").trim(),
  };

  if (!state.shiftPresets) {
    state.shiftPresets = [...DEFAULT_SHIFT_PRESETS];
  }
  state.shiftPresets.push(newPreset);
  localStorage.setItem(getUserStorageKey("shift_presets"), JSON.stringify(state.shiftPresets));
  renderShiftPresetsSettings();
  renderShiftModalPresets();

  if (supabaseClient && state.currentUser) {
    try {
      await supabaseClient.from("shift_presets").insert([
        {
          id: newPreset.id,
          employer_id: state.currentUser.id,
          start_time: newPreset.startTime,
          end_time: newPreset.endTime,
          label: newPreset.label || null,
        },
      ]);
    } catch (e) {
      console.warn("Supabase insert shift_preset error:", e);
    }
  }
};

window.handleDeleteShiftPreset = async function (presetId) {
  if (!state.shiftPresets) state.shiftPresets = [...DEFAULT_SHIFT_PRESETS];
  state.shiftPresets = state.shiftPresets.filter((p) => p.id !== presetId);
  localStorage.setItem(getUserStorageKey("shift_presets"), JSON.stringify(state.shiftPresets));
  renderShiftPresetsSettings();
  renderShiftModalPresets();

  if (supabaseClient && state.currentUser) {
    try {
      await supabaseClient
        .from("shift_presets")
        .delete()
        .eq("id", presetId)
        .eq("employer_id", state.currentUser.id);
    } catch (e) {
      console.warn("Supabase delete shift_preset error:", e);
    }
  }
};

window.handleEmployeeStatusChange = function (employeeId, newStatus) {
  if (!state.employeeCustomStatuses) state.employeeCustomStatuses = {};
  state.employeeCustomStatuses[employeeId] = newStatus;
  localStorage.setItem(getUserStorageKey("employee_statuses"), JSON.stringify(state.employeeCustomStatuses));

  const emp = state.employees.find((e) => e.id === employeeId);
  if (emp) {
    emp.status = newStatus;
  }
  renderAll();
};

window.handleEmployeeWorkTypeChange = function (employeeId, newType) {
  if (!state.employeeWorkTypes) state.employeeWorkTypes = {};
  state.employeeWorkTypes[employeeId] = newType;
  localStorage.setItem(getUserStorageKey("employee_work_types"), JSON.stringify(state.employeeWorkTypes));

  const emp = state.employees.find((e) => e.id === employeeId);
  const empName = emp ? emp.name : "zaposlenega";
  const label = newType === "part_time" ? "Polovični delovni čas (20h/teden)" : "Polni delovni čas (40h/teden)";
  showToast(`Za ${empName} nastavljen ${label}.`, "success");

  renderEmployeeDetail(employeeId);
};

// Odpusti zaposlenega (Prekini povezavo z enim sektorjem ali celotnim podjetjem)
window.handleDismissEmployee = async function (employeeId, specificSectorId = null) {
  const emp = state.employees.find((e) => e.id === employeeId);
  const empName = emp ? emp.name : "tega zaposlenega";

  let targetSectorIds = [];
  if (specificSectorId) {
    targetSectorIds = [specificSectorId];
  } else {
    // Vsi sektorji tega delodajalca
    targetSectorIds = state.sectors.map((s) => s.id);
  }

  const confirmMsg = specificSectorId
    ? `Ali ste prepričani, da želite zaposlenega "${empName}" odstraniti iz tega sektorja? Prekinil se bo pretok informacij in izbrisane bodo njegove dodeljene izmene v tem sektorju.`
    : `Ali ste prepričani, da želite odpustiti zaposlenega "${empName}"? S tem boste prekinili povezavo z vašim podjetjem (vsemi sektorji) in izbrisali njegove prihodnje dodeljene izmene.`;

  if (!confirm(confirmMsg)) return;

  if (!supabaseClient) {
    alert("Ni povezave s podatkovno bazo.");
    return;
  }

  try {
    // 1. Izbriši iz workplace_requests
    const { error: reqErr } = await supabaseClient
      .from("workplace_requests")
      .delete()
      .eq("user_id", employeeId)
      .in("workplace_id", targetSectorIds);

    if (reqErr) {
      console.warn("Brisanje zahteve ni uspelo, posodabljam status v 'denied':", reqErr);
      await supabaseClient
        .from("workplace_requests")
        .update({ status: "denied", updated_at: new Date().toISOString() })
        .eq("user_id", employeeId)
        .in("workplace_id", targetSectorIds);
    }

    // 2. Izbriši dodeljene izmene v urniku tega sektorja / delodajalca
    const { error: shiftErr } = await supabaseClient
      .from("schedule_shifts")
      .delete()
      .eq("user_id", employeeId)
      .in("workplace_id", targetSectorIds);

    if (shiftErr) {
      console.warn("Napaka pri brisanju dodeljenih izmen:", shiftErr);
    }

    alert(`Zaposleni "${empName}" je bil uspešno odpuščen in povezava prekinjena.`);

    // 3. Ponovno naloži podatke
    await loadAllData();

    // 4. Če zaposleni nima več nobenega sektorja v tem podjetju, zapri profil
    const updatedEmp = state.employees.find((e) => e.id === employeeId);
    if (!updatedEmp || Object.keys(updatedEmp.sectors || {}).length === 0) {
      window.closeEmployeeDetail();
    } else {
      renderEmployeeDetail(employeeId);
    }
  } catch (err) {
    console.error("Napaka pri odpuščanju zaposlenega:", err);
    alert("Prišlo je do napake: " + (err.message || err));
  }
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
// Urnik (Shift Scheduler) Helpers & Implementation
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

// ==========================================================================
// Urnik (Shift Scheduler) Implementation
// ==========================================================================
function initDefaultScheduleShifts() {
  if (state.scheduleShifts === null || state.scheduleShifts === undefined) {
    const saved = localStorage.getItem(getUserStorageKey("schedule_shifts"));
    if (saved) {
      try {
        state.scheduleShifts = JSON.parse(saved);
      } catch (e) {
        state.scheduleShifts = [];
      }
    } else {
      state.scheduleShifts = [];
    }
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

function getSpotsLabel(n) {
  if (n === 1) return "prosto mesto";
  if (n === 2) return "prosti mesti";
  if (n === 3 || n === 4) return "prosta mesta";
  return "prostih mest";
}

function getEnrichedOpenShifts() {
  const openShifts = state.openShifts || [];
  const scheduleShifts = state.scheduleShifts || [];

  return openShifts.map((os) => {
    const signups = [...(os.signups || [])];

    // Check if any schedule shift belongs to this open shift
    const matchingShifts = scheduleShifts.filter((s) => {
      if (s.openShiftId && s.openShiftId === os.id) return true;
      if (s.note === "Odprta izmena" && s.date === os.date && s.sectorId === os.sectorId) return true;
      return false;
    });

    matchingShifts.forEach((s) => {
      const alreadyPresent = signups.some((su) => su.userId === s.userId || (su.userName && su.userName === s.userName));
      if (!alreadyPresent) {
        signups.push({
          id: s.id,
          userId: s.userId,
          userName: s.userName || "Zaposleni",
        });
      }
    });

    return {
      ...os,
      signups,
    };
  });
}

function isShiftFromOpenShift(s, openShiftsOnDay) {
  if (s.openShiftId) return true;
  if (s.note === "Odprta izmena") return true;
  if (openShiftsOnDay && openShiftsOnDay.length > 0) {
    const match = openShiftsOnDay.some((os) => {
      const userSignedUp = (os.signups || []).some(
        (su) => su.userId === s.userId || (su.userName && su.userName === s.userName)
      );
      if (userSignedUp && (os.sectorId === s.sectorId || (os.startTime === s.startTime && os.endTime === s.endTime))) {
        return true;
      }
      return false;
    });
    if (match) return true;
  }
  return false;
}

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
  SLO_DAY_HEADERS.forEach((dayHeader, idx) => {
    const isWeekend = idx === 5 || idx === 6;
    html += `<div class="cal-month-day-header ${isWeekend ? "is-weekend" : ""}">${dayHeader}</div>`;
  });

  // Previous month trailing days
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    html += `
      <div class="schedule-month-cell outside-month">
        <div class="schedule-cell-top">
          <span class="cal-day-num outside-num">${dayNum}</span>
        </div>
      </div>
    `;
  }

  // Current month days
  const enrichedOpenShifts = getEnrichedOpenShifts();
  const openShiftsByDate = new Map();
  enrichedOpenShifts.forEach((os) => {
    if (state.scheduleSectorFilter && state.scheduleSectorFilter !== "all" && os.sectorId !== state.scheduleSectorFilter) return;
    if (state.scheduleEmployeeFilter && state.scheduleEmployeeFilter !== "all") {
      const isSignedUp = (os.signups || []).some((su) => su.userId === state.scheduleEmployeeFilter);
      if (!isSignedUp) return;
    }
    if (!openShiftsByDate.has(os.date)) openShiftsByDate.set(os.date, []);
    openShiftsByDate.get(os.date).push(os);
  });

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayShifts = shiftsByDate.get(dateStr) || [];
    const dayOpenShifts = openShiftsByDate.get(dateStr) || [];
    const regularDayShifts = dayShifts.filter((s) => !isShiftFromOpenShift(s, dayOpenShifts));
    const totalDayHours = regularDayShifts.reduce((sum, s) => sum + (Number(s.hours) || 0), 0) +
      dayOpenShifts.reduce((sum, os) => sum + ((os.signups ? os.signups.length : 0) * (Number(os.hours) || 0)), 0);
    const isToday = dateStr === todayStr;

    const dayExtEvents = (state.showExternalEvents !== false && state.externalEvents)
      ? state.externalEvents.filter((e) => e.date === dateStr)
      : [];
    let extEventsHtml = "";
    if (dayExtEvents.length > 0) {
      extEventsHtml = dayExtEvents
        .map(
          (ev) => `
            <div class="cal-personal-event-chip" onclick="event.stopPropagation();" title="Osebni koledar: ${ev.title}${ev.startTime ? ` (${ev.startTime}–${ev.endTime})` : ''}">
              <span style="font-size: 11px;">🔒</span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ev.title}</span>
            </div>
          `
        )
        .join("");
    }

    let openShiftsHtml = "";
    if (dayOpenShifts.length > 0) {
      openShiftsHtml = dayOpenShifts
        .map((s) => {
          const color = s.color || "#f59e0b";
          const signupsCount = s.signups ? s.signups.length : 0;
          const isFull = signupsCount >= s.requiredSpots;
          return `
            <div class="schedule-shift-chip is-open-shift ${isFull ? 'is-full' : ''}" style="border: 1px ${isFull ? 'solid' : 'dashed'} ${color}; border-left: 3.5px solid ${color}; background: ${isFull ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.09)'};" onclick="event.stopPropagation(); openShiftModal('${s.id}', null, null, true)" title="Odprta izmena: ${signupsCount}/${s.requiredSpots} prijavljenih. Kliknite za podrobnosti.">
              <div class="schedule-shift-chip-top">
                <span class="schedule-shift-chip-emp" style="color: ${color}; font-weight: 800; font-size: 11px;">🔓 ${s.sectorName}</span>
                <span style="font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px; background: ${isFull ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">${signupsCount}/${s.requiredSpots}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span class="schedule-shift-chip-time">${s.startTime}–${s.endTime}</span>
                <span style="font-size: 10px; font-weight: 700; color: var(--ink);">${number.format(s.hours)}h</span>
              </div>
              ${s.note && s.note !== "Odprta izmena" ? `<span style="font-size: 10px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.note}</span>` : ""}

              ${signupsCount > 0 ? `
                <div class="open-shift-signups-container" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed ${color}50; display: flex; flex-direction: column; gap: 2.5px;">
                  ${s.signups.map((su) => `
                    <div class="open-shift-user-badge" style="display: flex; align-items: center; justify-content: space-between; gap: 4px; background: #ffffff; padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.07); box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                      <div style="display: flex; align-items: center; gap: 4px; min-width: 0;">
                        <span class="avatar" style="width: 16px; height: 16px; font-size: 8px; font-weight: 700; background: ${color}20; color: ${color}; flex-shrink: 0;">${initials(su.userName)}</span>
                        <span style="font-weight: 700; font-size: 10.5px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${su.userName}</span>
                      </div>
                      <span style="font-size: 8.5px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 0.5px 4px; border-radius: 3px; flex-shrink: 0;">Prijavljen</span>
                    </div>
                  `).join('')}
                  ${!isFull ? `
                    <div style="font-size: 9.5px; color: #b45309; font-weight: 600; padding: 1px 2px; display: flex; align-items: center; gap: 3px;">
                      <span style="font-size: 9px;">➕</span>
                      <span>Še ${s.requiredSpots - signupsCount} ${getSpotsLabel(s.requiredSpots - signupsCount)}</span>
                    </div>
                  ` : `
                    <div style="font-size: 9px; color: #15803d; font-weight: 700; padding: 1px 2px; display: flex; align-items: center; gap: 3px;">
                      <span style="font-size: 9px;">✓</span>
                      <span>Zasedeno</span>
                    </div>
                  `}
                </div>
              ` : `
                <div style="font-size: 9.5px; color: #b45309; font-style: italic; margin-top: 3px; display: flex; align-items: center; gap: 3px;">
                  <span>⏳</span><span>Čaka na prijave (${s.requiredSpots} ${getSpotsLabel(s.requiredSpots)})</span>
                </div>
              `}
            </div>
          `;
        })
        .join("");
    }

    let shiftsHtml = "";
    if (regularDayShifts.length > 0) {
      shiftsHtml = regularDayShifts
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
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="cal-day-num ${isToday ? "is-today-badge" : ""}">${d}</span>
            ${isToday ? `<span class="today-indicator-pill">Danes</span>` : ""}
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            ${totalDayHours > 0 ? `<span class="cal-day-hours-badge" title="${number.format(totalDayHours)} načrtovanih ur">${number.format(totalDayHours)} h</span>` : ""}
            <button type="button" class="schedule-quick-add-btn" onclick="event.stopPropagation(); openShiftModal(null, '${dateStr}')" title="Dodaj izmeno za ta dan">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </div>
        <div class="schedule-cell-shifts-wrap">
          ${extEventsHtml}
          ${openShiftsHtml}
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
          <span class="cal-day-num outside-num">${n}</span>
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
    const isToday = dateStr === todayStr;

    const enrichedOpenShifts = getEnrichedOpenShifts();
    const openShiftsForDay = enrichedOpenShifts.filter((os) => {
      if (os.date !== dateStr) return false;
      if (state.scheduleSectorFilter && state.scheduleSectorFilter !== "all" && os.sectorId !== state.scheduleSectorFilter) return false;
      if (state.scheduleEmployeeFilter && state.scheduleEmployeeFilter !== "all") {
        const isSignedUp = (os.signups || []).some((su) => su.userId === state.scheduleEmployeeFilter);
        if (!isSignedUp) return false;
      }
      return true;
    });

    const regularDayShifts = dayShifts.filter((s) => !isShiftFromOpenShift(s, openShiftsForDay));
    const totalDayHours = regularDayShifts.reduce((sum, s) => sum + (Number(s.hours) || 0), 0) +
      openShiftsForDay.reduce((sum, os) => sum + ((os.signups ? os.signups.length : 0) * (Number(os.hours) || 0)), 0);

    let openShiftsHtml = "";
    if (openShiftsForDay.length > 0) {
      openShiftsHtml = openShiftsForDay
        .map((s) => {
          const color = s.color || "#f59e0b";
          const signupsCount = s.signups ? s.signups.length : 0;
          const isFull = signupsCount >= s.requiredSpots;
          return `
            <article class="schedule-week-shift-card is-open-shift ${isFull ? 'is-full' : ''}" style="border: 1px ${isFull ? 'solid' : 'dashed'} ${color}; border-left: 4px solid ${color}; background: ${isFull ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.08)'};" onclick="openShiftModal('${s.id}', null, null, true)">
              <div class="schedule-week-shift-emp-row">
                <span style="font-size: 11px; font-weight: 800; color: ${color}; text-transform: uppercase;">🔓 Odprta izmena</span>
                <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 100px; background: ${isFull ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">
                  ${signupsCount}/${s.requiredSpots} mest
                </span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span class="sector-code-badge" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}35; font-size: 10px; padding: 1px 6px;">
                  <span class="sector-color-dot" style="background-color: ${color}; width: 6px; height: 6px;"></span>
                  ${s.sectorName}
                </span>
                <span class="schedule-week-shift-time-badge">${s.startTime} – ${s.endTime} (${number.format(s.hours)}h)</span>
              </div>

              ${s.note && s.note !== "Odprta izmena" ? `<div class="cal-shift-note-box" style="margin-top: 4px; font-size: 11px;">${s.note}</div>` : ""}

              ${signupsCount > 0 ? `
                <div class="open-shift-signups-container" style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed ${color}50; display: flex; flex-direction: column; gap: 4px;">
                  <div style="font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em;">Prijavljeni zaposleni:</div>
                  ${s.signups.map((su) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                      <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                        <span class="avatar" style="width: 20px; height: 20px; font-size: 9px; font-weight: 700; background: ${color}20; color: ${color}; flex-shrink: 0;">${initials(su.userName)}</span>
                        <span style="font-weight: 700; font-size: 11.5px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${su.userName}</span>
                      </div>
                      <span style="font-size: 9.5px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;">Prijavljen</span>
                    </div>
                  `).join('')}
                  ${!isFull ? `
                    <div style="font-size: 10px; color: #b45309; font-weight: 600; padding: 2px 4px; display: flex; align-items: center; gap: 4px;">
                      <span style="font-size: 10px;">➕</span>
                      <span>Še ${s.requiredSpots - signupsCount} ${getSpotsLabel(s.requiredSpots - signupsCount)}</span>
                    </div>
                  ` : `
                    <div style="font-size: 10px; color: #15803d; font-weight: 700; padding: 2px 4px; display: flex; align-items: center; gap: 4px;">
                      <span style="font-size: 10px;">✓</span>
                      <span>Vsa mesta zasedena</span>
                    </div>
                  `}
                </div>
              ` : `
                <div style="font-size: 10.5px; color: #b45309; font-style: italic; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                  <span>⏳</span><span>Čaka na prijave zaposlenih (${s.requiredSpots} ${getSpotsLabel(s.requiredSpots)})</span>
                </div>
              `}
            </article>
          `;
        })
        .join("");
    }

    const dayExtEvents = (state.showExternalEvents !== false && state.externalEvents)
      ? state.externalEvents.filter((e) => e.date === dateStr)
      : [];
    let extEventsHtml = "";
    if (dayExtEvents.length > 0) {
      extEventsHtml = dayExtEvents
        .map(
          (ev) => `
            <div class="cal-personal-event-chip" style="margin-bottom: 6px; padding: 6px 8px; border-left: 3px solid #94a3b8; background: #f8fafc;" title="Osebni koledar: ${ev.title}">
              <span style="font-size: 12px;">🔒</span>
              <div style="overflow: hidden;">
                <div style="font-weight: 700; color: #475569; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ev.title}</div>
                <div style="font-size: 10px; color: #94a3b8;">${ev.startTime ? `${ev.startTime}${ev.endTime ? ' – ' + ev.endTime : ''}` : 'Celodnevno'} · Osebno</div>
              </div>
            </div>
          `
        )
        .join("");
    }

    let shiftsHtml = "";
    if (regularDayShifts.length === 0 && openShiftsForDay.length === 0 && dayExtEvents.length === 0) {
      shiftsHtml = `<div class="cal-empty-day-placeholder" style="padding: 18px 8px; font-size: 11px;">Ni načrtovanih izmen</div>`;
    } else {
      shiftsHtml = extEventsHtml + openShiftsHtml + regularDayShifts
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
        <div class="cal-week-header ${isToday ? "is-today-header" : ""}">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span class="cal-week-day-name">${SLO_DAY_HEADERS[idx]}</span>
            ${isToday ? `<span class="today-indicator-pill">Danes</span>` : ""}
          </div>
          <div class="cal-week-date-row">
            <span class="cal-week-date-num ${isToday ? "is-today-badge" : ""}">${dayDate.getDate()}. ${SLO_MONTH_NAMES[dayDate.getMonth()].slice(0, 3)}</span>
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
window.setShiftModalType = function (type) {
  const modalShiftTypeInput = $("#modalShiftType");
  if (modalShiftTypeInput) modalShiftTypeInput.value = type;

  const btnAssigned = $("#shiftTypeAssigned");
  const btnOpen = $("#shiftTypeOpen");
  const empGroup = $("#shiftEmployeeGroup");
  const spotsGroup = $("#shiftSpotsGroup");
  const empSelect = $("#modalShiftEmployee");
  const titleEl = $("#shiftModalTitle");
  const saveBtn = $("#saveShiftBtn");
  const isEditing = Boolean($("#modalShiftId")?.value);

  if (type === "open") {
    if (btnOpen) {
      btnOpen.style.background = "#fff";
      btnOpen.style.color = "var(--text-primary)";
      btnOpen.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
    }
    if (btnAssigned) {
      btnAssigned.style.background = "transparent";
      btnAssigned.style.color = "#64748b";
      btnAssigned.style.boxShadow = "none";
    }
    if (empGroup) empGroup.style.display = "none";
    if (spotsGroup) spotsGroup.style.display = "block";
    if (empSelect) empSelect.removeAttribute("required");
    if (titleEl) {
      titleEl.textContent = isEditing ? "Uredi odprto izmeno" : "Objavi odprto izmeno";
    }
    if (saveBtn) saveBtn.textContent = "Objavi odprto izmeno";
  } else {
    if (btnAssigned) {
      btnAssigned.style.background = "#fff";
      btnAssigned.style.color = "var(--text-primary)";
      btnAssigned.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
    }
    if (btnOpen) {
      btnOpen.style.background = "transparent";
      btnOpen.style.color = "#64748b";
      btnOpen.style.boxShadow = "none";
    }
    if (empGroup) empGroup.style.display = "block";
    if (spotsGroup) spotsGroup.style.display = "none";
    if (empSelect) empSelect.setAttribute("required", "required");
    if (titleEl) {
      titleEl.textContent = isEditing ? "Uredi izmeno na urniku" : "Dodaj zaposlenega na urnik";
    }
    if (saveBtn) saveBtn.textContent = "Shrani na urnik";
  }
};

window.adjustShiftSpots = function (delta) {
  const spotsInput = $("#modalShiftRequiredSpots");
  if (!spotsInput) return;
  let val = parseInt(spotsInput.value, 10) || 1;
  val = Math.max(1, Math.min(50, val + delta));
  spotsInput.value = val;
};

window.handleRemoveOpenShiftSignup = async function (openShiftId, signupId, employeeUserId) {
  if (!confirm("Ali res želite odstraniti tega zaposlenega iz odprte izmene?")) return;
  
  // Optimistic local state update
  state.openShifts = (state.openShifts || []).map((os) => {
    if (os.id === openShiftId) {
      return {
        ...os,
        signups: (os.signups || []).filter((su) => (signupId ? su.id !== signupId : true) && su.userId !== employeeUserId),
      };
    }
    return os;
  });
  state.scheduleShifts = (state.scheduleShifts || []).filter(
    (s) => !(s.openShiftId === openShiftId && s.userId === employeeUserId) &&
           !(s.note === "Odprta izmena" && s.userId === employeeUserId)
  );
  localStorage.setItem(getUserStorageKey("open_shifts"), JSON.stringify(state.openShifts));
  localStorage.setItem(getUserStorageKey("schedule_shifts"), JSON.stringify(state.scheduleShifts));

  if (!supabaseClient) {
    openShiftModal(openShiftId, null, null, true);
    renderSchedule();
    return;
  }

  try {
    if (signupId) {
      await supabaseClient.from("open_shift_signups").delete().eq("id", signupId);
    }
    await supabaseClient.from("schedule_shifts").delete().eq("open_shift_id", openShiftId).eq("user_id", employeeUserId);
    await fetchOpenShifts();
    await fetchScheduleShifts();
    openShiftModal(openShiftId, null, null, true);
    renderSchedule();
  } catch (err) {
    console.error("Napaka pri odstranjevanju prijave:", err);
  }
};

window.openShiftModal = function (shiftId = null, defaultDate = null, defaultSectorId = null, isOpenShift = false) {
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
  const spotsInput = $("#modalShiftRequiredSpots");
  const signupsGroup = $("#shiftSignupsGroup");
  const signupsList = $("#shiftSignupsList");
  const signupsCount = $("#shiftSignupsCount");
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

  if (shiftId && isOpenShift) {
    // Edit Open Shift Mode
    const openShift = getEnrichedOpenShifts().find((s) => s.id === shiftId) || (state.openShifts || []).find((s) => s.id === shiftId);
    if (!openShift) return;

    if (idInput) idInput.value = openShift.id;
    window.setShiftModalType("open");
    if (secSelect) secSelect.value = openShift.sectorId;
    if (dateInput) dateInput.value = openShift.date;
    if (startInput) startInput.value = openShift.startTime || "08:00";
    if (endInput) endInput.value = openShift.endTime || "16:00";
    if (spotsInput) spotsInput.value = openShift.requiredSpots || 1;
    if (noteInput) noteInput.value = openShift.note || "";
    if (deleteBtn) deleteBtn.style.display = "inline-flex";

    // Show signups
    if (signupsGroup && signupsList && signupsCount) {
      signupsGroup.style.display = "block";
      const signups = openShift.signups || [];
      signupsCount.textContent = `${signups.length} / ${openShift.requiredSpots}`;
      if (signups.length === 0) {
        signupsList.innerHTML = `<span style="font-size: 12px; color: var(--muted); font-style: italic;">Zaenkrat še ni prijavljenih zaposlenih.</span>`;
      } else {
        signupsList.innerHTML = signups.map((su) => `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
            <span><strong>${su.userName}</strong></span>
            <button type="button" onclick="handleRemoveOpenShiftSignup('${openShift.id}', '${su.id || ''}', '${su.userId}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 11px; font-weight: 700;">Odstrani</button>
          </div>
        `).join("");
      }
    }
  } else if (shiftId) {
    // Edit Assigned Shift Mode
    const shift = (state.scheduleShifts || []).find((s) => s.id === shiftId);
    if (!shift) return;

    if (idInput) idInput.value = shift.id;
    window.setShiftModalType("assigned");
    if (signupsGroup) signupsGroup.style.display = "none";
    if (empSelect) empSelect.value = shift.userId;
    if (secSelect) secSelect.value = shift.sectorId;
    if (dateInput) dateInput.value = shift.date;
    if (startInput) startInput.value = shift.startTime || "08:00";
    if (endInput) endInput.value = shift.endTime || "16:00";
    if (noteInput) noteInput.value = shift.note || "";
    if (deleteBtn) deleteBtn.style.display = "inline-flex";
  } else {
    // Add Mode
    if (idInput) idInput.value = "";
    window.setShiftModalType(isOpenShift ? "open" : "assigned");
    if (signupsGroup) signupsGroup.style.display = "none";
    if (spotsInput) spotsInput.value = 1;

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

  renderShiftModalPresets();
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

function renderShiftModalPresets() {
  const container = $("#shiftModalPresets");
  if (!container) return;

  const presets = state.shiftPresets && state.shiftPresets.length > 0
    ? state.shiftPresets
    : DEFAULT_SHIFT_PRESETS;

  if (presets.length === 0) {
    container.innerHTML = `<span style="font-size: 12px; color: var(--muted); font-style: italic;">Ni nastavljenih hitrih izbir. (Nastavite jih v Nastavitvah)</span>`;
    return;
  }

  container.innerHTML = presets
    .map((p) => {
      const dur = calculateShiftDuration(p.startTime, p.endTime);
      const labelPart = p.label ? `<span style="font-weight: 700; color: var(--primary-dark); margin-right: 4px;">${p.label}:</span>` : "";
      return `
        <button type="button" class="shift-preset-btn" onclick="setShiftPreset('${p.startTime}', '${p.endTime}')">
          ${labelPart}${p.startTime} – ${p.endTime} (${number.format(dur)}h)
        </button>
      `;
    })
    .join("");
}

window.handleDeleteShiftModal = async function () {
  const id = $("#modalShiftId")?.value;
  if (!id) return;
  const isTypeOpen = $("#modalShiftType")?.value === "open";

  const confirmText = isTypeOpen
    ? "Ali ste prepričani, da želite izbrisati to odprto izmeno? S tem se bodo izbrisale tudi vse morebitne prijave zaposlenih."
    : "Ali ste prepričani, da želite izbrisati to izmeno z urnika?";

  if (confirm(confirmText)) {
    if (isTypeOpen) {
      state.openShifts = (state.openShifts || []).filter((s) => s.id !== id);
      localStorage.setItem(getUserStorageKey("open_shifts"), JSON.stringify(state.openShifts));
      closeShiftModal();
      renderSchedule();

      if (supabaseClient && state.currentUser) {
        try {
          await supabaseClient.from("open_shifts").delete().eq("id", id);
          await fetchOpenShifts();
          renderSchedule();
        } catch (e) {
          console.warn("Supabase open_shift delete error:", e);
        }
      }
      syncCalendarFeedToSupabase();
    } else {
      state.scheduleShifts = (state.scheduleShifts || []).filter((s) => s.id !== id);
      localStorage.setItem(getUserStorageKey("schedule_shifts"), JSON.stringify(state.scheduleShifts));
      closeShiftModal();
      renderSchedule();

      if (supabaseClient && state.currentUser) {
        try {
          await supabaseClient.from("schedule_shifts").delete().eq("id", id);
        } catch (e) {
          console.warn("Supabase shift delete error:", e);
        }
      }
      syncCalendarFeedToSupabase();
    }
  }
};

// ============================================================================
// Koledarska povezava (Google Koledar, Apple Koledar, iCal .ics)
// ============================================================================

function generateScheduleICalendar() {
  const companyName = state.companyName || "Moje podjetje";
  const calName = `Urnik 4P - ${companyName}`;
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  let lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Finance 4P//Urnik//SL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calName}`,
    `X-WR-CALDESC:Delovne izmene podjetja ${companyName}`,
    "X-WR-TIMEZONE:Europe/Ljubljana",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Ljubljana",
    "BEGIN:STANDARD",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "END:DAYLIGHT",
    "END:VTIMEZONE"
  ];

  // 1. Dodeljene izmene (Assigned shifts)
  (state.scheduleShifts || []).forEach((s) => {
    if (!s.date || !s.startTime || !s.endTime) return;
    const cleanDate = s.date.slice(0, 10).replace(/-/g, "");
    const [sh, sm] = s.startTime.split(":");
    const [eh, em] = s.endTime.split(":");
    const startStr = `${cleanDate}T${sh.padStart(2, "0")}${sm.padStart(2, "0")}00`;

    // Preveri nočno izmeno (prehod v naslednji dan)
    let endCleanDate = cleanDate;
    const startMinutes = parseInt(sh, 10) * 60 + parseInt(sm, 10);
    const endMinutes = parseInt(eh, 10) * 60 + parseInt(em, 10);
    if (endMinutes <= startMinutes) {
      const parts = s.date.slice(0, 10).split("-").map(Number);
      const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      const ny = nextDay.getFullYear();
      const nm = String(nextDay.getMonth() + 1).padStart(2, "0");
      const nd = String(nextDay.getDate()).padStart(2, "0");
      endCleanDate = `${ny}${nm}${nd}`;
    }
    const endStr = `${endCleanDate}T${eh.padStart(2, "0")}${em.padStart(2, "0")}00`;

    const uid = `shift-${s.id || Math.random().toString(36).slice(2)}@finance4p.si`;
    const summary = `${s.userName || "Zaposleni"} · ${s.sectorName || "Delo"}`;
    const desc = `Zaposleni: ${s.userName || "Zaposleni"}\\nDelovno mesto: ${s.sectorName || ""}\\nČas izmene: ${s.startTime} – ${s.endTime} (${s.hours || 0} ur)${s.note ? `\\nOpomba: ${s.note}` : ""}\\n\\nUrnik Finance 4P`;
    const location = s.sectorName || "";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;TZID=Europe/Ljubljana:${startStr}`);
    lines.push(`DTEND;TZID=Europe/Ljubljana:${endStr}`);
    lines.push(`SUMMARY:${summary.replace(/,/g, "\\,").replace(/;/g, "\\;")}`);
    lines.push(`DESCRIPTION:${desc.replace(/,/g, "\\,").replace(/;/g, "\\;")}`);
    if (location) lines.push(`LOCATION:${location.replace(/,/g, "\\,").replace(/;/g, "\\;")}`);
    lines.push("STATUS:CONFIRMED");
    if (s.color) lines.push(`X-APPLE-CALENDAR-COLOR:${s.color}`);
    lines.push("END:VEVENT");
  });

  // 2. Odprte izmene (Open shifts)
  (state.openShifts || []).forEach((os) => {
    if (!os.date || !os.startTime || !os.endTime) return;
    const cleanDate = os.date.slice(0, 10).replace(/-/g, "");
    const [sh, sm] = os.startTime.split(":");
    const [eh, em] = os.endTime.split(":");
    const startStr = `${cleanDate}T${sh.padStart(2, "0")}${sm.padStart(2, "0")}00`;

    let endCleanDate = cleanDate;
    const startMinutes = parseInt(sh, 10) * 60 + parseInt(sm, 10);
    const endMinutes = parseInt(eh, 10) * 60 + parseInt(em, 10);
    if (endMinutes <= startMinutes) {
      const parts = os.date.slice(0, 10).split("-").map(Number);
      const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      const ny = nextDay.getFullYear();
      const nm = String(nextDay.getMonth() + 1).padStart(2, "0");
      const nd = String(nextDay.getDate()).padStart(2, "0");
      endCleanDate = `${ny}${nm}${nd}`;
    }
    const endStr = `${endCleanDate}T${eh.padStart(2, "0")}${em.padStart(2, "0")}00`;

    const signupsCount = os.signups ? os.signups.length : 0;
    const uid = `open-shift-${os.id || Math.random().toString(36).slice(2)}@finance4p.si`;
    const summary = `🔓 Odprta izmena: ${os.sectorName || "Delo"} (${signupsCount}/${os.requiredSpots || 1})`;
    const desc = `Odprta izmena: ${os.sectorName || ""}\\nPotrebno oseb: ${os.requiredSpots || 1}\\nPrijavljenih: ${signupsCount}\\nČas: ${os.startTime} – ${os.endTime} (${os.hours || 0} ur)${os.note ? `\\nOpomba: ${os.note}` : ""}\\n\\nUrnik Finance 4P`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;TZID=Europe/Ljubljana:${startStr}`);
    lines.push(`DTEND;TZID=Europe/Ljubljana:${endStr}`);
    lines.push(`SUMMARY:${summary.replace(/,/g, "\\,").replace(/;/g, "\\;")}`);
    lines.push(`DESCRIPTION:${desc.replace(/,/g, "\\,").replace(/;/g, "\\;")}`);
    if (os.sectorName) lines.push(`LOCATION:${os.sectorName.replace(/,/g, "\\,").replace(/;/g, "\\;")}`);
    lines.push("STATUS:TENTATIVE");
    lines.push("X-APPLE-CALENDAR-COLOR:#f59e0b");
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function getCalendarFeedToken() {
  let token = localStorage.getItem(getUserStorageKey("calendar_feed_token"));
  if (!token || token.length < 16) {
    const randomHex = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    token = `4p_feed_${randomHex}`;
    localStorage.setItem(getUserStorageKey("calendar_feed_token"), token);
  }
  return token;
}

function getCalendarFeedUrls() {
  const token = getCalendarFeedToken();
  const baseRpcUrl = `${state.supabaseUrl}/rest/v1/rpc/get_calendar_feed?feed_token=${token}&apikey=${state.supabaseKey}`;
  const webcalUrl = baseRpcUrl.replace(/^https?:\/\//i, "webcal://");
  return { httpUrl: baseRpcUrl, webcalUrl, token };
}

async function syncCalendarFeedToSupabase() {
  if (!supabaseClient || !state.currentUser) return;
  try {
    const token = getCalendarFeedToken();
    const icsData = generateScheduleICalendar();
    await supabaseClient.from("calendar_feeds").upsert(
      {
        employer_id: state.currentUser.id,
        token: token,
        calendar_name: `Urnik 4P - ${state.companyName || "Moje podjetje"}`,
        calendar_data: icsData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employer_id" }
    );
  } catch (err) {
    console.warn("Koledarska sinhronizacija opozorilo:", err);
  }
}

function parseICSContent(icsText) {
  const events = [];
  const lines = icsText.split(/\r\n|\n|\r/);
  let inEvent = false;
  let currentEvent = {};

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      currentEvent = {};
    } else if (line === "END:VEVENT") {
      if (currentEvent.date && (currentEvent.title || currentEvent.summary)) {
        events.push({
          id: currentEvent.uid || "ext_" + Math.random().toString(36).slice(2),
          title: currentEvent.title || currentEvent.summary || "Osebna obveznost",
          date: currentEvent.date,
          startTime: currentEvent.startTime || "",
          endTime: currentEvent.endTime || "",
          isExternal: true
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith("SUMMARY:")) {
        currentEvent.title = line.substring(8).replace(/\\,/g, ",").replace(/\\;/g, ";").trim();
      } else if (line.startsWith("UID:")) {
        currentEvent.uid = line.substring(4).trim();
      } else if (line.startsWith("DTSTART")) {
        const val = line.split(":").pop().trim();
        if (val && val.length >= 8) {
          const y = val.slice(0, 4);
          const m = val.slice(4, 6);
          const d = val.slice(6, 8);
          currentEvent.date = `${y}-${m}-${d}`;
          if (val.includes("T")) {
            const timePart = val.split("T")[1];
            currentEvent.startTime = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`;
          }
        }
      } else if (line.startsWith("DTEND")) {
        const val = line.split(":").pop().trim();
        if (val && val.includes("T")) {
          const timePart = val.split("T")[1];
          currentEvent.endTime = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`;
        }
      }
    }
  }
  return events;
}

function updateExternalCalStatusUI(corsWarning = false) {
  const statusEl = $("#externalCalStatus");
  const clearBtn = $("#clearExternalCalBtn");
  const eventsCount = (state.externalEvents || []).length;
  const savedUrl = localStorage.getItem(getUserStorageKey("external_cal_url")) || "";

  if (clearBtn) {
    clearBtn.style.display = eventsCount > 0 || savedUrl ? "inline-flex" : "none";
  }

  if (!statusEl) return;
  if (eventsCount > 0) {
    statusEl.innerHTML = `<span style="color: #10b981; font-weight: 700;">✓ Naloženih ${eventsCount} osebnih dogodkov.</span> Prikažejo se na urniku kot zasedeni termini.`;
  } else if (savedUrl && corsWarning) {
    statusEl.innerHTML = `<span style="color: #f59e0b; font-weight: 600;">⚠ URL je shranjen.</span> Ker brskalniki zaradi varnosti (CORS) blokirajo neposredno branje zunanjih koledarjev, kliknite <em>Naloži .ics datoteko</em> za takojšen prikaz dogodkov.`;
  } else if (savedUrl) {
    statusEl.innerHTML = `<span style="color: #10b981; font-weight: 700;">✓ URL shranjen.</span>`;
  } else {
    statusEl.innerHTML = `Ni naloženih osebnih koledarjev.`;
  }
}

window.openCalendarSyncModal = function () {
  const modal = $("#calendarSyncModal");
  if (!modal) return;

  const { httpUrl, webcalUrl } = getCalendarFeedUrls();
  const urlInput = $("#calSyncFeedUrl");
  if (urlInput) urlInput.value = httpUrl;

  const extUrlInput = $("#employerExternalCalUrl");
  if (extUrlInput) {
    extUrlInput.value = localStorage.getItem(getUserStorageKey("external_cal_url")) || "";
  }

  const toggleCheckbox = $("#toggleShowExternalEvents");
  if (toggleCheckbox) {
    toggleCheckbox.checked = state.showExternalEvents !== false;
  }

  updateExternalCalStatusUI();

  // Takoj sinhroniziraj najnovejše stanje v Supabase
  syncCalendarFeedToSupabase();

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.style.display = "block";
  }
};

window.closeCalendarSyncModal = function () {
  const modal = $("#calendarSyncModal");
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.style.display = "none";
  }
};

window.copyCalendarFeedUrl = function () {
  const urlInput = $("#calSyncFeedUrl");
  if (!urlInput || !urlInput.value) return;

  navigator.clipboard
    .writeText(urlInput.value)
    .then(() => {
      const copyBtn = $("#copyCalSyncUrlBtn");
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "✓ Kopirano!";
        copyBtn.style.background = "#10b981";
        copyBtn.style.borderColor = "#10b981";
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = "";
          copyBtn.style.borderColor = "";
        }, 2500);
      }
      showToast("Povezava koledarja je kopirana v odložišče.", "success");
    })
    .catch(() => {
      urlInput.select();
      document.execCommand("copy");
      showToast("Povezava kopirana.", "success");
    });
};

window.downloadScheduleICS = function () {
  const icsData = generateScheduleICalendar();
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const compSlug = slugify(state.companyName || "4p");
  link.download = `Urnik_4P_${compSlug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Datoteka koledarja (.ics) je bila uspešno prenesena.", "success");
};

window.subscribeAppleCalendar = function () {
  const { webcalUrl } = getCalendarFeedUrls();
  window.downloadScheduleICS();
  try {
    const hiddenIframe = document.createElement("iframe");
    hiddenIframe.style.display = "none";
    hiddenIframe.src = webcalUrl;
    document.body.appendChild(hiddenIframe);
    setTimeout(() => hiddenIframe.remove(), 2000);
  } catch (e) {}
  showToast("Datoteka za Apple Koledar je pripravljena. Ob uvozu izberite 'Nov koledar' za ločen prikaz.", "success");
};

window.openGoogleCalendarImport = function () {
  window.copyCalendarFeedUrl();
  window.open("https://calendar.google.com/calendar/r/settings/addbyurl", "_blank");
  showToast("Odprt je Google Koledar. V polje 'URL koledarja' prilepite kopirano povezavo.", "success");
};

window.handleExternalICSFileUpload = function (e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const text = evt.target.result;
      const events = parseICSContent(text);
      if (events.length === 0) {
        showToast("V datoteki ni bilo mogoče najti nobenih dogodkov.", "error");
        return;
      }
      state.externalEvents = events;
      localStorage.setItem(getUserStorageKey("external_cal_events"), JSON.stringify(events));
      updateExternalCalStatusUI();
      renderSchedule();
      showToast(`Uspešno uvoženih ${events.length} osebnih dogodkov.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Napaka pri branju .ics datoteke.", "error");
    }
  };
  reader.readAsText(file);
};

window.saveExternalCalendarUrl = async function () {
  const input = $("#employerExternalCalUrl");
  const val = input ? input.value.trim() : "";
  localStorage.setItem(getUserStorageKey("external_cal_url"), val);

  if (!val) {
    updateExternalCalStatusUI();
    showToast("Povezava osebnega koledarja odstranjena.", "info");
    return;
  }

  showToast("Preverjam koledarsko povezavo...", "info");
  const cleanUrl = val.replace(/^webcal:\/\//i, "https://");
  try {
    const res = await fetch(cleanUrl);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    const events = parseICSContent(text);
    state.externalEvents = events;
    localStorage.setItem(getUserStorageKey("external_cal_events"), JSON.stringify(events));
    updateExternalCalStatusUI();
    renderSchedule();
    showToast(`Povezava potrjena! Naloženih ${events.length} osebnih dogodkov.`, "success");
  } catch (err) {
    console.warn("Neposredno branje URL ni uspelo (CORS):", err);
    updateExternalCalStatusUI(true);
    showToast("URL je shranjen. Za takojšen prikaz dogodkov uporabite gumb 'Naloži .ics datoteko'.", "info");
  }
};

window.clearExternalCalendarEvents = function () {
  state.externalEvents = [];
  localStorage.removeItem(getUserStorageKey("external_cal_events"));
  localStorage.removeItem(getUserStorageKey("external_cal_url"));
  const input = $("#employerExternalCalUrl");
  if (input) input.value = "";
  const fileInput = $("#employerExternalCalFile");
  if (fileInput) fileInput.value = "";
  updateExternalCalStatusUI();
  renderSchedule();
  showToast("Osebni dogodki so odstranjeni z urnika.", "info");
};

window.toggleExternalEventsVisibility = function (e) {
  state.showExternalEvents = e.target.checked;
  localStorage.setItem(getUserStorageKey("show_external_cal"), String(state.showExternalEvents));
  renderSchedule();
};

function renderAll() {
  initDefaultScheduleShifts();
  renderOverview();
  renderSectors();
  renderFilters();
  renderEmployees();
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
    topbarMonthSwitcher.style.display = (view === "schedule") ? "none" : "flex";
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
  const currentUserId = state.currentUser ? state.currentUser.id : "";
  const notesWithTag = currentUserId ? `[emp:${currentUserId}] ${notes}`.trim() : notes;

  // Optimistic instant UI update
  state.sectors.push({ id, name, color, notes, code });
  closeSectorModalDialog();
  renderAll();

  if (supabaseClient && state.currentUser) {
    try {
      const { data, error } = await supabaseClient.from("workplaces").insert([
        {
          name: name,
          sector_name: name,
          sector_color: color,
          sector_notes: notesWithTag,
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
  localStorage.setItem(getUserStorageKey("company_name"), newCompanyName);

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

// Add Shift Preset Form
$("#addShiftPresetForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const startInput = $("#newPresetStartTime");
  const endInput = $("#newPresetEndTime");
  const labelInput = $("#newPresetLabel");
  const start = startInput ? startInput.value : "";
  const end = endInput ? endInput.value : "";
  const label = labelInput ? labelInput.value : "";
  if (start && end) {
    handleAddShiftPreset(start, end, label);
    if (labelInput) labelInput.value = "";
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

$("#shiftModalForm")?.addEventListener("submit", async (e) => {
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

  const typeInput = $("#modalShiftType");
  const isTypeOpen = typeInput?.value === "open";
  const sec = state.sectors.find((item) => item.id === sectorId);
  const sectorName = sec ? sec.name : "Sektor";
  const color = sec ? sec.color || "#56829d" : "#56829d";
  const hours = calculateShiftDuration(startTime, endTime);
  const existingId = idInput.value;

  if (isTypeOpen) {
    const spotsInput = $("#modalShiftRequiredSpots");
    const requiredSpots = parseInt(spotsInput?.value, 10) || 1;

    if (!sectorId || !date || !startTime || !endTime) {
      alert("Prosimo, izpolnite vsa obvezna polja.");
      return;
    }

    const openShiftId = existingId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "os_" + Date.now() + "_" + Math.floor(Math.random() * 1000));

    if (!state.openShifts) state.openShifts = [];
    const openShiftRecord = {
      id: openShiftId,
      isOpenShift: true,
      workplaceId: sectorId,
      sectorId: sectorId,
      sectorName: sectorName,
      color: color,
      date: date,
      startTime: startTime,
      endTime: endTime,
      hours: hours,
      requiredSpots: requiredSpots,
      note: note,
      signups: (state.openShifts.find(s => s.id === openShiftId)?.signups || [])
    };

    const exIndex = state.openShifts.findIndex(s => s.id === openShiftId);
    if (exIndex >= 0) {
      state.openShifts[exIndex] = openShiftRecord;
    } else {
      state.openShifts.push(openShiftRecord);
    }
    localStorage.setItem(getUserStorageKey("open_shifts"), JSON.stringify(state.openShifts));
    closeShiftModal();
    renderSchedule();

    if (supabaseClient && state.currentUser) {
      try {
        await supabaseClient.from("open_shifts").upsert({
          id: openShiftId,
          employer_id: state.currentUser.id,
          workplace_id: sectorId,
          date: date,
          start_time: startTime,
          end_time: endTime,
          hours: hours,
          required_spots: requiredSpots,
          note: note
        });
        await fetchOpenShifts();
        renderSchedule();
      } catch (err) {
        console.warn("Supabase open_shifts upsert error:", err);
      }
    }
    syncCalendarFeedToSupabase();
    return;
  }

  // Assigned shift
  if (!userId || !sectorId || !date || !startTime || !endTime) {
    alert("Prosimo, izpolnite vsa obvezna polja.");
    return;
  }

  const emp = state.employees.find((item) => item.id === userId);
  const userName = emp ? emp.name : "Zaposleni";

  if (!state.scheduleShifts) state.scheduleShifts = [];

  const shiftId = existingId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "shift_" + Date.now() + "_" + Math.floor(Math.random() * 1000));
  const shiftRecord = {
    id: shiftId,
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

  if (existingId) {
    const idx = state.scheduleShifts.findIndex((s) => s.id === existingId);
    if (idx !== -1) {
      state.scheduleShifts[idx] = shiftRecord;
    } else {
      state.scheduleShifts.push(shiftRecord);
    }
  } else {
    state.scheduleShifts.push(shiftRecord);
  }

  localStorage.setItem(getUserStorageKey("schedule_shifts"), JSON.stringify(state.scheduleShifts));
  closeShiftModal();
  renderSchedule();

  if (supabaseClient && state.currentUser) {
    try {
      await supabaseClient.from("schedule_shifts").upsert({
        id: shiftId,
        employer_id: state.currentUser.id,
        workplace_id: sectorId,
        user_id: userId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        hours: hours,
        note: note || "",
      });
    } catch (err) {
      console.warn("Supabase schedule_shifts upsert error:", err);
    }
  }
  syncCalendarFeedToSupabase();
});

// Back button from Employee Detail
$("#backToEmployeesList")?.addEventListener("click", () => {
  window.closeEmployeeDetail();
});

// Dismiss button from Employee Detail
$("#dismissEmployeeBtn")?.addEventListener("click", () => {
  if (state.selectedEmployeeId) {
    handleDismissEmployee(state.selectedEmployeeId);
  }
});

// Bootstrapping
initSupabase();
renderAll();
