/* =========================================================================
   Sonrisa Vital – Microinteracciones
   -------------------------------------------------------------------------
   1. Enlaces dinámicos a WhatsApp (número y mensaje en un solo lugar)
   2. Navbar: estado al hacer scroll, menú móvil y enlace activo
   3. Smooth scroll para anclas internas
   4. Reveal on scroll (IntersectionObserver)
   5. Contadores animados de estadísticas
   6. Tooltip del botón flotante (aparece a los 3 s)
   7. Estado "Abierto ahora / Cerrado" según hora de Bogotá
   8. Fallback de imagen hero y año del footer
   ========================================================================= */

(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // CONFIGURACIÓN: cambia aquí el número (formato internacional, sin "+")
  // ---------------------------------------------------------------------
  const CONFIG = {
    whatsappNumber: '573001234567',
    defaultMessage: 'Hola Sonrisa Vital, me gustaría agendar una valoración médica.',
    tooltipDelayMs: 3000,
    timezone: 'America/Bogota',
    // Horario: día (0 = domingo) -> [apertura, cierre] en horas decimales
    schedule: { 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [9, 13] },
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Enlaces de WhatsApp ------------------------------------------------ */
  const buildWhatsAppUrl = (service) => {
    const text = service
      ? `Hola Sonrisa Vital, me gustaría recibir información sobre ${service} y agendar una valoración médica.`
      : CONFIG.defaultMessage;
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    link.href = buildWhatsAppUrl(link.dataset.waService);
  });

  /* 2. Navbar -------------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  const setMenu = (open) => {
    mobileMenu.classList.toggle('hidden', !open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuToggle.querySelector('i').className = `fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-lg`;
    if (open) navbar.classList.add('is-scrolled');
    else onScroll();
  };

  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });

  // Resalta el enlace de la sección visible
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  ['inicio', 'servicios', 'nosotros', 'ubicacion'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  /* 3. Smooth scroll -------------------------------------------------------
     CSS ya aplica scroll-behavior; esto asegura soporte uniforme y mueve el
     foco al destino para usuarios de teclado / lectores de pantalla. */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id.length < 2) return; // enlaces "#" de ejemplo
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', id);
    });
  });

  /* 4. Reveal on scroll ---------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* 5. Contadores animados ------------------------------------------------- */
  const animateCounter = (el) => {
    const target = Number(el.dataset.counter);
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('[data-counter]').forEach((el) => counterObserver.observe(el));

  /* 6. Tooltip del botón flotante ----------------------------------------- */
  const tooltip = document.getElementById('wa-tooltip');
  const tooltipClose = document.getElementById('wa-tooltip-close');
  let tooltipDismissed = false;
  try {
    tooltipDismissed = sessionStorage.getItem('sv-tooltip-dismissed') === '1';
  } catch (_) { /* almacenamiento no disponible */ }

  if (!tooltipDismissed) {
    setTimeout(() => tooltip.classList.add('is-visible'), CONFIG.tooltipDelayMs);
  }
  tooltipClose.addEventListener('click', () => {
    tooltip.classList.remove('is-visible');
    try { sessionStorage.setItem('sv-tooltip-dismissed', '1'); } catch (_) { /* noop */ }
  });

  /* 7. Estado de apertura (hora de Bogotá) -------------------------------- */
  const openStatus = document.getElementById('open-status');
  const updateOpenStatus = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CONFIG.timezone, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const hour = (Number(get('hour')) % 24) + Number(get('minute')) / 60;
    const range = CONFIG.schedule[day];
    const isOpen = Boolean(range) && hour >= range[0] && hour < range[1];

    openStatus.innerHTML = isOpen
      ? '<span class="relative flex h-2.5 w-2.5"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span><span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600"></span></span><span class="text-green-700">Abierto ahora</span>'
      : '<span class="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400"></span><span class="text-slate-600">Cerrado ahora · Escríbenos y te respondemos al abrir</span>';
    openStatus.classList.remove('hidden');
    openStatus.classList.add('flex');
  };
  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);

  /* 8. Fallback de imagen y año ------------------------------------------- */
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const markFailed = () => img.parentElement.classList.add('img-failed');
    if (img.complete && img.naturalWidth === 0) markFailed();
    else img.addEventListener('error', markFailed, { once: true });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
