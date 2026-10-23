(() => {
  const hdr = document.querySelector('[data-hdr]');
  const hero = document.querySelector('.hero');
  const onScroll = () => {
    const limit = hero && document.body.classList.contains('is-home') ? hero.offsetHeight - 60 : 0;
    hdr.classList.toggle('is-solid', window.scrollY > limit);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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

  // Reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

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
