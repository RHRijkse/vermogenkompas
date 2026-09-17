(function(){'use strict';var $=id=>document.getElementById(id);  var menu = $('main-nav');
  var toggle = $('menu-toggle');
  function closeMenu() { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });
  var mobileQuery = window.matchMedia('(max-width: 760px)');
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', closeMenu);
  $('year').textContent = String(new Date().getFullYear());

})();
