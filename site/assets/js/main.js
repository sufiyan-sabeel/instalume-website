/* =========================================================
   InstaLume — site behaviour
   - accent-colour picker (remembered in the browser)
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

  var THEME_KEY = "instalume:accent";
  var DEFAULT_ACCENT = "#c5c7cc";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------------- footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- header shadow on scroll ---------------- */
  (function headerShadow() {
    function onScroll() {
      document.body.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* =========================================================
     Accent colour
     ========================================================= */
  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return ("0" + v.toString(16)).slice(-2);
    }).join("");
  }
  function mix(hex, target, t) {
    var c = hexToRgb(hex), tc = hexToRgb(target);
    if (!c || !tc) return hex;
    return rgbToHex(c[0] + (tc[0] - c[0]) * t, c[1] + (tc[1] - c[1]) * t, c[2] + (tc[2] - c[2]) * t);
  }

  function applyAccent(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return;
    var h = rgbToHex(rgb[0], rgb[1], rgb[2]);
    root.style.setProperty("--accent", h);
    root.style.setProperty("--accent-bright", mix(h, "#ffffff", 0.70));
    root.style.setProperty("--accent-deep", mix(h, "#000000", 0.38));
    root.style.setProperty("--accent-glow", rgb.join(","));

    var input = document.querySelector("[data-theme-custom]");
    if (input) input.value = h;

    var sws = document.querySelectorAll(".swatch");
    for (var i = 0; i < sws.length; i++) {
      var on = String(sws[i].getAttribute("data-accent")).toLowerCase() === h.toLowerCase();
      sws[i].setAttribute("aria-checked", on ? "true" : "false");
    }
    try { localStorage.setItem(THEME_KEY, h); } catch (e) { /* storage blocked */ }
  }

  (function themePicker() {
    var dock = document.querySelector("[data-theme-dock]");
    if (!dock) return;
    var toggle = dock.querySelector("[data-theme-toggle]");
    var panel = dock.querySelector("#theme-panel");
    var closeBtn = dock.querySelector("[data-theme-close]");
    var custom = dock.querySelector("[data-theme-custom]");
    var reset = dock.querySelector("[data-theme-reset]");
    var sws = Array.prototype.slice.call(dock.querySelectorAll(".swatch"));

    function open() { if (panel) { panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); } }
    function close() { if (panel) { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); } }

    if (toggle) toggle.addEventListener("click", function () { panel.hidden ? open() : close(); });
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("click", function (e) { if (!dock.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    sws.forEach(function (sw) {
      sw.addEventListener("click", function () { applyAccent(sw.getAttribute("data-accent")); });
    });

    var group = dock.querySelector(".swatches");
    if (group) {
      group.addEventListener("keydown", function (e) {
        var keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];
        if (keys.indexOf(e.key) === -1) return;
        var idx = sws.indexOf(document.activeElement);
        if (idx < 0) return;
        e.preventDefault();
        var dir = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
        var next = sws[(idx + dir + sws.length) % sws.length];
        next.focus();
        applyAccent(next.getAttribute("data-accent"));
      });
    }

    if (custom) custom.addEventListener("input", function () { applyAccent(custom.value); });
    if (reset) reset.addEventListener("click", function () { applyAccent(DEFAULT_ACCENT); });

    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    applyAccent(saved || DEFAULT_ACCENT);
  })();

  /* =========================================================
     3D logo tilt
     ========================================================= */
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

  /* =========================================================
     Release metadata
     ========================================================= */
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
          window.setTimeout(function () { a.classList.remove("is-loading"); }, 6000);
        });
      })(links[i]);
    }
  })();

  loadRelease();
})();
