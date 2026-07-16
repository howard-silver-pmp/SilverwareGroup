(() => {
  "use strict";

  const TURNSTILE_SITE_KEY = "0x4AAAAAAD2v1k3BeA1kVvaQ";
  const TURNSTILE_ACTION = "contact_form";
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const form = document.getElementById("contact-form");
  const submitButton = document.getElementById("contact-submit");
  const statusMessage = document.getElementById("form-status");
  const turnstileContainer = document.getElementById("contact-turnstile");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("email-format-error");

  let turnstileWidgetId = null;
  let securityStatusVisible = false;
  let emailValidationStarted = false;

  if (
    !form ||
    !submitButton ||
    !statusMessage ||
    !turnstileContainer ||
    !emailInput ||
    !emailError
  ) {
    return;
  }

  function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "form-status";

    if (type) {
      statusMessage.classList.add(`is-${type}`);
    }

    statusMessage.hidden = !message;
    statusMessage.setAttribute("role", type === "error" ? "alert" : "status");
    statusMessage.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  }

  function setSubmitReady(isReady) {
    submitButton.disabled = !isReady;
    submitButton.setAttribute("aria-disabled", String(!isReady));
  }

  function getEmailValidationMessage() {
    const value = emailInput.value.trim();

    if (!value) {
      return "Please enter your email address.";
    }

    if (!EMAIL_PATTERN.test(value)) {
      return "Please enter a valid email address, such as name@example.com.";
    }

    return "";
  }

  function displayEmailValidation(message) {
    emailInput.setCustomValidity(message);

    if (message) {
      emailInput.setAttribute("aria-invalid", "true");
      emailError.textContent = message;
      emailError.hidden = false;
      return;
    }

    emailInput.removeAttribute("aria-invalid");
    emailError.textContent = "";
    emailError.hidden = true;
  }

  function validateEmail(showError = false) {
    const message = getEmailValidationMessage();
    emailInput.setCustomValidity(message);

    if (showError || !message) {
      displayEmailValidation(message);
    }

    return !message;
  }

  emailInput.addEventListener("blur", () => {
    emailValidationStarted = true;
    validateEmail(true);
  });

  emailInput.addEventListener("invalid", () => {
    emailValidationStarted = true;
    validateEmail(true);
  });

  emailInput.addEventListener("input", () => {
    if (emailValidationStarted) {
      validateEmail(true);
    } else {
      emailInput.setCustomValidity("");
    }
  });

  function resetTurnstile() {
    setSubmitReady(false);

    if (turnstileWidgetId !== null && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }

  window.onTurnstileLoad = function onTurnstileLoad() {
    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: TURNSTILE_SITE_KEY,
      action: TURNSTILE_ACTION,
      theme: "light",
      size: "flexible",
      callback: () => {
        setSubmitReady(true);

        if (securityStatusVisible) {
          securityStatusVisible = false;
          setStatus("");
        }
      },
      "error-callback": () => {
        setSubmitReady(false);
        securityStatusVisible = true;
        setStatus(
          "The security verification could not be completed. Please refresh the page and try again.",
          "error"
        );
      },
      "expired-callback": () => {
        setSubmitReady(false);
        securityStatusVisible = true;
        setStatus("The security verification expired. Please complete it again.", "error");
      },
      "timeout-callback": () => {
        setSubmitReady(false);
        securityStatusVisible = true;
        setStatus("The security verification timed out. Please complete it again.", "error");
      },
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    emailValidationStarted = true;
    const emailIsValid = validateEmail(true);

    if (!emailIsValid || !form.reportValidity()) {
      if (!emailIsValid) {
        emailInput.focus();
      }
      return;
    }

    if (turnstileWidgetId === null || !window.turnstile) {
      setStatus(
        "The security verification is still loading. Please wait a moment and try again.",
        "error"
      );
      return;
    }

    const turnstileToken = window.turnstile.getResponse(turnstileWidgetId);

    if (!turnstileToken) {
      setStatus("Please complete the security verification before sending.", "error");
      setSubmitReady(false);
      return;
    }

    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    securityStatusVisible = false;
    setStatus("Sending your message…");

    const payload = {
      name: form.elements.name.value,
      company: form.elements.company.value,
      email: emailInput.value.trim(),
      message: form.elements.message.value,
      website: form.elements.website.value,
      turnstileToken,
    };

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        // The generic error below covers a malformed or empty response.
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Your message could not be sent. Please try again."
        );
      }

      form.reset();
      emailValidationStarted = false;
      displayEmailValidation("");
      setStatus(
        result.message ||
          "Thank you. Your message has been sent. We will respond as soon as possible.",
        "success"
      );
    } catch (error) {
      setStatus(
        error instanceof Error && error.message
          ? error.message
          : "Your message could not be sent. Please try again.",
        "error"
      );
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.removeAttribute("aria-busy");
      form.removeAttribute("aria-busy");
      resetTurnstile();
    }
  });
})();
