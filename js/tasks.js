/**
 * ProxyPal - Task Board (for registered ProxyPals)
 */

$(document).ready(async function () {
  populateTaskTypeFilter();
  await initTaskBoard();
  bindTaskBoardEvents();
  showWelcomeIfNeeded();
});

function showWelcomeIfNeeded() {
  if (sessionStorage.getItem("proxypal_welcome") === "1") {
    sessionStorage.removeItem("proxypal_welcome");
    const worker = getActiveProxyPal();
    if (worker) {
      $("#welcomeWorkerName").text(worker.name);
      $("#welcomeBanner").removeClass("d-none");
    }
  }
}

async function initTaskBoard() {
  const worker = getActiveProxyPal();
  if (worker) {
    $("#workerProfileStrip").removeClass("d-none");
    $("#workerStripName").text(worker.name);
    $("#workerStripCity").text(worker.city);
    $("#workerStripRate").text(worker.hourlyRate);
    $("#workerStripAvatar").attr(
      "src",
      "https://i.pravatar.cc/150?u=" + encodeURIComponent(worker.name)
    );
    $("#registerLinkBtn").addClass("d-none");
    await updateMyAcceptedCount(worker);
  }
  await renderTaskBoard();
}

async function updateMyAcceptedCount(worker) {
  const tasks = await getTasks();
  const mine = tasks.filter(function (t) {
    const assigned = t.assigned_to || t.assignedTo;
    return assigned === worker.id && t.status === "active";
  });
  $("#myAcceptedCount").text(mine.length + " accepted");
}

function populateTaskTypeFilter() {
  const $sel = $("#taskTypeFilter");
  TASK_TYPES.forEach(function (type) {
    $sel.append('<option value="' + type + '">' + type + "</option>");
  });
}

function bindTaskBoardEvents() {
  $("#taskStatusFilter, #taskTypeFilter").on("change", async function () {
    await renderTaskBoard();
  });
  $("#taskBoardSearch").on("keyup", async function () {
    await renderTaskBoard();
  });
  $("#refreshTasksBtn").on("click", async function () {
    await renderTaskBoard();
    showToast("Task list refreshed.", "info");
  });

  $(document).on("click", ".btn-accept-task", async function () {
    await handleAcceptTask($(this).data("id"));
  });

  $(document).on("click", ".btn-complete-task", async function () {
    const result = await completeAcceptedTask($(this).data("id"));
    if (result && !result.error) {
      showToast("Task marked as completed!");
      await initTaskBoard();
    } else if (result && result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Could not complete this task.", "error");
    }
  });

  $(document).on("click", ".btn-view-task", function () {
    openTaskDetail($(this).data("id"));
  });
}

async function handleAcceptTask(taskId) {
  const worker = getActiveProxyPal();
  if (!worker) {
    showToast("Register as a ProxyPal first.", "error");
    setTimeout(function () {
      window.location.href = "become.html";
    }, 1200);
    return;
  }

  const result = await acceptTask(taskId);
  if (!result.ok) {
    if (result.error === "unavailable") {
      showToast("This task was just taken by another ProxyPal.", "error");
    } else {
      showToast("Could not accept task.", "error");
    }
    await renderTaskBoard();
    return;
  }

  showToast("Task accepted! Redirecting to your workspace...");
  setTimeout(function () {
    window.location.href = "active-task.html";
  }, 1200);
}

async function getFilteredTasks() {
  const status = $("#taskStatusFilter").val() || "pending";
  const type = $("#taskTypeFilter").val() || "all";
  const q = ($("#taskBoardSearch").val() || "").trim().toLowerCase();
  let tasks = await getTasks();

  if (status !== "all") {
    tasks = tasks.filter(function (t) {
      return t.status === status;
    });
  }

  if (type !== "all") {
    tasks = tasks.filter(function (t) {
      return t.taskType === type;
    });
  }

  if (q) {
    tasks = tasks.filter(function (t) {
      const hay = (
        t.fullName +
        " " +
        t.location +
        " " +
        t.taskType +
        " " +
        (t.description || "")
      ).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  return tasks;
}

async function renderTaskBoard() {
  const tasks = await getFilteredTasks();
  const all = await getTasks();
  const worker = getActiveProxyPal();

  $("#statPending").text(
    all.filter(function (t) {
      return t.status === "pending";
    }).length
  );
  $("#statActive").text(
    all.filter(function (t) {
      return t.status === "active";
    }).length
  );
  $("#statCompleted").text(
    all.filter(function (t) {
      return t.status === "completed";
    }).length
  );

  const $list = $("#taskBoardList");
  if (!tasks.length) {
    $list.html(
      '<div class="col-12">' +
        renderEmptyStateHtml(
          "fa-inbox",
          "No tasks found",
          "Try changing filters or check back later for new postings.",
          '<a href="hire.html" class="btn btn-outline-glass btn-sm mt-2 me-2">Post a task (demo)</a>' +
            '<a href="become.html" class="btn btn-gradient btn-sm mt-2">Become a ProxyPal</a>'
        ) +
        "</div>"
    );
    return;
  }

  const cards = tasks.map(function (task) {
    return buildTaskCard(task, worker);
  });

  $list.html(cards.join(""));
}

function buildTaskCard(task, worker) {
  const isMine = worker && task.assignedTo === worker.id;
  const canAccept = task.status === "pending" && worker;
  const canComplete = task.status === "active" && isMine;

  let actions = "";
  if (canAccept) {
    actions =
      '<button type="button" class="btn btn-gradient btn-sm btn-accept-task" data-id="' +
      task.id +
      '"><i class="fa-solid fa-hand me-1"></i>Accept</button>';
  } else if (canComplete) {
    actions =
      '<button type="button" class="btn btn-gradient btn-sm btn-complete-task" data-id="' +
      task.id +
      '"><i class="fa-solid fa-check me-1"></i>Complete</button>';
  } else if (task.status === "pending" && !worker) {
    actions = '<a href="become.html" class="btn btn-outline-glass btn-sm">Register to accept</a>';
  } else if (task.assignedName) {
    actions =
      '<span class="small text-secondary"><i class="fa-solid fa-user-check me-1"></i>' +
      escapeHtml(task.assignedName) +
      "</span>";
  }

  const desc = task.description || "";
  const descShort = desc.length > 120 ? desc.substring(0, 120) + "..." : desc;

  return (
    '<div class="col-md-6 col-xl-4">' +
    '<article class="glass-card task-board-card h-100 p-4">' +
    '<div class="d-flex justify-content-between align-items-start mb-2">' +
    "<h5 class=\"mb-0\">" +
    escapeHtml(task.taskType) +
    "</h5>" +
    getStatusBadge(task.status) +
    "</div>" +
    '<p class="small text-secondary mb-2"><i class="fa-solid fa-location-dot me-1"></i>' +
    escapeHtml(task.location) +
    "</p>" +
    "<p class=\"mb-3\">" +
    escapeHtml(descShort) +
    "</p>" +
    '<ul class="list-unstyled small text-secondary mb-3">' +
    '<li><i class="fa-regular fa-user me-2"></i>' +
    escapeHtml(task.fullName) +
    "</li>" +
    '<li><i class="fa-regular fa-calendar me-2"></i>' +
    formatDate(task.dateTime || task.createdAt) +
    "</li>" +
    '<li><i class="fa-regular fa-clock me-2"></i>' +
    escapeHtml(task.duration || "—") +
    "</li>" +
    "</ul>" +
    '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
    '<span class="fw-bold fs-5">' +
    formatCurrency(task.budget) +
    "</span>" +
    '<div class="d-flex gap-2 flex-wrap">' +
    '<button type="button" class="btn btn-outline-glass btn-sm btn-view-task" data-id="' +
    task.id +
    '">Details</button>' +
    actions +
    "</div></div></article></div>"
  );
}

async function openTaskDetail(taskId) {
  const tasks = await getTasks();
  const task = tasks.find(function (t) {
    return t.id === taskId;
  });
  if (!task) return;

  $("#taskDetailTitle").text(task.taskType);
  $("#taskDetailBody").html(
    "<p><strong>Client:</strong> " +
      escapeHtml(task.fullName) +
      "</p>" +
      "<p><strong>Phone:</strong> " +
      escapeHtml(task.phone) +
      "</p>" +
      "<p><strong>Location:</strong> " +
      escapeHtml(task.location) +
      "</p>" +
      "<p><strong>When:</strong> " +
      formatDate(task.dateTime) +
      "</p>" +
      "<p><strong>Duration:</strong> " +
      escapeHtml(task.duration) +
      "</p>" +
      "<p><strong>Budget:</strong> " +
      formatCurrency(task.budget) +
      "</p>" +
      "<p><strong>Status:</strong> " +
      getStatusBadge(task.status) +
      "</p>" +
      "<p><strong>Description:</strong></p><p>" +
      escapeHtml(task.description) +
      "</p>" +
      (task.assignedName
        ? "<p class=\"small text-secondary\">Assigned to: " + escapeHtml(task.assignedName) + "</p>"
        : "")
  );

  const worker = getActiveProxyPal();
  let footer = '<button type="button" class="btn btn-outline-glass" data-bs-dismiss="modal">Close</button>';
  if (task.status === "pending" && worker) {
    footer +=
      ' <button type="button" class="btn btn-gradient btn-accept-task" data-id="' +
      task.id +
      '" data-bs-dismiss="modal">Accept Task</button>';
  }

  $("#taskDetailFooter").html(footer);
  new bootstrap.Modal(document.getElementById("taskDetailModal")).show();
}
