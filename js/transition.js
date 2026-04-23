import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clearHeroInterval } from "./config.js";
import { closeMenuForced } from "./navmenu.js";
import { getLoadingScreenPromise } from "./loading-screen.js";

gsap.registerPlugin(ScrollTrigger);

// Define these functions outside DOMContentLoaded so they're ready immediately
function revealTransition() {
  return new Promise((resolve) => {
    gsap.set(".transition-overlay", { scaleY: 1, transformOrigin: "top" });
    gsap.to(".transition-overlay", {
      scaleY: 0,
      duration: 0.6,
      stagger: -0.1,
      ease: "power2.inOut",
      onComplete: resolve,
    });
  });
}

function animateTransition() {
  return new Promise((resolve) => {
    gsap.set(".transition-overlay", { scaleY: 0, transformOrigin: "bottom" });
    gsap.to(".transition-overlay", {
      scaleY: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.inOut",
      onComplete: resolve,
    });
  });
}

function closeMenuIfOpen() {
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  if (menuToggleBtn && menuToggleBtn.classList.contains("menu-open")) {
    closeMenuForced({ immediate: true });
  }
}

const allowedPaths = new Set([
  "/",
  "/index.html",
  "/work",
  "/work.html",
  "/about",
  "/about.html",
  "/project",
  "/project.html",
  "/contact",
  "/contact.html",
]);

function normalizePath(pathname) {
  if (!pathname) return "/";
  if (pathname === "/index.html") return "/";
  // Strip .html extension for consistent comparison
  if (pathname.endsWith(".html")) {
    const stripped = pathname.slice(0, -5);
    return stripped === "/index" ? "/" : stripped;
  }
  return pathname;
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldIgnoreLink(link, href, event) {
  if (!href) return true;
  if (href === "#") return true;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return true;
  if (href.startsWith("javascript:")) return true;
  if (link.hasAttribute("download")) return true;
  const target = link.getAttribute("target");
  if (target && target !== "_self") return true;
  if (event && (event.defaultPrevented || isModifiedClick(event))) return true;
  // Let right/middle clicks behave normally
  if (event && event.button && event.button !== 0) return true;
  return false;
}

function getSafeInternalUrl(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;

  const normalized = normalizePath(url.pathname);
  if (!allowedPaths.has(normalized)) return null;

  return url;
}

function isSamePageUrl(url) {
  const current = new URL(window.location.href);
  return normalizePath(current.pathname) === normalizePath(url.pathname);
}



// Setup link handlers immediately - NOT blocked by loading screen
function setupLinkHandlers() {
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (shouldIgnoreLink(link, href, event)) return;

      // Hash-only navigation should not be animated.
      if (href && href.startsWith("#")) {
        closeMenuIfOpen();
        return;
      }

      const safeUrl = getSafeInternalUrl(href);
      if (!safeUrl) {
        // External or disallowed navigation: don't intercept.
        return;
      }

      if (isSamePageUrl(safeUrl)) {
        event.preventDefault();
        closeMenuIfOpen();
        return;
      }

      event.preventDefault();
      closeMenuIfOpen();

      clearHeroInterval();

      animateTransition().then(() => {
        // Kill all GSAP ScrollTrigger animations
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        gsap.killTweensOf("*");

        // Cleanup event listeners and timers
        if (typeof window.__performCleanup === "function") {
          window.__performCleanup();
        }

        window.location.assign(safeUrl.pathname + safeUrl.search + safeUrl.hash);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Setup link handlers immediately on DOMContentLoaded (not blocked by loading screen)
  setupLinkHandlers();
  
  // Wait for loading screen to complete before showing transition reveal
  await getLoadingScreenPromise();
  
  await revealTransition();
});
