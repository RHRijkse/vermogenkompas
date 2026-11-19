(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll([
    'main h2:not(.profile-card h2, .principle-card h2, .foundation-card h2, .download-card h2)',
    'main figure', 'main .overview-card', 'main .recognition-card',
    'main .step', 'main .principle-card', 'main .criterion-card', 'main .profile-card',
    'main .foundation-card', 'main .download-card', 'main .route-map > li',
    'main .complaint-steps > li', 'main .legal-detail'
  ].join(', '));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      target.classList.add('content-arrival');
    });
  }, { rootMargin: '0px 0px 12px', threshold: 0.1 });

  targets.forEach((target) => observer.observe(target));
})();
