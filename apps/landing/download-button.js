/**
 * Reusable download button component.
 * Usage: <div data-download-button></div> for full style, or
 *        <span data-download-button data-compact></span> for navbar/small style.
 *
 * On click, shows a Wispr-style modal with install steps, then the user can
 * click "Download Copaw" to start the download.
 *
 * URL: Default is the GitHub Releases asset (Copaw-macos.dmg). On index.html,
 * the build script (inject-download-url.mjs) replaces __DOWNLOAD_URL__ in the
 * page with the real URL and sets window.COWORK_DOWNLOAD_URL. If that hasn't
 * run (e.g. local preview) or the value is still the placeholder, we use the
 * default so the button always points at the GitHub releases bucket.
 */
(function () {
  var DEFAULT_URL =
    "https://github.com/alexakayman/cowork/releases/latest/download/Copaw-macos.dmg";
  var injected =
    typeof window.COWORK_DOWNLOAD_URL !== "undefined" &&
    window.COWORK_DOWNLOAD_URL &&
    window.COWORK_DOWNLOAD_URL !== "__DOWNLOAD_URL__";
  var url = injected ? window.COWORK_DOWNLOAD_URL : DEFAULT_URL;

  var UNLOCK_KEY = "copaw_download_unlocked";
  var downloadAllowed = false;

  var appleIcon =
    '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';

  var fullButton =
    '<a href="' +
    url +
    '" class="download-btn inline-flex items-center justify-center gap-2 bg-warm text-cream px-6 py-3 rounded-xl font-medium text-sm">' +
    appleIcon +
    " Get for macOS</a>";
  var compactButton =
    '<a href="' +
    url +
    '" class="download-btn inline-flex items-center justify-center gap-1.5 bg-warm text-cream px-3 py-1.5 rounded-lg text-sm font-medium">' +
    appleIcon.replace('class="w-5 h-5"', 'class="w-4 h-4"') +
    " Download</a>";

  var placeholders = document.querySelectorAll("[data-download-button]");
  placeholders.forEach(function (el) {
    var isCompact = el.hasAttribute("data-compact");
    var html = isCompact
      ? compactButton
      : '<div class="flex justify-center mb-8">' + fullButton + "</div>";
    el.innerHTML = html;
  });

  // ── Download modal (Wispr-style install steps) ──
  var modalHtml =
    '<div id="download-modal" class="fixed inset-0 z-50 hidden" aria-hidden="true">' +
    '  <div id="download-modal-backdrop" class="fixed inset-0 bg-warm/40"></div>' +
    '  <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">' +
    '    <div id="download-modal-content" class="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 pointer-events-auto border border-warm/10 my-auto">' +
    '      <h3 class="text-lg font-semibold text-warm mb-4">Install Copaw on Mac</h3>' +
    '      <ol class="list-decimal list-inside space-y-3 text-sm text-warm/80 mb-6">' +
    "        <li><strong>Open the DMG</strong> from your Downloads folder.</li>" +
    "        <li><strong>Drag Copaw</strong> to your Applications folder.</li>" +
    "        <li>If macOS says the app is damaged, open <strong>Terminal</strong> and run:" +
    '          <div class="mt-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">' +
    '            <code id="download-modal-cmd" class="min-w-0 p-2 bg-cream border border-warm/20 rounded text-xs font-mono break-all">sudo xattr -cr /Applications/Copaw.app</code>' +
    '            <button type="button" id="download-modal-copy" class="shrink-0 px-3 py-2 text-xs font-medium bg-warm text-cream rounded-lg hover:opacity-90 transition-opacity">Copy</button>' +
    "          </div>" +
    "        </li>" +
    "      </ol>" +
    '      <div id="download-gate" class="mb-6">' +
    '        <p class="text-sm font-semibold text-warm mb-2">Get for free</p>' +
    '        <p class="text-xs text-warm/60 mb-3">Enter your email once to unlock the download.</p>' +
    '        <form id="download-gate-form" class="flex flex-col gap-2">' +
    '          <label for="download-gate-email" class="text-xs font-medium text-warm/70">Email</label>' +
    '          <input id="download-gate-email" type="email" required autocomplete="email" placeholder="you@example.com" class="w-full bg-cream border border-warm/20 rounded-xl px-3 py-2 text-sm text-warm placeholder:text-warm/40 focus:outline-none" />' +
    '          <div id="download-gate-error" class="hidden text-xs text-rose font-medium"></div>' +
    '          <button type="submit" id="download-gate-submit" class="download-btn inline-flex items-center justify-center gap-2 bg-warm text-cream px-5 py-2.5 rounded-xl font-medium text-sm opacity-50 cursor-not-allowed" disabled>Get for free</button>' +
    "        </form>" +
    "      </div>" +
    '      <div class="flex flex-col sm:flex-row gap-2 justify-end sm:flex-wrap">' +
    '        <button type="button" id="download-modal-close" class="px-4 py-2 text-sm font-medium text-warm/70 hover:text-warm rounded-lg transition-colors">Close</button>' +
    '        <a href="#" id="download-modal-confirm" aria-disabled="true" class="download-btn inline-flex items-center justify-center gap-2 bg-warm text-cream px-5 py-2.5 rounded-xl font-medium text-sm opacity-50 pointer-events-none">' +
    appleIcon +
    " Download Copaw</a>" +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    "</div>";

  var wrap = document.createElement("div");
  wrap.innerHTML = modalHtml;
  var modal = wrap.firstElementChild;
  document.body.appendChild(modal);

  var backdrop = document.getElementById("download-modal-backdrop");
  var content = document.getElementById("download-modal-content");
  var closeBtn = document.getElementById("download-modal-close");
  var confirmLink = document.getElementById("download-modal-confirm");
  var copyBtn = document.getElementById("download-modal-copy");
  var cmdEl = document.getElementById("download-modal-cmd");
  var gateEl = document.getElementById("download-gate");
  var gateForm = document.getElementById("download-gate-form");
  var emailInput = document.getElementById("download-gate-email");
  var gateSubmit = document.getElementById("download-gate-submit");
  var gateError = document.getElementById("download-gate-error");
  var XATTR_CMD = "sudo xattr -cr /Applications/Copaw.app";

  function safeGetUnlocked() {
    try {
      return window.localStorage.getItem(UNLOCK_KEY) === "true";
    } catch (_) {
      return false;
    }
  }

  function safeSetUnlocked() {
    try {
      window.localStorage.setItem(UNLOCK_KEY, "true");
      return true;
    } catch (_) {
      return false;
    }
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim());
  }

  function setConfirmEnabled(enabled) {
    downloadAllowed = Boolean(enabled);
    if (!confirmLink) return;

    if (downloadAllowed) {
      confirmLink.href = url;
      confirmLink.setAttribute("aria-disabled", "false");
      confirmLink.classList.remove("opacity-50", "pointer-events-none");
    } else {
      confirmLink.href = "#";
      confirmLink.setAttribute("aria-disabled", "true");
      confirmLink.classList.add("opacity-50", "pointer-events-none");
    }
  }

  function setGateUI(unlocked) {
    if (!gateEl) return;
    gateEl.style.display = unlocked ? "none" : "block";

    if (gateError) {
      gateError.textContent = "";
      gateError.classList.add("hidden");
    }

    if (gateSubmit && !unlocked) {
      gateSubmit.disabled = !isValidEmail(emailInput ? emailInput.value : "");
      if (gateSubmit.disabled) {
        gateSubmit.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        gateSubmit.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }
  }

  function showModal() {
    var unlocked = safeGetUnlocked();
    setConfirmEnabled(unlocked);
    setGateUI(unlocked);

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function hideModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function onConfirmClick(e) {
    if (!downloadAllowed) {
      e.preventDefault();
      if (emailInput) emailInput.focus();
      return;
    }
    hideModal();
  }

  document.addEventListener("click", function (e) {
    if (
      e.target.closest(".download-btn") &&
      !e.target.closest("#download-modal-content")
    ) {
      e.preventDefault();
      showModal();
    }
  });

  if (backdrop) backdrop.addEventListener("click", hideModal);
  if (closeBtn) closeBtn.addEventListener("click", hideModal);
  if (confirmLink) confirmLink.addEventListener("click", onConfirmClick);
  if (gateForm && gateSubmit && emailInput) {
    var DEFAULT_GATE_TEXT = gateSubmit.textContent || "Get for free";

    function updateSubmitEnabled() {
      var valid = isValidEmail(emailInput.value);
      gateSubmit.disabled = !valid;
      if (gateSubmit.disabled) {
        gateSubmit.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        gateSubmit.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }

    emailInput.addEventListener("input", updateSubmitEnabled);

    gateForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = emailInput.value;
      if (!isValidEmail(email)) {
        if (gateError) {
          gateError.textContent = "Please enter a valid email.";
          gateError.classList.remove("hidden");
        }
        return;
      }

      gateSubmit.disabled = true;
      gateSubmit.textContent = "Submitting…";
      if (gateError) {
        gateError.textContent = "";
        gateError.classList.add("hidden");
      }

      fetch("/api/download-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) {
          if (!res.ok)
            return res.json().catch(function () {
              return {};
            });
          return { ok: true };
        })
        .then(function (data) {
          if (data && data.ok) {
            safeSetUnlocked();
            setConfirmEnabled(true);
            setGateUI(true);
            if (gateSubmit) gateSubmit.textContent = DEFAULT_GATE_TEXT;
            return;
          }

          var msg =
            (data && data.error && String(data.error)) ||
            "Could not unlock download. Please try again.";
          if (gateError) {
            gateError.textContent = msg;
            gateError.classList.remove("hidden");
          }
        })
        .catch(function () {
          if (gateError) {
            gateError.textContent = "Network error. Please try again.";
            gateError.classList.remove("hidden");
          }
        })
        .finally(function () {
          // Restore button state if user is still editing a valid email.
          if (gateSubmit) {
            gateSubmit.textContent = DEFAULT_GATE_TEXT;
            updateSubmitEnabled();
          }
        });
    });

    updateSubmitEnabled();
  }
  if (copyBtn && cmdEl) {
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(XATTR_CMD).then(
        function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () {
            copyBtn.textContent = "Copy";
          }, 2000);
        },
        function () {
          copyBtn.textContent = "Copy failed";
          setTimeout(function () {
            copyBtn.textContent = "Copy";
          }, 2000);
        },
      );
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      hideModal();
    }
  });
})();
