/**
 * ProxyPal - Hire Page Logic
 */

$(document).ready(function () {
  setupLocationAutocomplete("taskLocation", "locationList");
  setupLocationAutocomplete("clientLocation", "clientLocationList");
  populateTaskTypes();
  initHireForm();
  initPricingCalculator();
});

/** Fill task type dropdown */
function populateTaskTypes() {
  const $select = $("#taskType");
  TASK_TYPES.forEach(function (type) {
    $select.append('<option value="' + type + '">' + type + "</option>");
  });
}

/** Hire form submit with validation */
function initHireForm() {
  $("#hireForm").on("submit", async function (e) {
    e.preventDefault();
    ProxyPalValidator.clearForm("#hireForm");

    let valid = true;
    const fields = {
      fullName: $("#fullName"),
      phone: $("#phone"),
      taskType: $("#taskType"),
      taskLocation: $("#taskLocation"),
      clientLocation: $("#clientLocation"),
      dateTime: $("#dateTime"),
      duration: $("#duration"),
      budget: $("#budget"),
      description: $("#description")
    };

    if (!ProxyPalValidator.required(fields.fullName, "Full name")) valid = false;
    if (!ProxyPalValidator.phone(fields.phone)) valid = false;
    if (!ProxyPalValidator.required(fields.taskType, "Task type")) valid = false;
    if (!ProxyPalValidator.required(fields.taskLocation, "Task location")) valid = false;
    if (!ProxyPalValidator.required(fields.clientLocation, "Your location")) valid = false;
    if (!ProxyPalValidator.required(fields.dateTime, "Date & time")) valid = false;
    if (!ProxyPalValidator.required(fields.duration, "Duration")) valid = false;
    if (!ProxyPalValidator.numberMin(fields.budget, 100, "Budget")) valid = false;
    if (!ProxyPalValidator.required(fields.description, "Description")) valid = false;

    if (!valid) {
      showToast("Please fix the errors in the form.", "error");
      return;
    }

    const file = $("#referenceImage")[0].files[0];
    readFileAsDataURL(file, async function (imageRef) {
      const task = {
        fullName: fields.fullName.val().trim(),
        phone: fields.phone.val().trim(),
        taskType: fields.taskType.val(),
        location: fields.taskLocation.val().trim(),
        clientLocation: fields.clientLocation.val().trim(),
        dateTime: fields.dateTime.val(),
        duration: fields.duration.val(),
        budget: parseFloat(fields.budget.val()),
        description: fields.description.val().trim(),
        imageRef: imageRef,
        status: "pending"
      };

      await saveTask(task);
      $("#hireForm")[0].reset();
      const modal = new bootstrap.Modal(document.getElementById("successModal"));
      modal.show();
      showToast("Task request submitted successfully!");
    });
  });
}

/** Pricing calculator on hire page */
function initPricingCalculator() {
  function updatePrice() {
    const hours = parseFloat($("#calcHours").val()) || 0;
    const rate = parseFloat($("#calcRate").val()) || 150;
    const result = calculatePrice(hours, rate);
    $("#calcSubtotal").text(formatCurrency(result.subtotal));
    $("#calcFee").text(formatCurrency(result.platformFee));
    $("#calcTotal").text(formatCurrency(result.total));
  }

  $("#calcHours, #calcRate").on("input change", updatePrice);
  updatePrice();
}
