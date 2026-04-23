import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CONTENT_CONFIG, getImagePath, createHeroCarouselController, clearHeroInterval } from "./config.js";
import { debounce } from "./debounce.js";
import { trackInterval, onRemove } from "./lifecycle.js";

document.addEventListener("DOMContentLoaded", () => {
  const isHomePage = document.querySelector(".page.home-page");
  if (!isHomePage) return;

  gsap.registerPlugin(ScrollTrigger);

  const heroImg = document.querySelector(".hero-img img");
  if (!heroImg) return;
  let currentImageIndex = 1;
  const totalImages = CONTENT_CONFIG.workItems.total;
  let scrollTriggerInstance = null;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let heroInterval = null;
  let carouselPaused = false;
  let abortController = null;

  const startCarousel = () => {
    if (prefersReducedMotion) return;
    if (heroInterval) return;

    // Create AbortController for this carousel lifecycle
    abortController = createHeroCarouselController();
    const signal = abortController.signal;

    heroInterval = window.setInterval(() => {
      // Check if signal has been aborted before updating
      if (signal.aborted) {
        window.clearInterval(heroInterval);
        heroInterval = null;
        return;
      }
      currentImageIndex =
        currentImageIndex >= totalImages ? 1 : currentImageIndex + 1;
      heroImg.src = getImagePath(currentImageIndex);
    }, CONTENT_CONFIG.heroCarousel.interval);

    // Track interval for lifecycle cleanup
    trackInterval(heroInterval);
  };

  const stopCarousel = () => {
    if (!heroInterval) return;
    window.clearInterval(heroInterval);
    heroInterval = null;
    // Abort the controller to signal all watchers
    clearHeroInterval();
    abortController = null;
  };

  // Handle page visibility changes - pause carousel when tab is hidden
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden - pause carousel
      if (!carouselPaused && heroInterval) {
        stopCarousel();
        carouselPaused = true;
      }
    } else {
      // Page is visible - resume carousel
      if (carouselPaused) {
        startCarousel();
        carouselPaused = false;
      }
    }
  };

  // Start carousel only if page is visible and motion not reduced
  if (!prefersReducedMotion && !document.hidden) {
    startCarousel();
  }

  // Listen for visibility changes - register for cleanup
  onRemove(document, "visibilitychange", handleVisibilityChange);

  const initAnimations = () => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
    }

    if (prefersReducedMotion) {
      // Remove any transform/motion effects for reduced motion
      gsap.set(".hero-img", {
        y: "0%",
        scale: 1,
        rotation: 0,
      });
      return;
    }

    // Verify trigger element exists before creating ScrollTrigger
    const triggerElement = document.querySelector(".hero-img-holder");
    if (!triggerElement) {
      console.error("Hero image holder element not found in DOM");
      return;
    }

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: ".hero-img-holder",
      start: "top bottom",
      end: "top top",
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.set(".hero-img", {
          y: `${-110 + 110 * progress}%`,
          scale: 0.25 + 0.75 * progress,
          rotation: -15 + 15 * progress,
        });
      },
    });
  };

  initAnimations();

  // Register resize listener for cleanup
  const resizeHandler = debounce(initAnimations, 200);
  onRemove(window, "resize", resizeHandler);
});
