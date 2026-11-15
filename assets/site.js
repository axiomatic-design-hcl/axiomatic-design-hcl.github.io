// Small enhancements. Every page works without this script.
(function () {
  "use strict";

  // Copy buttons on code blocks.
  document.querySelectorAll(".code pre").forEach(function (pre) {
    if (!navigator.clipboard) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy this code");
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(pre.innerText.replace(/\n$/, "")).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      }, function () {
        btn.textContent = "Not copied";
      });
    });
    pre.parentNode.appendChild(btn);
  });

  // Lesson progress on the learn page. Stored only in this browser.
  var KEY = "adhcl-learn-done";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* no storage */ }
  }
  var buttons = document.querySelectorAll("[data-done]");
  var lessons = document.querySelectorAll("[data-lesson]");
  var bar = document.querySelector(".progress-bar span");
  var text = document.querySelector(".progress-text");

  function render() {
    var done = load();
    buttons.forEach(function (b) {
      var on = done.indexOf(b.dataset.done) !== -1;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "Lesson done" : "Mark this lesson as done";
    });
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      a.classList.toggle("done", done.indexOf(a.dataset.nav) !== -1);
    });
    var count = 0;
    lessons.forEach(function (l) { if (done.indexOf(l.dataset.lesson) !== -1) count++; });
    if (bar) bar.style.width = (lessons.length ? (100 * count / lessons.length) : 0) + "%";
    if (text) text.textContent = count + " of " + lessons.length + " lessons done";
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var done = load();
      var i = done.indexOf(b.dataset.done);
      if (i === -1) done.push(b.dataset.done); else done.splice(i, 1);
      save(done);
      render();
    });
  });
  if (lessons.length) render();

  // Highlight the current section in the table of contents.
  var links = {};
  document.querySelectorAll("[data-nav]").forEach(function (a) { links[a.dataset.nav] = a; });
  if ("IntersectionObserver" in window && Object.keys(links).length) {
    var current = null;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (current) current.classList.remove("active");
        current = links[id];
        if (current) current.classList.add("active");
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    document.querySelectorAll(".doc h2[id]").forEach(function (h) { obs.observe(h); });
  }

  // Start with the table of contents closed on small screens.
  var tocDetails = document.querySelector(".toc details");
  if (tocDetails && window.matchMedia("(max-width: 979px)").matches) tocDetails.open = false;

  // Close the mobile table of contents after a jump.
  document.querySelectorAll(".toc a").forEach(function (a) {
    a.addEventListener("click", function () {
      var d = a.closest("details");
      if (d && window.matchMedia("(max-width: 979px)").matches) d.open = false;
    });
  });
})();
