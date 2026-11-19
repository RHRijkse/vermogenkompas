(function () {
  'use strict';

  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  if (!motion.matches || !('IntersectionObserver' in window)) return;

  const sections = document.querySelectorAll([
    '.overview-heading', '.overview-card', '.section-intro', '.recognition-card',
    '.check-intro', '.equity-intro', '.process-intro', '.step', '.services-heading',
    '.service', '.contact-copy'
  ].join(', '));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.classList.add('home-reveal');
    });
  }, { rootMargin: '0px 0px 28px', threshold: 0.12 });

  sections.forEach((section) => observer.observe(section));
})();
