/* Hosung Kim — site interactions
   Every effect is progressive: without JS the page is a complete, readable resume. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Preloader ---------- */
  const loader = document.getElementById('loader');
  const word = document.getElementById('loader-word');
  const finishLoad = () => {
    loader.classList.add('done');
    setTimeout(() => { document.body.classList.remove('is-loading'); loader.style.display = 'none'; }, 900);
  };
  let seen = false;
  try { seen = sessionStorage.getItem('hk-loaded') === '1'; sessionStorage.setItem('hk-loaded', '1'); } catch (e) { /* storage blocked */ }
  if (reduce || seen) {
    loader.style.display = 'none';
    document.body.classList.remove('is-loading');
  } else {
    const words = ['Hello', '안녕하세요', 'Hola', 'Bonjour', 'Ciao', 'Hallo', 'こんにちは', 'Hello'];
    let i = 0;
    requestAnimationFrame(() => loader.classList.add('show-word'));
    const step = () => {
      i += 1;
      if (i >= words.length) { finishLoad(); return; }
      word.textContent = words[i];
      setTimeout(step, i === 1 ? 260 : 150);
    };
    setTimeout(step, 700);
  }

  /* ---------- LinkedIn-style durations ("2 yrs 6 mos") ---------- */
  document.querySelectorAll('.dur').forEach((el) => {
    const [sy, sm] = el.dataset.start.split('-').map(Number);
    let ey, em;
    if (el.dataset.end === 'present') { const d = new Date(); ey = d.getFullYear(); em = d.getMonth() + 1; }
    else { [ey, em] = el.dataset.end.split('-').map(Number); }
    const total = (ey - sy) * 12 + (em - sm) + 1; // LinkedIn counts both end months
    const y = Math.floor(total / 12), m = total % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
    el.textContent += ` · ${parts.join(' ')}`;
  });

  /* ---------- Local time in LA ---------- */
  const clock = document.getElementById('clock');
  const tick = () => {
    try {
      clock.textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).format(new Date());
    } catch (e) { clock.textContent = 'Los Angeles'; }
  };
  tick(); setInterval(tick, 30000);

  /* ---------- Menu ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const panel = document.getElementById('menu-panel');
  const overlay = document.getElementById('menu-overlay');
  const setMenu = (open) => {
    menuBtn.classList.toggle('open', open);
    panel.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) menuBtn.classList.add('visible');
  };
  menuBtn.addEventListener('click', () => setMenu(!panel.classList.contains('open')));
  overlay.addEventListener('click', () => setMenu(false));
  panel.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const label = el.querySelector('.label');
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform 0.15s linear';
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        if (label) { label.style.transition = 'transform 0.15s linear'; label.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`; }
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
        if (label) { label.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)'; label.style.transform = ''; }
      });
    });
  }

  /* ---------- Experience accordion ---------- */
  const exps = [...document.querySelectorAll('.exp')];
  const toggleExp = (li, open) => {
    li.classList.toggle('open', open);
    li.querySelector('.exp-row').setAttribute('aria-expanded', String(open));
  };
  exps.forEach((li) => {
    li.querySelector('.exp-row').addEventListener('click', () => toggleExp(li, !li.classList.contains('open')));
  });
  if (exps[0]) toggleExp(exps[0], true); // current role open by default

  /* ---------- Cursor-following preview over the experience list ---------- */
  const preview = document.getElementById('preview');
  if (finePointer && preview) {
    const slides = [...preview.querySelectorAll('.pv')];
    const target = { x: 0, y: 0 }, pos = { x: 0, y: 0 };
    let running = false;
    const follow = () => {
      pos.x = lerp(pos.x, target.x, reduce ? 1 : 0.14);
      pos.y = lerp(pos.y, target.y, reduce ? 1 : 0.14);
      preview.style.left = `${pos.x}px`;
      preview.style.top = `${pos.y}px`;
      if (running) requestAnimationFrame(follow);
    };
    exps.forEach((li) => {
      const row = li.querySelector('.exp-row');
      const idx = Number(li.dataset.preview);
      row.addEventListener('mouseenter', (e) => {
        if (!running) { pos.x = target.x = e.clientX; pos.y = target.y = e.clientY; running = true; requestAnimationFrame(follow); }
        slides.forEach((s) => { s.style.transform = `translateY(${-idx * 100}%)`; });
        preview.classList.add('active');
      });
      row.addEventListener('mousemove', (e) => { target.x = e.clientX; target.y = e.clientY; });
      row.addEventListener('mouseleave', () => { preview.classList.remove('active'); });
    });
    document.querySelector('.exp-list').addEventListener('mouseleave', () => { running = false; });
  }

  /* ---------- Scroll-driven effects ---------- */
  const hero = document.querySelector('.hero');
  const marquee = document.getElementById('marquee');
  const rows = [...document.querySelectorAll('.slide-row')];
  const toolkit = document.querySelector('.toolkit');
  const curve = document.getElementById('curve');
  const contact = document.getElementById('contact');
  const isNarrow = () => window.innerWidth <= 900;

  let lastY = window.scrollY, dir = -1, mx = 0;

  const onScroll = () => {
    const y = window.scrollY;
    if (y !== lastY) dir = y > lastY ? -1 : 1; // name slides left on scroll down, right on scroll up
    lastY = y;

    // Floating menu button after the hero
    if (!isNarrow()) menuBtn.classList.toggle('visible', y > hero.offsetHeight * 0.75 || panel.classList.contains('open'));

    if (reduce) return;

    // Toolkit rows slide in opposite directions as the section crosses the viewport
    const r = toolkit.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    rows.forEach((row) => {
      const range = Math.max(0, row.scrollWidth - window.innerWidth) * 0.5 + 120;
      const d = Number(row.dataset.dir);
      const x = d < 0 ? -p * range : (p - 1) * range;
      row.style.transform = `translate3d(${x}px, 0, 0)`;
    });

    // Curve above the footer flattens as the footer comes in
    const c = contact.getBoundingClientRect();
    const cp = clamp((window.innerHeight - c.top) / (window.innerHeight * 0.9), 0, 1);
    const h = 120 * (1 - cp);
    curve.style.height = `${h}px`;
    curve.style.top = `${-h / 2}px`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Name marquee: continuous drift; direction follows scroll
  if (!reduce) {
    const loop = () => {
      const span = marquee.firstElementChild;
      const w = span ? span.offsetWidth : 1;
      mx += 0.9 * dir;
      if (mx <= -w) mx += w;
      if (mx > 0) mx -= w;
      marquee.style.transform = `translate3d(${mx}px, 0, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* ---------- Demo video: play muted while on screen, pause when scrolled away ---------- */
  const demo = document.querySelector('.rt-video');
  if (demo && 'IntersectionObserver' in window && !reduce) {
    let userPaused = false;
    demo.addEventListener('pause', () => { if (demo.dataset.auto !== '1') userPaused = true; demo.dataset.auto = ''; });
    demo.addEventListener('play', () => { userPaused = false; });
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !userPaused) { demo.play().catch(() => {}); }
      else if (!en.isIntersecting && !demo.paused) { demo.dataset.auto = '1'; demo.pause(); }
    }, { threshold: 0.5 }).observe(demo);
  }

  /* ---------- Contact form ---------- */
  const TO = 'hosungk@marshall.usc.edu';
  // FormSubmit relays the form to this inbox. After the one-time activation email,
  // you can swap the address in this URL for the random alias FormSubmit gives you.
  const ENDPOINT = `https://formsubmit.co/ajax/${TO}`;
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const sendBtn = document.getElementById('send-btn');

  document.getElementById('touch-btn').addEventListener('click', (e) => {
    e.preventDefault();
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('f-name').focus({ preventScroll: true }), reduce ? 0 : 700);
  });

  const mailtoFor = (d) => {
    const body = `${d.message}\n\n— ${d.name}${d.organization ? `, ${d.organization}` : ''}\n${d.email}`;
    return `mailto:${TO}?subject=${encodeURIComponent(`Website message from ${d.name}`)}&body=${encodeURIComponent(body)}`;
  };
  const setStatus = (html, cls) => { status.className = `cform-status ${cls || ''}`; status.innerHTML = html; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const d = Object.fromEntries(['name', 'email', 'organization', 'message', '_honey'].map((k) => [k, String(fd.get(k) || '').trim()]));
    if (d._honey) return; // bot

    // Validate
    let bad = null;
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
    const mark = (id) => { const el = document.getElementById(id); el.closest('.field').classList.add('invalid'); bad = bad || el; };
    if (!d.name) mark('f-name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) mark('f-email');
    if (!d.message) mark('f-msg');
    if (bad) { setStatus('Please fill in your name, a valid email and a message.', 'err'); bad.focus(); return; }

    const fallback = () => setStatus(`Couldn’t send from the page. <a href="${mailtoFor(d)}">Open it in your email app instead</a>, or write to ${TO}.`, 'err');

    if (location.protocol === 'file:') { fallback(); return; } // relay needs a hosted page

    sendBtn.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: d.name,
          email: d.email,
          organization: d.organization || '—',
          message: d.message,
          _subject: `Website message from ${d.name}`,
          _replyto: d.email,
          _template: 'table',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && String(json.success) === 'true') {
        form.reset();
        setStatus(`Thanks, ${d.name.split(' ')[0]}! Your message is on its way. I’ll reply to ${d.email}.`, 'ok');
      } else {
        fallback();
      }
    } catch (err) {
      fallback();
    } finally {
      sendBtn.disabled = false;
    }
  });
})();
