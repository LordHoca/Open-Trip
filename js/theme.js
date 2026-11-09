/* ===========================================================
   theme.js — light / dark mode toggle
   =========================================================== */
(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById("themeToggle");
  const STORAGE_KEY = "rfa-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    toggleBtn && toggleBtn.setAttribute(
      "aria-label",
      theme === "dark" ? "Ganti ke tampilan terang" : "Ganti ke tampilan gelap"
    );
  }

  // tentukan tema awal: preferensi tersimpan > preferensi sistem > terang
  let initial = localStorage.getItem(STORAGE_KEY);
  if (!initial) {
    initial = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(initial);

  toggleBtn && toggleBtn.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
})();
