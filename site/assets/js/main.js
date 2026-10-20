/* =========================================================
   InstaLume — site behaviour
   - restrained 3D tilt on the logo
   - real release metadata from GitHub (with graceful fallback)
   - tactile download button states
   No third-party dependencies.
   ========================================================= */
(function () {
  "use strict";

  var REPO = "sufiyan-sabeel/Insta-Lume";
  var RELEASES_PAGE = "https://github.com/" + REPO + "/releases";
  var LATEST_API = "https://api.github.com/repos/" + REPO + "/releases/latest";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------- footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- 3D logo tilt ---------------- */
  (function logo() {
    var stage = document.querySelector("[data-logo-stage]");
    var plate = document.querySelector("[data-logo-plate]");
    if (!stage || !plate || reduceMotion.matches) return;

    var raf = null, rx = 0, ry = 0, active = false;

    function apply() {
      plate.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      raf = null;
    }
    function schedule() { if (raf === null) raf = window.requestAnimationFrame(apply); }

    function onMove(e) {
      var r = plate.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      var max = e.pointerType === "touch" ? 8 : 16;
      ry = Math.max(-max, Math.min(max, px * max));
      rx = Math.max(-max, Math.min(max, -py * max));
      schedule();
    }
    function reset() { rx = 0; ry = 0; active = false; schedule(); }

    stage.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse") { active = true; onMove(e); }
      else if (e.pointerType === "touch" && e.buttons) { onMove(e); }
    }, { passive: true });
    stage.addEventListener("pointerleave", function () { if (active) reset(); });
    stage.addEventListener("pointerup", function (e) { if (e.pointerType === "touch") reset(); });
    stage.addEventListener("pointercancel", reset);
  })();

  /* ---------------- release metadata ---------------- */
  var $ = function (id) { return document.getElementById(id); };

  function formatBytes(n) {
    if (typeof n !== "number" || !isFinite(n) || n <= 0) return null;
    var units = ["B", "KB", "MB", "GB"], i = 0, v = n;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return (i === 0 ? v.toFixed(0) : v.toFixed(1)) + " " + units[i];
  }
  function formatDate(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function setDownloadLinks(url) {
    var links = document.querySelectorAll("[data-download]");
    for (var i = 0; i < links.length; i++) links[i].href = url;
  }
  function showNotice(html) {
    var n = $("download-notice");
    if (!n) return;
    n.hidden = false;
    n.innerHTML = html;
  }

  function loadRelease() {
    if (!("fetch" in window)) { fallback("This browser cannot load release data automatically."); return; }

    fetch(LATEST_API, { headers: { "Accept": "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (rel) {
        var assets = Array.isArray(rel.assets) ? rel.assets : [];
        var apk = null;
        for (var i = 0; i < assets.length; i++) {
          if (/\.apk$/i.test(assets[i].name)) { apk = assets[i]; break; }
        }
        if (!apk && assets.length) apk = assets[0];

        if ($("spec-version")) $("spec-version").textContent = rel.tag_name || rel.name || "Unknown";

        var relDate = formatDate(rel.published_at || rel.created_at);
        if ($("spec-date")) $("spec-date").textContent = relDate || "Not published";

        var assetUrl = null;
        if (apk) {
          var size = formatBytes(apk.size);
          if ($("spec-file")) $("spec-file").textContent = size ? (apk.name + " \u00b7 " + size) : apk.name;
          assetUrl = apk.browser_download_url || null;
        } else if ($("spec-file")) {
          $("spec-file").textContent = "No APK asset on the latest release";
        }

        var digest = (apk && apk.digest) ? String(apk.digest).replace(/^sha256:/i, "") : null;
        if ($("spec-sha")) {
          $("spec-sha").textContent = digest || "Not published for this asset";
          if (!digest) $("spec-sha").classList.add("muted");
        }

        if ($("panel-notes")) $("panel-notes").href = rel.html_url || RELEASES_PAGE;

        setDownloadLinks(assetUrl || RELEASES_PAGE);

        if (!assetUrl) {
          showNotice('No downloadable APK could be verified on the latest release. ' +
            'Please open <a href="' + RELEASES_PAGE + '" target="_blank" rel="noopener noreferrer">GitHub Releases</a>.');
        }
      })
      .catch(function () {
        fallback("Release metadata could not be loaded right now.");
      });
  }

  function fallback(reason) {
    if ($("spec-version")) $("spec-version").textContent = "Could not verify";
    if ($("spec-date")) $("spec-date").textContent = "\u2014";
    if ($("spec-file")) $("spec-file").textContent = "\u2014";
    if ($("spec-sha")) $("spec-sha").textContent = "\u2014";
    setDownloadLinks(RELEASES_PAGE);
    showNotice(reason + ' The download button opens ' +
      '<a href="' + RELEASES_PAGE + '" target="_blank" rel="noopener noreferrer">GitHub Releases</a> instead.');
  }

  /* ---------------- download button feedback ---------------- */
  (function downloadButtons() {
    var links = document.querySelectorAll("[data-download]");
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        a.addEventListener("click", function () {
          a.classList.add("is-loading");
          // Navigation / download proceeds normally via the anchor href.
          window.setTimeout(function () { a.classList.remove("is-loading"); }, 6000);
        });
      })(links[i]);
    }
  })();

  loadRelease();
})();
