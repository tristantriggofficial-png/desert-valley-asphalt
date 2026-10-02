// Desert Valley Asphalt — site interactions
// Vanilla JS only, no dependencies (static Netlify deploy, no build step).
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }

  // Expand full quote form when "add project details" link is clicked
  document.querySelectorAll('[data-expand-form]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(link.getAttribute('data-expand-form'));
      if (target) {
        target.style.display = target.style.display === 'none' ? 'block' : 'none';
      }
    });
  });

  // Close any open <details> submenu when clicking outside (desktop dropdown)
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.main-nav details[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  // -------------------------------------------------------------
  // Scroll-reveal: fade/translate-in on scroll, via IntersectionObserver.
  // Elements are marked up here at runtime (not hand-added to each of the
  // 21 pages) so every page gets the same reveal treatment automatically.
  // Headlines, ledes, CTAs and list items get a slight stagger (~90ms)
  // so groups of things don't all snap in at once.
  // -------------------------------------------------------------
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var markReveal = function (el, i) {
      if (!el || el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      if (i) el.style.setProperty('--reveal-i', i);
    };

    // Section-level headline/lede/CTA reveal
    document.querySelectorAll('main section, .site-header + .trust-strip').forEach(function (section) {
      markReveal(section.querySelector('h1'), 0);
      markReveal(section.querySelector('h2'), 0);
      markReveal(section.querySelector('.lede'), 1);
      var ctaRow = section.querySelector('.hero-ctas, .badge-row');
      markReveal(ctaRow, 2);
    });

    // Staggered groups: cards, city chips, stats, faq items, footer columns
    document.querySelectorAll('.grid').forEach(function (grid) {
      grid.querySelectorAll('.card').forEach(function (card, i) { markReveal(card, Math.min(i, 5)); });
    });
    document.querySelectorAll('.city-grid').forEach(function (grid) {
      grid.querySelectorAll('.city-chip').forEach(function (chip, i) { markReveal(chip, Math.min(i, 6)); });
    });
    document.querySelectorAll('.stats-row').forEach(function (row) {
      row.querySelectorAll('.stat').forEach(function (stat, i) { markReveal(stat, i); });
    });
    document.querySelectorAll('main').forEach(function (main) {
      main.querySelectorAll('.faq-item').forEach(function (item, i) { markReveal(item, Math.min(i, 4)); });
    });
    document.querySelectorAll('.quick-form').forEach(function (form) { markReveal(form, 1); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  // -------------------------------------------------------------
  // Floating dock behavior for the mobile sticky CTA bar: hide on
  // scroll-down, reveal on scroll-up (mirrors the "dock" pattern from
  // high-end real-estate / editorial sites rather than a flat bar that's
  // always on screen).
  // -------------------------------------------------------------
  var dock = document.querySelector('.sticky-cta');
  if (dock && !reduceMotion) {
    var lastY = window.scrollY;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > lastY && y > 120) {
          dock.classList.add('dock-hidden');
        } else {
          dock.classList.remove('dock-hidden');
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  // Slim the header slightly once the page has scrolled, like a dock
  // settling onto the surface rather than staying full-height forever.
  var header = document.querySelector('.site-header');
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }
});
