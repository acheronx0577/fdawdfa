import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { debounce } from "./debounce.js";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  try {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.add("reduce-motion");
      ScrollTrigger.refresh();
      return;
    }

    let isMobile = window.innerWidth <= 900;

    const mobileSettings = {
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: true,
      touchMultiplier: 1.5,
      infinite: false,
      lerp: 0.05,
      wheelMultiplier: 1,
      orientation: "vertical",
      smoothWheel: true,
      syncTouch: true,
    };

    const desktopSettings = {
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      lerp: 0.1,
      wheelMultiplier: 1,
      orientation: "vertical",
      smoothWheel: true,
      syncTouch: true,
    };

    let lenis = new Lenis(isMobile ? mobileSettings : desktopSettings);
    let isLenisPaused = document.hidden; // Start paused if hidden
    let isDestroying = false; // Guard against concurrent resize operations

    lenis.on("scroll", ScrollTrigger.update);

    const onLenisRaf = (time) => {
      // Skip ticker update if page is hidden
      if (document.hidden) return;
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onLenisRaf);
    gsap.ticker.lagSmoothing(0);

    // Handle page visibility changes
    const handleLenisVisibility = () => {
      isLenisPaused = document.hidden;
    };

    document.addEventListener("visibilitychange", handleLenisVisibility);

    const handleResize = debounce(() => {
      // Prevent concurrent resize handlers from causing race conditions
      if (isDestroying) return;
      
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= 900;

      if (wasMobile !== isMobile) {
        isDestroying = true;
        
        // Remove ticker BEFORE destroying old Lenis to prevent race
        gsap.ticker.remove(onLenisRaf);
        
        try {
          lenis.destroy();
        } catch (error) {
          console.error("lenis.destroy failed:", error);
        }
        
        // Create new instance after old one is fully destroyed
        lenis = new Lenis(isMobile ? mobileSettings : desktopSettings);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(onLenisRaf);
        ScrollTrigger.refresh();
        
        isDestroying = false;
      }
    }, 300);

    window.addEventListener("resize", handleResize);
  } catch (error) {
    console.error("Failed to initialize Lenis scroll:", error);
    // Fallback: use native scroll
    document.documentElement.classList.add("native-scroll");
  }
});
