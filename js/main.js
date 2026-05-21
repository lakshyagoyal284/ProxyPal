/**
 * ProxyPal - Main JavaScript (shared across all pages)
 * Navbar, footer, theme, modals, animations, live notifications
 */

$(document).ready(async function () {
  initSampleData();
  initTheme();
  renderNavbar();
  renderFooter();
  initStickyNavbar();
  initScrollReveal();
  initAuthModals();
  initChatWidget();
  initLiveNotifications();
  hidePageLoader();
  highlightActiveNav();
  initGlobalSearch();
  await initTaskLockGuard();
});

/** Page loading spinner */
function hidePageLoader() {
  setTimeout(function () {
    $("#pageLoader").addClass("hidden");
    setTimeout(function () {
      $("#pageLoader").remove();
    }, 500);
  }, 800);
}

/** Theme toggle - dark/light */
function initTheme() {
  const saved = localStorage.getItem(ProxyPalStorage.KEYS.THEME) || "dark";
  applyTheme(saved);

  $(document).on("click", "#themeToggle", function () {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(ProxyPalStorage.KEYS.THEME, next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = $("#themeToggle i");
  if (icon.length) {
    icon.attr("class", theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon");
  }
}

/** Reusable navbar HTML */
function renderNavbar() {
  const container = $("#navbar-container");
  if (!container.length) return;

  const currentPage = $("body").data("page") || "";
  const user = getCurrentUser();

  const navHtml = `
    <nav class="navbar navbar-expand-xl navbar-proxypal fixed-top">
      <div class="container navbar-container-inner">
        <a class="navbar-brand" href="index.html">
          <i class="fa-solid fa-user-clock me-2"></i>ProxyPal
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain"
          aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarMain">
          <ul class="navbar-nav navbar-nav-main">
            <li class="nav-item"><a class="nav-link ${currentPage === "home" ? "active" : ""}" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link ${currentPage === "hire" ? "active" : ""}" href="hire.html">Hire</a></li>
            <li class="nav-item">
              <a class="nav-link ${currentPage === "become" ? "active" : ""}" href="become.html" title="Become a ProxyPal">
                <span class="nav-text-short">Become</span><span class="nav-text-full">Become a ProxyPal</span>
              </a>
            </li>
            <li class="nav-item"><a class="nav-link ${currentPage === "tasks" ? "active" : ""}" href="tasks.html" title="Browse posted tasks">Task Board</a></li>
            <li class="nav-item"><a class="nav-link ${currentPage === "dashboard" ? "active" : ""}" href="dashboard.html">Dashboard</a></li>
            ${
              user
                ? `<li class="nav-item"><a class="nav-link ${currentPage === "admin" ? "active" : ""}" href="admin.html">Admin</a></li>`
                : ""
            }
            <li class="nav-item"><a class="nav-link ${currentPage === "contact" ? "active" : ""}" href="contact.html">Contact</a></li>
          </ul>
          <div class="navbar-actions">
            <div class="navbar-search position-relative d-none d-xl-block">
              <i class="fa-solid fa-search search-icon"></i>
              <input type="search" class="form-control form-control-sm" id="globalSearch" placeholder="Search..." aria-label="Search">
            </div>
            <button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
              <i class="fa-solid fa-sun"></i>
            </button>
            ${
              user
                ? `
              <div class="dropdown navbar-user-dropdown">
                <button class="btn btn-outline-glass btn-sm dropdown-toggle navbar-user-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fa-solid fa-user me-1"></i>
                  <span class="navbar-user-greeting">${escapeHtml(user.name)}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end glass-dropdown">
                  <li><h6 class="dropdown-header"><i class="fa-solid fa-id-card me-2"></i>${escapeHtml(user.email)}</h6></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item ${currentPage === "dashboard" ? "active" : ""}" href="dashboard.html"><i class="fa-solid fa-gauge-high me-2"></i>Dashboard</a></li>
                  <li><a class="dropdown-item" href="dashboard.html"><i class="fa-solid fa-user-pen me-2"></i>Profile</a></li>
                  <li><a class="dropdown-item" href="contact.html"><i class="fa-solid fa-gear me-2"></i>Settings</a></li>
                  <li><a class="dropdown-item ${currentPage === "admin" ? "active" : ""}" href="admin.html"><i class="fa-solid fa-shield-halved me-2"></i>Admin Panel</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#" id="navbarLogoutBtn"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
                </ul>
              </div>`
                : `<button type="button" class="btn btn-outline-glass btn-sm navbar-btn-login" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>`
            }
            <a href="hire.html" class="btn btn-gradient btn-sm navbar-btn-cta">Hire Now</a>
          </div>
        </div>
      </div>
    </nav>
  `.replace(/<\/?motion>/g, "");

  container.html(navHtml);
}

/** Reusable footer */
function renderFooter() {
  const container = $("#footer-container");
  if (!container.length) return;

  const year = new Date().getFullYear();
  container.html(`
    <footer class="footer-proxypal">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <h5 class="text-white mb-3"><i class="fa-solid fa-user-clock me-2"></i>ProxyPal</h5>
            <p>India's trusted platform to hire someone for your waiting time. Queues, appointments, deliveries — we've got you covered.</p>
            <div class="social-links mt-3">
              <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
              <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div class="col-6 col-lg-2">
            <h6 class="text-white mb-3">Quick Links</h6>
            <ul class="list-unstyled">
              <li><a href="index.html">Home</a></li>
              <li><a href="hire.html">Hire ProxyPal</a></li>
              <li><a href="become.html">Become ProxyPal</a></li>
              <li><a href="tasks.html">Task Board</a></li>
              <li><a href="dashboard.html">Dashboard</a></li>
            </ul>
          </div>
          <div class="col-6 col-lg-2">
            <h6 class="text-white mb-3">Support</h6>
            <ul class="list-unstyled">
              <li><a href="contact.html">Contact Us</a></li>
              <li><a href="contact.html#faq">FAQ</a></li>
              <li><a href="admin.html">Admin Panel</a></li>
            </ul>
          </div>
          <div class="col-lg-4">
            <h6 class="text-white mb-3">Newsletter</h6>
            <p class="small">Get updates on new cities and features.</p>
            <div class="input-group">
              <input type="email" class="form-control" placeholder="Your email" id="newsletterEmail">
              <button class="btn btn-gradient" type="button" id="newsletterBtn">Subscribe</button>
            </div>
          </div>
        </div>
        <hr class="my-4 border-secondary">
        <p class="text-center small mb-0">&copy; ${year} ProxyPal. Demo MVP — Backend-ready with Express + PostgreSQL.</p>
      </div>
    </footer>
  `.replace(/<\/?motion>/g, ""));

  $("#newsletterBtn").on("click", function () {
    const email = $("#newsletterEmail").val().trim();
    if (email && isValidEmail(email)) {
      showToast("Subscribed successfully! Welcome to ProxyPal.");
      $("#newsletterEmail").val("");
    } else {
      showToast("Please enter a valid email.", "error");
    }
  });
}

/** Sticky navbar shadow on scroll */
function initStickyNavbar() {
  $(window).on("scroll", function () {
    if ($(window).scrollTop() > 50) {
      $(".navbar-proxypal").addClass("scrolled");
    } else {
      $(".navbar-proxypal").removeClass("scrolled");
    }
  });
}

/** Scroll reveal animation */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });
}

/** Login / Register modals (delegated — modals injected by components.js) */
function initAuthModals() {
  $(document).on("submit", "#loginForm", async function (e) {
    e.preventDefault();
    const email = $("#loginEmail").val().trim();
    const password = $("#loginPassword").val();
    if (!isValidEmail(email)) {
      showToast("Enter a valid email.", "error");
      return;
    }
    await loginUser(email, password);
    const loginModal = document.getElementById("loginModal");
    if (loginModal) bootstrap.Modal.getInstance(loginModal).hide();
    showToast("Welcome back!");
    renderNavbar();
  });

  $(document).on("submit", "#registerForm", async function (e) {
    e.preventDefault();
    const name = $("#registerName").val().trim();
    const email = $("#registerEmail").val().trim();
    const password = $("#registerPassword").val();
    if (!name || !isValidEmail(email) || password.length < 4) {
      showToast("Fill all fields. Password min 4 chars.", "error");
      return;
    }
    await registerUser(name, email, password);
    const registerModal = document.getElementById("registerModal");
    if (registerModal) bootstrap.Modal.getInstance(registerModal).hide();
    showToast("Account created! Welcome to ProxyPal.");
    renderNavbar();
  });

  $(document).on("click", "#navbarLogoutBtn", function () {
    logoutUser();
    showToast("Logged out successfully.");
    renderNavbar();
  });
}

/** Chat widget UI */
function initChatWidget() {
  if (!$("#chatWidget").length) return;

  $("#chatToggle").on("click", function () {
    $("#chatPanel").toggleClass("open");
  });

  $("#chatSend").on("click", sendChatMessage);
  $("#chatInput").on("keypress", function (e) {
    if (e.which === 13) sendChatMessage();
  });

  function sendChatMessage() {
    const input = $("#chatInput");
    const text = input.val().trim();
    if (!text) return;

    appendChatMsg(text, "user");
    input.val("");

    setTimeout(function () {
      const replies = [
        "Thanks for reaching out! A ProxyPal agent will assist you shortly.",
        "You can hire a ProxyPal from our Hire page in under 2 minutes.",
        "Our average response time is under 15 minutes during business hours.",
        "For urgent tasks, mention 'URGENT' in your task description."
      ];
      appendChatMsg(replies[Math.floor(Math.random() * replies.length)], "bot");
    }, 900);
  }

  function appendChatMsg(text, type) {
    $("#chatMessages").append(`<div class="chat-msg ${type}">${escapeHtml(text)}</div>`.replace(/<\/?motion>/g, ""));
    const el = document.getElementById("chatMessages");
    el.scrollTop = el.scrollHeight;
  }
}

/** Fake live notifications */
function initLiveNotifications() {
  if (!$("#liveNotificationArea").length) return;

  function showLiveNotification() {
    const item = LIVE_NOTIFICATIONS[Math.floor(Math.random() * LIVE_NOTIFICATIONS.length)];
    const html = `
      <div class="live-notification glass-card p-3 shadow">
        <div class="d-flex align-items-center gap-2">
          <i class="fa-solid fa-bell text-warning"></i>
          <small><strong>${item.name}</strong> from ${item.city} just hired a ProxyPal</small>
        </div>
      </div>
    `.replace(/<\/?motion>/g, "");

    $("#liveNotificationArea").html(html);

    setTimeout(function () {
      $("#liveNotificationArea").fadeOut(400, function () {
        $(this).empty().show();
      });
    }, 5000);
  }

  setTimeout(showLiveNotification, 3000);
  setInterval(showLiveNotification, 15000);
}

/** Animated stat counters on homepage */
function initStatCounters() {
  $(".stat-number").each(function () {
    const $el = $(this);
    const target = parseInt($el.data("target"), 10) || 0;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const counter = setInterval(function () {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(counter);
      }
      $el.text(Math.floor(current).toLocaleString("en-IN") + ($el.data("suffix") || ""));
    }, 16);
  });
}

/** Global search - redirects or filters */
function initGlobalSearch() {
  $(document).on("keyup", "#globalSearch", function (e) {
    if (e.key === "Enter") {
      const q = $(this).val().trim().toLowerCase();
      if (q) {
        sessionStorage.setItem("proxypal_search", q);
        window.location.href = "admin.html";
      }
    }
  });
}

function highlightActiveNav() {
  // Handled in renderNavbar via data-page
}

/**
 * Navigation Guard — prevents workers with active tasks from leaving to other pages
 * This runs on every page except the active-task page itself.
 */
async function initTaskLockGuard() {
  try {
    const currentPage = $("body").data("page") || "";
    // Don't guard on the active-task page itself
    if (currentPage === "active-task") return;

    // If worker has an active task, redirect to active-task.html
    const hasLock = await hasActiveTaskLock();
    if (hasLock) {
      showToast("You have an active task! Redirecting...", "info");
      setTimeout(function () {
        window.location.href = "active-task.html";
      }, 500);
      return;
    }

    // Also override navbar links to prevent navigation if worker has active task
    $(document).on("click", ".nav-link, .navbar-brand", async function (e) {
      try {
        if (await hasActiveTaskLock()) {
          e.preventDefault();
          e.stopPropagation();
          showToast("Complete your active task first!", "error");
          setTimeout(function () {
            window.location.href = "active-task.html";
          }, 500);
        }
      } catch (e) {
        // ignore
      }
    });
  } catch (e) {
    // ignore
  }
}

/** Location autocomplete datalist helper */
function setupLocationAutocomplete(inputId, datalistId) {
  const $list = $("#" + datalistId);
  if (!$list.length) return;
  $list.empty();
  INDIAN_CITIES.forEach(function (city) {
    $list.append(`<option value="${city}">`);
  });
}

/** Rating stars interactive UI */
function initRatingStars(containerSelector) {
  const $container = $(containerSelector);
  if (!$container.length) return;

  $container.find("i").on("mouseenter", function () {
    const rating = $(this).data("rating");
    highlightStars($container, rating, true);
  });

  $container.on("mouseleave", function () {
    const selected = $container.data("selected") || 0;
    highlightStars($container, selected, false);
  });

  $container.find("i").on("click", function () {
    const rating = $(this).data("rating");
    $container.data("selected", rating);
    highlightStars($container, rating, false);
    $container.trigger("ratingChange", [rating]);
  });
}

function highlightStars($container, rating, isHover) {
  $container.find("i").each(function () {
    const r = $(this).data("rating");
    $(this).toggleClass(isHover ? "hover" : "active", r <= rating);
    if (!isHover) $(this).removeClass("hover");
  });
}

/** Expose for index page */
window.initStatCounters = initStatCounters;
window.setupLocationAutocomplete = setupLocationAutocomplete;
window.initRatingStars = initRatingStars;
