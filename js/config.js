/**
 * Site configuration for content counts and settings
 * Update this file when changing the number of portfolio items
 */
export const CONTENT_CONFIG = {
  workItems: {
    total: 10,
    imageDir: '/images/work-items',
    imagePrefix: 'work-item-',
    imageExt: '.webp',
  },
  heroCarousel: {
    interval: 600, // ms between image changes
  },
  footerExplosion: {
    particleCount: 13,
    maxImages: 25,
    imageDir: '/images/footer-explode-animation',
    imagePrefix: '',
    imageExt: '.webp',
  },
};

/**
 * Generate image path helper
 */
export function getImagePath(index) {
  const { imageDir, imagePrefix, imageExt } = CONTENT_CONFIG.workItems;
  return `${imageDir}/${imagePrefix}${index}${imageExt}`;
}

/**
 * Generate footer explosion image path helper
 */
export function getFooterExplosionImagePath(index) {
  const { imageDir, imagePrefix, imageExt } = CONTENT_CONFIG.footerExplosion;
  return `${imageDir}/${imagePrefix}${index}${imageExt}`;
}

/**
 * Dynamically discover available footer explosion images up to maxImages
 * Stops at the first missing image to prevent unnecessary 404s.
 */
let discoveredImagesPromise = null;
export function getDiscoveredFooterImages() {
  if (discoveredImagesPromise) return discoveredImagesPromise;
  
  const { particleCount, maxImages, imageDir, imagePrefix, imageExt } = CONTENT_CONFIG.footerExplosion;
  const available = [];
  
  discoveredImagesPromise = new Promise((resolve) => {
    const checkImage = (index) => {
      if (index > maxImages) {
        resolve(available);
        return;
      }
      const src = `${imageDir}/${imagePrefix}${index}${imageExt}`;
      const img = new Image();
      img.onload = () => {
        available.push(src);
        checkImage(index + 1);
      };
      img.onerror = () => {
        // Fallback to initial particleCount if nothing was found
        if (available.length === 0) {
          resolve(Array.from({length: particleCount}, (_, i) => `${imageDir}/${imagePrefix}${i + 1}${imageExt}`));
        } else {
          resolve(available);
        }
      };
      img.src = src;
    };
    
    checkImage(1);
  });
  
  return discoveredImagesPromise;
}

/**
 * AbortController factory for hero carousel
 * Replaces interval-based cleanup with modern cancellation token pattern
 */
let activeHeroController = null;

export function createHeroCarouselController() {
  activeHeroController = new AbortController();
  return activeHeroController;
}

export function getActiveHeroController() {
  return activeHeroController;
}

export function clearHeroInterval() {
  if (activeHeroController) {
    activeHeroController.abort();
    activeHeroController = null;
  }
}

/**
 * Legacy support for hero interval ID tracking
 * (kept for backward compatibility with existing code)
 */
export let heroIntervalId = null;

export function setHeroIntervalId(id) {
  heroIntervalId = id;
}
