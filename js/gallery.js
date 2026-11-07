/* ===========================================================
   gallery.js — galeri potret dan lanskap dengan gerak otomatis.
   =========================================================== */
(function () {
  const TOTAL_PHOTOS = 27;
  const AUTO_SPEED = 30;
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
    const previous = document.querySelector(`[data-gallery-prev="${orientation}"]`);
    const next = document.querySelector(`[data-gallery-next="${orientation}"]`);
    if (!wrapper || !previous || !next || !images.length) return;

    const createImage = ({ src }, index, isClone = false) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = isClone ? "" : `Momen perjalanan RFA ${index + 1}`;
      image.loading = "lazy";
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
    let movementTimer;
    let manualScrollTimer;
    let isMoving = false;
    let autoEnabled = !prefersReducedMotion;

    function scrollPositionFor(image) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      return wrapper.scrollLeft + imageRect.left - wrapperRect.left;
    }

    function normalizeIndex(index) {
      if (index < firstOriginalIndex) return index + images.length;
      if (index >= returnIndex) return index - images.length;
      return index;
    }

    function stopAutoMotion(disable = true) {
      if (disable) autoEnabled = false;
      if (autoFrame) cancelAnimationFrame(autoFrame);
      autoFrame = undefined;
      autoPreviousTime = undefined;
      autoPosition = undefined;
      isMoving = false;
    }

    function finishMove(targetIndex) {
      activeIndex = normalizeIndex(targetIndex);
      if (activeIndex !== targetIndex) {
        wrapper.classList.add("is-resetting");
        wrapper.scrollLeft = scrollPositionFor(wrapper.children[activeIndex]);
        wrapper.classList.remove("is-resetting");
      }
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
      autoFrame = requestAnimationFrame(animateAutoMotion);
    }

    function startAutoMotion() {
      if (!autoEnabled || autoFrame) return;
      activeIndex = firstOriginalIndex;
      wrapper.classList.add("is-resetting");
      wrapper.scrollLeft = scrollPositionFor(wrapper.children[firstOriginalIndex]);
      wrapper.classList.remove("is-resetting");
      autoPosition = wrapper.scrollLeft;
      isMoving = true;
      autoFrame = requestAnimationFrame(animateAutoMotion);
    }

    function moveTo(targetIndex) {
      stopAutoMotion();
      clearTimeout(movementTimer);
      clearTimeout(manualScrollTimer);
      isMoving = true;
      activeIndex = normalizeIndex(targetIndex);
      wrapper.scrollTo({
        left: scrollPositionFor(wrapper.children[activeIndex]),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
      movementTimer = setTimeout(() => finishMove(activeIndex), SCROLL_DURATION);
    }

    function nearestImageIndex() {
      const wrapperLeft = wrapper.getBoundingClientRect().left;
      let closestIndex = 0;
      let closestDistance = Infinity;

      Array.from(wrapper.children).forEach((image, index) => {
        const distance = Math.abs(image.getBoundingClientRect().left - wrapperLeft);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });
      return closestIndex;
    }

    wrapper.classList.add("is-resetting");
    wrapper.scrollLeft = scrollPositionFor(originalImages[0]);
    wrapper.classList.remove("is-resetting");

    previous.addEventListener("click", () => moveTo(nearestImageIndex() - 1));
    next.addEventListener("click", () => moveTo(nearestImageIndex() + 1));
    wrapper.addEventListener("scroll", () => {
      if (isMoving) return;
      clearTimeout(manualScrollTimer);
      manualScrollTimer = setTimeout(() => {
        activeIndex = normalizeIndex(nearestImageIndex());
      }, 160);
    });

    window.addEventListener("resize", () => {
      const shouldResumeAutoMotion = autoEnabled;
      stopAutoMotion(false);
      clearTimeout(movementTimer);
      wrapper.classList.add("is-resetting");
      wrapper.scrollLeft = scrollPositionFor(wrapper.children[activeIndex]);
      wrapper.classList.remove("is-resetting");
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
