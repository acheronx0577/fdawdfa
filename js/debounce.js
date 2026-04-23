/**
 * @param {(...args: unknown[]) => void} fn
 * @param {number} waitMs
 */
export function debounce(fn, waitMs) {
  let timeoutId = 0;
  let isCancelled = false;

  const debouncedFn = (...args) => {
    if (isCancelled) return;
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      if (!isCancelled) fn(...args);
    }, waitMs);
  };

  // Expose cancel method for cleanup
  debouncedFn.cancel = () => {
    isCancelled = true;
    window.clearTimeout(timeoutId);
  };

  return debouncedFn;
}
