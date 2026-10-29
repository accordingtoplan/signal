(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdr = document.querySelector('[data-hdr]');
  const hero = document.querySelector('.hero');

  // Home: the hero wordmark rides up and shrinks into the header slot, then hands over to the header logo
  const logo = still ? null : document.querySelector('.is-home .hero-logo');
  const mark = hdr.querySelector('.hdr-logo');
  if (logo) logo.classList.add('is-pinned');
  const place = () => {
    const end = hero.offsetHeight - 60;
    const p = Math.min(Math.max(window.scrollY / end, 0), 1);
    const k = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const y = hero.offsetHeight / 2 + (hdr.offsetHeight / 2 - hero.offsetHeight / 2) * k;
    const s = 1 + (mark.offsetWidth / logo.offsetWidth - 1) * k;
    logo.style.transform = `translate(-50%, calc(-50% + ${y}px)) scale(${s})`;
    logo.classList.toggle('is-gone', hdr.classList.contains('is-solid'));
  };

  // Stacked spotlights: hide each one once the next fully covers it, so the browser
  // isn't painting a dozen full-screen layers at once (Chrome drops tiles and they flicker)
  const spots = [...document.querySelectorAll('.spot')];
  const cover = () => spots.forEach((s, i) => {
    const n = spots[i + 1];
    s.classList.toggle('is-under', !!n && n.getBoundingClientRect().top <= 0);
  });

  let ticking = false;
  const onScroll = () => {
    const limit = hero && document.body.classList.contains('is-home') ? hero.offsetHeight - 60 : 0;
    hdr.classList.toggle('is-solid', window.scrollY > limit);
    if (spots.length) cover();
    if (logo) place();
    ticking = false;
  };
  onScroll();
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  // Phone menu
  const btn = document.querySelector('[data-menu]');
  const drawer = document.querySelector('[data-drawer]');
  btn.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
    hdr.classList.toggle('is-solid', open || window.scrollY > 0);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Events: drop dated ones once their day has passed, and the whole list if nothing is left
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  document.querySelectorAll('[data-events]').forEach((sec) => {
    sec.querySelectorAll('li[data-until]').forEach((li) => { li.hidden = li.dataset.until < today; });
    sec.hidden = !sec.querySelector('li:not([hidden])');
  });

  // Split headings into masked words, numbered by the line they sit on
  const split = (el) => {
    const words = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const w = document.createElement('span');
          const s = document.createElement('span');
          w.className = 'w';
          s.textContent = t;
          w.append(s);
          frag.append(w);
          words.push(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('sr')) walk(n);
    });
    walk(el);
    let line = -1, top = null;
    words.forEach((w) => {
      if (w.offsetTop !== top) { top = w.offsetTop; line++; }
      w.style.setProperty('--i', line);
    });
    el.setAttribute('data-lines', '');
  };
  if (!still) {
    document.querySelectorAll('.spot-name, .hero-t-name, .intro-t, .t-line, .visit-t, .sec-t').forEach(split);
    document.querySelectorAll('.gal-img, .pair figure, .news-item figure, .tile-img, .visit-img')
      .forEach((f) => f.setAttribute('data-wipe', ''));
  }

  // Reveal on scroll; things that arrive together go in a short stagger
  const io = new IntersectionObserver((es) => {
    let n = 0;
    es.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.style.setProperty('--d', `${Math.min(n++, 5) * 90}ms`);
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal], [data-lines], [data-wipe]').forEach((el) => io.observe(el));

  // Page transitions: name the clicked photo so it grows into the tenant hero on the next page
  let picked = null;
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a.tile, a.spot');
    const plain = ev.button === 0 && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey;
    picked = a && plain ? { path: a.pathname, fig: a.querySelector('figure') } : null;
  });
  window.addEventListener('pageswap', (ev) => {
    const to = ev.activation && ev.activation.entry && new URL(ev.activation.entry.url).pathname;
    if (!ev.viewTransition || !picked || to !== picked.path) return;
    const fig = picked.fig;
    fig.style.viewTransitionName = 'hero';
    const clear = () => { fig.style.viewTransitionName = ''; };
    ev.viewTransition.finished.then(clear, clear);
  });
  window.addEventListener('pageshow', () => { picked = null; });

  // Filter chips on the index grid
  const chips = document.querySelectorAll('[data-filter]');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.classList.toggle('is-on', x === c));
    const f = c.dataset.filter;
    document.querySelectorAll('[data-grid] .tile').forEach((t) => {
      t.hidden = f !== 'all' && t.dataset.group !== f;
    });
  }));
  // Header links like index.html#food open the grid with that filter set
  const pick = () => {
    const chip = document.querySelector(`[data-filter="${location.hash.slice(1)}"]`);
    if (chip) { chip.click(); document.getElementById('index').scrollIntoView(); }
  };
  pick();
  window.addEventListener('hashchange', pick);

  // Pause videos that are off screen
  const vio = new IntersectionObserver((es) => es.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
  }));
  document.querySelectorAll('video').forEach((v) => vio.observe(v));

  // Newsletter form is a placeholder until launch
  const form = document.querySelector('[data-news]');
  if (form) form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    form.querySelector('[data-news-msg]').hidden = false;
  });
})();
