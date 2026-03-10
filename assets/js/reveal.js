/* /assets/js/reveal.js */

(function () {
  function getRevealTargets() {
    const selectors = [
      'main > section',
      'main > article',
      'main article > section',
      '.reveal'
    ];

    const seen = new Set();
    const targets = [];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        targets.push(el);
      });
    });

    return targets;
  }

  function initReveal() {
    const targets = getRevealTargets();

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12
      }
    );

    targets.forEach((el, index) => {
      el.classList.add('reveal-auto');
      el.style.animationDelay = `${Math.min(index * 0.08, 0.4)}s`;
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
