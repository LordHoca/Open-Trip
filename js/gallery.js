/* ===========================================================
   gallery.js — galeri potret dan lanskap dengan gerak otomatis.
   =========================================================== */
(function () {
  const TOTAL_PHOTOS = 27;
  const AUTO_SPEED = 40;
  const SCROLL_DURATION = 700;
  const photos = Array.from(
    { length: TOTAL_PHOTOS },
    (_, index) => `assets/images/gallery-${String(index + 1).padStart(2, "0")}.jpg`
  );

  function getOrientation(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({
        src,
        orientation: image.naturalHeight > image.naturalWidth ? "portrait" : "landscape"
      });
      image.onerror = () => reject(new Error(`Gagal memuat foto galeri: ${src}`));
      image.src = src;
    });
  }

  function setupGallery(orientation, images) {
    const wrapper = document.getElementById(`${orientation}Gallery`);
    if (!wrapper || !images.length) return;

    const createImage = ({ src }, index, isClone = false) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = isClone ? "" : `Momen perjalanan RFA ${index + 1}`;
      image.loading = "lazy";
      image.draggable = false;
      if (isClone) image.setAttribute("aria-hidden", "true");
      return image;
    };

    const beforeClones = images.map((photo, index) => createImage(photo, index, true));
    const originalImages = images.map((photo, index) => createImage(photo, index));
    const afterClones = images.map((photo, index) => createImage(photo, index, true));
    wrapper.replaceChildren(...beforeClones, ...originalImages, ...afterClones);

    const firstOriginalIndex = images.length;
    const returnIndex = images.length * 2;
    const autoDirection = orientation === "landscape" ? -1 : 1;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = firstOriginalIndex;
    let autoFrame;
    let autoPreviousTime;
    let autoPosition;
    let resumeTimer;
    let pointerId;
    let pointerStartX;
    let pointerStartScroll;
    let pointerMoved = false;
    let isMoving = false;
    let autoEnabled = !prefersReducedMotion;

    function scrollPositionFor(image) {
      return image.offsetLeft;
    }

    function normalizeIndex(index) {
      if (index < firstOriginalIndex) return index + images.length;
      if (index >= returnIndex) return index - images.length;
      return index;
    }

    function updateCylinderCards() {
      const center = wrapper.clientWidth / 2;
      const radius = Math.max(center, 1);
      Array.from(wrapper.children).forEach((image) => {
        const imageCenter = image.offsetLeft - wrapper.scrollLeft + image.offsetWidth / 2;
        const position = Math.max(-1, Math.min(1, (imageCenter - center) / radius));
        const distanceFromCenter = Math.abs(position);
        const angle = position * 76;
        const depth = (Math.cos(distanceFromCenter * Math.PI / 2) - 1) * 100;
        const scale = 1 - distanceFromCenter * 0.18;
        const opacity = 1 - distanceFromCenter * 0.55;
        image.style.setProperty("--cylinder-angle", `${angle}deg`);
        image.style.setProperty("--cylinder-depth", `${depth}px`);
        image.style.setProperty("--cylinder-scale", scale.toFixed(3));
        image.style.setProperty("--cylinder-opacity", opacity.toFixed(3));
      });
    }

    function normalizeScrollPosition() {
      const originalPosition = scrollPositionFor(wrapper.children[firstOriginalIndex]);
      const returnPosition = scrollPositionFor(wrapper.children[returnIndex]);
      const cycleLength = returnPosition - originalPosition;
      if (cycleLength <= 0) return;

      if (wrapper.scrollLeft < originalPosition || wrapper.scrollLeft >= returnPosition) {
        const offset = ((wrapper.scrollLeft - originalPosition) % cycleLength + cycleLength) % cycleLength;
        wrapper.classList.add("is-resetting");
        wrapper.scrollLeft = originalPosition + offset;
        wrapper.classList.remove("is-resetting");
        autoPosition = wrapper.scrollLeft;
      }
    }

    function stopAutoMotion() {
      if (autoFrame) cancelAnimationFrame(autoFrame);
      autoFrame = undefined;
      autoPreviousTime = undefined;
      isMoving = false;
    }

    function finishMove(targetIndex) {
      activeIndex = normalizeIndex(targetIndex);
      if (activeIndex !== targetIndex) {
        wrapper.classList.add("is-resetting");
        wrapper.scrollLeft = scrollPositionFor(wrapper.children[activeIndex]);
        wrapper.classList.remove("is-resetting");
      }
      updateCylinderCards();
      isMoving = false;
    }

    function animateAutoMotion(timestamp) {
      if (document.hidden) {
        autoPreviousTime = undefined;
        autoFrame = requestAnimationFrame(animateAutoMotion);
        return;
      }
      if (autoPreviousTime === undefined) autoPreviousTime = timestamp;
      const elapsed = timestamp - autoPreviousTime;
      autoPreviousTime = timestamp;
      autoPosition += autoDirection * AUTO_SPEED * elapsed / 1000;

      const originalPosition = scrollPositionFor(wrapper.children[firstOriginalIndex]);
      const returnPosition = scrollPositionFor(wrapper.children[returnIndex]);
      const cloneBoundary = scrollPositionFor(
        wrapper.children[autoDirection > 0 ? returnIndex : 0]
      );
      const crossedBoundary = autoDirection > 0
        ? autoPosition >= cloneBoundary
        : autoPosition <= cloneBoundary;
      if (crossedBoundary) {
        autoPosition -= autoDirection * (returnPosition - originalPosition);
        wrapper.classList.add("is-resetting");
        wrapper.scrollLeft = autoPosition;
        wrapper.classList.remove("is-resetting");
      } else {
        wrapper.scrollLeft = autoPosition;
      }
      updateCylinderCards();
      autoFrame = requestAnimationFrame(animateAutoMotion);
    }

    function startAutoMotion() {
      if (!autoEnabled || autoFrame) return;
      autoPosition = wrapper.scrollLeft;
      isMoving = true;
      autoFrame = requestAnimationFrame(animateAutoMotion);
    }

    function nearestImageIndex() {
      let closestIndex = 0;
      let closestDistance = Infinity;

      Array.from(wrapper.children).forEach((image, index) => {
        const distance = Math.abs(image.offsetLeft - wrapper.scrollLeft);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });
      return closestIndex;
    }

    function scheduleAutoResume() {
      if (pointerId !== undefined) return;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        finishMove(nearestImageIndex());
        startAutoMotion();
      }, SCROLL_DURATION);
    }

    wrapper.classList.add("is-resetting");
    wrapper.scrollLeft = scrollPositionFor(originalImages[0]);
    wrapper.classList.remove("is-resetting");
    updateCylinderCards();

    wrapper.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartScroll = wrapper.scrollLeft;
      pointerMoved = false;
      clearTimeout(resumeTimer);
      stopAutoMotion();
      if (event.pointerType === "mouse") {
        event.preventDefault();
        wrapper.setPointerCapture(event.pointerId);
      }
    });

    wrapper.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId || event.pointerType === "touch") return;
      if (Math.abs(event.clientX - pointerStartX) > 4) {
        pointerMoved = true;
        event.preventDefault();
        wrapper.scrollLeft = pointerStartScroll - (event.clientX - pointerStartX);
      }
    });

    function endPointer(event) {
      if (event.pointerId !== pointerId) return;
      pointerId = undefined;
      if (pointerMoved) event.preventDefault();
      scheduleAutoResume();
    }

    wrapper.addEventListener("pointerup", endPointer);
    wrapper.addEventListener("pointercancel", endPointer);
    wrapper.addEventListener("scroll", () => {
      if (!isMoving) normalizeScrollPosition();
      updateCylinderCards();
      if (isMoving) return;
      scheduleAutoResume();
    });
    wrapper.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaX) > 0) {
        clearTimeout(resumeTimer);
        stopAutoMotion();
        scheduleAutoResume();
      }
    });

    window.addEventListener("resize", () => {
      const shouldResumeAutoMotion = autoEnabled;
      stopAutoMotion();
      clearTimeout(resumeTimer);
      wrapper.classList.add("is-resetting");
      wrapper.scrollLeft = scrollPositionFor(wrapper.children[activeIndex]);
      wrapper.classList.remove("is-resetting");
      updateCylinderCards();
      isMoving = false;
      if (shouldResumeAutoMotion) startAutoMotion();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (autoFrame) cancelAnimationFrame(autoFrame);
        autoFrame = undefined;
        autoPreviousTime = undefined;
      } else if (isMoving && autoEnabled) {
        autoFrame = requestAnimationFrame(animateAutoMotion);
      }
    });

    startAutoMotion();
  }

  Promise.all(
    photos.map((src) =>
      getOrientation(src).catch((error) => {
        console.error(error);
        return null;
      })
    )
  ).then((loadedPhotos) => {
    const availablePhotos = loadedPhotos.filter(Boolean);
    setupGallery("portrait", availablePhotos.filter((photo) => photo.orientation === "portrait"));
    setupGallery("landscape", availablePhotos.filter((photo) => photo.orientation === "landscape"));
  });
})();
