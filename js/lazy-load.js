/**
 * Lazy Load Utility
 * Dynamically loads heavy modules only when needed
 * Includes caching to prevent duplicate imports
 */

// Cache Promises to prevent duplicate imports
let splinePromise = null;
let threePromise = null;
let howlerPromise = null;

// Track preload state for error reporting
export const preloadState = {
  spline: { status: "idle", error: null },
  howler: { status: "idle", error: null },
  three: { status: "idle", error: null },
};

/**
 * Lazy load Spline 3D runtime
 * Returns cached Promise on subsequent calls (prevents duplicate imports)
 * Usage: lazyLoadSpline().then(() => { ... your spline code ... })
 */
export function lazyLoadSpline() {
  return (
    splinePromise ||= (async () => {
      try {
        const module = await import("@splinetool/runtime");
        return module;
      } catch (error) {
        splinePromise = null; // Reset cache on error to allow retry
        console.error("Failed to load Spline runtime:", error);
        throw error;
      }
    })()
  );
}

/**
 * Lazy load Three.js for 3D scenes
 * Returns cached Promise on subsequent calls
 * Usage: lazyLoadThree().then(() => { ... your three.js code ... })
 */
export function lazyLoadThree() {
  return (
    threePromise ||= (async () => {
      try {
        const THREE = await import("three");
        return THREE;
      } catch (error) {
        threePromise = null; // Reset cache on error
        console.error("Failed to load Three.js:", error);
        throw error;
      }
    })()
  );
}

/**
 * Lazy load Howler audio library
 * Returns cached Promise on subsequent calls
 * Only loaded when audio features are needed
 */
export function lazyLoadHowler() {
  return (
    howlerPromise ||= (async () => {
      try {
        const { Howler, Howl } = await import("howler");
        return { Howler, Howl };
      } catch (error) {
        howlerPromise = null; // Reset cache on error
        console.error("Failed to load Howler:", error);
        throw error;
      }
    })()
  );
}

/**
 * Intersection Observer to trigger lazy loading when element becomes visible
 * Usage: lazyLoadOnScroll(element, loaderFunction)
 */
export function lazyLoadOnScroll(element, loaderFunction) {
  if (!element) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loaderFunction();
        observer.unobserve(element);
      }
    });
  });

  observer.observe(element);
}

/**
 * Preload heavy modules after page idle time with error tracking
 * Updates preloadState for visibility into module loading status
 */
export function preloadSplineOnIdle(delayMs = 2000) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      setTimeout(() => {
        if (preloadState.spline.status !== "idle") return;
        
        preloadState.spline.status = "loading";
        lazyLoadSpline()
          .then(() => {
            preloadState.spline.status = "loaded";
            console.log("✅ Spline preloaded successfully");
          })
          .catch((error) => {
            preloadState.spline.status = "error";
            preloadState.spline.error = error.message;
            console.error("❌ Spline preload failed:", error);
          });
      }, delayMs);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      if (preloadState.spline.status !== "idle") return;
      
      preloadState.spline.status = "loading";
      lazyLoadSpline()
        .then(() => {
          preloadState.spline.status = "loaded";
          console.log("✅ Spline preloaded successfully");
        })
        .catch((error) => {
          preloadState.spline.status = "error";
          preloadState.spline.error = error.message;
          console.error("❌ Spline preload failed:", error);
        });
    }, delayMs + 1000);
  }
}

export function preloadHowlerOnIdle(delayMs = 2000) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      setTimeout(() => {
        if (preloadState.howler.status !== "idle") return;
        
        preloadState.howler.status = "loading";
        lazyLoadHowler()
          .then(() => {
            preloadState.howler.status = "loaded";
            console.log("✅ Howler preloaded successfully");
          })
          .catch((error) => {
            preloadState.howler.status = "error";
            preloadState.howler.error = error.message;
            console.error("❌ Howler preload failed:", error);
          });
      }, delayMs);
    });
  } else {
    setTimeout(() => {
      if (preloadState.howler.status !== "idle") return;
      
      preloadState.howler.status = "loading";
      lazyLoadHowler()
        .then(() => {
          preloadState.howler.status = "loaded";
          console.log("✅ Howler preloaded successfully");
        })
        .catch((error) => {
          preloadState.howler.status = "error";
          preloadState.howler.error = error.message;
          console.error("❌ Howler preload failed:", error);
        });
    }, delayMs + 1000);
  }
}
/**
 * Generic preload function (kept for backward compatibility)
 * Usage: preloadOnIdle(lazyLoadSpline, 3000)
 */
export function preloadOnIdle(loaderFunction, delayMs = 2000) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      setTimeout(() => {
        loaderFunction().catch((error) => {
          // Preload errors don't break the page
          console.warn("Preload failed:", error);
        });
      }, delayMs);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      loaderFunction().catch((error) => {
        console.warn("Preload failed:", error);
      });
    }, delayMs + 1000);
  }
}
