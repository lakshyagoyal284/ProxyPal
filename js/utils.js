/**
 * ProxyPal - Utility Functions & localStorage Management
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
 * Sample dataset for demo - seeds localStorage on first visit
 */
function initSampleData() {
  if (localStorage.getItem(ProxyPalStorage.KEYS.INITIALIZED)) return;

  const sampleTasks = [
    {
      id: "pp_task_001",
      fullName: "Priya Sharma",
      phone: "+91 98765 43210",
      taskType: "Queue Standing",
      location: "DMart, Koregaon Park, Pune",
      clientLocation: "Koregaon Park, Pune",
      dateTime: "2026-05-18T09:00",
      duration: "3 hours",
      budget: 450,
      description: "Need someone to stand in line for iPhone launch sale.",
      status: "active",
      createdAt: "2026-05-10T08:00:00Z",
      acceptedAt: "2026-05-18T08:45:00Z",
      assignedTo: "pp_worker_001",
      assignedName: "Rahul Deshmukh",
      imageRef: null
    },
    {
      id: "pp_task_002",
      fullName: "Arjun Mehta",
      phone: "+91 91234 56789",
      taskType: "Government Office",
      location: "RTO Office, Andheri, Mumbai",
      clientLocation: "Andheri East, Mumbai",
      dateTime: "2026-05-12T10:30",
      duration: "4 hours",
      budget: 600,
      description: "Submit driving license renewal forms and collect receipt.",
      status: "completed",
      createdAt: "2026-05-08T14:00:00Z",
      imageRef: null
    },
    {
      id: "pp_task_003",
      fullName: "Sneha Reddy",
      phone: "+91 99887 76655",
      taskType: "Delivery Wait",
      location: "Whitefield, Bangalore",
      clientLocation: "Whitefield Main Road, Bangalore",
      dateTime: "2026-05-20T14:00",
      duration: "2 hours",
      budget: 300,
      description: "Wait at home for furniture delivery and inspect package.",
      status: "pending",
      createdAt: "2026-05-14T11:00:00Z",
      imageRef: null
    },
    {
      id: "pp_task_004",
      fullName: "Karan Patel",
      phone: "+91 98123 45678",
      taskType: "Bank Visit",
      location: "HDFC Bank, Connaught Place, Delhi",
      clientLocation: "Connaught Place, Delhi",
      dateTime: "2026-05-22T11:00",
      duration: "2 hours",
      budget: 400,
      description: "Collect passbook update and submit cheque deposit form.",
      status: "pending",
      createdAt: "2026-05-15T09:00:00Z",
      imageRef: null
    },
    {
      id: "pp_task_005",
      fullName: "Meera Iyer",
      phone: "+91 97654 32109",
      taskType: "Appointment Attendance",
      location: "Apollo Clinic, Indiranagar, Bangalore",
      clientLocation: "Indiranagar, Bangalore",
      dateTime: "2026-05-19T08:30",
      duration: "1 hour",
      budget: 250,
      description: "Attend doctor follow-up and collect prescription.",
      status: "pending",
      createdAt: "2026-05-15T14:00:00Z",
      imageRef: null
    }
  ];

  const sampleProxyPals = [
    {
      id: "pp_worker_001",
      name: "Rahul Deshmukh",
      age: 28,
      skills: "Queue standing, Appointments, Form submission",
      city: "Pune",
      availability: "Mon-Sat, 8 AM - 8 PM",
      hourlyRate: 150,
      experience: "2 years as queue proxy. 150+ tasks completed.",
      rating: 4.8,
      createdAt: "2025-11-01T00:00:00Z"
    },
    {
      id: "pp_worker_002",
      name: "Anita Joshi",
      age: 32,
      skills: "Government offices, Document pickup, Bank visits",
      city: "Mumbai",
      availability: "Weekdays, 9 AM - 6 PM",
      hourlyRate: 200,
      experience: "Former admin assistant. Expert in Mumbai govt offices.",
      rating: 4.9,
      createdAt: "2025-09-15T00:00:00Z"
    },
    {
      id: "pp_worker_003",
      name: "Vikram Singh",
      age: 24,
      skills: "Delivery wait, Event queuing, Shopping",
      city: "Delhi",
      availability: "Flexible - Full time",
      hourlyRate: 120,
      experience: "College student. Available for short tasks.",
      rating: 4.5,
      createdAt: "2026-01-20T00:00:00Z"
    }
  ];

  const sampleUser = {
    id: "pp_user_demo",
    name: "Demo User",
    email: "demo@proxypal.in",
    phone: "+91 90000 12345",
    role: "client",
    avatar: "https://i.pravatar.cc/150?u=demo",
    joinedAt: "2026-01-01T00:00:00Z"
  };

  ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, sampleTasks);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.PROXYPALS, sampleProxyPals);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.USERS, [sampleUser]);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.CONTACTS, []);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, sampleUser);
  localStorage.setItem(ProxyPalStorage.KEYS.INITIALIZED, "true");
}

/** Get all task requests */
function getTasks() {
  return ProxyPalStorage.get(ProxyPalStorage.KEYS.TASKS) || [];
}

/** Save new task request */
function saveTask(task) {
  const tasks = getTasks();
  task.id = ProxyPalStorage.generateId();
  task.status = task.status || "pending";
  task.createdAt = new Date().toISOString();
  tasks.unshift(task);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
  return task;
}

/** Update task status */
function updateTaskStatus(id, status) {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks[idx].status = status;
    ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
    return tasks[idx];
  }
  return null;
}

/** Delete task by id */
function deleteTask(id) {
  const tasks = getTasks().filter((t) => t.id !== id);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
}

/** Get all ProxyPals */
function getProxyPals() {
  return ProxyPalStorage.get(ProxyPalStorage.KEYS.PROXYPALS) || [];
}

/** Save new ProxyPal registration */
function saveProxyPal(worker) {
  const workers = getProxyPals();
  worker.id = ProxyPalStorage.generateId();
  worker.rating = 5.0;
  worker.createdAt = new Date().toISOString();
  workers.unshift(worker);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.PROXYPALS, workers);
  return worker;
}

/** Delete ProxyPal */
function deleteProxyPal(id) {
  const workers = getProxyPals().filter((w) => w.id !== id);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.PROXYPALS, workers);
}

/** Currently logged-in ProxyPal (after registration) */
function getActiveProxyPal() {
  return ProxyPalStorage.get(ProxyPalStorage.KEYS.ACTIVE_WORKER);
}

function setActiveProxyPal(worker) {
  ProxyPalStorage.set(ProxyPalStorage.KEYS.ACTIVE_WORKER, worker);
}

/** ProxyPal accepts a posted task */
function acceptTask(taskId) {
  const worker = getActiveProxyPal();
  if (!worker) return { ok: false, error: "not_registered" };

  const tasks = getTasks();
  const idx = tasks.findIndex(function (t) {
    return t.id === taskId;
  });
  if (idx === -1) return { ok: false, error: "not_found" };

  const task = tasks[idx];
  if (task.status !== "pending") {
    return { ok: false, error: "unavailable" };
  }

  task.status = "active";
  task.assignedTo = worker.id;
  task.assignedName = worker.name;
  task.acceptedAt = new Date().toISOString();
  tasks[idx] = task;
  ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
  return { ok: true, task: task };
}

/** Mark accepted task complete (ProxyPal) — enforces 60% time rule */
function completeAcceptedTask(taskId) {
  const worker = getActiveProxyPal();
  const tasks = getTasks();
  const idx = tasks.findIndex(function (t) {
    return t.id === taskId;
  });
  if (idx === -1) return null;
  if (worker && tasks[idx].assignedTo && tasks[idx].assignedTo !== worker.id) {
    return null;
  }

  // Check 60% time rule
  const check = canCompleteTask(taskId);
  if (!check.allowed) {
    return { error: check.reason };
  }

  tasks[idx].status = "completed";
  tasks[idx].completedAt = new Date().toISOString();
  ProxyPalStorage.set(ProxyPalStorage.KEYS.TASKS, tasks);
  return tasks[idx];
}

/** Parse duration string like "3 hours", "1 hour", "2 hours" to total minutes */
function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;
  // Handle hours: "3 hours", "1 hour", "2 hrs", "5+ hours", etc.
  const hourMatch = durationStr.match(/(\d+)\s*hours?/i);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60;
  }
  // Handle "5+ hours" pattern
  const hourPlusMatch = durationStr.match(/(\d+)\+\s*hours?/i);
  if (hourPlusMatch) {
    return parseInt(hourPlusMatch[1], 10) * 60;
  }
  // Handle minutes: "30 mins", "45 minutes", etc.
  const minMatch = durationStr.match(/(\d+)\s*mins?/i);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }
  // Handle "half hour", "half an hour"
  if (/half/i.test(durationStr)) {
    return 30;
  }
  return 0;
}

/** Check if a task can be completed based on the 60% time rule */
function canCompleteTask(taskId) {
  const tasks = getTasks();
  const task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return { allowed: false, reason: "Task not found." };
  if (task.status !== "active") return { allowed: false, reason: "Task is not active." };

  const acceptedAt = new Date(task.acceptedAt);
  const now = new Date();
  const totalMinutes = parseDurationToMinutes(task.duration);

  if (totalMinutes <= 0) {
    // If duration can't be parsed, allow completion
    return { allowed: true, progress: 100 };
  }

  const elapsedMs = now.getTime() - acceptedAt.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);
  const progress = Math.min(100, Math.round((elapsedMinutes / totalMinutes) * 100));
  const sixtyPercentMinutes = totalMinutes * 0.6;

  if (elapsedMinutes < sixtyPercentMinutes) {
    const remainingMs = (sixtyPercentMinutes - elapsedMinutes) * 60 * 1000;
    return {
      allowed: false,
      reason: "60% of task time not yet elapsed.",
      progress: progress,
      remainingMs: remainingMs,
      sixtyPercentMinutes: Math.round(sixtyPercentMinutes),
      totalMinutes: totalMinutes
    };
  }

  return { allowed: true, progress: progress, elapsedMinutes: Math.round(elapsedMinutes), totalMinutes: totalMinutes };
}

/** Get the active task assigned to the current worker */
function getWorkerActiveTask() {
  const worker = getActiveProxyPal();
  if (!worker) return null;
  const tasks = getTasks();
  return tasks.find(function (t) {
    return t.assignedTo === worker.id && t.status === "active";
  }) || null;
}

/** Check if the active worker is currently on a task (navigation lockdown) */
function hasActiveTaskLock() {
  const worker = getActiveProxyPal();
  if (!worker) return false;
  const tasks = getTasks();
  return tasks.some(function (t) {
    return t.assignedTo === worker.id && t.status === "active";
  });
}

/** Save contact message */
function saveContact(message) {
  const contacts = ProxyPalStorage.get(ProxyPalStorage.KEYS.CONTACTS) || [];
  message.id = ProxyPalStorage.generateId();
  message.createdAt = new Date().toISOString();
  contacts.unshift(message);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.CONTACTS, contacts);
  return message;
}

/** Get current logged-in user */
function getCurrentUser() {
  return ProxyPalStorage.get(ProxyPalStorage.KEYS.CURRENT_USER);
}

/** Login user (demo) */
function loginUser(email, password) {
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

/** Register user (demo) */
function registerUser(name, email, password) {
  const users = ProxyPalStorage.get(ProxyPalStorage.KEYS.USERS) || [];
  const user = {
    id: ProxyPalStorage.generateId(),
    name: name,
    email: email,
    role: "client",
    avatar: "https://i.pravatar.cc/150?u=" + encodeURIComponent(email),
    joinedAt: new Date().toISOString()
  };
  users.push(user);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.USERS, users);
  ProxyPalStorage.set(ProxyPalStorage.KEYS.CURRENT_USER, user);
  return user;
}

/** Escape HTML to prevent XSS */
function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Format currency INR */
function formatCurrency(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

/** Format date for display */
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

/** Get status badge HTML */
function getStatusBadge(status) {
  const map = {
    pending: '<span class="badge badge-pending">Pending</span>',
    active: '<span class="badge badge-active">Active</span>',
    completed: '<span class="badge badge-completed">Completed</span>',
    cancelled: '<span class="badge badge-cancelled">Cancelled</span>'
  };
  return map[status] || map.pending;
}

/** Indian cities for location autocomplete */
const INDIAN_CITIES = [
  "Mumbai, Maharashtra",
  "Delhi, NCR",
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Pune, Maharashtra",
  "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan",
  "Lucknow, Uttar Pradesh",
  "Kochi, Kerala",
  "Chandigarh",
  "Indore, Madhya Pradesh",
  "Bhopal, Madhya Pradesh",
  "Nagpur, Maharashtra",
  "Surat, Gujarat",
  "Vadodara, Gujarat",
  "Coimbatore, Tamil Nadu",
  "Visakhapatnam, Andhra Pradesh",
  "Goa"
];

/** Task types */
const TASK_TYPES = [
  "Queue Standing",
  "Government Office",
  "Appointment Attendance",
  "Form Submission",
  "Delivery Wait",
  "Bank Visit",
  "Event Registration",
  "Shopping / Errands",
  "Other"
];

/** Fake notification names for live feed */
const LIVE_NOTIFICATIONS = [
  { name: "Rahul", city: "Pune" },
  { name: "Priya", city: "Mumbai" },
  { name: "Arjun", city: "Bangalore" },
  { name: "Sneha", city: "Hyderabad" },
  { name: "Vikram", city: "Delhi" },
  { name: "Anita", city: "Chennai" },
  { name: "Karan", city: "Jaipur" },
  { name: "Meera", city: "Kochi" }
];

/** Calculate price from hours and rate */
function calculatePrice(hours, hourlyRate) {
  const h = parseFloat(hours) || 0;
  const r = parseFloat(hourlyRate) || 150;
  const base = h * r;
  const platformFee = base * 0.1;
  return {
    subtotal: base,
    platformFee: platformFee,
    total: base + platformFee
  };
}

/** Show Bootstrap toast */
function showToast(message, type = "success") {
  const toastEl = document.getElementById("globalToast");
  if (!toastEl) return;
  const body = toastEl.querySelector(".toast-message") || toastEl.querySelector(".toast-body");
  const icon = toastEl.querySelector(".toast-icon");
  if (body) body.textContent = message;
  toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-info");
  toastEl.classList.add("text-bg-" + (type === "error" ? "danger" : type === "info" ? "info" : "success"));
  if (icon) {
    icon.className =
      "toast-icon fa-solid " +
      (type === "error" ? "fa-circle-xmark" : type === "info" ? "fa-circle-info" : "fa-circle-check");
  }
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}

/** Validate email format */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate Indian phone */
function isValidPhone(phone) {
  return /^[\d\s+\-()]{10,15}$/.test(phone.replace(/\s/g, ""));
}

/** Read file as base64 for demo image upload */
function readFileAsDataURL(file, callback) {
  if (!file) {
    callback(null);
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.onerror = () => callback(null);
  reader.readAsDataURL(file);
}

/** Render empty state HTML */
function renderEmptyStateHtml(icon, title, message, ctaHtml) {
  return (
    '<div class="empty-state glass-card">' +
    '<i class="fa-solid ' + icon + '"></i>' +
    "<h4>" + title + "</h4>" +
    '<p class="text-secondary">' + message + "</p>" +
    (ctaHtml || "") +
    "</div>"
  ).replace(/<\/?motion>/g, "");
}
