/**
 * ProxyPal - Dashboard Page Logic
 */

$(document).ready(function () {
  showDashboardSkeletons();
  setTimeout(async function () {
    await renderDashboard();
  }, 600);
});

function showDashboardSkeletons() {
  const skeleton =
    '<div class="glass-card p-4 mb-3">' +
    '<div class="skeleton skeleton-title"></div>' +
    '<div class="skeleton skeleton-text"></div>' +
    '<div class="skeleton skeleton-text" style="width:70%"></div>' +
    "</div>";
  $("#activeTasksList, #completedTasksList").html(skeleton);
}

async function renderDashboard() {
  const user = getCurrentUser();
  const tasks = await getTasks();

  if (user) {
    $("#profileName").text(user.name);
    $("#profileEmail").text(user.email || "demo@proxypal.in");
    $("#profileAvatar").attr("src", user.avatar || "images/Lakshya.png");
  }

  // Avatar upload handler
  initAvatarUpload();

  const active = tasks.filter(function (t) {
    return t.status === "active" || t.status === "pending";
  });
  const completed = tasks.filter(function (t) {
    return t.status === "completed";
  });

  const totalEarnings = completed.reduce(function (sum, t) {
    return sum + (t.budget || 0);
  }, 0);

  $("#earningsAmount").text(formatCurrency(totalEarnings));
  $("#activeCount, #activeCountCard").text(active.length);
  $("#completedCount").text(completed.length);
  $("#totalTasksCount").text(tasks.length);

  renderTaskList("#activeTasksList", active, "active");
  renderTaskList("#completedTasksList", completed, "completed");

  updateProgressTracker(active.length > 0 ? active[0] : null);
}

function renderTaskList(selector, tasks, type) {
  const $container = $(selector);
  if (!tasks.length) {
    const cta =
      type === "active"
        ? '<a href="hire.html" class="btn btn-gradient btn-sm mt-2">Hire a ProxyPal</a>'
        : "";
    $container.html(
      renderEmptyStateHtml(
        type === "active" ? "fa-clipboard-list" : "fa-circle-check",
        "No " + type + " tasks",
        type === "active"
          ? "Post a task to get started with your first ProxyPal."
          : "Completed tasks will appear here.",
        cta
      )
    );
    return;
  }

  let html = "";
  tasks.forEach(function (task) {
    const desc = (task.description || "").substring(0, 80);
    html +=
      '<div class="task-card-dashboard glass-card">' +
      '<div class="d-flex justify-content-between align-items-start flex-wrap gap-2">' +
      "<div>" +
      "<h6 class=\"mb-1\">" + task.taskType + "</h6>" +
      '<p class="small text-secondary mb-1"><i class="fa-solid fa-location-dot me-1"></i>' +
      task.location +
      "</p>" +
      '<p class="small mb-0">' +
      desc +
      "...</p>" +
      "</div>" +
      '<div class="text-end">' +
      getStatusBadge(task.status) +
      '<p class="fw-bold mt-2 mb-0">' +
      formatCurrency(task.budget) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<p class="mt-2 small text-secondary mb-0"><i class="fa-regular fa-calendar me-1"></i>' +
      formatDate(task.dateTime || task.createdAt) +
      "</p>" +
      "</div>";
  });
  $container.html(html);
}

/** Profile picture upload handler */
function initAvatarUpload() {
  // Unbind previous handler to avoid duplicates
  $("#avatarUpload").off("change");

  $("#avatarUpload").on("change", function () {
    const file = this.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image too large. Max 2MB allowed.", "error");
      return;
    }

    readFileAsDataURL(file, function (dataUrl) {
      if (!dataUrl) {
        showToast("Failed to read image.", "error");
        return;
      }

      // Update display immediately
      $("#profileAvatar").attr("src", dataUrl);

      // Save to user profile
      const saved = updateUserAvatar(dataUrl);
      if (saved) {
        showToast("Profile photo updated! 🎉");
      } else {
        showToast("Could not save photo. Login first.", "error");
      }
    });
  });
}

function updateProgressTracker(task) {
  let activeIndex = 0;
  if (task) {
    if (task.status === "pending") activeIndex = 0;
    else if (task.status === "active") activeIndex = 2;
    else if (task.status === "completed") activeIndex = 3;
  }

  $(".progress-step").each(function (i) {
    $(this).removeClass("active done");
    if (i < activeIndex) $(this).addClass("done");
    else if (i === activeIndex) $(this).addClass("active");
  });
}
