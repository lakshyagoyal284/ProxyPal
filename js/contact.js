/**
 * ProxyPal - Contact Page Logic
 */

$(document).ready(function () {
  initContactForm();
  initRatingStars("#serviceRating");
});

function initContactForm() {
  $("#contactForm").on("submit", async function (e) {
    e.preventDefault();
    ProxyPalValidator.clearForm("#contactForm");

    let valid = true;
    if (!ProxyPalValidator.required($("#contactName"), "Name")) valid = false;
    if (!ProxyPalValidator.email($("#contactEmail"))) valid = false;
    if (!ProxyPalValidator.required($("#contactSubject"), "Subject")) valid = false;
    if (!ProxyPalValidator.required($("#contactMessage"), "Message")) valid = false;

    if (!valid) {
      showToast("Please fix form errors.", "error");
      return;
    }

    await saveContact({
      name: $("#contactName").val().trim(),
      email: $("#contactEmail").val().trim(),
      subject: $("#contactSubject").val().trim(),
      message: $("#contactMessage").val().trim()
    });

    $("#contactForm")[0].reset();
    showToast("Message sent! We'll respond within 24 hours.");
  });
}
