/* ===========================================================
   nav.js — menu mobile, dropdown "Destination", warna menu aktif,
   titik hero, dan efek navbar saat scroll
   =========================================================== */
(function () {
  // --- menu hamburger (mobile) ---
  const hamburger = document.getElementById("hamburger");
  const navlinks = document.getElementById("navlinks");

  function setMenuOpen(isOpen) {
    if (!hamburger || !navlinks) return;
    navlinks.classList.toggle("is-open", isOpen);
    hamburger.classList.toggle("is-open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
  }

  if (hamburger && navlinks) {
    hamburger.addEventListener("click", () => {
      setMenuOpen(!navlinks.classList.contains("is-open"));
    });

    navlinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (
        navlinks.classList.contains("is-open") &&
        !navlinks.contains(event.target) &&
        !hamburger.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    });
  }

  // --- dropdown "Destination": klik untuk buka pilihan pulau ---
  const destToggle = document.getElementById("destToggle");
  const destPanel = document.getElementById("destPanel");
  const destDropdown = document.getElementById("destDropdown");

  function closeDestPanel() {
    destPanel && destPanel.classList.remove("is-open");
    destToggle && destToggle.classList.remove("is-active");
  }

  destToggle &&
    destToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const willOpen = !destPanel.classList.contains("is-open");
      destPanel.classList.toggle("is-open", willOpen);
      if (willOpen) {
        document
          .querySelectorAll(".navlink")
          .forEach((l) => l.classList.remove("is-active"));
        destToggle.classList.add("is-active");
      } else {
        destToggle.classList.remove("is-active");
      }
    });

  // tutup dropdown kalau klik di luar area menu
  document.addEventListener("click", function (e) {
    if (destDropdown && !destDropdown.contains(e.target)) {
      closeDestPanel();
    }
  });

  // --- link navbar biasa (bukan tombol dropdown): beri warna biru saat diklik ---
  const allNavLinks = document.querySelectorAll(".navlink");
  const plainNavLinks = document.querySelectorAll(".navlink:not(.navlink--dropdown)");
  plainNavLinks.forEach((link) => {
    link.addEventListener("click", function () {
      allNavLinks.forEach((l) => l.classList.remove("is-active"));
      this.classList.add("is-active");
    });
  });

  // pilihan pulau di dalam dropdown juga ikut menutup menu & dropdown
  destPanel &&
    destPanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", function () {
    setMenuOpen(false);
        closeDestPanel();
        document
          .querySelectorAll(".navlink")
          .forEach((l) => l.classList.remove("is-active"));
        destToggle && destToggle.classList.add("is-active");
      });
    });

  navlinks &&
    navlinks.querySelectorAll(":scope > a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

  // --- bayangan navbar ketika halaman di-scroll ---
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", function () {
    if (!navbar) return;
    navbar.style.boxShadow = window.scrollY > 10 ? "0 8px 24px -16px rgba(11,37,69,.35)" : "none";
  });

  // --- slideshow hero: foto berganti setiap lima detik ---
  const heroImage = document.getElementById("heroImage");
  const heroImageNext = document.getElementById("heroImageNext");
  const heroTitle = document.getElementById("heroTitle");
  const heroDescription = document.getElementById("heroDescription");
  const heroDots = Array.from(document.querySelectorAll("#heroDots button"));
  const heroSlides = [
    {
      image: "assets/images/home-01.png",
      alt: "Liburan di Kepulauan Seribu",
      title: "See the beauty<br>in a beautiful ways",
      description: "Setiap pulau punya keindahan dan ceritanya sendiri.<br>Bersama RFA, nikmati perjalanan privat yang lebih mudah, menyenangkan, dan penuh kenangan."
    },
    {
      image: "assets/images/home-02.png",
      alt: "Perjalanan menyusuri hutan mangrove Kepulauan Seribu",
      title: "Setiap Momen<br>Punya Cerita.",
      description: "Lihat berbagai keseruan perjalanan bersama RFA.<br>Dari indahnya pemandangan laut hingga momen sederhana yang selalu ingin dikenang."
     
    },
    {
      image: "assets/images/home-03.png",
      alt: "Menikmati matahari terbenam di Kepulauan Seribu",
      title: "Liburan Sesukamu,<br>Cerita Milikmu.",
      description: "Punya rencana liburan sendiri? Tentukan destinasi, tanggal, dan aktivitas yang kamu inginkan.<br>RFA siap membantu mewujudkan perjalanan versimu"
      
    },
    {
      image: "assets/images/home-04.jpg",
      alt: "Keseruan perjalanan bersama RFA di pantai",
      title: "Sunset, Sea,<br>and Endless Memories.",
      description: "Nikmati hangatnya matahari yang perlahan tenggelam di balik lautan.<br>Karena terkadang, momen paling sederhana justru menjadi kenangan yang paling sulit dilupakan."
    }
  ].slice(0, heroDots.length);
  if (heroImage && heroImageNext && heroTitle && heroDescription && heroDots.length) {
    let activeSlide = 0;
    let activeImage = heroImage;
    let transitionRequest = 0;

    function showSlide(index) {
      activeSlide = index;
      const request = ++transitionRequest;
      const slide = heroSlides[activeSlide];
      heroDots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeSlide;
        dot.classList.toggle("is-active", isActive);
        if (isActive) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });

      const preloadedImage = new Image();
      preloadedImage.onload = () => {
        if (request !== transitionRequest) return;

        const incomingImage = activeImage === heroImage ? heroImageNext : heroImage;
        incomingImage.src = slide.image;
        incomingImage.alt = slide.alt;
        heroTitle.innerHTML = slide.title;
        heroDescription.innerHTML = slide.description;
        requestAnimationFrame(() => {
          if (request !== transitionRequest) return;
          incomingImage.classList.add("is-active");
          activeImage.classList.remove("is-active");
          activeImage = incomingImage;
        });
      };
      preloadedImage.onerror = () => {
        console.error(`Gagal memuat foto hero: ${slide.image}`);
      };
      preloadedImage.src = slide.image;
    }

    heroDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
        clearInterval(slideshow);
        slideshow = setInterval(advanceSlide, 5000);
      });
    });

    function advanceSlide() {
      showSlide((activeSlide + 1) % heroSlides.length);
    }

    let slideshow = setInterval(advanceSlide, 5000);
  }
})();
