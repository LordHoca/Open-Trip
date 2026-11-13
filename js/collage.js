(function () {
  const images = document.querySelectorAll(".mission__collage .collage");
  const maxTilt = 18;
  const keyboardStep = 3;

  function setTilt(image, x, y) {
    const clamp = value => Math.max(-maxTilt, Math.min(maxTilt, value));
    image.style.setProperty("--drag-rotate-x", `${clamp(x)}deg`);
    image.style.setProperty("--drag-rotate-y", `${clamp(y)}deg`);
  }

  function resetTilt(image) {
    image.classList.remove("is-dragging");
    setTilt(image, 0, 0);
  }

  images.forEach(image => {
    let activePointer;
    let startX = 0;
    let startY = 0;
    let width = 1;
    let height = 1;

    image.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;

      event.preventDefault();
      activePointer = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      const bounds = image.getBoundingClientRect();
      width = bounds.width || 1;
      height = bounds.height || 1;
      image.classList.add("is-dragging");
      image.setPointerCapture(event.pointerId);
    });

    image.addEventListener("pointermove", event => {
      if (event.pointerId !== activePointer) return;

      const rotateY = ((event.clientX - startX) / width) * maxTilt * 2;
      const rotateX = ((startY - event.clientY) / height) * maxTilt * 2;
      setTilt(image, rotateX, rotateY);
    });

    image.addEventListener("pointerup", event => {
      if (event.pointerId !== activePointer) return;
      activePointer = undefined;
      resetTilt(image);
    });

    image.addEventListener("pointercancel", () => {
      activePointer = undefined;
      resetTilt(image);
    });

    image.addEventListener("keydown", event => {
      const currentX = parseFloat(image.style.getPropertyValue("--drag-rotate-x")) || 0;
      const currentY = parseFloat(image.style.getPropertyValue("--drag-rotate-y")) || 0;
      const keys = {
        ArrowUp: [currentX + keyboardStep, currentY],
        ArrowDown: [currentX - keyboardStep, currentY],
        ArrowLeft: [currentX, currentY - keyboardStep],
        ArrowRight: [currentX, currentY + keyboardStep]
      };

      if (event.key === "Escape") {
        resetTilt(image);
      } else if (keys[event.key]) {
        event.preventDefault();
        setTilt(image, ...keys[event.key]);
      }
    });
  });
})();
