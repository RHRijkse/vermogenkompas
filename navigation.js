(function () {
  'use strict';

  var toggle = document.getElementById('menu-toggle');
  var panel = document.getElementById('navigation-panel');
  var backdrop = document.querySelector('.menu-backdrop');
  if (!toggle || !panel || !backdrop) return;

  function setOpen(open, restoreFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    panel.inert = !open;
    panel.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    if (restoreFocus) toggle.focus();
  }

  setOpen(false);
  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  backdrop.addEventListener('click', function () { setOpen(false, true); });
  panel.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.site-header')) setOpen(false);
  });
  document.addEventListener('focusin', function (event) {
    if (!event.target.closest('.site-header')) setOpen(false);
  });
  window.addEventListener('pageshow', function () { setOpen(false); });
})();
