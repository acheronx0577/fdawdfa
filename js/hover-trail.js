/**
 * Hover Trail Animation
 * Creates an image trail effect that follows the mouse cursor on the loading screen.
 * Uses images from the footer-explode-animation folder.
 * Only active on desktop (>1000px) and while the loading screen is visible.
 */
import { getDiscoveredFooterImages } from "./config.js";

function initHoverTrail() {
  const container = document.querySelector(".loading-screen .trail-container");
  if (!container) return;

  let animationId = null;
  let moveListener = null;

  const config = {
    imageCount: 25,          // Allow up to 25 images on screen at once
    imageLifespan: 1500,     // Stay on screen longer (1.5s instead of 0.75s)
    removalDelay: 50,
    mouseThreshold: 110,     // Distance needed on desktop
    mouseThresholdMobile: 90,// Distance needed on mobile
    inDuration: 750,
    outDuration: 1000,
    inEasing: "cubic-bezier(.07,.5,.5,1)",
    outEasing: "cubic-bezier(.87, 0, .13, 1)",
  };

  // Use the footer-explode-animation images
  let images = Array.from(
    { length: 13 },
    (_, i) => `/images/footer-explode-animation/${i + 1}.webp`
  );
  getDiscoveredFooterImages().then((discovered) => {
    images = discovered;
  });
  const trail = [];

  let mouseX = 0,
    mouseY = 0,
    lastMouseX = 0,
    lastMouseY = 0;
  let isCursorInContainer = false;
  let lastRemovalTime = 0;
  let shouldCreateImage = false;

  const isInContainer = (x, y) => {
    const rect = container.getBoundingClientRect();
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  };

  const hasMovedEnough = () => {
    const distance = Math.sqrt(
      Math.pow(mouseX - lastMouseX, 2) + Math.pow(mouseY - lastMouseY, 2)
    );
    // Use the config threshold for desktop, and the mobile config for mobile
    const currentThreshold = window.innerWidth > 1000 ? config.mouseThreshold : config.mouseThresholdMobile;
    return distance > currentThreshold;
  };

  const createImage = () => {
    if (trail.length >= config.imageCount) {
      const oldest = trail.shift();
      if (oldest.element.parentNode) {
        oldest.element.parentNode.removeChild(oldest.element);
      }
    }

    const img = document.createElement("img");
    img.classList.add("trail-img");

    const randomIndex = Math.floor(Math.random() * images.length);
    const rotation = (Math.random() - 0.5) * 50;
    img.src = images[randomIndex];

    const rect = container.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;

    img.style.left = `${relativeX}px`;
    img.style.top = `${relativeY}px`;
    img.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotation}deg) scale(0)`;
    img.style.transition = `transform ${config.inDuration}ms ${config.inEasing}`;

    container.appendChild(img);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (img) img.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotation}deg) scale(1)`;
      });
    });

    trail.push({
      element: img,
      rotation: rotation,
      removeTime: Date.now() + config.imageLifespan,
    });
  };

  const removeOldImages = () => {
    const now = Date.now();

    if (now - lastRemovalTime < config.removalDelay || trail.length === 0)
      return;

    const oldestImage = trail[0];
    if (now >= oldestImage.removeTime) {
      const imgToRemove = trail.shift();

      imgToRemove.element.style.transition = `transform ${config.outDuration}ms ${config.outEasing}`;
      imgToRemove.element.style.transform = `translate3d(-50%, -50%, 0) rotate(${imgToRemove.rotation}deg) scale(0)`;

      lastRemovalTime = now;

      setTimeout(() => {
        if (imgToRemove.element.parentNode) {
          imgToRemove.element.parentNode.removeChild(imgToRemove.element);
        }
      }, config.outDuration);
    }
  };

  const startAnimation = () => {
    moveListener = (e) => {
      // Handle both mouse and touch events
      if (e.touches && e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }

      isCursorInContainer = isInContainer(mouseX, mouseY);

      if (isCursorInContainer && hasMovedEnough()) {
        shouldCreateImage = true;
      }
    };

    document.addEventListener("mousemove", moveListener);
    document.addEventListener("touchmove", moveListener, { passive: true });

    const animate = () => {
      if (shouldCreateImage) {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        createImage();
        shouldCreateImage = false;
      }
      removeOldImages();
      animationId = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopAnimation = () => {
    if (moveListener) {
      document.removeEventListener("mousemove", moveListener);
      document.removeEventListener("touchmove", moveListener);
      moveListener = null;
    }

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    trail.forEach((item) => {
      if (item.element.parentNode) {
        item.element.parentNode.removeChild(item.element);
      }
    });
    trail.length = 0;
  };

  // Stop the trail when the loading screen hides
  const loadingScreen = document.getElementById("homePageLoadingScreen");
  if (loadingScreen) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          if (loadingScreen.classList.contains("hidden")) {
            stopAnimation();
            observer.disconnect();
          }
        }
      }
    });
    observer.observe(loadingScreen, { attributes: true });
  }

  startAnimation();
}

// Run immediately if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHoverTrail);
} else {
  initHoverTrail();
}
