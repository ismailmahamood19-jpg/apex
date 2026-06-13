/**
 * Scroll hero transition — direct scroll mapping
 */
(function () {
  const transitionRoot = document.querySelector("#transitionRoot");
  const overlayInner = document.querySelector("#overlayInner");
  const documentRoot = document.documentElement;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!transitionRoot) return;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  let lastProgressStr = "";

  function setupHeroGradientObserver() {
    const heroStage = transitionRoot.querySelector(".hero-stage");
    if (!heroStage) return;

    const syncGradient = (isVisible) => {
      const bg = window.__heroLiquidGradient;
      if (!bg) return;
      if (isVisible) bg.resume();
      else bg.pause();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => syncGradient(entry.isIntersecting));
      },
      { threshold: 0 }
    );

    observer.observe(heroStage);
    syncGradient(heroStage.getBoundingClientRect().bottom > 0 && heroStage.getBoundingClientRect().top < window.innerHeight);
  }

  function syncOverlayReveal(progress) {
    if (!overlayInner) return;
    if (progress > 0.38) {
      overlayInner.classList.add("is-revealed");
    }
  }

  function applyProgress(progress) {
    const progressStr = progress.toFixed(4);
    if (progressStr === lastProgressStr) return;
    lastProgressStr = progressStr;

    documentRoot.style.setProperty("--transition-progress", progressStr);
    transitionRoot.classList.toggle("is-scroll-transitioning", progress > 0.001);
    syncOverlayReveal(progress);
  }

  function updateScrollProgress() {
    const rect = transitionRoot.getBoundingClientRect();
    const scrollRange = Math.max(rect.height - window.innerHeight, 1);
    const passed = clamp(-rect.top, 0, scrollRange);
    const progress = clamp(passed / scrollRange, 0, 1);
    applyProgress(progress);
  }

  function setupOverlayRevealObserver() {
    if (!overlayInner) return;
    if (reducedMotionQuery.matches) {
      overlayInner.classList.add("is-revealed");
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          overlayInner.classList.add("is-revealed");
          obs.disconnect();
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(overlayInner);
  }

  if (reducedMotionQuery.matches) {
    applyProgress(0);
    setupOverlayRevealObserver();
    if (overlayInner) overlayInner.classList.add("is-revealed");
    return;
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollProgress();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScrollProgress, { passive: true });
  setupHeroGradientObserver();
  setupOverlayRevealObserver();
  updateScrollProgress();
})();
