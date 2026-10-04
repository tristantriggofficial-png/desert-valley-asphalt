// Desert Valley Asphalt — site interactions
// Vanilla JS only, no dependencies (static Netlify deploy, no build step).
// This file loads at the very end of <body>, so the DOM is already parsed and
// we can mark up reveal targets before first paint (no flash of un-animated content).
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------------------------------------------------------------
  // Mobile menu
  // -------------------------------------------------------------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // "+ Add project details" expands the optional form fields
  document.querySelectorAll('[data-expand-form]').forEach(function (link) {
    link.setAttribute('role', 'button');
    link.setAttribute('aria-expanded', 'false');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(link.getAttribute('data-expand-form'));
      if (!target) return;
      var hidden = target.style.display === 'none';
      target.style.display = hidden ? 'block' : 'none';
      link.setAttribute('aria-expanded', hidden ? 'true' : 'false');
    });
  });

  // Close any open <details> dropdown when clicking outside it, or on Escape
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.main-nav details[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.main-nav details[open]').forEach(function (d) { d.removeAttribute('open'); });
    if (nav && nav.classList.contains('open') && toggle) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  // -------------------------------------------------------------
  // Header gets a soft shadow once the page scrolls (no layout change)
  // -------------------------------------------------------------
  var header = document.querySelector('.site-header');
  if (header) {
    var headerTick = false;
    var onScroll = function () {
      if (headerTick) return;
      headerTick = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        headerTick = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -------------------------------------------------------------
  // Scroll-reveal via IntersectionObserver.
  // Marked at runtime so all 21 pages get the same treatment with no per-page
  // markup. Groups stagger ~90ms per item (--reveal-i). Only opacity + the
  // individual `translate` property animate, so it stays on the compositor and
  // never fights the hover transforms on cards.
  // -------------------------------------------------------------
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var mark = function (el, i) {
      if (!el || el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      if (i) el.style.setProperty('--reveal-i', i);
    };

    // Hero copy: eyebrow -> headline -> lede -> buttons -> pills -> form
    document.querySelectorAll('.hero').forEach(function (hero) {
      mark(hero.querySelector('.eyebrow'), 0);
      mark(hero.querySelector('h1'), 1);
      mark(hero.querySelector('.lede'), 2);
      mark(hero.querySelector('.hero-ctas'), 3);
      mark(hero.querySelector('.badge-row'), 4);
      mark(hero.querySelector('.quick-form'), 3);
    });

    // Section headings, intro paragraphs, split-column content
    document.querySelectorAll('main section:not(.hero)').forEach(function (section) {
      section.querySelectorAll('h2').forEach(function (h) { mark(h, 0); });
      var intro = section.querySelector('h2 + p');
      mark(intro, 1);
      section.querySelectorAll('.split > div > p, .split > div > ul, .split-reverse > div > p, .split-reverse > div > ul').forEach(function (el, i) { mark(el, Math.min(i + 1, 4)); });
    });

    // Staggered groups
    document.querySelectorAll('.grid').forEach(function (grid) {
      grid.querySelectorAll('.card').forEach(function (card, i) { mark(card, Math.min(i, 5)); });
    });
    document.querySelectorAll('.city-grid').forEach(function (grid) {
      grid.querySelectorAll('.city-chip').forEach(function (chip, i) { mark(chip, Math.min(i, 6)); });
    });
    document.querySelectorAll('.stats-row .stat').forEach(function (stat, i) { mark(stat, i); });
    document.querySelectorAll('main .faq-item').forEach(function (item, i) { mark(item, Math.min(i, 4)); });
    document.querySelectorAll('main section:not(.hero) .quick-form, main section .card').forEach(function (el) {
      if (el.parentElement && el.parentElement.classList.contains('grid')) return; // grid cards are staggered above
      mark(el, 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Stat numbers count up once when they scroll into view
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
      var countIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countIo.unobserve(entry.target);
          var el = entry.target;
          var end = parseInt(el.getAttribute('data-count'), 10);
          var start = null;
          var dur = 1100;
          var step = function (ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(end * eased);
            if (p < 1) window.requestAnimationFrame(step);
          };
          window.requestAnimationFrame(step);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { el.textContent = '0'; countIo.observe(el); });
    }
  }
})();

// Send every quote form to GoHighLevel as well as Netlify Forms.
(function () {
  var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/K3zWWHjtYsH1TM1OH4U1/webhook-trigger/8a8dfcfe-a2fb-40f4-87f7-46a9c7702a26';
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.querySelector || form.tagName !== 'FORM' || !form.querySelector('input[name="form-name"]')) return;
    var bot = form.querySelector('[name="bot-field"]');
    if (bot && bot.value) return;
    var body = new URLSearchParams();
    new FormData(form).forEach(function (value, key) {
      if (key !== 'bot-field' && typeof value === 'string') body.append(key, value);
    });
    body.append('source_page', window.location.href);
    try {
      fetch(GHL_WEBHOOK, { method: 'POST', mode: 'no-cors', body: body, keepalive: true });
    } catch (err) { /* Netlify submission still goes through */ }
  });
})();
