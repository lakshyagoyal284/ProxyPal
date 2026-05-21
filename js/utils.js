/**
 * ProxyPal - Utility Functions
 * Data layer now uses the API backend. Falls back to localStorage cache for fast reads.
 */

const ProxyPalStorage = {
  KEYS: {
    TASKS: "proxypal_tasks",
    PROXYPALS: "proxypal_workers",
    USERS: "proxypal_users",
    CONTACTS: "proxypal_contacts",
    CURRENT_USER: "proxypal_current_user",
    ACTIVE_WORKER: "proxypal_active_worker",
    THEME: "proxypal_theme",
    INITIALIZED: "proxypal_initialized"
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Storage read error:", e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage write error:", e);
      return false;
    }
  },

  generateId() {
    return "pp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }
};

/**
 * Sample dataset for demo - seeds localStorage on first visit (no API fallback)
 */
function initSampleData() {
  if (localStorage.getItem(ProxyPalStorage.KEYS.INITIALIZED)) return;
  localStorage.setItem(ProxyPalStorage.KEYS.INITIALIZED, "true");
}

// ─── Tasks (async - API backed) ───────────────────

/** Get all task requests */
async function getTasks() {
  try {
    const data = await ProxyPalAPI.getTasks();
    return data.tasks || [];
  } catch (e) {
    console.warn("getTasks fallback to localStorage:", e.message);
    return ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
  }
}

/** Save new task request */
async function saveTask(task) {
  task.id = task.id || ProxyPalStorage.generateId();
  task.status = task.status || "pending";
  task.createdAt = task.createdAt || new Date().toISOString();

  try {
    const data = await ProxyPalAPI.createTask(task);
    return data.task || task;
  } catch (e) {
    console.warn("saveTask fallback to localStorage:", e.message);
    const tasks = ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
    tasks.unshift(task);
    ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
    return task;
  }
}

/** Update task status */
async function updateTaskStatus(id, status) {
  try {
    const data = await ProxyPalAPI.updateTaskStatus(id, status);
    return data.task || null;
  } catch (e) {
    console.warn("updateTaskStatus fallback to localStorage:", e.message);
    const tasks = ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx].status = status;
      ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
      return tasks[idx];
    }
    return null;
  }
}

/** Delete task by id */
async function deleteTask(id) {
  try {
    await ProxyPalAPI.deleteTask(id);
    return true;
  } catch (e) {
    console.warn("deleteTask fallback to localStorage:", e.message);
    const tasks = ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
    ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks.filter((t) => t.id !== id));
    return true;
  }
}

// ─── Workers (ProxyPals) ──────────────────────

/** Get all ProxyPals */
async function getProxyPals() {
  try {
    const data = await ProxyPalAPI.getWorkers();
    return data.workers || [];
  } catch (e) {
    console.warn("getProxyPals fallback to localStorage:", e.message);
    return ProxyPalStorage.get(ProxyPalStorage.KEYS.PROXYPALS) || [];
  }
}

/** Save new ProxyPal registration */
async function saveProxyPal(worker) {
  worker.id = worker.id || ProxyPalStorage.generateId();
  worker.rating = worker.rating || 5.0;
  worker.createdAt = worker.createdAt || new Date().toISOString();

  try {
    const data = await ProxyPalAPI.registerWorker(worker);
    setActiveProxyPal(data.worker || worker);
    return data.worker || worker;
  } catch (e) {
    console.warn("saveProxyPal fallback to localStorage:", e.message);
    const workers = ProxyPalStorage.get(ProxyPalStorage.KEYS.PROXYPALS) || [];
    workers.unshift(worker);
    ProxyPalStorage.set(ProxyPalStorage.KEYS.PROXYPALS, workers);
    setActiveProxyPal(worker);
    return worker;
  }
}

/** Delete ProxyPal */
async function deleteProxyPal(id) {
  try {
    await ProxyPalAPI.deleteWorker(id);
    return true;
  } catch (e) {
    console.warn("deleteProxyPal fallback to localStorage:", e.message);
    const workers = ProxyPalStorage.get(ProxyPalStorage.KEYS.PROXYPALS) || [];
    ProxyPalStorage.set(ProxyPalStorage.KEYS.PROXYPALS, workers.filter((w) => w.id !== id));
    return true;
  }
}

/** Currently logged-in ProxyPal (cached in localStorage for fast sync access) */
function getActiveProxyPal() {
  return ProxyPalStorage.get(ProxyPalStorage.KEYS.ACTIVE_WORKER);
}

function setActiveProxyPal(worker) {
  ProxyPalStorage.set(ProxyPalStorage.KEYS.ACTIVE_WORKER, worker);
}

/** Refresh active worker from API */
async function refreshActiveProxyPal() {
  try {
    const data = await ProxyPalAPI.getMyWorkerProfile();
    if (data.worker) {
      setActiveProxyPal(data.worker);
      return data.worker;
    }
  } catch (e) {
    // ignore
  }
  return getActiveProxyPal();
}

/** ProxyPal accepts a posted task */
async function acceptTask(taskId) {
  const worker = getActiveProxyPal();
  if (!worker) return { ok: false, error: "not_registered" };

  try {
    const data = await ProxyPalAPI.acceptTask(taskId);
    return { ok: true, task: data.task };
  } catch (e) {
    if (e.error === "unavailable" || e.error === "not_found" || e.error === "not_registered") {
      return { ok: false, error: e.error };
    }
    console.warn("acceptTask fallback:", e.message);
    // Fallback: do it locally
    const tasks = ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
    const idx = tasks.findIndex(function (t) { return t.id === taskId; });
    if (idx === -1) return { ok: false, error: "not_found" };
    if (tasks[idx].status !== "pending") return { ok: false, error: "unavailable" };
    tasks[idx].status = "active";
    tasks[idx].assignedTo = worker.id;
    tasks[idx].assignedName = worker.name;
    tasks[idx].acceptedAt = new Date().toISOString();
    ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
    return { ok: true, task: tasks[idx] };
  }
}

/** Mark accepted task complete — enforces 60% time rule */
async function completeAcceptedTask(taskId) {
  const worker = getActiveProxyPal();

  try {
    const data = await ProxyPalAPI.completeTask(taskId);
    return data.task;
  } catch (e) {
    if (e.error === "60% of task time not yet elapsed.") {
      return { error: e.error, progress: e.progress };
    }
    console.warn("completeAcceptedTask fallback:", e.message);
    // Fallback
    const tasks = ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
    const idx = tasks.findIndex(function (t) { return t.id === taskId; });
    if (idx === -1) return null;
    if (worker && tasks[idx].assignedTo && tasks[idx].assignedTo !== worker.id) return null;
    const check = canCompleteTaskLocal(tasks[idx]);
    if (!check.allowed) return { error: check.reason };
    tasks[idx].status = "completed";
    tasks[idx].completedAt = new Date().toISOString();
    ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
    return tasks[idx];
  }
}

/** Parse duration string to minutes */
function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;
  const hourMatch = durationStr.match(/(\d+)\s*hours?/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  const hourPlusMatch = durationStr.match(/(\d+)\+\s*hours?/i);
  if (hourPlusMatch) return parseInt(hourPlusMatch[1], 10) * 60;
  const minMatch = durationStr.match(/(\d+)\s*mins?/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  if (/half/i.test(durationStr)) return 30;
  return 0;
}

/** Check 60% time rule - async, fetches task by id */
async function canCompleteTask(taskId) {
  try {
    const tasks = await getTasks();
    const task = tasks.find(function (t) { return t.id === taskId; });
    if (!task) return { allowed: false, reason: "Task not found", progress: 0 };
    return canCompleteTaskLocal(task);
  } catch (e) {
    return { allowed: false, reason: "Error checking task", progress: 0 };
  }
}

/** Check 60% time rule (local version for fallback) */
function canCompleteTaskLocal(task) {
  if (task.status !== "active") return { allowed: false, reason: "Task is not active." };
  if (!task.acceptedAt) return { allowed: true, progress: 100 };
  const acceptedAt = new Date(task.acceptedAt);
  const now = new Date();
  const totalMinutes = parseDurationToMinutes(task.duration);
  if (totalMinutes <= 0) return { allowed: true, progress: 100 };
  const elapsedMinutes = (now.getTime() - acceptedAt.getTime()) / (1000 * 60);
  const progress = Math.min(100, Math.round((elapsedMinutes / totalMinutes) * 100));
  if (elapsedMinutes < totalMinutes * 0.6) {
    const remainingMs = Math.max(0, (totalMinutes * 0.6 - elapsedMinutes) * 60 * 1000);
    return {
      allowed: false,
      reason: "60% of task time not yet elapsed.",
      progress,
      remainingMs,
      totalMinutes,
      sixtyPercentMinutes: Math.round(totalMinutes * 0.6),
    };
  }
  return { allowed: true, progress: progress };
}

/** Get the active task for the current worker */
async function getWorkerActiveTask() {
  const worker = getActiveProxyPal();
  if (!worker) return null;
  try {
    const tasks = await getTasks();
    return tasks.find(function (t) {
      return t.assigned_to === worker.id && t.status === "active";
    }) || tasks.find(function (t) {
      return t.assignedTo === worker.id && t.status === "active";
    }) || null;
  } catch (e) {
    return null;
  }
}

/** Check if worker has an active task (navigation lockdown) */
async function hasActiveTaskLock() {
  const worker = getActiveProxyPal();
  if (!worker) return false;
  try {
    const tasks = await getTasks();
    return tasks.some(function (t) {
      const assigned = t.assigned_to || t.assignedTo;
      return assigned === worker.id && (t.status === "active");
    });
  } catch (e) {
    return false;
  }
}

// ─── Contact ──────────────────────────────────

/** Save contact message */
async function saveContact(message) {
  message.id = message.id || ProxyPalStorage.generateId();
  message.createdAt = message.createdAt || new Date().toISOString();
  try {
    const data = await ProxyPalAPI.submitContact(message);
    return data.contact || message;
  } catch (e) {
    console.warn("saveContact fallback to localStorage:", e.message);
    const contacts = ProxyPalStorage.get(ProxyPalStorage.KEYS.CONTACTS) || [];
    contacts.unshift(message);
    ProxyPalStorage.set(ProxyPalStorage.KEYS.CONTACTS, contacts);
    return message;
  }
}

// ─── Auth (sync cache + async API) ────────────

/** Get current logged-in user (sync - from localStorage cache) */
function getCurrentUser() {
  return ProxyPalStorage.get(ProxyPalStorage.KEYS.CURRENT_USER);
}

/** Login user (async - calls API) */
async function loginUser(email, password) {
  try {
    const data = await ProxyPalAPI.login(email, password);
    if (data.user) {
      // Cache user in localStorage for fast sync access
      ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, data.user);
      // Also store in users list for backward compat
      const users = ProxyPalStorage.get(ProxyPalStorage.KEYS.USERS) || [];
      const idx = users.findIndex((u) => u.email === email.toLowerCase());
      if (idx === -1) {
        users.push(data.user);
      } else {
        users[idx] = data.user;
      }
      ProxyPalStorage.set(ProxyPalStorage.KEYS.USERS, users);
      return data.user;
    }
    return null;
  } catch (e) {
    console.warn("loginUser fallback:", e.message);
    // Fallback to localStorage demo mode
    const users = ProxyPalStorage.get(ProxyPalStorage.KEYS.USERS) || [];
    let user = users.find((u) => u.email === email);
    if (!user && email) {
      user = {
        id: ProxyPalStorage.generateId(),
        name: email.split("@")[0],
        email: email,
        role: "client",
        avatar: "https://i.pravatar.cc/150?u=" + encodeURIComponent(email),
        joinedAt: new Date().toISOString()
      };
      users.push(user);
      ProxyPalStorage.set(ProxyPalStorage.KEYS.USERS, users);
    }
    if (user) {
      ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, user);
      return user;
    }
    return null;
  }
}

/** Register user (async - calls API) */
async function registerUser(name, email, password) {
  try {
    const data = await ProxyPalAPI.register(name, email, password);
    if (data.user) {
      ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, data.user);
      const users = ProxyPalStorage.get(ProxyPalStorage.KEYS.USERS) || [];
      users.push(data.user);
      ProxyPalStorage.set(ProxyPalStorage.KEYS.USERS, users);
      return data.user;
    }
    return null;
  } catch (e) {
    console.warn("registerUser fallback:", e.message);
    const user = {
      id: ProxyPalStorage.generateId(),
      name: name,
      email: email.toLowerCase(),
      role: "client",
      avatar: "https://i.pravatar.cc/150?u=" + encodeURIComponent(email),
      joinedAt: new Date().toISOString()
    };
    const users = ProxyPalStorage.get(ProxyPalStorage.KEYS.USERS) || [];
    users.push(user);
    ProxyPalStorage.set(ProxyPalStorage.KEYS.USERS, users);
    ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, user);
    return user;
  }
}

/** Logout current user */
function logoutUser() {
  ProxyPalAPI.logout();
  ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, null);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.ACTIVE_WORKER, null);
}

// ─── Utility functions (unchanged) ────────────

function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getStatusBadge(status) {
  const map = {
    pending: '<span class="badge badge-pending">Pending</span>',
    active: '<span class="badge badge-active">Active</span>',
    completed: '<span class="badge badge-completed">Completed</span>',
    cancelled: '<span class="badge badge-cancelled">Cancelled</span>'
  };
  return map[status] || map.pending;
}

const INDIAN_CITIES = [
  "Mumbai, Maharashtra", "Delhi, NCR", "Bangalore, Karnataka", "Hyderabad, Telangana",
  "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Pune, Maharashtra", "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Kochi, Kerala", "Chandigarh",
  "Indore, Madhya Pradesh", "Bhopal, Madhya Pradesh", "Nagpur, Maharashtra", "Surat, Gujarat",
  "Vadodara, Gujarat", "Coimbatore, Tamil Nadu", "Visakhapatnam, Andhra Pradesh", "Goa"
];

const TASK_TYPES = [
  "Queue Standing", "Government Office", "Appointment Attendance", "Form Submission",
  "Delivery Wait", "Bank Visit", "Event Registration", "Shopping / Errands", "Other"
];

const LIVE_NOTIFICATIONS = [
  { name: "Rahul", city: "Pune" }, { name: "Priya", city: "Mumbai" },
  { name: "Arjun", city: "Bangalore" }, { name: "Sneha", city: "Hyderabad" },
  { name: "Vikram", city: "Delhi" }, { name: "Anita", city: "Chennai" },
  { name: "Karan", city: "Jaipur" }, { name: "Meera", city: "Kochi" }
];

function calculatePrice(hours, hourlyRate) {
  const h = parseFloat(hours) || 0;
  const r = parseFloat(hourlyRate) || 150;
  const base = h * r;
  const platformFee = base * 0.1;
  return { subtotal: base, platformFee: platformFee, total: base + platformFee };
}

function showToast(message, type = "success") {
  const toastEl = document.getElementById("globalToast");
  if (!toastEl) return;
  const body = toastEl.querySelector(".toast-message") || toastEl.querySelector(".toast-body");
  const icon = toastEl.querySelector(".toast-icon");
  if (body) body.textContent = message;
  toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-info");
  toastEl.classList.add("text-bg-" + (type === "error" ? "danger" : type === "info" ? "info" : "success"));
  if (icon) {
    icon.className = "toast-icon fa-solid " +
      (type === "error" ? "fa-circle-xmark" : type === "info" ? "fa-circle-info" : "fa-circle-check");
  }
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[\d\s+\-()]{10,15}$/.test(phone.replace(/\s/g, ""));
}

function readFileAsDataURL(file, callback) {
  if (!file) { callback(null); return; }
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.onerror = () => callback(null);
  reader.readAsDataURL(file);
}

function renderEmptyStateHtml(icon, title, message, ctaHtml) {
  return ('<div class="empty-state glass-card">' +
    '<i class="fa-solid ' + icon + '"></i>' +
    "<h4>" + title + "</h4>" +
    '<p class="text-secondary">' + message + "</p>" +
    (ctaHtml || "") +
    "</div>").replace(/<\/?motion>/g, "");
}
