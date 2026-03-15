/**
 * Reusable download button component.
 * Usage: <div data-download-button></div> for full style, or
 *        <span data-download-button data-compact></span> for navbar/small style.
 *
 * URL: Default is the GitHub Releases asset (Cowork-macos.dmg). On index.html,
 * the build script (inject-download-url.mjs) replaces __DOWNLOAD_URL__ in the
 * page with the real URL and sets window.COWORK_DOWNLOAD_URL. If that hasn't
 * run (e.g. local preview) or the value is still the placeholder, we use the
 * default so the button always points at the GitHub releases bucket.
 */
(function () {
  var DEFAULT_URL = "https://github.com/alexakayman/cowork/releases/latest/download/Cowork-macos.dmg";
  var injected = typeof window.COWORK_DOWNLOAD_URL !== "undefined" && window.COWORK_DOWNLOAD_URL && window.COWORK_DOWNLOAD_URL !== "__DOWNLOAD_URL__";
  var url = injected ? window.COWORK_DOWNLOAD_URL : DEFAULT_URL;

  var appleIcon = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';

  var fullButton = '<a href="' + url + '" class="download-btn inline-flex items-center justify-center gap-2 bg-warm text-cream px-6 py-3 rounded-xl font-medium text-sm">' + appleIcon + ' Get for macOS</a>';
  var compactButton = '<a href="' + url + '" class="download-btn inline-flex items-center justify-center gap-1.5 bg-warm text-cream px-3 py-1.5 rounded-lg text-sm font-medium">' + appleIcon.replace('class="w-5 h-5"', 'class="w-4 h-4"') + ' Download</a>';

  var placeholders = document.querySelectorAll("[data-download-button]");
  placeholders.forEach(function (el) {
    var isCompact = el.hasAttribute("data-compact");
    var html = isCompact ? compactButton : '<div class="flex justify-center mb-8">' + fullButton + "</div>";
    el.innerHTML = html;
  });
})();
