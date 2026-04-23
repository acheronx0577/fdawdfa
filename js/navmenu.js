import gsap from "gsap";

// Exported function for explicit module imports
export function closeMenuForced(options = {}) {
  const { immediate = false } = options;
  
  // Get elements (will be cached once within DOMContentLoaded)
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  const navOverlay = document.querySelector(".nav-overlay");
  const navItemsContainer = document.querySelector("nav .nav-items");
  const openLabel = document.querySelector(".open-label");
  const closeLabel = document.querySelector(".close-label");
  const navFooterHeaders = document.querySelectorAll(".nav-footer-item-header");
  const navFooterCopies = document.querySelectorAll(".nav-footer-item-copy");
  
  // Check if menu is open via class
  const isMenuOpen = menuToggleBtn?.classList.contains("menu-open");
  if (!isMenuOpen) return;

  if (immediate) {
    // Instantly close without running competing timelines
    gsap.killTweensOf([
      navOverlay,
      openLabel,
      closeLabel,
      navItemsContainer,
      navFooterHeaders,
      navFooterCopies,
    ]);

    if (navOverlay) navOverlay.style.pointerEvents = "none";
    if (navItemsContainer) navItemsContainer.classList.remove("show");
    if (menuToggleBtn) menuToggleBtn.classList.remove("menu-open");
    
    // Restore body scroll
    const scrollY = parseInt(document.body.style.top || "0") * -1;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);

    gsap.set([openLabel, closeLabel], { y: "0rem" });
    gsap.set(navOverlay, { opacity: 0 });
    gsap.set([navFooterHeaders, navFooterCopies], {
      opacity: 0,
      y: "100%",
    });

    if (menuToggleBtn) menuToggleBtn.style.pointerEvents = "";
    
    // Update state machine
    if (menuToggleBtn) {
      menuToggleBtn.setAttribute("data-menu-state", "CLOSED");
    }
  }
}

// State machine: CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED
const MENU_STATES = {
  CLOSED: "CLOSED",
  OPENING: "OPENING",
  OPEN: "OPEN",
  CLOSING: "CLOSING",
};

document.addEventListener("DOMContentLoaded", () => {
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  const navOverlay = document.querySelector(".nav-overlay");
  const navItemsContainer = document.querySelector("nav .nav-items");
  const openLabel = document.querySelector(".open-label");
  const closeLabel = document.querySelector(".close-label");
  const navItems = document.querySelectorAll(".nav-item");
  const navFooterHeaders = document.querySelectorAll(".nav-footer-item-header");
  const navFooterCopies = document.querySelectorAll(".nav-footer-item-copy");

  // Guard against missing elements
  if (!menuToggleBtn || !navOverlay || !navItemsContainer) {
    console.error("Navigation menu elements not found in DOM");
    return;
  }

  // Initialize state machine via data attributes
  menuToggleBtn.setAttribute("data-menu-state", MENU_STATES.CLOSED);
  let scrollY = 0;
  let originalBodyPosition = '';
  let originalBodyTop = '';
  let originalBodyWidth = '';
  let stateChangeTimeout = null;

  const getMenuState = () => menuToggleBtn.getAttribute("data-menu-state") || MENU_STATES.CLOSED;
  
  const setMenuState = (newState) => {
    menuToggleBtn.setAttribute("data-menu-state", newState);
  };

  const transitionState = (fromState, toState, duration) => {
    // Auto-reset from OPENING/CLOSING if animation hangs
    if (stateChangeTimeout) clearTimeout(stateChangeTimeout);
    
    if (toState === MENU_STATES.OPENING || toState === MENU_STATES.CLOSING) {
      stateChangeTimeout = setTimeout(() => {
        const currentState = getMenuState();
        if (currentState === MENU_STATES.OPENING) {
          setMenuState(MENU_STATES.OPEN);
        } else if (currentState === MENU_STATES.CLOSING) {
          setMenuState(MENU_STATES.CLOSED);
        }
      }, duration + 100); // Add buffer
    }
    
    setMenuState(toState);
  };

  const toggleMenu = () => {
    const currentState = getMenuState();
    
    // Ignore clicks during animation
    if (currentState === MENU_STATES.OPENING || currentState === MENU_STATES.CLOSING) {
      return;
    }

    if (currentState === MENU_STATES.CLOSED) {
      transitionState(MENU_STATES.CLOSED, MENU_STATES.OPENING, 500);
      
      navOverlay.style.pointerEvents = "all";
      navItemsContainer.classList.add("show");
      menuToggleBtn.classList.add("menu-open");
      scrollY = window.scrollY;
      originalBodyPosition = document.body.style.position;
      originalBodyTop = document.body.style.top;
      originalBodyWidth = document.body.style.width;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      const openTl = gsap.timeline({
        onComplete: () => {
          setMenuState(MENU_STATES.OPEN);
          if (stateChangeTimeout) clearTimeout(stateChangeTimeout);
        },
      });

      openTl.to(
        [openLabel, closeLabel],
        {
          y: "-1.48rem",
          duration: 0.3,
          overwrite: true,
        },
        0
      );

      openTl.to(
        navOverlay,
        {
          opacity: 1,
          duration: 0.3,
          overwrite: true,
        },
        0
      );

      openTl.to(
        [navFooterHeaders, navFooterCopies],
        {
          opacity: 1,
          y: "0%",
          duration: 0.5,
          stagger: 0.05,
          ease: "power4.out",
          overwrite: true,
        },
        0
      );
    } else if (currentState === MENU_STATES.OPEN) {
      transitionState(MENU_STATES.OPEN, MENU_STATES.CLOSING, 500);
      
      // Kill any ongoing open animations for instant close
      gsap.killTweensOf([
        navOverlay,
        openLabel,
        closeLabel,
        navItems,
        navFooterHeaders,
        navFooterCopies,
      ]);

      navOverlay.style.pointerEvents = "none";
      navItemsContainer.classList.remove("show");
      menuToggleBtn.classList.remove("menu-open");
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);

      const closeTl = gsap.timeline({
        onComplete: () => {
          setMenuState(MENU_STATES.CLOSED);
          if (stateChangeTimeout) clearTimeout(stateChangeTimeout);
        },
      });

      closeTl.to(
        [openLabel, closeLabel],
        {
          y: "0rem",
          duration: 0.3,
          overwrite: true,
        },
        0
      );

      closeTl.to(
        navOverlay,
        {
          opacity: 0,
          duration: 0.3,
          overwrite: true,
        },
        0
      );

      closeTl.set(
        [navFooterHeaders, navFooterCopies],
        {
          opacity: 0,
          y: "100%",
        },
        ">"
      );
    }
  };

  menuToggleBtn.addEventListener("click", toggleMenu);

  // Programmatic API for transition.js (backward compatibility - uses exported function)
  window.forceCloseMenu = (options = {}) => closeMenuForced(options);
});
