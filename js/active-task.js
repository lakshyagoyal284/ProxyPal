/**
 * ProxyPal - Active Task Workspace
 * Handles task execution view with chat, map, progress tracking, and completion.
 */

$(document).ready(function () {
  try {
    initActiveTask();
  } catch (e) {
    console.error("Active task init error:", e);
    // Always hide loader even if something crashes
    hidePageLoader2();
    showToast("Something went wrong loading the workspace.", "error");
  }
});

// Chat conversation threads per task (in-memory, persists in session)
const taskChats = {};

// Interval IDs for cleanup
let progressInterval = null;
let completeBtnInterval = null;

const CLIENT_CHAT_REPLIES = [
  "Thank you for accepting the task! Let me know if you need any directions.",
  "I'm available if you have any questions about the task.",
  "Please confirm when you reach the location.",
  "Great, keep me updated on the progress!",
  "Everything going well?",
  "Thanks for the update!",
  "Let me know once you're done. I'll confirm completion.",
  "Appreciate your help with this!",
  "If anything comes up, just message me here.",
  "Perfect, thanks for taking this on!"
];

async function initActiveTask() {
  const task = await getWorkerActiveTask();

  if (!task) {
    showToast("No active task found.", "error");
    hidePageLoader2();
    setTimeout(function () {
      window.location.href = "tasks.html";
    }, 1500);
    return;
  }

  loadTaskData(task);
  initTaskChat(task);
  initCopyPhone();
  initProgressTracker(task);
  initCompleteButton(task);
  initExitWarning();

  // Map is async — don't let it block the loader
  initMap(task).then(function () {
    // map loaded
  }).catch(function () {
    // map failed silently, that's ok
  });

  hidePageLoader2();

  // Restore previous chat if exists
  if (taskChats[task.id]) {
    renderChatMessages(task.id);
  }
}

function hidePageLoader2() {
  var $loader = $("#pageLoader");
  if (!$loader.length) return;
  $loader.addClass("hidden");
  setTimeout(function () {
    $loader.remove();
  }, 500);
}

function loadTaskData(task) {
  // Header
  $("#taskTitle").text(task.taskType);

  // Client info
  $("#clientName").text(task.fullName);
  $("#clientAvatar").attr(
    "src",
    "https://i.pravatar.cc/150?u=" + encodeURIComponent(task.fullName + "_client")
  );
  $("#clientPhone").text(task.phone);
  $("#chatClientName").text(task.fullName.split(" ")[0]);
  $("#chatClientAvatar").attr(
    "src",
    "https://i.pravatar.cc/150?u=" + encodeURIComponent(task.fullName + "_client")
  );

  // Task details
  $("#taskType").text(task.taskType);
  $("#taskBudget").text(formatCurrency(task.budget));
  $("#taskDuration").text(task.duration);
  $("#taskDateTime").text(formatDate(task.dateTime));
  $("#taskLocation").text(task.location);
  $("#clientLocation").text(task.clientLocation || task.location);
  $("#taskDescription").text(task.description || "No description provided.");
}

function initCopyPhone() {
  $("#copyPhoneBtn").on("click", function () {
    const phone = $("#clientPhone").text();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(phone).then(function () {
        showToast("Phone number copied!");
      }).catch(function () {
        fallbackCopy(phone);
      });
    } else {
      fallbackCopy(phone);
    }
  });
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast("Phone number copied!");
  } catch (e) {
    // ignore
  }
  document.body.removeChild(textarea);
}

function initMap(task) {
  return new Promise(function (resolve) {
    var mapContainer = document.getElementById("taskMap");
    if (!mapContainer) { resolve(); return; }

    var taskLocation = task.location || "India";
    var clientLocation = task.clientLocation || task.location || "India";

    // Build OpenStreetMap embed URL with markers for both locations
    var taskQuery = encodeURIComponent(taskLocation);
    var clientQuery = encodeURIComponent(clientLocation);

    // Use a simple but informative embed — shows both locations
    // The embed will default to India view
    var embedUrl = "https://www.openstreetmap.org/export/embed.html" +
      "?bbox=68.0,8.0,98.0,37.0" +
      "&layer=mapnik" +
      "&marker=20.5937,78.9629";

    // Create a rich map area with iframe + location cards below
    var mapHtml =
      '<iframe id="mapFrame" width="100%" height="100%" frameborder="0" style="border:0" ' +
      'src="' + embedUrl + '" ' +
      'allowfullscreen loading="lazy"></iframe>';

    mapContainer.innerHTML = mapHtml;

    // Also add a text row showing both locations below the map
    var infoRow = document.createElement("div");
    infoRow.className = "d-flex justify-content-between align-items-center mt-2 small";
    infoRow.innerHTML =
      '<span><span class="legend-dot task-loc" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#6366f1;margin-right:4px;"></span> Task: <strong>' + escapeHtml(taskLocation) + '</strong></span>' +
      '<span><span class="legend-dot client-loc" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;margin-right:4px;"></span> Client: <strong>' + escapeHtml(clientLocation) + '</strong></span>';

    mapContainer.parentNode.appendChild(infoRow);

    resolve();
  });
}

function initTaskChat(task) {
  // Initialize chat history for this task if not exists
  if (!taskChats[task.id]) {
    taskChats[task.id] = [
      {
        from: "client",
        text: "Hi! Thanks for accepting my task. Let me know when you're on your way!",
        time: new Date(task.acceptedAt || Date.now()).getTime() - 30000
      }
    ];
    // Add a couple more initial messages for realism
    setTimeout(function () {
      addClientMessage(task.id, "I'm at the location if you need any help finding it.");
    }, 2000);
  }

  renderChatMessages(task.id);

  // Send message on click or Enter
  $("#taskChatSend").off("click").on("click", function () {
    sendTaskChatMessage(task);
  });

  $("#taskChatInput").off("keypress").on("keypress", function (e) {
    if (e.which === 13) {
      sendTaskChatMessage(task);
    }
  });
}

function sendTaskChatMessage(task) {
  const input = $("#taskChatInput");
  const text = input.val().trim();
  if (!text) return;

  // Add worker message
  taskChats[task.id].push({
    from: "worker",
    text: text,
    time: Date.now()
  });

  input.val("");
  renderChatMessages(task.id);

  // Auto-reply from client after a short delay
  const delay = 1000 + Math.random() * 2000;
  setTimeout(function () {
    const replies = CLIENT_CHAT_REPLIES;
    const reply = replies[Math.floor(Math.random() * replies.length)];
    addClientMessage(task.id, reply);

    // Maybe add a follow-up
    setTimeout(function () {
      if (Math.random() > 0.5) {
        var followUps = [
          "Let me know when you reach.",
          "How's it going so far?",
          "Is everything okay?",
          "Do you need any more details?"
        ];
        addClientMessage(task.id, followUps[Math.floor(Math.random() * followUps.length)]);
      }
    }, 3000 + Math.random() * 4000);
  }, delay);
}

function addClientMessage(taskId, text) {
  taskChats[taskId].push({
    from: "client",
    text: text,
    time: Date.now()
  });
  renderChatMessages(taskId);
}

function renderChatMessages(taskId) {
  var $container = $("#taskChatMessages");
  if (!$container.length) return;

  var messages = taskChats[taskId] || [];

  var html = "";
  messages.forEach(function (msg) {
    var timeStr = new Date(msg.time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
    html += '<div class="chat-msg ' + msg.from + '">' +
      escapeHtml(msg.text) +
      '<span class="msg-time">' + timeStr + '</span>' +
      '</div>';
  });

  $container.html(html);
  // Scroll to bottom
  var el = $container[0];
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

function initProgressTracker(task) {
  updateProgress(task);
  // Clear any existing interval
  if (progressInterval) clearInterval(progressInterval);
  // Update every second
  progressInterval = setInterval(function () {
    updateProgress(task);
  }, 1000);
}

function updateProgress(task) {
  try {
    var check = canCompleteTaskLocal(task);

    if (check.allowed) {
      // 60% time has passed
      $("#workspaceTimer").addClass("ready");
      $("#countdownDisplay").text("Ready!");
      $("#progress60Fill").css("width", "100%").addClass("complete-ready");
    } else if (check.remainingMs !== undefined) {
      // Update countdown
      var remainingSecs = Math.ceil(check.remainingMs / 1000);
      var mins = Math.floor(remainingSecs / 60);
      var secs = remainingSecs % 60;
      $("#countdownDisplay").text(
        String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
      );

      // Update progress bar
      var progress = Math.min(99, check.progress || 0);
      $("#progress60Fill").css("width", progress + "%").removeClass("complete-ready");

      // Update complete section status
      var totalMins = check.totalMinutes;
      var sixtyMins = check.sixtyPercentMinutes;
      $("#completeTimeInfo").html(
        '<i class="fa-regular fa-clock me-1"></i>' +
        '60% of ' + totalMins + ' min = ' + sixtyMins + ' min needed'
      );
    }
  } catch (e) {
    // Don't let timer errors crash
  }
}

function initCompleteButton(task) {
  var $btn = $("#completeTaskBtn");
  var $lockIcon = $("#completeLockIcon i");
  var $statusText = $("#completeStatusText");
  var $subText = $("#completeSubText");

  function updateCompleteState() {
    try {
      var check = canCompleteTaskLocal(task);

      if (check.allowed) {
        $btn
          .removeClass("btn-complete-disabled")
          .addClass("btn-complete-ready")
          .prop("disabled", false)
          .html('<i class="fa-solid fa-check-circle me-2"></i>Complete Task');

        $lockIcon.removeClass("fa-lock").addClass("fa-unlock-alt");
        $("#completeLockIcon").addClass("unlocked");
        $statusText.text("Ready to complete!");
        $subText.text("You have passed the 60% time threshold. You can now mark this task as complete.");

        // Update the timer display
        $("#countdownDisplay").text("Ready!");
        $("#workspaceTimer").addClass("ready");
      } else {
        $btn
          .removeClass("btn-complete-ready")
          .addClass("btn-complete-disabled")
          .prop("disabled", true)
          .html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Waiting for time threshold...');

        $lockIcon.removeClass("fa-unlock-alt").addClass("fa-lock");
        $("#completeLockIcon").removeClass("unlocked");
        $statusText.text("Task in progress");
        $subText.text("You can complete the task after 60% of the allocated time has passed.");
      }
    } catch (e) {
      // Don't let timer errors crash
    }
  }

  // Initial state
  updateCompleteState();

  // Also update when the progress timer updates
  if (completeBtnInterval) clearInterval(completeBtnInterval);
  completeBtnInterval = setInterval(updateCompleteState, 2000);

  // Complete button click
  $btn.off("click").on("click", async function () {
    if ($(this).prop("disabled")) return;

    // Confirm
    if (!confirm("Are you sure you want to mark this task as complete?")) return;

    const result = await completeAcceptedTask(task.id);

    if (result && !result.error) {
      showToast("Task completed successfully! 🎉");

      // Add a completion message to chat
      addClientMessage(task.id, "Thank you so much! I'll confirm the completion now.");
      setTimeout(function () {
        addClientMessage(task.id, "Task has been marked as completed. Great work!");
      }, 1200);

      // Redirect to dashboard after a moment
      setTimeout(function () {
        window.location.href = "dashboard.html";
      }, 3000);

      // Disable the button
      $btn
        .prop("disabled", true)
        .html('<i class="fa-solid fa-check-circle me-2"></i>Completed! Redirecting...');
    } else if (result && result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Could not complete the task.", "error");
    }
  });
}

function initExitWarning() {
  // Show a warning when user tries to navigate away
  var $banner = $("#exitWarningBanner");
  if ($banner.length) {
    $banner.show();
  }

  // Intercept all link clicks and prevent navigation
  $(document).on("click", "a", function (e) {
    var href = $(this).attr("href");
    // Allow hash links, javascript:, and the complete flow redirect
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    if (href.indexOf("dashboard.html") !== -1 || href.indexOf("tasks.html") !== -1 ||
        href.indexOf("index.html") !== -1 || href.indexOf("hire.html") !== -1 ||
        href.indexOf("become.html") !== -1 || href.indexOf("contact.html") !== -1 ||
        href.indexOf("admin.html") !== -1) {
      e.preventDefault();
      e.stopPropagation();
      showToast("You cannot leave while on an active task!", "error");
      // Flash the banner
      if ($banner.length) {
        $banner.css("opacity", "0.5").animate({ opacity: 1 }, 200);
      }
    }
  });

  // Override the confirmation dialog for page unload
  var hasLock = getActiveProxyPal() !== null;
  window.addEventListener("beforeunload", function (e) {
    if (hasLock) {
      e.preventDefault();
      e.returnValue = "You are currently on an active task. Are you sure you want to leave?";
    }
  });
}
