/**
 * ProxyPal - Shared Form Validation (jQuery)
 */

const ProxyPalValidator = {
  /** Clear validation state on a form */
  clearForm(formSelector) {
    $(formSelector).find(".is-invalid").removeClass("is-invalid");
    $(formSelector).find(".invalid-feedback").remove();
  },

  /** Mark field invalid */
  setInvalid($field, message) {
    $field.addClass("is-invalid");
    if (!$field.next(".invalid-feedback").length) {
      $field.after("<div class=\"invalid-feedback\">" + message + "</div>");
    }
  },

  /** Validate required text field */
  required($field, label) {
    const val = $field.val().trim();
    if (!val) {
      this.setInvalid($field, label + " is required.");
      return false;
    }
    return true;
  },

  /** Validate phone */
  phone($field) {
    const val = $field.val().trim();
    if (!isValidPhone(val)) {
      this.setInvalid($field, "Enter a valid phone number.");
      return false;
    }
    return true;
  },

  /** Validate email */
  email($field) {
    const val = $field.val().trim();
    if (!isValidEmail(val)) {
      this.setInvalid($field, "Enter a valid email address.");
      return false;
    }
    return true;
  },

  /** Validate number min */
  numberMin($field, min, label) {
    const val = parseFloat($field.val());
    if (isNaN(val) || val < min) {
      this.setInvalid($field, label + " must be at least " + min + ".");
      return false;
    }
    return true;
  }
};
