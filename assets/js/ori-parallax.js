/*==================== ORI PARALLAX ====================
  Fondo de bosque en capas inspirado en Ori and the Will of the Wisps.
  - 4 capas SVG generadas proceduralmente (lejos -> primer plano)
  - luz espiritual + rayos + niebla
  - paleta que cambia segun la seccion visible (data-biome)
  - particulas (esporas, luciernagas, bokeh) y una luz tipo Sein que sigue al cursor
  Respeta prefers-reduced-motion. Sin librerias.
=====================================================*/
(() => {
    'use strict';

    const bg = document.querySelector('.ori-bg');
    if (!bg) return;

    document.body.classList.add('ori', 'dark-theme');

    const root = document.documentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(pointer: fine)').matches;

    /*---------- Paletas (biomas) ----------
      [sky0, sky1, sky2, glow, far, mid, near, rim, fog] */
    const BIOMES = {
        niwen:  ['#050a1c', '#0b1f4a', '#1c6a8c', '#9be7ff', '#123a5e', '#0b2547', '#050f22', '#6fe0ff', '#2a7fb0'],
        luma:   ['#031218', '#05414b', '#12857b', '#8bffe0', '#0d4f55', '#083a42', '#031a20', '#5ff5d0', '#1fa89a'],
        mould:  ['#091306', '#1f3d10', '#6a8a1e', '#e9ff82', '#2d4d15', '#1b330c', '#091806', '#c9f45c', '#6e9e2c'],
        ink:    ['#12051d', '#3a1262', '#8a2f93', '#ffa3ec', '#40185f', '#2a0f45', '#12051f', '#ff8de0', '#8a3fb8'],
        waste:  ['#1a0905', '#5c240f', '#d0651d', '#ffd47a', '#6a2c12', '#47190a', '#1a0905', '#ffc15a', '#b8561f'],
        silent: ['#03050f', '#0a1034', '#2b43a0', '#d4e2ff', '#14205a', '#0c1646', '#04081c', '#9fc0ff', '#3d58b8']
    };
    const VARS = ['sky0', 'sky1', 'sky2', 'glow', 'far', 'mid', 'near', 'rim', 'fog'];

    const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
    const rgb2hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const PAL = {};
    Object.keys(BIOMES).forEach(k => PAL[k] = BIOMES[k].map(hex2rgb));
    const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const smooth = t => t * t * (3 - 2 * t);

    /*---------- Utilidades ----------*/
    function rng(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    const f = n => Math.round(n * 10) / 10;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    function leafPath(len, wid) {
        return `M0 0C${f(wid * .95)} ${f(-len * .25)} ${f(wid * .7)} ${f(-len * .8)} 0 ${f(-len)}` +
               `C${f(-wid * .7)} ${f(-len * .8)} ${f(-wid * .95)} ${f(-len * .25)} 0 0Z`;
    }
    // ang: 0 = hacia arriba, 90 = derecha, 180 = hacia abajo
    function leaf(cls, x, y, len, wid, ang, vein) {
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">` +
               `<path class="${cls}" d="${leafPath(len, wid)}"/>` +
               (vein ? `<path class="vein" d="M0 0Q${f(wid * .12)} ${f(-len * .5)} 0 ${f(-len * .92)}"/>` : '') +
               `</g>`;
    }
    function glowBulb(x, y, halo, core) {
        return `<circle class="bulb" cx="${f(x)}" cy="${f(y)}" r="${f(halo)}"/>` +
               `<circle class="core" cx="${f(x)}" cy="${f(y)}" r="${f(core)}"/>`;
    }

    /*---------- Capas ----------*/
    const LAYERS = [
        { name: 'far',   e: 0.15, dx: 6,  build: buildFar },
        { name: 'mid',   e: 0.35, dx: 16, build: buildMid },
        { name: 'near',  e: 0.75, dx: 34, build: buildNear },
        { name: 'front', e: 1.20, dx: 60, build: buildFront }
    ];

    function buildFar(W, H, r) {
        let s = '';
        const n = Math.round(W / 38);
        for (let i = 0; i < n; i++) {
            const x = r() * W, w = 4 + r() * 8, top = H * (.05 + r() * .25);
            s += `<path class="far" d="M${f(x - w)} ${f(H)}L${f(x - w * .4)} ${f(top)}L${f(x + w * .4)} ${f(top)}L${f(x + w)} ${f(H)}Z"/>`;
            const k = 3 + Math.floor(r() * 3);
            for (let j = 0; j < k; j++) {
                s += `<ellipse class="far" cx="${f(x + (r() - .5) * 90)}" cy="${f(top - r() * 30)}" rx="${f(30 + r() * 60)}" ry="${f(18 + r() * 30)}"/>`;
            }
        }
        s += `<rect class="far" x="0" y="${f(H - 60)}" width="${f(W)}" height="60"/>`;
        return s;
    }

    function buildMid(W, H, r) {
        let s = '';
        const n = Math.max(4, Math.round(W / 230));
        for (let i = 0; i < n; i++) {
            const x = (i + .2 + r() * .6) * W / n;
            const w = 26 + r() * 34, top = H * (.04 + r() * .1), b = (r() - .5) * 70;
            const left = `M${f(x - w)} ${f(H)}C${f(x - w + b)} ${f(H * .7)} ${f(x - w * .55 + b * 1.4)} ${f(H * .3)} ${f(x - w * .4 + b)} ${f(top)}`;
            s += `<path class="mid" d="${left}L${f(x + w * .4 + b)} ${f(top)}C${f(x + w * .55 + b * 1.4)} ${f(H * .3)} ${f(x + w + b)} ${f(H * .7)} ${f(x + w)} ${f(H)}Z"/>`;
            s += `<path class="rim" d="${left}"/>`;

            // ramas con hojas
            for (let k = 0; k < 3; k++) {
                const y = H * (.12 + r() * .45), side = r() < .5 ? -1 : 1, len = 100 + r() * 180;
                const xt = x + b * (1 - y / H);
                const ex = xt + side * len, ey = y - 40 - r() * 60;
                s += `<path class="stem m" stroke-width="${f(6 + r() * 8)}" d="M${f(xt)} ${f(y)}Q${f(xt + side * len * .5)} ${f(y - 10)} ${f(ex)} ${f(ey)}"/>`;
                const nl = 5 + Math.floor(r() * 4);
                for (let j = 0; j < nl; j++) {
                    s += leaf('mid l', ex + (r() - .5) * 30, ey + (r() - .5) * 30, 40 + r() * 50, 14 + r() * 16, side * 80 + (r() - .5) * 120, false);
                }
            }
            // hueco luminoso en el tronco
            if (r() < .6) {
                const hy = H * (.3 + r() * .4), hx = x + b * (1 - hy / H);
                s += glowBulb(hx, hy, 34, 5);
            }
        }
        // follaje colgante en la parte alta
        const m = Math.round(W / 70);
        s += `<rect class="mid" x="0" y="-10" width="${f(W)}" height="26"/>`;
        for (let i = 0; i < m; i++) {
            s += leaf('mid l', r() * W, -6 + r() * 40, 120 + r() * 140, 40 + r() * 50, 180 + (r() - .5) * 70, false);
        }
        return s;
    }

    function buildNear(W, H, r) {
        let s = '';
        const S = clamp(W / 1200, .55, 1);
        const gy = x => H - 210 + Math.sin(x / W * 9.4) * 22 + Math.sin(x * .013) * 10;

        // follaje colgante + lianas con bulbos
        const m = Math.round(W / 180);
        for (let i = 0; i < m; i++) {
            s += leaf('near l', r() * W, -10 + r() * 30, (220 + r() * 200) * S, (60 + r() * 70) * S, 180 + (r() - .5) * 80, true);
        }
        for (let i = 0; i < Math.round(W / 260); i++) {
            const x = r() * W, len = 200 + r() * 300, sway = (r() - .5) * 120;
            s += `<path class="stem n" stroke-width="${f(4 + r() * 3)}" d="M${f(x)} 0C${f(x + sway)} ${f(len * .4)} ${f(x - sway)} ${f(len * .7)} ${f(x + sway * .4)} ${f(len)}"/>`;
            s += glowBulb(x + sway * .4, len, 36 + r() * 16, 4 + r() * 2);
        }

        // hojas laterales a lo largo de todo el recorrido
        const side = Math.round(18 * S + 6);
        for (let i = 0; i < side; i++) {
            const left = r() < .5, y = r() * (H - 180) + 40;
            const x = left ? -10 + r() * 150 * S : W + 10 - r() * 150 * S;
            const ang = left ? 20 + r() * 50 : -(20 + r() * 50);
            const len = (140 + r() * 180) * S, wid = (40 + r() * 50) * S;
            s += leaf('near l', x, y, len, wid, ang, true);
            if (r() < .4) {
                const a = ang * Math.PI / 180;
                s += glowBulb(x + Math.sin(a) * len, y - Math.cos(a) * len, 30 + r() * 20, 3 + r() * 2);
            }
        }

        // suelo del bosque
        let d = `M0 ${f(H)}L0 ${f(gy(0))}`;
        for (let x = 20; x <= W + 20; x += 20) d += `L${x} ${f(gy(x))}`;
        s += `<path class="near" d="${d}L${f(W + 20)} ${f(H)}Z"/>`;

        // pozo espiritual al final del recorrido
        s += `<circle class="bulb" cx="${f(W * .5)}" cy="${f(gy(W * .5) + 6)}" r="${f(240 * S)}"/>`;
        s += `<ellipse class="core" cx="${f(W * .5)}" cy="${f(gy(W * .5) + 4)}" rx="${f(26 * S)}" ry="7"/>`;

        // hongos bioluminiscentes
        const mush = Math.round(W / 130);
        for (let i = 0; i < mush; i++) {
            const x = r() * W, base = gy(x) + 8, h = 24 + r() * 60, cw = 14 + r() * 22;
            s += `<rect class="near" x="${f(x - 3)}" y="${f(base - h)}" width="6" height="${f(h + 6)}" rx="3"/>`;
            s += `<circle class="bulb" cx="${f(x)}" cy="${f(base - h)}" r="${f(cw * 3.2)}"/>`;
            s += `<path class="glowcap" d="M${f(x - cw)} ${f(base - h + 2)}Q${f(x)} ${f(base - h - cw * 1.3)} ${f(x + cw)} ${f(base - h + 2)}Z"/>`;
        }
        return s;
    }

    function buildFront(W, H, r) {
        const S = clamp(W / 1200, .55, 1);
        const L = (x, y, len, wid, ang) => leaf('front', x, y, len * S, wid * S, ang, false);
        return L(-20, -30, 520, 190, 165) + L(W + 20, -30, 480, 170, 195) +
               L(-30, H + 20, 600, 200, 22) + L(W + 30, H + 20, 560, 190, -25) +
               L(-30, H * .45, 340, 120, 62) + L(W + 30, H * .7, 360, 120, -65);
    }

    /*---------- Elementos ----------*/
    const layerEls = LAYERS.map(l => Object.assign(l, { el: bg.querySelector(`[data-layer="${l.name}"]`) }));
    const orbEl = bg.querySelector('.ori-orb');
    const raysEl = bg.querySelector('.ori-rays');
    const mists = [...bg.querySelectorAll('.ori-mist')];
    const cBack = bg.querySelector('canvas[data-fx="back"]');
    const cFront = bg.querySelector('canvas[data-fx="front"]');
    const xBack = cBack.getContext('2d');
    const xFront = cFront.getContext('2d');

    let W = innerWidth, H = innerHeight;
    // modo ligero: moviles/tablets. Parallax corto, sin desenfoque y sin suavizado con retraso
    let lite = false;
    const LITE_E = { far: .04, mid: .10, near: .22, front: .30 };
    function isLite() { return innerWidth < 768 || !finePointer; }
    // En movil la barra del navegador cambia innerHeight al hacer scroll: usamos una altura estable
    function stableH() {
        return lite ? Math.round(Math.max(innerHeight, Math.min(screen.height || 0, innerHeight * 1.25))) : innerHeight;
    }

    function buildLayers() {
        lite = isLite();
        W = innerWidth; H = stableH();
        bg.style.height = H + 'px';
        layerEls.forEach((l, i) => {
            if (!l.el) return;
            const dx = (finePointer && !reduce && !lite) ? l.dx : 0;
            const w = W + dx * 2;
            const h = Math.round(H * (1 + (lite ? LITE_E[l.name] : l.e)));
            l.h = h; l.px = h - H; l.dxPx = dx;
            l.el.style.left = -dx + 'px';
            l.el.style.width = w + 'px';
            l.el.style.height = h + 'px';
            const art = l.build(w, h, rng(1000 + i * 77));
            l.el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${art}</svg>`;
        });

        // rayos de luz desde la luz espiritual
        const r = rng(4242), ox = W * .66, oy = H * .16, len = H * 1.4;
        let rays = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
            `<defs><linearGradient id="oriRay" x1="0" y1="0" x2="0" y2="1">` +
            `<stop offset="0" style="stop-color:var(--c-glow);stop-opacity:.6"/>` +
            `<stop offset="1" style="stop-color:var(--c-glow);stop-opacity:0"/></linearGradient></defs>`;
        for (let i = 0; i < 7; i++) {
            const a = (-38 + i * 12 + (r() - .5) * 6) * Math.PI / 180, w = 24 + r() * 56;
            const sx = Math.sin(a), cy = Math.cos(a);
            const ex = ox + sx * len, ey = oy + cy * len;
            rays += `<polygon class="ray" style="animation-delay:${f(-r() * 11)}s" fill="url(#oriRay)" points="` +
                `${f(ox - cy * 4)},${f(oy + sx * 4)} ${f(ox + cy * 4)},${f(oy - sx * 4)} ` +
                `${f(ex + cy * w)},${f(ey - sx * w)} ${f(ex - cy * w)},${f(ey + sx * w)}"/>`;
        }
        raysEl.innerHTML = rays + '</svg>';
    }

    /*---------- Biomas segun seccion ----------*/
    const sections = [...document.querySelectorAll('[data-biome]')];
    let anchors = [], maxScroll = 1, lastKey = '';

    function measure() {
        const sy = window.pageYOffset;
        anchors = sections.map(s => {
            const b = s.getBoundingClientRect();
            return { top: b.top + sy, bottom: b.bottom + sy, biome: PAL[s.dataset.biome] ? s.dataset.biome : 'niwen' };
        }).sort((a, b) => a.top - b.top);
        maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    }

    /*
      Por que no cambiar variables CSS: cada cambio de --c-* recalcula estilos de
      toda la pagina y repinta las capas SVG (44-82 ms por cambio en CPU lenta,
      mas que un frame). Aqui el color vive en capas de tinte fijas con
      mix-blend-mode: color. Cambiar de seccion solo transiciona su opacidad,
      que la GPU resuelve sin repintar nada. El acento de la web no cambia.
    */
    const TINTS = {
        niwen:  '#2a7fb0',
        luma:   '#1fa89a',
        mould:  '#6e9e2c',
        ink:    '#8a3fb8',
        waste:  '#d0651d',
        silent: '#3d58b8'
    };
    const tintEls = {};
    let curBiome = null, activeIdx = 0;

    function buildTints() {
        if (Object.keys(tintEls).length) return;
        const vignette = bg.querySelector('.ori-vignette');
        Object.keys(TINTS).forEach(name => {
            const d = document.createElement('div');
            d.className = 'ori-tint';
            d.style.background = TINTS[name];
            bg.insertBefore(d, vignette);
            tintEls[name] = d;
        });
    }

    function setBiome(name, instant) {
        if (name === curBiome && !instant) return;
        curBiome = name;
        Object.keys(tintEls).forEach(k => {
            const el = tintEls[k];
            if (instant) el.classList.add('no-anim');
            el.classList.toggle('is-on', k === name);
            if (instant) { void el.offsetWidth; el.classList.remove('no-anim'); }
        });
    }

    function pickSection(sy) {
        if (!anchors.length) return 0;
        const y = sy + innerHeight * .5;
        const cur = anchors[activeIdx];
        // histeresis: no cambiar hasta pasar 70px del limite de la seccion actual
        if (cur && y > cur.top - 70 && y < cur.bottom + 70) return activeIdx;
        let best = activeIdx, bd = Infinity;
        anchors.forEach((a, i) => {
            const d = y < a.top ? a.top - y : y > a.bottom ? y - a.bottom : 0;
            if (d < bd) { bd = d; best = i; }
        });
        return best;
    }

    function updateBiome(sy, instant) {
        if (!anchors.length) return;
        activeIdx = pickSection(sy);
        setBiome(anchors[activeIdx].biome, instant);
    }

    /*---------- Particulas ----------*/
    let dpr = 1;
    let particles = [];
    let sprite = null, spriteKey = '';

    function makeSprite() {
        const key = '155,231,255';
        if (key === spriteKey) return;
        spriteKey = key;
        sprite = document.createElement('canvas');
        sprite.width = sprite.height = 64;
        const c = sprite.getContext('2d');
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(.18, `rgba(${key},.85)`);
        g.addColorStop(.5, `rgba(${key},.22)`);
        g.addColorStop(1, `rgba(${key},0)`);
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
    }

    function buildParticles() {
        dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
        [cBack, cFront].forEach(c => {
            c.width = W * dpr; c.height = H * dpr;
            c.style.width = W + 'px'; c.style.height = H + 'px';
        });
        const r = rng(777);
        const total = lite ? clamp(Math.round(W * H / 16000), 24, 42) : clamp(Math.round(W * H / 9000), 55, 170);
        particles = [];
        for (let i = 0; i < total; i++) {
            const roll = r();
            const kind = roll < .62 ? 'spore' : (roll < .9 || lite) ? 'wisp' : 'bokeh';
            const p = { kind, x: r() * W, y: r() * H, ph: r() * 6.28, sp: .6 + r() * 1.4 };
            if (kind === 'spore') { p.d = .3 + r() * .6; p.s = 2 + r() * 3;  p.a = .35; p.vy = -(4 + r() * 8);  p.front = false; }
            if (kind === 'wisp')  { p.d = .8 + r() * .6; p.s = 6 + r() * 8;  p.a = .8;  p.vy = -(6 + r() * 12); p.front = r() < .4; }
            if (kind === 'bokeh') { p.d = 1.6 + r() * .8; p.s = 30 + r() * 40; p.a = .11; p.vy = -(10 + r() * 14); p.front = true; }
            particles.push(p);
        }
    }

    /*---------- Estado de scroll / raton ----------*/
    let builtOnce = false;
    let P = 0, targetP = 0, sy = 0, smoothSy = 0;
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    let cx = -999, cy = -999, tx = -999, ty = -999, cursorSeen = 0;
    const trail = [];

    function onScroll() {
        sy = window.pageYOffset;
        targetP = clamp(sy / maxScroll, 0, 1);
        updateBiome(sy, false);
    }

    function applyTransforms() {
        if (lite) {
            layerEls.forEach(l => {
                if (l.el) l.el.style.transform = `translate3d(0,${f(-P * l.px)}px,0)`;
            });
            return;
        }
        layerEls.forEach(l => {
            if (!l.el) return;
            l.el.style.transform = `translate3d(${f(mx * l.dxPx)}px,${f(-P * l.px + my * l.dxPx * .3)}px,0)`;
        });
        const dy = -P * H * .12;
        orbEl.style.transform = `translate3d(${f(mx * 10)}px,${f(dy)}px,0)`;
        raysEl.style.transform = `translate3d(${f(mx * 10)}px,${f(dy)}px,0)`;
        mists.forEach((m, i) => {
            m.style.transform = `translate3d(0,${f(-P * H * (.2 + i * .25))}px,0)`;
        });
    }

    function drawSprite(ctx, x, y, size, alpha) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, (x - size) * dpr, (y - size) * dpr, size * 2 * dpr, size * 2 * dpr);
    }

    let last = 0;
    function drawParticles(t, dt) {
        makeSprite();
        [xBack, xFront].forEach(c => {
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, W * dpr, H * dpr);
            c.globalCompositeOperation = 'lighter';
        });

        const near = 170;
        for (const p of particles) {
            if (dt) {
                p.x += (Math.sin(t * .0005 * p.sp + p.ph) * 10) * dt * p.d;
                p.y += p.vy * dt * p.d;
                if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
            }
            let sx = p.x + mx * 18 * p.d;
            let syy = ((p.y - smoothSy * (lite ? .05 : .28) * p.d) % H + H) % H;

            // la luz Sein atrae suavemente a las luces cercanas
            if (cursorSeen && p.kind !== 'bokeh') {
                const dx = cx - sx, dy = cy - syy, dist = Math.hypot(dx, dy);
                if (dist < near && dist > 1 && dt) {
                    const pull = (1 - dist / near) * 70 * dt;
                    p.x += dx / dist * pull;
                    p.y += dy / dist * pull;
                }
            }
            const tw = .6 + .4 * Math.sin(t * .002 * p.sp + p.ph);
            drawSprite(p.front ? xFront : xBack, sx, syy, p.s * (p.kind === 'wisp' ? .9 + tw * .2 : 1), p.a * tw);
        }

        // luz Sein (cursor)
        if (cursorSeen) {
            const alive = clamp(1 - (t - cursorSeen) / 4000, 0, 1) * .6 + .4;
            for (let i = 0; i < trail.length; i++) {
                const k = i / trail.length;
                drawSprite(xFront, trail[i][0], trail[i][1], 4 + k * 12, k * .5 * alive);
            }
            drawSprite(xFront, cx, cy, 30, .75 * alive);
            xFront.globalAlpha = alive;
            xFront.fillStyle = '#fff';
            xFront.beginPath();
            xFront.arc(cx * dpr, cy * dpr, 3 * dpr, 0, 6.283);
            xFront.fill();
        }
        xBack.globalAlpha = xFront.globalAlpha = 1;
    }

    function frame(t) {
        const dt = Math.min(.05, (t - last) / 1000 || 0);
        last = t;
        if (lite) { P = targetP; smoothSy = sy; }
        else { P += (targetP - P) * .12; smoothSy += (sy - smoothSy) * .12; }
        mx += (tmx - mx) * .06;
        my += (tmy - my) * .06;
        cx += (tx - cx) * .2;
        cy += (ty - cy) * .2;
        if (cursorSeen) { trail.push([cx, cy]); if (trail.length > 16) trail.shift(); }
        applyTransforms();
        drawParticles(t, dt);
        requestAnimationFrame(frame);
    }

    /*---------- Eventos ----------*/
    function setup() {
        buildTints();
        measure();
        buildLayers();
        buildParticles();
        sy = window.pageYOffset;
        targetP = clamp(sy / maxScroll, 0, 1);
        updateBiome(sy, !builtOnce);
        builtOnce = true;
        P = targetP; smoothSy = sy;
        applyTransforms();
    }

    let resizeTimer, builtW = innerWidth, builtH = innerHeight;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const dw = Math.abs(innerWidth - builtW);
            const dh = Math.abs(innerHeight - builtH) / builtH;
            if (dw < 2 && dh < .25 && innerHeight <= H + 2) { measure(); onScroll(); return; } // solo la barra del navegador (si encoge, el fondo ya cubre)
            builtW = innerWidth; builtH = innerHeight;
            setup();
            if (reduce) drawParticles(0, 0);
        }, 200);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', () => { measure(); onScroll(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);

    if (finePointer && !reduce) {
        window.addEventListener('pointermove', e => {
            tmx = (e.clientX / innerWidth - .5) * 2;
            tmy = (e.clientY / innerHeight - .5) * 2;
            tx = e.clientX; ty = e.clientY;
            if (!cursorSeen) { cx = tx; cy = ty; }
            cursorSeen = performance.now();
        }, { passive: true });
        document.addEventListener('mouseleave', () => { cursorSeen = 0; trail.length = 0; });
    }

    setup();
    if (reduce) { applyTransforms(); drawParticles(0, 0); }
    else requestAnimationFrame(frame);
})();
