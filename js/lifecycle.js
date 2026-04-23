/**
 * Lifecycle Manager
 * Centralized tracking and cleanup of event listeners, intervals, and timeouts
 * Called before page transitions to prevent memory leaks
 */

const listeners = [];
const intervals = [];
const timeouts = [];

/**
 * Register an event listener for cleanup
 * @param {Element} element - DOM element to attach listener
 * @param {string} eventName - Event name (e.g., 'click', 'resize')
 * @param {Function} handler - Event handler function
 */
export function onRemove(element, eventName, handler) {
  element.addEventListener(eventName, handler);
  listeners.push({ element, eventName, handler });
}

/**
 * Register an interval for cleanup
 * @param {number} intervalId - ID returned from setInterval
 * @returns {number} The same interval ID for chaining
 */
export function trackInterval(intervalId) {
  intervals.push(intervalId);
  return intervalId;
}

/**
 * Register a timeout for cleanup
 * @param {number} timeoutId - ID returned from setTimeout
 * @returns {number} The same timeout ID for chaining
 */
export function trackTimeout(timeoutId) {
  timeouts.push(timeoutId);
  return timeoutId;
}

/**
 * Cleanup all tracked resources
 * Call this before page transitions to prevent memory leaks
 */
export function cleanup() {
  // Remove all listeners
  listeners.forEach(({ element, eventName, handler }) => {
    element.removeEventListener(eventName, handler);
  });
  listeners.length = 0;

  // Clear all intervals
  intervals.forEach((id) => window.clearInterval(id));
  intervals.length = 0;

  // Clear all timeouts
  timeouts.forEach((id) => window.clearTimeout(id));
  timeouts.length = 0;

  console.log("✅ Lifecycle cleanup complete");
}

// Expose globally for transition.js
window.__performCleanup = cleanup;
