/* ============================================
   js/library.js — Component Library logic
   ============================================ */

(function () {
  'use strict';

  /* ── Smooth scroll for anchor nav links ── */
  document.querySelectorAll('.lib-nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

})();