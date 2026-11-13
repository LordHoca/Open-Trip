(() => {
  const cv = document.getElementById('air'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) document.documentElement.classList.add('no-cursor');

  const PAL = {
    biru:   ['#a6e8ff', '#bbdbf8', '#8fb9fc'],
    teal:   ['#b4f7e4', '#27cbaa', '#0a7a74'],
    bening: ['#ffffff', '#d3edf7', '#7fb4cb']
  };
  const DROP = new Path2D('M16 2C16 2 4 15 4 21a12 12 0 0 0 24 0C28 15 16 2 16 2Z');
  let pal = PAL.biru, jejak = true, riak = true, ukuran = 6;
  let W, H, dpr;

  const st = { tx: 0, ty: 0, px: 0, py: 0, ang: 0, vis: false, touch: false, last: 0,
               hover: false, down: false, hs: 1, pulse: 1, nextFall: 0, dx: 0, dy: 0 };
  const parts = [];
  let jumlah = 1;
  const countEl = document.getElementById('count');
  const skala = () => 0.7 + ukuran / 100 * 1.6;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  // ---- Input (mouse + sentuhan) ----
  function gerak(e) {
    st.touch = e.pointerType === 'touch';
    st.tx = e.clientX; st.ty = e.clientY; st.last = performance.now();
    if (!st.vis) { st.px = st.tx; st.py = st.ty; st.dx = st.tx; st.dy = st.ty; st.vis = true; }
  }
  addEventListener('pointermove', gerak, { passive: true });
  addEventListener('pointerdown', e => { gerak(e); st.down = true; percik(e.clientX, e.clientY); });
  addEventListener('pointerup', () => { st.down = false; });
  document.addEventListener('mouseleave', () => { st.vis = false; });
  addEventListener('pointerover', e => { st.hover = !!e.target.closest('button,input,a,[data-cursor]'); });

  // ---- Efek ----
  function setTetes() {
    const ml = (jumlah * 0.05).toFixed(2).replace('.', ',');
    if (countEl) countEl.textContent = jumlah + ' tetes ≈ ' + ml + ' ml';
  }
  function percik(x, y) {
    const s = skala();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, v = 90 + Math.random() * 150;
      parts.push({ t: 'splash', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: (2 + Math.random() * 2.6) * s, life: 1 });
    }
    if (riak) {
      parts.push({ t: 'ripple', x, y, r: 6 * s, rate: 150, ry: 1, life: 1 });
      parts.push({ t: 'ripple', x, y, r: 2 * s, rate: 95, ry: 1, life: 1, delay: .1 });
    }
    jumlah++; setTetes();
  }
  function lepas(now) {
    const s = skala();
    st.pulse = .78; st.nextFall = now + 1800;
    parts.push({ t: 'fall', x: st.px, y: st.py + 14 * s, vy: 0, r: 7 * s,
                 ground: Math.min(H - 10, st.py + 60 + 170 * s) });
  }

  // ---- Gambar tetes ----
  function gambarTetes(x, y, size, ang, sx, sy, glow) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang * Math.PI / 180);
    ctx.scale(size / 32 * sx, size / 32 * sy); ctx.translate(-16, -20);
    const g = ctx.createLinearGradient(0, 2, 0, 33);
    g.addColorStop(0, pal[0]); g.addColorStop(.55, pal[1]); g.addColorStop(1, pal[2]);
    if (glow) { ctx.shadowColor = pal[1]; ctx.shadowBlur = 14; }
    ctx.fillStyle = g; ctx.fill(DROP);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(DROP);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.ellipse(11.5, 20, 2.2, 4, .3, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  const sudutPendek = (a, b) => ((b - a + 540) % 360) - 180;

  // ---- Loop animasi ----
  let prev = performance.now();
  function loop(now) {
    const dt = Math.min((now - prev) / 1000, .05); prev = now;
    ctx.clearRect(0, 0, W, H);
    const s = skala();

    // ikuti pointer
    const k = reduce ? 1 : 1 - Math.pow(1 - .24, dt * 60);
    const vx = st.tx - st.px, vy = st.ty - st.py;
    st.px += vx * k; st.py += vy * k;
    const sp = Math.hypot(vx, vy);

    // ujung tetes menunjuk ke belakang arah gerak; diam = tegak
    const target = (!reduce && sp > 1.5) ? Math.atan2(-vy, -vx) * 180 / Math.PI + 90 : 0;
    st.ang += sudutPendek(st.ang, target) * (1 - Math.pow(.82, dt * 60));

    // jejak titik-titik
    if (jejak && !reduce && st.vis && Math.hypot(st.px - st.dx, st.py - st.dy) > 9 * s) {
      parts.push({ t: 'dot', x: st.px, y: st.py, r: 3.6 * s * Math.min(1, .4 + sp / 25), life: 1 });
      st.dx = st.px; st.dy = st.py;
    }

    // sentuhan: sembunyikan setelah jari lepas; diam lama: tetes jatuh
    if (st.touch && st.vis && now - st.last > 1800) st.vis = false;
    if (!reduce && st.vis && !st.down && now - st.last > 800 && now > st.nextFall) lepas(now);

    // partikel
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      if (p.t === 'dot') {
        p.life -= dt / .9;
        ctx.globalAlpha = Math.max(p.life, 0) * .85; ctx.fillStyle = pal[1];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * Math.max(p.life, 0), 0, 6.3); ctx.fill();
      } else if (p.t === 'splash') {
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt / .75;
        ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = pal[0];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * Math.max(p.life, .1), 0, 6.3); ctx.fill();
      } else if (p.t === 'ripple') {
        p.r += p.rate * dt; p.life -= dt / .85;
        ctx.globalAlpha = Math.max(p.life, 0) * .75; ctx.strokeStyle = pal[0]; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * p.ry, 0, 0, 6.3); ctx.stroke();
      } else if (p.t === 'fall') {
        p.vy += 1500 * dt; p.y += p.vy * dt;
        ctx.globalAlpha = 1; gambarTetes(p.x, p.y, p.r * 2.4, 0, .85, 1.25, false);
        if (p.y >= p.ground) {
          parts.push({ t: 'ripple', x: p.x, y: p.ground, r: 4, rate: 90, ry: .35, life: 1 });
          if (riak) parts.push({ t: 'ripple', x: p.x, y: p.ground, r: 1, rate: 55, ry: .35, life: 1, delay: .12 });
          for (let j = 0; j < 4; j++) {
            const a = -Math.PI / 2 + (Math.random() - .5) * 1.8;
            parts.push({ t: 'splash', x: p.x, y: p.ground, vx: Math.cos(a) * 70, vy: Math.sin(a) * 110, r: 1.8 * s, life: 1 });
          }
          jumlah++; setTetes(); p.dead = true;
        }
      }
      if (p.dead || p.life <= 0) parts.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    // tetes utama
    st.hs += ((st.hover ? 1.4 : 1) - st.hs) * (1 - Math.pow(.8, dt * 60));
    st.pulse += (1 - st.pulse) * (1 - Math.pow(.88, dt * 60));
    if (st.vis) {
      const regang = reduce ? 0 : Math.min(sp / 45, .55);
      const tekan = st.down ? .8 : 1;
      gambarTetes(st.px, st.py, 24 * s * st.hs * st.pulse * tekan, st.ang, 1 - regang * .35, 1 + regang, true);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---- Kontrol (opsional; aman dihapus) ----
  const swatches = document.querySelectorAll('.sw');
  swatches.forEach(b => b.addEventListener('click', () => {
    pal = PAL[b.dataset.pal];
    swatches.forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  const sizeEl = document.getElementById('size');
  if (sizeEl) sizeEl.addEventListener('input', () => { ukuran = +sizeEl.value; });
  const bind = (id, set) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => {
      const on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', on); set(on);
    });
  };
  bind('tTrail', v => { jejak = v; });
  bind('tRipple', v => { riak = v; });
  setTetes();
})();