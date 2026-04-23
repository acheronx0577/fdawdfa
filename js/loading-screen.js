/**
 * Loading Screen Manager
 * Shows a loading screen for 5 seconds on home page load/refresh
 * Only applies to the home page, other pages are unaffected
 * Disables scrolling during the loading screen
 */

let loadingScreenComplete = Promise.resolve();
let preventScrollListener = (e) => e.preventDefault();
const preventScrollListenerOptions = { passive: false };

function initLoadingScreen() {
  // Only run on home page - check the page div, not body
  const pageDivElement = document.querySelector(".page.home-page");
  if (!pageDivElement) {
    console.log("Not home page, skipping loading screen");
    return;
  }

  const loadingScreen = document.getElementById("homePageLoadingScreen");
  if (!loadingScreen) {
    console.log("Loading screen element not found");
    return;
  }

  console.log("Loading screen initialized");

  // Scroll to top and disable scrolling
  window.scrollTo(0, 0);
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  document.addEventListener("wheel", preventScrollListener, preventScrollListenerOptions);
  document.addEventListener("touchmove", preventScrollListener, preventScrollListenerOptions);

  // Create a promise that resolves when loading screen is done
  loadingScreenComplete = new Promise((resolve) => {
    const animationDuration = 6000; // Must match CSS `loadingStripeMove`/`loadingBarProgress` (6s)
    const startTime = Date.now();
    const percentageCounter = document.getElementById("percentageCounter");
    const fadeDuration = 600; // Must match CSS `.loading-screen { transition: opacity ... }`

    // Custom easing: fast start to ~20%, then steady linear rise to 100%
    const customEasing = (t) => {
      if (t < 0.2) {
        // Fast start: takes 20% of time to reach 20%
        return (t / 0.2) * 0.2;
      } else {
        // Linear/steady rise from 20% to 100% over remaining 80% of time
        return 0.2 + ((t - 0.2) / 0.8) * 0.8;
      }
    };

    // Animate percentage counter from 0 to 100
    const animateCounter = () => {
      const currentTime = Date.now() - startTime;
      const normalizedProgress = Math.min(currentTime / animationDuration, 1);
      const easedProgress = customEasing(normalizedProgress);
      const progress = easedProgress * 100;
      const displayValue = Math.floor(progress);

      if (percentageCounter) {
        percentageCounter.textContent = displayValue;
      }

      if (progress < 100) {
        requestAnimationFrame(animateCounter);
      } else {
        // Animation complete; resolve after fade finishes (no extra hidden delay)
        const totalWaitTime = animationDuration + fadeDuration;
        const holdBeforeFade = 0;

        const timeoutId = setTimeout(() => {
          console.log(
            `Animation completed. Starting fade after ${holdBeforeFade}ms; total ${totalWaitTime}ms (includes ${fadeDuration}ms fade).`
          );
          loadingScreen.classList.add("hidden");

          // Re-enable scrolling after fade-out completes (0.6s)
          setTimeout(() => {
            console.log("Re-enabling scroll");
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            document.removeEventListener("wheel", preventScrollListener, preventScrollListenerOptions);
            document.removeEventListener("touchmove", preventScrollListener, preventScrollListenerOptions);
            resolve(); // Resolve after fade-out completes
          }, fadeDuration);
        }, holdBeforeFade);

        // Export timeout ID for cleanup if needed
        loadingScreen.dataset.timeoutId = timeoutId;
      }
    };

    // Start the counter animation
    requestAnimationFrame(animateCounter);
  });
}

// Update date dynamically (loading screen only)
function updateDynamicDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  const dateText = `visit in ${month}/${day}/${year}`;
  
  // Update loading screen footer only
  const loadingScreenTags = document.querySelector("#homePageLoadingScreen .hero-footer-tags p");
  if (loadingScreenTags) {
    loadingScreenTags.textContent = dateText;
  }
}

// Export the promise so transition.js can wait for it
export function getLoadingScreenPromise() {
  return loadingScreenComplete;
}

// Run immediately if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    updateDynamicDate();
    initLoadingScreen();
  });
} else {
  // DOM is already loaded (script loaded after DOMContentLoaded)
  updateDynamicDate();
  initLoadingScreen();
}
