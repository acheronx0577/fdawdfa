// Initialize analytics with error handling
(async () => {
  try {
    const { inject } = await import("@vercel/analytics");
    inject();
  } catch (error) {
    console.warn("Failed to load Vercel Analytics:", error);
    // Log to localStorage as fallback
    try {
      localStorage.setItem(
        "analytics_error",
        JSON.stringify({ error: error.message, timestamp: new Date().toISOString() })
      );
    } catch (e) {
      // localStorage quota exceeded or unavailable
    }
  }

  try {
    const { injectSpeedInsights } = await import("@vercel/speed-insights");
    injectSpeedInsights();
  } catch (error) {
    console.warn("Failed to load Vercel Speed Insights:", error);
    // Non-critical, continue
  }
})();
