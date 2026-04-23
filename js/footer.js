import { CONTENT_CONFIG, getDiscoveredFooterImages } from "./config.js";
import { debounce } from "./debounce.js";

document.addEventListener("DOMContentLoaded", () => {
  const isContactPage = document.querySelector(".page.contact-page");
  if (isContactPage) return;

  const footer = document.querySelector("footer");
  const explosionContainer = document.querySelector(".explosion-container");
  let hasExploded = false;

  const config = {
    gravity: 0.22,
    friction: 0.98,
    imageSize: "min(13vw, 240px)",
    horizontalTargetVw: 44, // Tighter horizontal spread target
    verticalTargetVh: 64,   // target height peak representing % of screen height
    rotationSpeed: 10,
    resetDelay: 500,
  };

  let imagePaths = Array.from(
    { length: CONTENT_CONFIG.footerExplosion.particleCount },
    (_, i) => `${CONTENT_CONFIG.footerExplosion.imageDir}/${CONTENT_CONFIG.footerExplosion.imagePrefix}${i + 1}${CONTENT_CONFIG.footerExplosion.imageExt}`
  );

  getDiscoveredFooterImages().then((paths) => {
    imagePaths = paths;
    imagePaths.forEach((path) => {
      const img = new Image();
      img.src = path;
    });
    createParticles();
  });

  const createParticles = () => {
    explosionContainer.innerHTML = "";

    imagePaths.forEach((path) => {
      const particle = document.createElement("img");
      particle.src = path;
      particle.loading = "lazy";
      particle.classList.add("explosion-particle-img");
      particle.style.width = typeof config.imageSize === "number" ? `${config.imageSize}px` : config.imageSize;
      explosionContainer.appendChild(particle);
    });
  };

  class Particle {
    constructor(element) {
      this.element = element;
      this.x = 0;
      this.y = 0;

      // Ensure proportionate explosion height across all screens using h = v^2/2g
      const targetHeightPx = (window.innerHeight * config.verticalTargetVh) / 100;
      const baseVy = Math.sqrt(2 * config.gravity * targetHeightPx);
      this.vy = -baseVy - (Math.random() * (baseVy * 0.3));

      // Ensure proportionate explosion width across all screens using d = v / (1-f)
      const targetWidthPx = (window.innerWidth * config.horizontalTargetVw) / 100;
      const baseVx = targetWidthPx * (1 - config.friction);
      this.vx = (Math.random() - 0.5) * (baseVx * 2);

      this.rotation = 0;
      this.rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed;
    }

    update() {
      this.vy += config.gravity;
      this.vx *= config.friction;
      this.rotationSpeed *= config.friction;

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;

      // Keep particles from escaping the screen horizontally with a playful bounce
      const screenHalfWidth = window.innerWidth / 2;
      const imageHalfWidth = (this.element.offsetWidth || 150) / 2;

      // If particle drifts further than screen edge, bounce it back visually
      if (this.x > (screenHalfWidth - imageHalfWidth)) {
        this.x = screenHalfWidth - imageHalfWidth;
        this.vx *= -1; // Bounce off right wall
      } else if (this.x < -(screenHalfWidth - imageHalfWidth)) {
        this.x = -(screenHalfWidth - imageHalfWidth);
        this.vx *= -1; // Bounce off left wall
      }

      this.element.style.transform = `translate(calc(-50% + ${this.x}px), ${this.y}px) rotate(${this.rotation}deg)`;
    }
  }

  const explode = () => {
    if (hasExploded) return;
    hasExploded = true;

    let particleElements = document.querySelectorAll(".explosion-particle-img");
    if (particleElements.length === 0) {
      createParticles();
      particleElements = document.querySelectorAll(".explosion-particle-img");
    }

    const particles = Array.from(particleElements).map(
      (element) => new Particle(element)
    );

    let animationId;

    const animate = () => {
      particles.forEach((particle) => particle.update());
      animationId = requestAnimationFrame(animate);

      if (
        particles.every(
          (particle) => particle.y > explosionContainer.offsetHeight / 2
        )
      ) {
        cancelAnimationFrame(animationId);
      }
    };

    animate();
  };

  const reset = () => {
    hasExploded = false;
    const particleElements = document.querySelectorAll(".explosion-particle-img");
    particleElements.forEach((particle) => {
      particle.style.transform = "";
    });
  };

  const isScreenLargeEnough = () => {
    return window.innerWidth >= 700;
  };

  if ("IntersectionObserver" in window && footer) {
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          // Only explode if screen is large enough
          if (isScreenLargeEnough()) {
            setTimeout(explode, 300);
          }
        } else {
          // When user scrolls away from footer, allow re-trigger on return.
          reset();
        }
      },
      { root: null, threshold: 0.5 }
    );
    io.observe(footer);

    // Initial check in case footer is already visible on page load
    setTimeout(() => {
      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (footerRect.top <= viewportHeight * 0.5 && !hasExploded && isScreenLargeEnough()) {
        setTimeout(explode, 300);
      }
    }, 100);
  } else {
    // Fallback: keep old-ish behavior but far less aggressive.
    const checkFooterPosition = () => {
      if (!footer) return;
      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (footerRect.top > viewportHeight * 1.2) {
        reset();
      } else if (!hasExploded && footerRect.top <= viewportHeight * 0.5 && isScreenLargeEnough()) {
        setTimeout(explode, 300);
      }
    };

    window.addEventListener("scroll", debounce(checkFooterPosition, 50), {
      passive: true,
    });
    setTimeout(checkFooterPosition, 500);
  }

  window.addEventListener("resize", debounce(() => {
    reset();
    if (!isScreenLargeEnough()) {
      explosionContainer.innerHTML = "";
    } else {
      // When resizing to large screen, check if footer is visible
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        if (footerRect.top <= viewportHeight * 0.5 && !hasExploded) {
          setTimeout(explode, 300);
        }
      }
    }
  }, 200));

  createParticles();
});
