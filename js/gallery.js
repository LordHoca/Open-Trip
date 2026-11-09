/* ===========================================================
   gallery.js — Dual 360° Orbit Curve (High-DPI Crisp Rendering)
   =========================================================== */
(function () {
  const TOTAL_PHOTOS = 27;

  const photoSources = [
    ...Array.from(
      { length: TOTAL_PHOTOS },
      (_, index) => `assets/images/gallery-${String(index + 1).padStart(2, "0")}.jpg`
    ),
    "assets/images/footer image.jpg"
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

  let allLoadedPhotos = [];
  let activeLightboxIndex = 0;

  function getOrientation(src, index) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () =>
        resolve({
          src,
          index,
          title: `Kenangan Bersama RFA #${index + 1}`,
          orientation: image.naturalHeight > image.naturalWidth ? "portrait" : "landscape"
        });
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function setupOrbitCurve(orientation, photos) {
    const stage = document.getElementById(`${orientation}Gallery`);
    const ring = document.getElementById(`${orientation}OrbitRing`);
    if (!stage || !ring || !photos.length) return;

    const MIN_CARDS = 12;
    const MAX_CARDS = 16;
    let deck = [...photos];
    while (deck.length < MIN_CARDS) {
      deck = deck.concat(photos);
    }
    if (deck.length > MAX_CARDS) {
      deck = deck.slice(0, MAX_CARDS);
    }

    const count = deck.length;
    const angleStep = 360 / count;

    ring.replaceChildren();
    const cards = deck.map((photo, idx) => {
      const card = document.createElement("div");
      card.className = "orbit-card";
      card.dataset.photoIndex = String(photo.index);

      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = `${photo.title} (${idx + 1})`;
      img.loading = "eager";
      img.decoding = "sync";
      img.draggable = false;

      card.appendChild(img);
      ring.appendChild(card);

      return {
        el: card,
        baseAngle: idx * angleStep
      };
    });

    const autoDir = orientation === "landscape" ? 1 : -1;
    const autoSpeed = prefersReducedMotion ? 0 : 0.08 * autoDir;

    let targetRotY = 0;
    let currentRotY = 0;
    let radius = 360;

    let isDragging = false;
    let isHovered = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragStartRotY = 0;
    let pointerAxis = null;
    let movedDistance = 0;

    function computeSafeRadius() {
      const cardWidth = ring.offsetWidth || (orientation === "portrait" ? 150 : 195);
      const vw = window.innerWidth;
      const gap = vw <= 519 ? 18 : vw <= 900 ? 24 : 30;

      const polygonRadius = (cardWidth + gap) / (2 * Math.sin(Math.PI / count));
      const minRadius = vw <= 519 ? 225 : 340;
      radius = Math.max(polygonRadius, minRadius);
    }

    function renderOrbit() {
      if (!isDragging && !isHovered && !document.hidden) {
        targetRotY += autoSpeed;
      }

      currentRotY = lerp(currentRotY, targetRotY, 0.08);

      cards.forEach(({ el, baseAngle }) => {
        const netAngleDeg = (((baseAngle + currentRotY) % 360) + 540) % 360 - 180;
        const rad = (netAngleDeg * Math.PI) / 180;
        const cosAngle = Math.cos(rad);
        const sinAngle = Math.sin(rad);

        if (cosAngle <= 0.08) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        } else {
          // Pembulatan koordinat X dan Z mencegah blur sub-piksel pada layar HP
          const x = Math.round(sinAngle * radius);
          const z = Math.round((cosAngle - 1) * radius);
          const opacity = Math.min(1, Math.pow((cosAngle - 0.08) / 0.92, 1.1));

          el.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${netAngleDeg.toFixed(1)}deg)`;
          el.style.opacity = opacity.toFixed(2);
          el.style.visibility = "visible";
          el.style.pointerEvents = cosAngle > 0.4 ? "auto" : "none";
          el.style.zIndex = String(Math.round(cosAngle * 100));
        }
      });

      requestAnimationFrame(renderOrbit);
    }

    stage.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") isHovered = true;
    });
    stage.addEventListener("pointerleave", () => {
      isHovered = false;
    });

    stage.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragStartRotY = targetRotY;
      pointerAxis = null;
      movedDistance = 0;

      if (e.pointerType === "mouse") {
        e.preventDefault();
        stage.setPointerCapture(e.pointerId);
      }
    });

    stage.addEventListener("pointermove", (e) => {
      if (!isDragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!pointerAxis && Math.hypot(dx, dy) > 6) {
        pointerAxis = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
        if (pointerAxis === "horizontal" && e.pointerType !== "mouse") {
          stage.setPointerCapture(e.pointerId);
        }
      }

      if (pointerAxis === "horizontal" || e.pointerType === "mouse") {
        movedDistance = Math.hypot(dx, dy);
        const degPerPx = (180 / Math.PI) / Math.max(radius * 0.85, 180);
        targetRotY = dragStartRotY + dx * degPerPx;
      }
    });

    function finishPointer(e) {
      if (!isDragging || e.pointerId !== pointerId) return;
      isDragging = false;
      pointerId = null;
      pointerAxis = null;

      if (movedDistance < 8) {
        const tappedCard = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest(".orbit-card");
        if (tappedCard && tappedCard.dataset.photoIndex !== undefined) {
          openLightbox(Number(tappedCard.dataset.photoIndex));
        }
      }
    }

    stage.addEventListener("pointerup", finishPointer);
    stage.addEventListener("pointercancel", finishPointer);

    stage.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          targetRotY -= e.deltaX * 0.16;
        }
      },
      { passive: false }
    );

    window.addEventListener("resize", computeSafeRadius);
    computeSafeRadius();
    requestAnimationFrame(renderOrbit);
  }

  // Lightbox (Resolusi Native 100% Tajam, Geser Kiri/Kanan untuk Ganti Foto)
  const lightbox = document.getElementById("lightbox3D");
  const lightboxCard = document.getElementById("lightboxCard");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");

  function renderLightboxPhoto() {
    if (!allLoadedPhotos.length || !lightboxImage) return;
    const item = allLoadedPhotos[activeLightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.title;
    if (lightboxCaption) {
      lightboxCaption.textContent = `${item.title} • Geser untuk foto lainnya`;
    }
  }

  function openLightbox(photoIndex) {
    if (!lightbox || !allLoadedPhotos.length) return;
    const idx = allLoadedPhotos.findIndex((p) => p.index === photoIndex);
    activeLightboxIndex = idx >= 0 ? idx : 0;
    renderLightboxPhoto();
    if (lightboxCard) lightboxCard.style.transform = "none";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    if (lightboxCard) lightboxCard.style.transform = "none";
  }

  function stepLightbox(dir) {
    if (!allLoadedPhotos.length) return;
    activeLightboxIndex =
      (activeLightboxIndex + dir + allLoadedPhotos.length) % allLoadedPhotos.length;
    renderLightboxPhoto();
  }

  if (lightboxCard) {
    let lbPointerId = null;
    let lbStartX = 0;
    let lbDeltaX = 0;

    lightboxCard.addEventListener("pointerdown", (e) => {
      lbPointerId = e.pointerId;
      lbStartX = e.clientX;
      lbDeltaX = 0;
      lightboxCard.classList.add("is-dragging");
      lightboxCard.setPointerCapture(e.pointerId);
    });

    lightboxCard.addEventListener("pointermove", (e) => {
      if (lbPointerId !== e.pointerId) return;
      lbDeltaX = e.clientX - lbStartX;
      lightboxCard.style.transform = `translateX(${Math.round(lbDeltaX * 0.45)}px)`;
    });

    function endLightboxSwipe(e) {
      if (e.pointerId !== lbPointerId) return;
      lbPointerId = null;
      lightboxCard.classList.remove("is-dragging");
      lightboxCard.style.transform = "none"; // Kembali ke transform: none agar 100% tajam

      if (lbDeltaX > 45) {
        stepLightbox(-1);
      } else if (lbDeltaX < -45) {
        stepLightbox(1);
      }
    }

    lightboxCard.addEventListener("pointerup", endLightboxSwipe);
    lightboxCard.addEventListener("pointercancel", endLightboxSwipe);
  }

  lightboxBackdrop && lightboxBackdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  Promise.all(photoSources.map((src, index) => getOrientation(src, index))).then((results) => {
    allLoadedPhotos = results.filter(Boolean);
    const portraitPhotos = allLoadedPhotos.filter((p) => p.orientation === "portrait");
    const landscapePhotos = allLoadedPhotos.filter((p) => p.orientation === "landscape");

    setupOrbitCurve("portrait", portraitPhotos.length ? portraitPhotos : allLoadedPhotos);
    setupOrbitCurve("landscape", landscapePhotos.length ? landscapePhotos : allLoadedPhotos);
  });
})();
