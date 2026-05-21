/**
 * ProxyPal - Become a ProxyPal Page Logic
 */

$(document).ready(function () {
  setupLocationAutocomplete("workerCity", "cityList");
  initBecomeForm();
  initRatingStars("#profileRating");
});

function initBecomeForm() {
  $("#becomeForm").on("submit", async function (e) {
    e.preventDefault();
    ProxyPalValidator.clearForm("#becomeForm");

    let valid = true;
    const name = $("#workerName");
    const age = $("#workerAge");
    const skills = $("#workerSkills");
    const city = $("#workerCity");
    const availability = $("#workerAvailability");
    const rate = $("#hourlyRate");
    const experience = $("#workerExperience");

    if (!ProxyPalValidator.required(name, "Name")) valid = false;
    if (!ProxyPalValidator.numberMin(age, 18, "Age")) valid = false;
    if (!ProxyPalValidator.required(skills, "Skills")) valid = false;
    if (!ProxyPalValidator.required(city, "City")) valid = false;
    if (!ProxyPalValidator.required(availability, "Availability")) valid = false;
    if (!ProxyPalValidator.numberMin(rate, 50, "Hourly rate")) valid = false;
    if (!ProxyPalValidator.required(experience, "Experience")) valid = false;

    if (!valid) {
      showToast("Please fix the errors in the form.", "error");
      return;
    }

    const worker = {
      name: name.val().trim(),
      age: parseInt(age.val(), 10),
      skills: skills.val().trim(),
      city: city.val().trim(),
      availability: availability.val().trim(),
      hourlyRate: parseFloat(rate.val()),
      experience: experience.val().trim(),
      idProofUploaded: $("#idProof")[0].files.length > 0
    };

    const saved = await saveProxyPal(worker);
    setActiveProxyPal(saved);

    $("#becomeForm")[0].reset();
    showToast("Welcome! Taking you to the task board...");

    sessionStorage.setItem("proxypal_welcome", "1");
    setTimeout(function () {
      window.location.href = "tasks.html";
    }, 1200);
  });
}

function renderProfilePreview(worker) {
  const avatarUrl = "https://i.pravatar.cc/150?u=" + encodeURIComponent(worker.name);
  const stars = Math.round(worker.rating || 5);
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    starsHtml +=
      '<i class="fa-solid fa-star ' + (i <= stars ? "text-warning" : "text-secondary") + '"></i>';
  }

  const html = [
    '<div class="profile-preview-card glass-card">',
    '<img src="' + avatarUrl + '" alt="' + worker.name + '" class="preview-avatar">',
    "<h3>" + worker.name + "</h3>",
    '<p class="text-secondary"><i class="fa-solid fa-location-dot me-1"></i>' + worker.city + "</p>",
    '<div class="stars mb-2">' + starsHtml + ' <span class="small">(New)</span></div>',
    "<p><strong>₹" + worker.hourlyRate + "/hr</strong></p>",
    '<p class="small"><i class="fa-solid fa-clock me-1"></i>' + worker.availability + "</p>",
    "<p><strong>Skills:</strong> " + worker.skills + "</p>",
    '<p class="text-secondary small">' + worker.experience + "</p>",
    '<a href="tasks.html" class="btn btn-gradient mt-2">Browse Tasks</a>',
    "</div>"
  ].join("");

  $("#profilePreviewCard").html(html);
}
