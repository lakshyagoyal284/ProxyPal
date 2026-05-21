/**
 * ProxyPal - Admin Panel Logic
 */

$(document).ready(async function () {
  await renderAdminTables();
  initAdminFilters();
  initAdminTabs();
});

function initAdminTabs() {
  $('button[data-bs-toggle="tab"]').on("shown.bs.tab", async function () {
    await renderAdminTables();
  });
}

function initAdminFilters() {
  $("#adminSearch").on("keyup", function () {
    filterTables($(this).val().trim().toLowerCase());
  });

  $("#filterStatus").on("change", function () {
    renderTasksTable($(this).val());
  });

  // Pre-fill search from global navbar
  const savedSearch = sessionStorage.getItem("proxypal_search");
  if (savedSearch) {
    $("#adminSearch").val(savedSearch);
    filterTables(savedSearch);
    sessionStorage.removeItem("proxypal_search");
  }
}

async function renderAdminTables() {
  await renderTasksTable($("#filterStatus").val() || "all");
  await renderProxyPalsTable();
}

async function renderTasksTable(statusFilter) {
  let tasks = await getTasks();
  if (statusFilter && statusFilter !== "all") {
    tasks = tasks.filter((t) => t.status === statusFilter);
  }

  const $tbody = $("#tasksTableBody");
  if (!tasks.length) {
    $tbody.html(
      '<tr><td colspan="8" class="text-center py-4 text-secondary">No task requests found.</td></tr>'
    );
    return;
  }

  let html = "";
  tasks.forEach(function (task) {
    html +=
      "<tr data-search=\"" +
      (task.fullName + " " + task.location + " " + task.taskType).toLowerCase() +
      "\">" +
      "<td><small>" + task.id.substring(0, 12) + "...</small></td>" +
      "<td>" + task.fullName + "</td>" +
      "<td>" + task.taskType + "</td>" +
      "<td>" + task.location.substring(0, 30) + (task.location.length > 30 ? "..." : "") + "</td>" +
      "<td>" + formatCurrency(task.budget) + "</td>" +
      "<td>" + getStatusBadge(task.status) + "</td>" +
      "<td><small>" + formatDate(task.createdAt) + "</small></td>" +
      '<td><button class="btn btn-sm btn-outline-danger delete-task" data-id="' +
      task.id +
      '"><i class="fa-solid fa-trash"></i></button></td>' +
      "</tr>";
  });
  $tbody.html(html);

  $(".delete-task").on("click", async function () {
    const id = $(this).data("id");
    if (confirm("Delete this task request?")) {
      await deleteTask(id);
      showToast("Task deleted.");
      await renderAdminTables();
    }
  });
}

async function renderProxyPalsTable() {
  const workers = await getProxyPals();
  const $tbody = $("#proxypalsTableBody");

  if (!workers.length) {
    $tbody.html(
      '<tr><td colspan="7" class="text-center py-4 text-secondary">No ProxyPals registered.</td></tr>'
    );
    return;
  }

  let html = "";
  workers.forEach(function (w) {
    html +=
      "<tr data-search=\"" +
      (w.name + " " + w.city + " " + w.skills).toLowerCase() +
      "\">" +
      "<td><small>" + w.id.substring(0, 12) + "...</small></td>" +
      "<td>" + w.name + "</td>" +
      "<td>" + w.city + "</td>" +
      "<td>₹" + w.hourlyRate + "/hr</td>" +
      "<td><span class='badge bg-primary'>" + (w.rating || 5) + " ★</span></td>" +
      "<td><small>" + formatDate(w.createdAt) + "</small></td>" +
      '<td><button class="btn btn-sm btn-outline-danger delete-worker" data-id="' +
      w.id +
      '"><i class="fa-solid fa-trash"></i></button></td>' +
      "</tr>";
  });
  $tbody.html(html);

  $(".delete-worker").on("click", async function () {
    const id = $(this).data("id");
    if (confirm("Remove this ProxyPal?")) {
      await deleteProxyPal(id);
      showToast("ProxyPal removed.");
      await renderProxyPalsTable();
    }
  });
}

function filterTables(query) {
  $("#tasksTableBody tr, #proxypalsTableBody tr").each(function () {
    const text = $(this).data("search") || $(this).text().toLowerCase();
    $(this).toggle(!query || text.indexOf(query) !== -1);
  });
}
