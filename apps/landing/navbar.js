/**
 * Shared navbar component. Injects the same nav into every page.
 * Set data-page on <body> to highlight the current link: "index" | "privacy" | "changelog" | "apps"
 * Example: <body class="..." data-page="changelog">
 */
(function () {
  function linkClass(page) {
    var current = (document.body.getAttribute("data-page") || "index").toLowerCase();
    return current === page ? "text-warm font-medium" : "text-warm/70 hover:text-warm";
  }

  var nav =
    '<nav class="border-b border-warm/20 bg-cream sticky top-0 z-10">' +
    '<div class="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">' +
    '<a href="index.html" class="font-bold text-warm text-lg shrink-0">Copaw</a>' +
    '<div class="flex items-center gap-4 sm:gap-6 text-sm flex-shrink-0">' +
    '<a href="privacy.html" class="' +
    linkClass("privacy") +
    '">Privacy</a>' +
    '<a href="changelog.html" class="' +
    linkClass("changelog") +
    '">Changelog</a>' +
    '<span data-download-button data-compact></span>' +
    "</div>" +
    "</div>" +
    "</nav>";

  var root = document.getElementById("navbar-root");
  if (root) {
    root.outerHTML = nav;
  }
})();
