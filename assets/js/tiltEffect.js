/**
 * VIGIL — Cinematic 3D Tilt & Specular Physics Engine
 * 60 FPS smooth dampening for cards with dynamic radial light reflection
 * Supports Touch, Pointer, and iOS DeviceOrientation (Gyroscope).
 */

export class TiltEngine {
  constructor() {
    this.cards = [];
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.orientationHandler = this.handleOrientation.bind(this);
    this.hasRequestedGyro = false;
    this.initGyroscope();
  }

  attach(element, options = {}) {
    if (!element) return;
    const config = {
      maxRotation: options.maxRotation || 8, // degrees
      perspective: options.perspective || 1000,
      scale: options.scale || 1.015,
      speed: options.speed || 400, // transition duration ms
      glare: options.glare !== false,
      ...options
    };

    const cardData = {
      el: element,
      config,
      rect: element.getBoundingClientRect(),
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
      isHovered: false,
      rafId: null
    };

    // Ensure perspective container styling
    element.style.transformStyle = 'preserve-3d';
    element.style.willChange = 'transform';

    // Create or locate specular glare layer
    let glareEl = element.querySelector('.specular-glare');
    if (config.glare && !glareEl) {
      glareEl = document.createElement('div');
      glareEl.className = 'specular-glare';
      glareEl.style.position = 'absolute';
      glareEl.style.inset = '0';
      glareEl.style.borderRadius = 'inherit';
      glareEl.style.pointerEvents = 'none';
      glareEl.style.mixBlendMode = 'overlay';
      glareEl.style.zIndex = '3';
      glareEl.style.transition = 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      element.appendChild(glareEl);
    }
    cardData.glareEl = glareEl;

    // Event listeners
    const onEnter = () => {
      cardData.isHovered = true;
      cardData.rect = element.getBoundingClientRect();
      if (cardData.glareEl) cardData.glareEl.style.opacity = '1';
    };

    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = cardData.rect;

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      // Map [0, 1] to [-1, 1]
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      // Calculate rotations
      cardData.targetX = (clampedY - 0.5) * -2 * config.maxRotation;
      cardData.targetY = (clampedX - 0.5) * 2 * config.maxRotation;

      cardData.glareX = clampedX * 100;
      cardData.glareY = clampedY * 100;
    };

    const onLeave = () => {
      cardData.isHovered = false;
      cardData.targetX = 0;
      cardData.targetY = 0;
      if (cardData.glareEl) cardData.glareEl.style.opacity = '0';
    };

    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);

    // Touch support
    element.addEventListener('touchstart', onEnter, { passive: true });
    element.addEventListener('touchmove', onMove, { passive: true });
    element.addEventListener('touchend', onLeave, { passive: true });

    this.cards.push(cardData);
    this.startLoop();
  }

  initGyroscope() {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires user interaction to request permission
      const unlockGyro = () => {
        if (this.hasRequestedGyro) return;
        this.hasRequestedGyro = true;
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', this.orientationHandler);
            }
          })
          .catch(() => {});
        window.removeEventListener('click', unlockGyro);
        window.removeEventListener('touchend', unlockGyro);
      };
      window.addEventListener('click', unlockGyro);
      window.addEventListener('touchend', unlockGyro);
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.orientationHandler);
    }
  }

  handleOrientation(e) {
    if (!e.gamma || !e.beta) return;
    // Gamma is left/right (-90 to 90), Beta is front/back (-180 to 180)
    const tiltX = Math.max(-15, Math.min(15, (e.beta - 45) * 0.3));
    const tiltY = Math.max(-15, Math.min(15, e.gamma * 0.3));

    this.cards.forEach((card) => {
      if (!card.isHovered) {
        card.targetX = -tiltX;
        card.targetY = tiltY;
        card.glareX = 50 + tiltY * 2;
        card.glareY = 50 + tiltX * 2;
        if (card.glareEl) card.glareEl.style.opacity = '0.35';
      }
    });
  }

  startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const render = () => {
      this.cards.forEach((card) => {
        // Smooth dampening interpolation
        card.currentX = lerp(card.currentX, card.targetX, 0.12);
        card.currentY = lerp(card.currentY, card.targetY, 0.12);

        const currentScale = card.isHovered ? card.config.scale : 1.0;

        card.el.style.transform = `perspective(${card.config.perspective}px) rotateX(${card.currentX.toFixed(2)}deg) rotateY(${card.currentY.toFixed(2)}deg) scale3d(${currentScale}, ${currentScale}, 1)`;

        if (card.glareEl) {
          card.glareEl.style.background = `radial-gradient(circle at ${card.glareX.toFixed(1)}% ${card.glareY.toFixed(1)}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 70%)`;
        }
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}
