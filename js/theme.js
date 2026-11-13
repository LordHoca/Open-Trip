/* ===========================================================
   theme.js — light / dark mode toggle
   =========================================================== */
(function () {
  const root = document.documentElement;
  const STORAGE_KEY = "rfa-theme";

  function applyTheme(theme, toggleBtn) {
    root.setAttribute("data-theme", theme);
    toggleBtn && toggleBtn.setAttribute(
      "aria-label",
      theme === "dark" ? "Ganti ke tampilan terang" : "Ganti ke tampilan gelap"
    );
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme === "dark" || savedTheme === "light"
    ? savedTheme
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.setAttribute("data-theme", initialTheme);

  function initializeToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    if (!toggleBtn) return;

    applyTheme(initialTheme, toggleBtn);
    toggleBtn.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, toggleBtn);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToggle, { once: true });
  } else {
    initializeToggle();
  }
})();
