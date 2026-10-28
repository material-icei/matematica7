/* =========================================================
   app.js — Estado de la partida, pantallas, gamificación e informe
   ========================================================= */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG, C = window.CONTENIDOS, E = window.Engine, F = window.F;
  const MIS = C.misiones;
  const KEY = 'guardianes7mo_v1';
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  let storageOK = true;
  let S = null;      // estado guardado
  let RUN = null;    // misión en curso
  let CUR = null;    // desafío en curso

  /* ================= almacenamiento ================= */
  function load() {
    try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; }
    catch (e) { storageOK = false; return null; }
  }
  function save() {
    if (!S) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; } catch (e) { storageOK = false; }
  }
  function fresh(alias) {
    return { v: 1, alias: alias, creado: Date.now(), tiempoMs: 0, misiones: {}, bonos: {}, insignias: [], autoeval: {},
      corregidas: 0, envios: [], finalVisto: false, docente: false, anim: true };
  }

  /* ================= tiempo de juego ================= */
  let lastTick = Date.now(), wasVisible = document.visibilityState === 'visible';
  function tick() {
    const now = Date.now();
    if (S && wasVisible) { const d = now - lastTick; if (d > 0 && d < 60000) S.tiempoMs += d; }
    lastTick = now; wasVisible = document.visibilityState === 'visible';
    if (S) save();
  }
  setInterval(tick, 10000);
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('pagehide', tick);

  /* ================= utilidades ================= */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const pct = (x) => Math.round(x * 100) + ' %';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const strip = (s) => String(s || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const byId = (id) => MIS.find((m) => m.id === id);
  const idxOf = (m) => MIS.indexOf(m);
  function screen(html, cls) {
    app.innerHTML = '<div class="screen ' + (cls || '') + '">' + (storageOK ? '' : '<div class="banner">Este navegador no permite guardar el progreso: si cerrás la pestaña, se perderá lo realizado.</div>') + html + '</div>';
    window.scrollTo(0, 0);
    return app.firstChild;
  }
  function on(root, sel, ev, fn) { root.querySelectorAll(sel).forEach((n) => n.addEventListener(ev, fn)); }
  function starsHTML(n, cls) { let s = '<span class="stars ' + (cls || '') + '" aria-label="' + n + ' de 3 estrellas">'; for (let i = 0; i < 3; i++) s += F.icon('star', i < n ? 'on' : 'off'); return s + '</span>'; }
  function brandMark() {
    return '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l14 5v11c0 9-6 15-14 18C12 34 6 28 6 19V8z" fill="#142545" stroke="#3fd6c6" stroke-width="2.4"/><path d="M13 27l7-14 7 14z" fill="none" stroke="#ffbf3c" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 27h14" stroke="#ffbf3c" stroke-width="2.4"/></svg>';
  }
  function toast(html) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 5000);
  }
  function animOn() { return S ? S.anim !== false : true; }
  function applyAnim() { document.body.classList.toggle('no-anim', !animOn()); }
  function confetti(host) {
    if (!animOn() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    const cols = ['#ffbf3c', '#3fd6c6', '#ff6d5e', '#9b8cff', '#8fd14f'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length];
      p.style.animationDelay = (Math.random() * 0.6) + 's'; p.style.transform = 'rotate(' + Math.random() * 180 + 'deg)';
      c.appendChild(p);
    }
    host.appendChild(c); setTimeout(() => c.remove(), 2800);
  }

  /* ================= cálculo de resultados ================= */
  const graded = (ch) => ch.tipo !== 'self';
  const nOf = (ch) => ch.tipo === 'hunt' ? ch.rondas : 1;
  /** puntaje de logro de un registro: 1 por acierto al primer intento, 0,5 con reintento, 0,75 recuperada en repaso */
  const scoreOf = (r) => r.s1 + 0.5 * r.s2 + 0.75 * r.s3;
  function rec(mid, cid) { const m = S.misiones[mid]; return m && m.items[cid]; }
  function mStats(m) {
    const st = { total: 0, answered: 0, score: 0, correct: 0, first: 0, retry: 0, recov: 0, wrong: 0, pistas: 0, intentos: 0, items: 0, itemsAnswered: 0 };
    m.desafios.forEach((ch) => {
      if (!graded(ch)) return;
      st.total += nOf(ch); st.items++;
      const r = rec(m.id, ch.id);
      if (!r) return;
      st.itemsAnswered++; st.answered += r.n; st.score += scoreOf(r);
      st.first += r.s1; st.retry += r.s2; st.recov += r.s3; st.wrong += r.w;
      st.correct += r.s1 + r.s2 + r.s3; st.pistas += r.pistas || 0; st.intentos += r.intentos || 0;
    });
    st.complete = st.items > 0 && st.itemsAnswered === st.items;
    st.logro = st.total ? st.score / st.total : 0;
    return st;
  }
  const EPS = 1e-9;
  function approved(m) { const s = mStats(m); return s.complete && s.logro >= CFG.UMBRAL_DESBLOQUEO - EPS; }
  function stars(m) {
    const s = mStats(m), ES = CFG.ESTRELLAS;
    if (!s.complete) return 0;
    if (s.logro >= ES.tres - EPS && s.pistas <= ES.maxPistasParaTres) return 3;
    if (s.logro >= ES.dos - EPS) return 2;
    if (s.logro >= ES.una - EPS) return 1;
    return 0;
  }
  function unlocked(i) {
    if (S.docente || i === 0) return true;
    if (MIS[i].final) return MIS.slice(0, i).every(approved);
    return approved(MIS[i - 1]);
  }
  function needsReview(m) { return m.desafios.some((ch) => graded(ch) && (!rec(m.id, ch.id) || scoreOf(rec(m.id, ch.id)) < nOf(ch) - EPS)); }
  function totalXP() {
    let x = 0;
    MIS.forEach((m) => { const mm = S.misiones[m.id]; if (mm) Object.keys(mm.items).forEach((k) => { x += mm.items[k].xp || 0; }); });
    Object.keys(S.bonos).forEach((k) => { const b = S.bonos[k]; x += (b.aprobada ? CFG.XP.misionAprobada : 0) + (b.tres ? CFG.XP.tresEstrellas : 0); });
    return x;
  }
  const totalStars = () => MIS.reduce((a, m) => a + stars(m), 0);
  function maxXP(m) {
    let x = 0;
    m.desafios.forEach((ch) => { if (graded(ch)) x += ch.tipo === 'hunt' ? ch.rondas * CFG.XP.rondaJuego : CFG.XP.primerIntento; });
    return x + CFG.XP.misionAprobada + CFG.XP.tresEstrellas;
  }
  function badgeFor(m) { return C.insignias.find((b) => b.regla.aprobadas && b.regla.aprobadas.indexOf(m.id) >= 0); }
  function xpFor(outcome, pistas) {
    const X = CFG.XP;
    if (outcome === 'w') return 0;
    const base = outcome === 's1' ? X.primerIntento : outcome === 's2' ? X.conReintento : X.recuperada;
    return Math.max(X.minimoPorAcierto, base - X.descuentoPista * (pistas || 0));
  }
  /** guarda el mejor resultado de un desafío; devuelve el XP nuevo ganado */
  function storeItem(m, ch, r) {
    const mm = S.misiones[m.id] || (S.misiones[m.id] = { items: {}, partidas: 0 });
    const old = mm.items[ch.id];
    let better = !old || scoreOf(r) > scoreOf(old) + EPS || (Math.abs(scoreOf(r) - scoreOf(old)) < EPS && (r.pistas || 0) < (old.pistas || 0));
    const oldXP = old ? old.xp || 0 : 0;
    const totalIntentos = (old ? old.intentosTotales || old.intentos || 0 : 0) + (r.intentos || 0);
    if (better) mm.items[ch.id] = Object.assign({}, r, { xp: Math.max(oldXP, r.xp) });
    else old.xp = Math.max(oldXP, r.xp);
    mm.items[ch.id].intentosTotales = totalIntentos;
    mm.items[ch.id].veces = (old ? old.veces || 1 : 0) + 1;
    return Math.max(0, mm.items[ch.id].xp - oldXP);
  }
  function checkBadges() {
    const nuevos = [];
    C.insignias.forEach((b) => {
      if (S.insignias.indexOf(b.id) >= 0) return;
      const r = b.regla; let ok = false;
      if (r.aprobadas) ok = r.aprobadas.every((id) => approved(byId(id)));
      if (r.corregidas) ok = S.corregidas >= r.corregidas;
      if (r.tresSinPistas) ok = MIS.some((m) => stars(m) === 3 && mStats(m).pistas === 0);
      if (r.estrellas) ok = totalStars() >= r.estrellas;
      if (ok) { S.insignias.push(b.id); nuevos.push(b); }
    });
    return nuevos;
  }
  function badgeToast(b) { toast('<span class="badge-mini" style="animation:none"><span class="bic" style="width:2.6rem;height:2.6rem">' + F.icon(b.icono) + '</span></span><div><b>¡Nueva insignia!</b><br>' + esc(b.nombre) + '</div>'); }

  /* ================= BIENVENIDA ================= */
  function welcomeArt() {
    const g = '<g fill="none" stroke-linecap="round" stroke-linejoin="round">';
    return '<svg viewBox="0 0 520 460" role="img" aria-label="Composición de figuras geométricas: rombo, triángulo rectángulo con cuadrados sobre sus lados, compás y arcos.">' +
      '<defs><linearGradient id="wg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fd6c6" stop-opacity=".5"/><stop offset="1" stop-color="#9b8cff" stop-opacity=".15"/></linearGradient>' +
      '<linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbf3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff6d5e" stop-opacity=".2"/></linearGradient></defs>' +
      g + '<circle cx="260" cy="230" r="205" stroke="rgba(120,170,255,.22)" stroke-width="1.5" stroke-dasharray="3 9"/>' +
      '<circle cx="260" cy="230" r="150" stroke="rgba(120,170,255,.18)" stroke-width="1.5"/>' +
      '<path d="M260 40 L430 230 L260 420 L90 230 Z" fill="url(#wg1)" stroke="#3fd6c6" stroke-width="3"/>' +
      '<path d="M260 40V420M90 230H430" stroke="#3fd6c6" stroke-width="1.5" stroke-dasharray="6 7"/>' +
      '<path d="M200 300 L200 180 L360 300 Z" fill="url(#wg2)" stroke="#ffbf3c" stroke-width="3"/>' +
      '<path d="M200 288h12v12" stroke="#ffbf3c" stroke-width="2"/>' +
      '<path d="M200 180 h-120 v120 h120" stroke="rgba(255,109,94,.9)" stroke-width="2.4"/>' +
      '<path d="M200 300 v160" stroke="none"/>' +
      '<path d="M200 300 L200 420 L360 420 L360 300" stroke="rgba(155,140,255,.9)" stroke-width="2.4"/>' +
      '<path d="M200 180 L320 20 L480 140 L360 300" stroke="rgba(143,209,79,.85)" stroke-width="2.4"/>' +
      '<path d="M430 230 A170 170 0 0 0 390 120" stroke="#fff" stroke-width="2" stroke-dasharray="2 6"/>' +
      '<g transform="translate(408 60) rotate(18)"><circle cx="0" cy="0" r="8" stroke="#eef3ff" stroke-width="2.4"/><path d="M-3 7 L-26 92 M3 7 L26 92 M-16 52 H16" stroke="#eef3ff" stroke-width="2.6"/></g>' +
      '<text x="250" y="246" fill="#eef3ff" font-family="Space Grotesk, sans-serif" font-size="22" font-weight="700">a²+b²=c²</text>' +
      '<g fill="#ffbf3c" stroke="none"><circle cx="260" cy="40" r="5"/><circle cx="430" cy="230" r="5"/><circle cx="260" cy="420" r="5"/><circle cx="90" cy="230" r="5"/></g>' +
      '</g></svg>';
  }
  function renderWelcome() {
    const s = load();
    const root = screen(
      '<div class="topbar"><div class="brand">' + brandMark() + '<span>Guardianes de la Geometría</span></div><div class="spacer"></div>' +
      '<button class="btn btn-ghost btn-small" data-howto>' + F.icon('help') + ' ¿Cómo se juega?</button></div>' +
      '<main class="welcome"><div>' +
      '<div class="eyebrow">Matemática · ' + esc(CFG.CURSO) + '</div>' +
      '<h1>La Liga de los <em>Guardianes</em> de la Geometría</h1>' +
      '<p class="lead">Ángulos, triángulos, Pitágoras, cuadriláteros y áreas: ' + MIS.length + ' misiones para demostrar que la geometría no tiene secretos para vos.</p>' +
      (s ? '<div class="continue-card"><b>¡Hola de nuevo, ' + esc(s.alias) + '!</b><p>Tu progreso está guardado en esta computadora.</p><div class="row"><button class="btn btn-primary btn-big" data-continue>' + F.icon('play') + ' Continuar aventura</button><button class="btn btn-ghost" data-other>Soy otro estudiante</button></div></div>' :
        '<form class="start" novalidate><div class="field"><label for="alias">Tu nombre o un alias</label><input id="alias" maxlength="30" autocomplete="off" aria-describedby="alias-help alias-err"><span class="help" id="alias-help">Solo tu nombre o un apodo. No hace falta correo ni contraseña.</span><span class="err" id="alias-err" role="alert"></span></div>' +
        '<div class="row"><button class="btn btn-primary btn-big" type="submit">' + F.icon('play') + ' Comenzar aventura</button><button class="btn btn-ghost btn-big" type="button" data-howto>' + F.icon('help') + ' ¿Cómo se juega?</button></div></form>') +
      '<p class="note">Tu progreso se guarda solo en esta computadora y en este navegador. Al final vas a poder enviar tu informe a la docente.</p>' +
      '</div><div class="welcome-art">' + welcomeArt() + '</div></main>');
    on(root, '[data-howto]', 'click', () => openHowto());
    const form = root.querySelector('form.start');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = $('#alias').value.trim().replace(/\s+/g, ' ');
        if (v.length < 2) { $('#alias-err').textContent = 'Escribí un nombre o alias de al menos 2 letras.'; $('#alias').focus(); return; }
        if (/@/.test(v)) { $('#alias-err').textContent = 'No escribas tu correo: alcanza con tu nombre o un apodo.'; $('#alias').focus(); return; }
        S = fresh(v); save(); applyAnim(); renderMap(0);
      });
      setTimeout(() => $('#alias') && $('#alias').focus(), 50);
    }
    on(root, '[data-continue]', 'click', () => { S = s; applyAnim(); renderMap(); });
    on(root, '[data-other]', 'click', () => {
      openModal('Cambiar de estudiante',
        '<p>Se va a borrar de esta computadora el progreso de <b>' + esc(s.alias) + '</b>.</p><p>Si todavía no envió su informe a la docente, conviene enviarlo antes.</p>',
        [{ t: 'Cancelar', cls: 'btn-ghost-dark' },
          { t: 'Ver informe de ' + s.alias, cls: 'btn-ghost-dark', fn: () => { S = s; renderReport(); } },
          { t: 'Borrar y empezar', cls: 'btn-primary', fn: () => { try { localStorage.removeItem(KEY); } catch (e) { } S = null; renderWelcome(); } }]);
    });
  }

  /* ================= MAPA ================= */
  const POS = [[9, 20], [27, 20], [45, 20], [63, 20], [81, 20], [81, 52], [63, 52], [45, 52], [27, 52], [9, 52], [9, 84], [27, 84], [45, 84], [63, 84], [85, 82]];
  const ZONES = [['Ángulos y bisectriz', 27, 5], ['Triángulos', 72, 5], ['Pitágoras', 72, 37], ['Mediatriz', 45, 37], ['Cuadriláteros', 18, 37], ['Perímetro y área', 18, 69], ['Fórmulas de área', 54, 69], ['Desafío final', 85, 64]];
  function topbarMain() {
    const nAp = MIS.filter(approved).length;
    return '<div class="topbar"><div class="brand">' + brandMark() + '<span>Guardianes de la Geometría</span></div>' +
      '<span class="chip">Guardián/a: <b>' + esc(S.alias) + '</b></span>' +
      '<div class="spacer"></div>' +
      '<span class="chip" title="Misiones aprobadas">' + F.icon('map') + ' ' + nAp + ' / ' + MIS.length + ' misiones</span>' +
      '<span class="chip chip-amber">' + F.icon('star') + ' <b>' + totalStars() + '</b> estrellas</span>' +
      '<span class="chip chip-amber xp">' + totalXP() + ' XP</span>' +
      '<button class="btn btn-ghost btn-small" data-badges>' + F.icon('medal') + ' Insignias ' + S.insignias.length + '/' + C.insignias.length + '</button>' +
      '<button class="btn btn-ghost btn-small" data-report>' + F.icon('report') + ' Informe</button>' +
      '<button class="btn btn-ghost btn-small" data-howto aria-label="¿Cómo se juega?">' + F.icon('help') + '</button></div>';
  }
  function wireTop(root) {
    on(root, '[data-badges]', 'click', openBadges);
    on(root, '[data-report]', 'click', () => renderReport());
    on(root, '[data-howto]', 'click', () => openHowto());
  }
  function stateOf(i) { const m = MIS[i]; if (!unlocked(i)) return 'locked'; return mStats(m).complete ? 'done' : 'avail'; }
  function renderMap(sel) {
    RUN = null; CUR = null;
    if (sel == null) { sel = MIS.findIndex((m, i) => unlocked(i) && !approved(m)); if (sel < 0) sel = MIS.length - 1; }
    let path = '', done = '';
    POS.forEach((p, i) => { path += (i ? 'L' : 'M') + p[0] + ' ' + p[1]; });
    for (let i = 1; i < MIS.length; i++) if (approved(MIS[i - 1]) && unlocked(i)) done += 'M' + POS[i - 1][0] + ' ' + POS[i - 1][1] + 'L' + POS[i][0] + ' ' + POS[i][1];
    let nodes = '';
    MIS.forEach((m, i) => {
      const st = stateOf(i), stb = stars(m);
      const label = 'Misión ' + (i + 1) + ': ' + m.titulo + '. ' + ({ locked: 'Bloqueada', avail: 'Disponible', done: 'Completada' })[st] + (st === 'done' ? ', ' + stb + ' estrellas' : '');
      nodes += '<button class="node ' + st + (m.final ? ' final' : '') + (i === sel ? ' sel' : '') + '" style="left:' + POS[i][0] + '%;top:' + POS[i][1] + '%" data-i="' + i + '" aria-label="' + esc(label) + '" aria-pressed="' + (i === sel) + '">' +
        F.icon(m.icono) + '<span class="num">' + (m.final ? 'FINAL' : (i + 1)) + '</span>' +
        (st === 'locked' ? '<span class="lock">' + F.icon('lock') + '</span>' : '') +
        (st === 'done' ? '<span class="node-stars" aria-hidden="true">' + [0, 1, 2].map((k) => F.icon('star', k < stb ? '' : 'off')).join('') + '</span>' : '') + '</button>';
    });
    const zones = ZONES.map((z) => '<span class="zone" style="left:' + z[1] + '%;top:' + z[2] + '%">' + z[0] + '</span>').join('');
    const root = screen(topbarMain() + '<main class="mapwrap"><div class="map" role="group" aria-label="Mapa de misiones">' +
      '<svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="map-path" d="' + path + '" vector-effect="non-scaling-stroke"/><path class="map-path-done" d="' + done + '" vector-effect="non-scaling-stroke"/></svg>' +
      zones + nodes + '</div><aside class="side card paper" id="side" aria-live="polite"></aside></main>');
    wireTop(root);
    on(root, '.node', 'click', (e) => {
      const i = +e.currentTarget.getAttribute('data-i');
      root.querySelectorAll('.node').forEach((n) => { n.classList.toggle('sel', n === e.currentTarget); n.setAttribute('aria-pressed', n === e.currentTarget); });
      side(i);
    });
    side(sel);
    if (S.envios && false) save();
  }
  function side(i) {
    const m = MIS[i], st = stateOf(i), s = mStats(m), b = badgeFor(m), el = $('#side');
    const stTxt = { locked: F.icon('lock') + ' Bloqueada', avail: F.icon('play') + ' Disponible', done: approved(m) ? F.icon('check') + ' Completada' : F.icon('refresh') + ' Completada · falta aprobar' }[st];
    let lockmsg = '';
    if (st === 'locked') lockmsg = m.final ? 'Se desbloquea cuando apruebes todas las misiones anteriores con al menos ' + pct(CFG.UMBRAL_DESBLOQUEO) + ' de logro.' :
      'Se desbloquea cuando apruebes la misión ' + i + ' («' + MIS[i - 1].titulo + '») con al menos ' + pct(CFG.UMBRAL_DESBLOQUEO) + ' de logro.';
    el.innerHTML = '<div class="kicker">' + F.icon(m.icono) + ' Misión ' + (i + 1) + ' · ' + esc(m.paginas) + '</div>' +
      '<h2>' + esc(m.titulo) + '</h2><p class="desc">' + esc(m.descripcion) + '</p>' +
      '<span class="status ' + (st === 'done' && !approved(m) ? 'pend' : st) + '">' + stTxt + '</span>' +
      '<dl class="kv"><dt>Recompensa</dt><dd>hasta ' + maxXP(m) + ' XP' + (b ? ' · insignia «' + esc(b.nombre) + '»' : '') + '</dd>' +
      '<dt>Desafíos</dt><dd>' + m.desafios.length + '</dd>' +
      '<dt>Mejor resultado</dt><dd>' + (s.itemsAnswered ? pct(s.logro) + ' de logro ' + starsHTML(stars(m)) : 'sin jugar todavía') + '</dd></dl>' +
      (lockmsg ? '<p class="lockmsg">' + lockmsg + '</p>' : '') +
      '<div class="actions-col">' +
      (st !== 'locked' ? '<button class="btn btn-primary btn-big" data-play>' + F.icon('play') + (s.itemsAnswered ? ' Jugar de nuevo' : ' Jugar misión') + '</button>' : '') +
      (st === 'done' && needsReview(m) ? '<button class="btn btn-ghost-dark" data-review>' + F.icon('refresh') + ' Repasar errores</button>' : '') +
      '</div>';
    on(el, '[data-play]', 'click', () => startRun(m, 'full'));
    on(el, '[data-review]', 'click', () => startRun(m, 'repaso'));
  }

  /* ================= MISIÓN: introducción ================= */
  function startRun(m, mode) {
    let queue = m.desafios.map((c, i) => i);
    if (mode === 'repaso') {
      queue = queue.filter((i) => { const ch = m.desafios[i]; if (!graded(ch)) return false; const r = rec(m.id, ch.id); return !r || scoreOf(r) < nOf(ch) - EPS; });
      if (!queue.length) { mode = 'full'; queue = m.desafios.map((c, i) => i); }
    }
    const i = idxOf(m);
    RUN = { m: m, mode: mode, queue: queue, pos: 0, xp: 0, res: {}, nextWasUnlocked: i + 1 < MIS.length ? unlocked(i + 1) : null };
    renderIntro();
  }
  function topbarPlay() {
    const m = RUN.m, steps = RUN.queue.map((qi, k) => {
      const ch = m.desafios[qi], r = RUN.res[ch.id];
      return '<span class="step ' + (k === RUN.pos && CUR ? 'cur ' : '') + (r || '') + '" title="Desafío ' + (k + 1) + '"></span>';
    }).join('');
    return '<div class="topbar"><button class="btn btn-ghost btn-small" data-exit>' + F.icon('back') + ' Mapa</button>' +
      '<div class="tb-title">' + F.icon(m.icono) + '<span>Misión ' + (idxOf(m) + 1) + ' · ' + esc(m.titulo) + (RUN.mode === 'repaso' ? ' · Repaso' : '') + '</span></div>' +
      '<div class="spacer"></div><div class="steps" aria-hidden="true">' + steps + '</div>' +
      '<span class="chip chip-amber xp" aria-label="Puntos de experiencia">' + totalXP() + ' XP</span></div>';
  }
  function exitRun() {
    if (!CUR || CUR.done) { renderMap(idxOf(RUN.m)); return; }
    openModal('¿Salir de la misión?', '<p>Lo que ya respondiste queda guardado. La misión se completa cuando terminás todos sus desafíos.</p>',
      [{ t: 'Seguir jugando', cls: 'btn-ghost-dark' }, { t: 'Salir al mapa', cls: 'btn-primary', fn: () => renderMap(idxOf(RUN.m)) }]);
  }
  function renderIntro() {
    const m = RUN.m, ej = m.ejemplo || {};
    CUR = null;
    const rev = RUN.mode === 'repaso';
    const root = screen(topbarPlay() + '<main class="intro">' +
      '<section class="card paper task"><div class="task-head"><span class="num">Misión ' + (idxOf(m) + 1) + '</span><span class="tag">Planificación ' + esc(m.paginas) + '</span></div>' +
      '<h2 tabindex="-1" id="intro-h">' + esc(m.titulo) + '</h2>' +
      '<div class="goal">' + F.icon('flag') + '<div><b>Objetivo:</b> ' + m.objetivo + '</div></div>' +
      (rev ? '<p class="goal" style="background:#fff2d3;color:#6e4700">' + F.icon('refresh') + '<span><b>Modo repaso:</b> vas a practicar ' + RUN.queue.length + ' desafío' + (RUN.queue.length > 1 ? 's' : '') + ' que todavía no resolviste al primer intento.</span></p>' : '') +
      '<ul class="concepts">' + m.puntos.map((p) => '<li><span>' + p + '</span></li>').join('') + '</ul>' +
      (ej.html ? '<div class="example"><b>Ejemplo</b>' + ej.html + '</div>' : '') +
      (m.enlaces ? '<div class="links">' + m.enlaces.map((l) => '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.t) + ' ↗</a>').join(' · ') + '</div>' : '') +
      '<div class="actions"><span class="attempts">' + RUN.queue.length + ' desafíos · hasta ' + maxXP(m) + ' XP</span><div class="spacer"></div>' +
      '<button class="btn btn-primary btn-big" data-start>¡Comenzar! ' + F.icon('play') + '</button></div></section>' +
      '<section class="card paper visual">' + (ej.fig ? ej.fig() : '') + '</section></main>');
    on(root, '[data-exit]', 'click', () => renderMap(idxOf(m)));
    on(root, '[data-start]', 'click', renderChallenge);
    $('#intro-h').focus();
  }

  /* ================= MISIÓN: desafío ================= */
  const TYPE_LABEL = { choice: 'Elegí la respuesta', multi: 'Marcá todas las correctas', number: 'Calculá', classify: 'Clasificá', select: 'Completá', order: 'Ordená los pasos',
    grid: 'Dibujá en la cuadrícula', triangle: 'Compás virtual', point: 'Ubicá el punto', hunt: 'Juego', self: 'Autoevaluación' };
  const TRY_TITLES = ['¡Buen intento!', 'Revisemos juntos.', 'Casi…'];
  function renderChallenge() {
    const m = RUN.m, ch = m.desafios[RUN.queue[RUN.pos]];
    CUR = { ch: ch, attempts: 0, pista: false, done: false };
    const figFn = E.figFor(ch, m, MIS);
    const interactive = ['grid', 'triangle', 'point', 'hunt'].indexOf(ch.tipo) >= 0;
    const layout = interactive ? 'wide' : (figFn && ch.layout !== 'nofig' ? (ch.layout === 'narrowfig' ? 'narrowfig' : '') : 'nofig');
    const isSelf = ch.tipo === 'self', isHunt = ch.tipo === 'hunt';
    const root = screen(topbarPlay() + '<main class="play ' + layout + '">' +
      (layout !== 'nofig' ? '<section class="card paper visual" id="vis"></section>' : '') +
      '<section class="card paper task"><div class="task-head"><span class="num">Desafío ' + (RUN.pos + 1) + ' de ' + RUN.queue.length + '</span><span>' + TYPE_LABEL[ch.tipo] + '</span><span class="tag" title="Origen en la planificación">' + esc(ch.fuente) + '</span>' +
      (isSelf ? '<span class="self-badge">No suma ni resta puntos</span>' : '') + '</div>' +
      (isHunt ? '' : '<h2 class="consigna" id="consigna" tabindex="-1">' + ch.consigna + '</h2>') +
      '<div class="answer" id="ans"></div>' +
      '<div class="feedback" id="fb" role="status" aria-live="polite"></div>' +
      '<div class="actions" id="acts">' +
      (!isSelf && !isHunt ? '<button class="btn btn-hint" id="b-hint">' + F.icon('bulb') + ' Pista</button>' : '') +
      '<div class="spacer"></div><span class="attempts" id="att"></span>' +
      (isHunt ? '' : '<button class="btn btn-primary" id="b-check">' + (isSelf ? 'Registrar autoevaluación' : 'Comprobar') + '</button>') +
      '<button class="btn btn-primary" id="b-next" hidden>' + (RUN.pos + 1 < RUN.queue.length ? 'Siguiente desafío' : 'Terminar misión') + ' ' + F.icon('play') + '</button>' +
      '</div></section></main>');
    const vis = $('#vis');
    if (vis && figFn && !interactive) vis.innerHTML = figFn();
    on(root, '[data-exit]', 'click', exitRun);
    const ctx = {
      fig: vis, ans: $('#ans'), wide: layout === 'nofig',
      changed: () => { if (CUR && CUR.fbEmpty) { hideFb(); CUR.fbEmpty = false; } },
      submit: () => check(),
      customDone: (res) => finishHunt(res)
    };
    CUR.ctrl = E.render(ch, ctx);
    const bc = $('#b-check'); if (bc) bc.addEventListener('click', check);
    const bh = $('#b-hint'); if (bh) bh.addEventListener('click', useHint);
    $('#b-next').addEventListener('click', next);
    updAttempts();
    const h = $('#consigna'); if (h) h.focus(); else CUR.ctrl.focus();
  }
  function updAttempts() {
    const a = $('#att'); if (!a || !CUR) return;
    if (CUR.ch.tipo === 'self' || CUR.ch.tipo === 'hunt' || CUR.done) { a.textContent = ''; return; }
    a.textContent = 'Intento ' + Math.min(CUR.attempts + 1, CFG.MAX_INTENTOS) + ' de ' + CFG.MAX_INTENTOS;
  }
  function showFb(kind, html) {
    const fb = $('#fb'); const icon = { ok: 'check', bad: 'x', hint: 'bulb', sol: 'eye' }[kind];
    fb.className = 'feedback show ' + kind; fb.innerHTML = F.icon(icon) + '<div class="fb-body">' + html + '</div>';
  }
  function hideFb() { const fb = $('#fb'); fb.className = 'feedback'; fb.innerHTML = ''; }
  function useHint() {
    if (!CUR || CUR.done) return;
    CUR.pista = true;
    showFb('hint', '<p class="fb-title">Pista</p><p>' + CUR.ch.pista + '</p>');
    if (CUR.ctrl.onHint) CUR.ctrl.onHint();
    const b = $('#b-hint'); if (b) { b.disabled = true; b.innerHTML = F.icon('bulb') + ' Pista usada'; }
  }
  function check() {
    if (!CUR || CUR.done) return;
    const ch = CUR.ch, resp = CUR.ctrl.get(), res = E.validate(ch, resp);
    if (res.empty) { showFb('hint', '<p>' + res.msg + '</p>'); CUR.fbEmpty = true; return; }
    if (ch.tipo === 'self') { finishSelf(resp); return; }
    CUR.attempts++;
    CUR.ctrl.clearMarks(); CUR.ctrl.mark(res);
    if (res.ok) { finishItem(CUR.attempts === 1 ? (RUN.mode === 'repaso' ? 's3' : 's1') : 's2', res); return; }
    if (CUR.attempts < CFG.MAX_INTENTOS) {
      let html = '<p class="fb-title">' + TRY_TITLES[(CUR.attempts - 1) % TRY_TITLES.length] + '</p><p>' + res.msg + '</p>';
      if (CUR.attempts === CFG.MAX_INTENTOS - 1 && ch.pista) {
        CUR.pista = true; html += '<p><b>Pista:</b> ' + ch.pista + '</p>';
        if (CUR.ctrl.onHint) CUR.ctrl.onHint();
        const b = $('#b-hint'); if (b) { b.disabled = true; b.innerHTML = F.icon('bulb') + ' Pista usada'; }
      }
      showFb('bad', html + '<p>Corregí y volvé a comprobar.</p>');
      updAttempts();
      return;
    }
    CUR.ctrl.reveal();
    finishItem('w', res);
  }
  function lockAndNext() {
    CUR.done = true; CUR.ctrl.lock(true);
    const bc = $('#b-check'); if (bc) bc.hidden = true;
    const bh = $('#b-hint'); if (bh) bh.hidden = true;
    const bn = $('#b-next'); bn.hidden = false; updAttempts();
    setTimeout(() => bn.focus(), 30);
  }
  function refreshSteps() {
    const t = document.querySelector('.steps'); if (!t) return;
    const tmp = document.createElement('div'); tmp.innerHTML = topbarPlay();
    t.innerHTML = tmp.querySelector('.steps').innerHTML;
    const xp = document.querySelector('.topbar .xp'); if (xp) xp.textContent = totalXP() + ' XP';
  }
  function finishItem(outcome, res) {
    const ch = CUR.ch, m = RUN.m;
    const r = { n: 1, s1: 0, s2: 0, s3: 0, w: 0, intentos: CUR.attempts, pistas: CUR.pista ? 1 : 0 };
    r[outcome] = 1; r.xp = xpFor(outcome, r.pistas);
    const gained = storeItem(m, ch, r);
    RUN.xp += gained; RUN.res[ch.id] = outcome;
    if (outcome === 's2') S.corregidas++;
    lockAndNext();
    const xpChip = gained ? ' <span class="xpgain">+' + gained + ' XP</span>' : '';
    if (outcome === 'w') {
      showFb('sol', '<p class="fb-title">Esta vez no salió. Así se resuelve:</p><p>' + ch.explica + '</p><p>Las respuestas correctas quedaron marcadas. Lo vas a poder practicar en el repaso.</p>');
    } else {
      const title = outcome === 's2' ? '¡Lo corregiste!' : outcome === 's3' ? '¡Recuperado!' : '¡Correcto!';
      showFb('ok', '<p class="fb-title">' + title + xpChip + '</p><p>' + res.msg + '</p>' + (outcome !== 's1' ? '<p>' + ch.explica + '</p>' : ''));
    }
    const nb = checkBadges(); nb.forEach(badgeToast);
    save(); refreshSteps();
  }
  function finishHunt(res) {
    const ch = CUR.ch, m = RUN.m;
    const r = { n: res.n, s1: res.s1, s2: res.s2, s3: 0, w: res.w, intentos: res.s1 + 2 * res.s2 + 2 * res.w, pistas: 0 };
    r.xp = Math.round(res.s1 * CFG.XP.rondaJuego + res.s2 * CFG.XP.rondaJuego / 2);
    const gained = storeItem(m, ch, r);
    RUN.xp += gained; RUN.res[ch.id] = res.w > res.n / 2 ? 'w' : res.s1 === res.n ? 's1' : 's2';
    lockAndNext();
    showFb('ok', '<p class="fb-title">¡Juego terminado!' + (gained ? ' <span class="xpgain">+' + gained + ' XP</span>' : '') + '</p><p>' + ch.explica + '</p>');
    const nb = checkBadges(); nb.forEach(badgeToast);
    save(); refreshSteps();
  }
  function finishSelf(resp) {
    const ch = CUR.ch;
    S.autoeval[ch.id] = { marcados: resp.filter(Boolean).length, total: resp.length, fecha: Date.now(), mision: RUN.m.id };
    RUN.res[ch.id] = 'self';
    lockAndNext();
    showFb('ok', '<p class="fb-title">¡Autoevaluación registrada!</p><p>Marcaste ' + S.autoeval[ch.id].marcados + ' de ' + resp.length + ' criterios. Tu docente va a revisar las construcciones en la carpeta.</p>');
    save(); refreshSteps();
  }
  function next() {
    RUN.pos++;
    if (RUN.pos >= RUN.queue.length) endMission(); else renderChallenge();
  }

  /* ================= MISIÓN: final ================= */
  function endMission() {
    const m = RUN.m, i = idxOf(m), st = mStats(m), stb = stars(m), ap = approved(m);
    const b = S.bonos[m.id] || (S.bonos[m.id] = {});
    let bonus = 0;
    if (ap && !b.aprobada) { b.aprobada = true; bonus += CFG.XP.misionAprobada; }
    if (stb === 3 && !b.tres) { b.tres = true; bonus += CFG.XP.tresEstrellas; }
    RUN.xp += bonus;
    const mm = S.misiones[m.id] || (S.misiones[m.id] = { items: {}, partidas: 0 });
    mm.partidas = (mm.partidas || 0) + 1; mm.ultima = Date.now();
    const nuevos = checkBadges();
    save();
    const runIds = Object.keys(RUN.res).filter((k) => RUN.res[k] !== 'self');
    const runOk = runIds.filter((k) => RUN.res[k] !== 'w').length;
    const unlockedNow = i + 1 < MIS.length && !RUN.nextWasUnlocked && unlocked(i + 1);
    const titles = ['Misión para seguir practicando', '¡Avanzaste!', '¡Buen trabajo!', '¡Dominio sólido!'];
    const msgs = [
      'Todavía hay conceptos para revisar. Usá el repaso: las explicaciones te van a ayudar.',
      'Diste los primeros pasos. Con un poco más de práctica vas a consolidar estos contenidos.',
      'Buen desempeño, con algunos errores que ya sabés cómo corregir.',
      'Demostraste un dominio sólido de los objetivos de esta misión.'];
    const isFinalWin = m.final && ap;
    const root = screen(topbarPlay() + '<main class="endwrap"><section class="card paper endcard" id="endcard">' +
      '<div class="eyebrow" style="color:var(--violet-ink)">Misión ' + (i + 1) + ' · ' + esc(m.titulo) + '</div>' +
      '<h2 tabindex="-1" id="end-h">' + titles[stb] + '</h2>' +
      '<div class="bigstars" aria-label="' + stb + ' de 3 estrellas">' + [0, 1, 2].map((k) => F.icon('star', k < stb ? 'on' : 'off')).join('') + '</div>' +
      '<p class="endmsg">' + msgs[stb] + '</p>' +
      '<div class="stats"><div class="stat"><div class="v">' + pct(st.logro) + '</div><div class="k">Logro de la misión (mejor resultado)</div></div>' +
      '<div class="stat"><div class="v">' + runOk + ' / ' + runIds.length + '</div><div class="k">Desafíos resueltos en esta partida</div></div>' +
      '<div class="stat"><div class="v">+' + RUN.xp + '</div><div class="k">XP ganados ahora' + (bonus ? ' (incluye +' + bonus + ' de bonificación)' : '') + '</div></div>' +
      '<div class="stat"><div class="v">' + st.pistas + '</div><div class="k">Pistas usadas</div></div></div>' +
      '<p class="crit">3 estrellas: logro de ' + pct(CFG.ESTRELLAS.tres) + ' o más y hasta ' + CFG.ESTRELLAS.maxPistasParaTres + ' pista · 2 estrellas: ' + pct(CFG.ESTRELLAS.dos) + ' o más · 1 estrella: ' + pct(CFG.ESTRELLAS.una) + ' o más.</p>' +
      (nuevos.length ? '<div class="newbadges">' + nuevos.map((b2) => '<span class="badge-mini"><span class="bic">' + F.icon(b2.icono) + '</span>' + esc(b2.nombre) + '</span>').join('') + '</div>' : '') +
      (unlockedNow ? '<p><span class="unlock">' + F.icon('play') + ' ¡Nueva misión desbloqueada: ' + esc(MIS[i + 1].titulo) + '!</span></p>' : '') +
      (!ap ? '<p class="crit" style="color:#8d2116"><b>Para aprobar esta misión necesitás al menos ' + pct(CFG.UMBRAL_DESBLOQUEO) + ' de logro.</b> Repasá los desafíos pendientes y volvé a intentarlo.</p>' : '') +
      '<div class="row">' +
      '<button class="btn btn-ghost-dark" data-map>' + F.icon('map') + ' Volver al mapa</button>' +
      (needsReview(m) ? '<button class="btn btn-ghost-dark" data-review>' + F.icon('refresh') + ' Repasar errores</button>' : '') +
      (isFinalWin ? '<button class="btn btn-primary" data-final>' + F.icon('trophy') + ' Ver reconocimiento</button>' :
        (i + 1 < MIS.length && unlocked(i + 1) ? '<button class="btn btn-primary" data-next>Siguiente misión ' + F.icon('play') + '</button>' : '')) +
      '</div></section></main>');
    on(root, '[data-exit]', 'click', () => renderMap(i));
    on(root, '[data-map]', 'click', () => renderMap(i + 1 < MIS.length && unlocked(i + 1) ? i + 1 : i));
    on(root, '[data-review]', 'click', () => startRun(m, 'repaso'));
    on(root, '[data-next]', 'click', () => startRun(MIS[i + 1], 'full'));
    on(root, '[data-final]', 'click', renderFinal);
    nuevos.forEach(badgeToast);
    if (stb >= 2 || unlockedNow) confetti($('#endcard'));
    $('#end-h').focus();
  }

  /* ================= RECONOCIMIENTO FINAL ================= */
  function renderFinal() {
    S.finalVisto = true; save();
    const rep = buildReport();
    const root = screen(topbarMain() + '<main class="endwrap"><section class="card paper cert" id="cert">' +
      '<div class="seal">' + F.icon('crown') + '</div>' +
      '<div class="eyebrow" style="color:var(--violet-ink);margin-top:1rem">' + esc(CFG.NOMBRE_AVENTURA) + '</div>' +
      '<h2 tabindex="-1" id="cert-h">¡' + esc(S.alias) + ', ya sos Guardián/a de la Geometría!</h2>' +
      '<p class="endmsg">Recorriste ángulos, triángulos, el Teorema de Pitágoras, la mediatriz, los cuadriláteros, el perímetro y las áreas.</p>' +
      '<div class="stats"><div class="stat"><div class="v">' + rep.xp + '</div><div class="k">XP acumulados</div></div>' +
      '<div class="stat"><div class="v">' + rep.estrellas + ' / ' + MIS.length * 3 + '</div><div class="k">Estrellas</div></div>' +
      '<div class="stat"><div class="v">' + rep.insignias.length + '</div><div class="k">Insignias</div></div>' +
      '<div class="stat"><div class="v">' + pct(rep.pctCorrectas) + '</div><div class="k">Respuestas correctas</div></div></div>' +
      '<div class="row"><button class="btn btn-ghost-dark" data-map>' + F.icon('map') + ' Volver al mapa</button><button class="btn btn-primary" data-rep>' + F.icon('report') + ' Ver y enviar mi informe</button></div>' +
      '</section></main>');
    wireTop(root);
    on(root, '[data-map]', 'click', () => renderMap());
    on(root, '[data-rep]', 'click', () => renderReport());
    confetti($('#cert'));
    $('#cert-h').focus();
  }

  /* ================= INFORME ================= */
  function levelOf(p) {
    if (p.actividades < CFG.MIN_ACTIVIDADES_COMENTARIO) return { k: 's', t: 'Sin datos suficientes' };
    if (p.logro >= CFG.NIVELES.consolidado - EPS) return { k: 'c', t: 'Logro consolidado' };
    if (p.logro >= CFG.NIVELES.enProceso - EPS) return { k: 'p', t: 'En proceso de consolidación' };
    return { k: 'a', t: 'Requiere acompañamiento' };
  }
  function buildReport() {
    const per = [], map = {};
    let answered = 0, correct = 0, first = 0, intentos = 0;
    MIS.forEach((m) => {
      const k = m.contenido;
      if (!map[k]) { map[k] = { key: k, nombre: C.contenidos[k].nombre, misiones: [], actividades: 0, correctas: 0, primer: 0, score: 0, total: 0, fallos: [] }; per.push(map[k]); }
      const p = map[k]; p.misiones.push(m);
      m.desafios.forEach((ch) => {
        if (!graded(ch)) return;
        p.total += nOf(ch);
        const r = rec(m.id, ch.id); if (!r) return;
        p.actividades += r.n; p.correctas += r.s1 + r.s2 + r.s3; p.primer += r.s1; p.score += scoreOf(r);
        intentos += r.intentosTotales || r.intentos || 0;
        if (r.s1 < r.n) p.fallos.push({ m: m, ch: ch, r: r });
      });
    });
    per.forEach((p) => {
      answered += p.actividades; correct += p.correctas; first += p.primer;
      p.logro = p.actividades ? p.score / p.actividades : 0;
      p.nivel = levelOf(p);
      p.recomendacion = p.nivel.k === 'c' ? 'Continuar con desafíos de mayor complejidad del mismo contenido.' : p.nivel.k === 's' ? 'Completar las misiones de este contenido para obtener evidencias.' : C.contenidos[p.key].practica;
    });
    const fortalezas = per.filter((p) => p.nivel.k === 'c').map((p) => C.contenidos[p.key].fuerte);
    const mejoras = per.filter((p) => p.nivel.k === 'p' || p.nivel.k === 'a').map((p) => C.contenidos[p.key].debil);
    const sinDatos = per.filter((p) => p.nivel.k === 's').map((p) => p.nombre);
    const recomendaciones = per.filter((p) => p.nivel.k === 'p' || p.nivel.k === 'a').map((p) => ({
      nombre: p.nombre, practica: C.contenidos[p.key].practica,
      items: p.fallos.sort((a, b) => scoreOf(a.r) / a.r.n - scoreOf(b.r) / b.r.n).slice(0, 4).map((f) => 'Misión ' + (idxOf(f.m) + 1) + ' · ' + f.ch.fuente + ': ' + strip(f.ch.consigna).slice(0, 90) + (strip(f.ch.consigna).length > 90 ? '…' : '')),
      misiones: p.misiones.filter((m) => needsReview(m) && mStats(m).itemsAnswered).map((m) => m.id)
    }));
    const auto = [];
    MIS.forEach((m) => m.desafios.forEach((ch) => { if (ch.tipo === 'self') { const a = S.autoeval[ch.id]; auto.push({ mision: idxOf(m) + 1, fuente: ch.fuente, marcados: a ? a.marcados : null, total: ch.items.length }); } }));
    return {
      alias: S.alias, aventura: CFG.NOMBRE_AVENTURA, curso: CFG.CURSO,
      fecha: new Date().toLocaleString('es-AR'), fechaISO: new Date().toISOString(),
      tiempoMin: Math.round((S.tiempoMs || 0) / 60000),
      misionesCompletadas: MIS.filter((m) => mStats(m).complete).length,
      misionesAprobadas: MIS.filter(approved).length,
      nivelesDesbloqueados: MIS.filter((m, i) => unlocked(i)).length,
      xp: totalXP(), estrellas: totalStars(),
      insignias: S.insignias.map((id) => (C.insignias.find((b) => b.id === id) || {}).nombre).filter(Boolean),
      actividades: answered, correctas: correct, primerIntento: first, incorrectas: answered - correct, intentos: intentos,
      pctCorrectas: answered ? correct / answered : 0,
      porContenido: per, fortalezas: fortalezas, mejoras: mejoras, sinDatos: sinDatos, recomendaciones: recomendaciones, autoevaluaciones: auto,
      porMision: MIS.map((m, i) => { const s = mStats(m); return { n: i + 1, titulo: m.titulo, completa: s.complete, aprobada: approved(m), logro: s.logro, estrellas: stars(m), correctas: s.correct, actividades: s.answered, pistas: s.pistas }; }),
      docente: !!S.docente
    };
  }
  function renderReport(tab) {
    tab = tab || 'res';
    const R = buildReport();
    const rows = R.porContenido.map((p) => '<tr><td>' + esc(p.nombre) + '</td><td class="n">' + p.actividades + ' / ' + p.total + '</td><td class="n">' + p.correctas + '</td><td class="n">' + (p.actividades ? pct(p.logro) : '—') + '</td><td><span class="lvl ' + p.nivel.k + '">' + p.nivel.t + '</span></td><td>' + esc(p.recomendacion) + '</td></tr>').join('');
    const misRows = R.porMision.map((x) => '<tr><td>' + x.n + '. ' + esc(x.titulo) + '</td><td class="n">' + (x.actividades ? pct(x.logro) : '—') + '</td><td>' + (x.completa ? starsHTML(x.estrellas) : '<span class="lvl s">' + (x.actividades ? 'Incompleta' : 'Sin jugar') + '</span>') + '</td><td>' + (x.aprobada ? '<span class="lvl c">Aprobada</span>' : x.completa ? '<span class="lvl a">No aprobada</span>' : '') + '</td></tr>');
    const root = screen(topbarMain() + '<main class="report">' +
      '<div class="tabs" role="tablist" aria-label="Secciones del informe">' +
      [['res', 'Resumen'], ['cont', 'Desempeño por contenido'], ['mis', 'Detalle por misión'], ['fort', 'Fortalezas y recomendaciones']].map((t) => '<button class="tab" role="tab" id="tab-' + t[0] + '" aria-controls="rp-' + t[0] + '" aria-selected="' + (t[0] === tab) + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div style="min-height:0;display:grid">' +
      // A + B
      '<section class="card paper rpanel" role="tabpanel" id="rp-res" aria-labelledby="tab-res"' + (tab === 'res' ? '' : ' hidden') + '>' +
      '<div class="rhead"><div><h2>Informe de ' + esc(R.alias) + '</h2><div class="meta">' + esc(R.aventura) + ' · ' + esc(R.curso) + ' · ' + esc(R.fecha) + '</div></div>' +
      '<div class="meta" style="text-align:right">Tiempo de juego registrado en esta computadora: <b>' + R.tiempoMin + ' min</b>' + (R.docente ? '<br><b style="color:#8d2116">Modo docente activo (misiones desbloqueadas)</b>' : '') + '</div></div>' +
      '<div class="rgrid">' +
      stat(R.misionesCompletadas + ' / ' + MIS.length, 'Misiones completadas') + stat(R.misionesAprobadas, 'Misiones aprobadas') + stat(R.nivelesDesbloqueados, 'Niveles desbloqueados') + stat(R.xp + ' XP', 'Puntos de experiencia') +
      stat(pct(R.pctCorrectas), 'Respuestas correctas') + stat(R.actividades, 'Actividades respondidas') + stat(R.correctas + ' / ' + R.incorrectas, 'Correctas / incorrectas') + stat(R.intentos, 'Intentos totales') +
      stat(R.primerIntento, 'Correctas al primer intento') + stat(R.estrellas + ' / ' + MIS.length * 3, 'Estrellas') + '<div class="stat" style="grid-column:span 2"><div class="k">Insignias obtenidas</div><div style="font-weight:600;font-size:.92rem;margin-top:.2rem">' + (R.insignias.length ? R.insignias.map(esc).join(' · ') : 'Todavía ninguna') + '</div></div>' +
      '</div><p class="rnote"><b>Cómo se calcula:</b> Respuestas correctas = actividades resueltas correctamente (en cualquier intento) ÷ actividades respondidas. Los puntos de bonificación (XP) no intervienen en este porcentaje. Cada ronda del juego «Cazadores de figuras» cuenta como una actividad. Las autoevaluaciones no se califican.</p></section>' +
      // C
      '<section class="card paper rpanel" role="tabpanel" id="rp-cont" aria-labelledby="tab-cont"' + (tab === 'cont' ? '' : ' hidden') + '>' +
      '<h3 class="rsub">Desempeño por contenido</h3><table class="rt"><thead><tr><th>Contenido evaluado</th><th>Actividades realizadas</th><th>Correctas</th><th>Logro</th><th>Nivel</th><th>Recomendación de práctica</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="rnote"><b>Logro</b> = (correctas al 1.er intento + 0,5 × correctas con reintento + 0,75 × recuperadas en repaso) ÷ actividades realizadas. Niveles: consolidado desde ' + pct(CFG.NIVELES.consolidado) + ', en proceso desde ' + pct(CFG.NIVELES.enProceso) + '. Con menos de ' + CFG.MIN_ACTIVIDADES_COMENTARIO + ' actividades: «Sin datos suficientes». Estos indicadores son <b>evidencias parciales</b> del desempeño en esta experiencia, no un diagnóstico definitivo.</p>' +
      '</section><section class="card paper rpanel" role="tabpanel" id="rp-mis" aria-labelledby="tab-mis"' + (tab === 'mis' ? '' : ' hidden') + '><h3 class="rsub">Detalle por misión</h3><div class="cols2">' + [misRows.slice(0, 8), misRows.slice(8)].map((part) => '<table class="rt"><thead><tr><th>Misión</th><th>Logro</th><th>Estrellas</th><th>Estado</th></tr></thead><tbody>' + part.join('') + '</tbody></table>').join('') + '</div></section>' +
      // D + E
      '<section class="card paper rpanel" role="tabpanel" id="rp-fort" aria-labelledby="tab-fort"' + (tab === 'fort' ? '' : ' hidden') + '>' +
      '<div class="cols2"><div><h3 class="rsub">Fortalezas</h3>' + (R.fortalezas.length ? '<ul class="rlist">' + R.fortalezas.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '<p class="rnote">Todavía no hay contenidos con logro consolidado y datos suficientes.</p>') +
      '<h3 class="rsub" style="margin-top:.8rem">Aspectos para mejorar</h3>' + (R.mejoras.length ? '<ul class="rlist">' + R.mejoras.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '<p class="rnote">No se registran aspectos para mejorar con datos suficientes.</p>') +
      (R.sinDatos.length ? '<p class="rnote"><b>Sin datos suficientes:</b> ' + R.sinDatos.map(esc).join('; ') + '.</p>' : '') +
      '<h3 class="rsub" style="margin-top:.8rem">Autoevaluación de construcciones</h3><ul class="rlist">' + R.autoevaluaciones.map((a) => '<li>Misión ' + a.mision + ' (' + esc(a.fuente) + '): ' + (a.marcados == null ? 'sin registrar' : a.marcados + ' de ' + a.total + ' criterios marcados') + '</li>').join('') + '</ul></div>' +
      '<div><h3 class="rsub">Recomendaciones personalizadas</h3>' + (R.recomendaciones.length ? R.recomendaciones.map((r) => '<div style="margin-bottom:.7rem"><b>' + esc(r.nombre) + '</b><p style="margin:.2rem 0">' + esc(r.practica) + '</p>' + (r.items.length ? '<ul class="rlist">' + r.items.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') + '</div>').join('') :
        '<p class="rnote">' + (R.actividades ? '¡Sin recomendaciones de recuperación por ahora! Se puede seguir con las misiones pendientes.' : 'Todavía no hay actividades registradas.') + '</p>') +
      '</div></div></section></div>' +
      '<div class="rbar"><button class="btn btn-primary" data-send>' + F.icon('send') + ' Enviar informe</button>' +
      '<button class="btn btn-ghost" data-print>' + F.icon('print') + ' Imprimir / PDF</button>' +
      '<button class="btn btn-ghost" data-recover' + (MIS.some((m) => mStats(m).itemsAnswered && needsReview(m)) ? '' : ' disabled') + '>' + F.icon('refresh') + ' Repetir actividades de recuperación</button>' +
      '<span class="sendst" id="sendst" role="status">' + lastSendText() + '</span><div class="spacer"></div>' +
      '<button class="btn btn-ghost" data-map>' + F.icon('map') + ' Volver al mapa</button></div></main>');
    wireTop(root);
    on(root, '[data-tab]', 'click', (e) => {
      const t = e.currentTarget.getAttribute('data-tab');
      root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b === e.currentTarget));
      root.querySelectorAll('.rpanel').forEach((p) => { p.hidden = p.id !== 'rp-' + t; });
    });
    on(root, '[data-map]', 'click', () => renderMap());
    on(root, '[data-print]', 'click', () => window.print());
    on(root, '[data-send]', 'click', (e) => sendReport(R, e.currentTarget));
    on(root, '[data-recover]', 'click', () => {
      const cand = MIS.filter((m) => mStats(m).itemsAnswered && needsReview(m)).sort((a, b) => mStats(a).logro - mStats(b).logro)[0];
      if (cand) startRun(cand, 'repaso');
    });
  }
  function stat(v, k) { return '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>'; }
  function lastSendText() {
    const l = S.envios && S.envios[S.envios.length - 1];
    return l ? 'Último envío: ' + new Date(l.t).toLocaleString('es-AR') + ' (' + l.estado + ')' : '';
  }
  function configured() { return CFG.APPS_SCRIPT_URL && /^https:\/\/script\.google\.com\//.test(CFG.APPS_SCRIPT_URL) && CFG.GOOGLE_SHEET_ID && !/PEGAR/.test(CFG.GOOGLE_SHEET_ID); }
  function payloadOf(R) {
    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    return {
      clave: CFG.CLAVE_ENVIO, sheetId: CFG.GOOGLE_SHEET_ID, envioId: id,
      alias: R.alias, aventura: R.aventura, curso: R.curso, fecha: R.fechaISO, tiempoMin: R.tiempoMin,
      misionesCompletadas: R.misionesCompletadas, misionesAprobadas: R.misionesAprobadas, nivelesDesbloqueados: R.nivelesDesbloqueados,
      xp: R.xp, estrellas: R.estrellas, insignias: R.insignias.join(', '),
      actividades: R.actividades, correctas: R.correctas, incorrectas: R.incorrectas, primerIntento: R.primerIntento, intentos: R.intentos,
      pctCorrectas: Math.round(R.pctCorrectas * 1000) / 10,
      fortalezas: R.fortalezas.join(' | '), mejoras: R.mejoras.join(' | '), sinDatos: R.sinDatos.join(' | '),
      recomendaciones: R.recomendaciones.map((r) => r.nombre + ': ' + r.practica).join(' | '),
      autoevaluaciones: R.autoevaluaciones.map((a) => 'M' + a.mision + ': ' + (a.marcados == null ? '-' : a.marcados + '/' + a.total)).join(' | '),
      modoDocente: R.docente,
      porContenido: R.porContenido.map((p) => ({ contenido: p.nombre, actividades: p.actividades, correctas: p.correctas, logro: Math.round(p.logro * 1000) / 10, nivel: p.nivel.t, recomendacion: p.recomendacion })),
      porMision: R.porMision.map((x) => ({ mision: x.n + '. ' + x.titulo, completa: x.completa, aprobada: x.aprobada, logro: Math.round(x.logro * 1000) / 10, estrellas: x.estrellas, correctas: x.correctas, actividades: x.actividades, pistas: x.pistas }))
    };
  }
  function sendReport(R, btn) {
    const st = $('#sendst');
    function done(ok, text) {
      st.className = 'sendst ' + (ok ? 'ok' : 'bad'); st.textContent = text; btn.disabled = false;
      if (ok) { S.envios.push({ t: Date.now(), estado: ok === 'unconfirmed' ? 'sin confirmación' : 'recibido' }); save(); }
    }
    if (!configured()) { st.className = 'sendst bad'; st.textContent = 'La docente todavía no configuró la planilla (archivo config.js). Podés imprimir el informe o guardarlo en PDF.'; return; }
    if (!navigator.onLine) { st.className = 'sendst bad'; st.textContent = 'No hay conexión a internet. Conectate y volvé a intentar.'; return; }
    btn.disabled = true; st.className = 'sendst'; st.textContent = 'Enviando…';
    const body = JSON.stringify(payloadOf(R));
    fetch(CFG.APPS_SCRIPT_URL, { method: 'POST', body: body, redirect: 'follow' })
      .then((r) => r.json())
      .then((j) => { if (j && j.ok) done(true, '¡Informe enviado! La planilla confirmó la recepción.'); else done(false, 'La planilla respondió con un error: ' + ((j && j.error) || 'desconocido') + '. Avisale a tu docente.'); })
      .catch(() => {
        fetch(CFG.APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: body })
          .then(() => done('unconfirmed', 'Informe enviado. (El navegador no pudo leer la confirmación: pedile a tu docente que verifique la planilla.)'))
          .catch(() => done(false, 'No se pudo enviar. Revisá la conexión e intentá otra vez, o imprimí el informe.'));
      });
  }

  /* ================= MODALES ================= */
  let lastFocus = null;
  function openModal(title, body, buttons, wide) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"' + (wide ? '' : ' style="width:min(36rem,100%)"') + '>' +
      '<div class="modal-h"><h2 id="mh">' + title + '</h2><button class="ib" data-close aria-label="Cerrar">' + F.icon('x') + '</button></div>' +
      '<div class="modal-b">' + body + '</div>' +
      (buttons && buttons.length ? '<div class="modal-f">' + buttons.map((b, i) => '<button class="btn ' + (b.cls || 'btn-ghost-dark') + '" data-mb="' + i + '">' + esc(b.t) + '</button>').join('') + '</div>' : '') + '</div></div>';
    const back = modalRoot.firstChild;
    back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
    on(back, '[data-close]', 'click', closeModal);
    on(back, '[data-mb]', 'click', (e) => { const b = buttons[+e.currentTarget.getAttribute('data-mb')]; closeModal(); if (b.fn) b.fn(); });
    const f = back.querySelector('.modal-f .btn:last-child') || back.querySelector('[data-close]'); f.focus();
    return back;
  }
  function closeModal() { modalRoot.innerHTML = ''; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalRoot.firstChild) closeModal();
    if (e.key === 'Tab' && modalRoot.firstChild) {
      const f = modalRoot.querySelectorAll('button, input, select, summary, a[href]'); if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  function openBadges() {
    const html = '<div class="badges">' + C.insignias.map((b) => {
      const onB = S.insignias.indexOf(b.id) >= 0;
      return '<div class="badge ' + (onB ? 'on' : '') + '"><span class="bic">' + F.icon(b.icono) + '</span><div><div class="bn">' + esc(b.nombre) + '</div><div class="bd">' + (onB ? '✓ Obtenida · ' : 'Por obtener · ') + esc(b.desc) + '</div></div></div>';
    }).join('') + '</div><p class="rnote">Estrellas: ' + totalStars() + ' de ' + MIS.length * 3 + ' · Respuestas corregidas después de la retroalimentación: ' + (S.corregidas || 0) + '</p>';
    openModal('Insignias y logros', html, [{ t: 'Cerrar', cls: 'btn-primary' }], true);
  }

  function openHowto() {
    const X = CFG.XP;
    const body = '<div class="howto">' +
      '<section><h3>' + F.icon('map') + ' Cómo avanzar</h3><ul><li>Elegí una misión disponible en el mapa.</li><li>Cada misión empieza con una explicación breve y un ejemplo.</li><li>La siguiente misión se desbloquea cuando lográs al menos <b>' + pct(CFG.UMBRAL_DESBLOQUEO) + '</b> de logro.</li><li>El desafío final necesita todas las misiones aprobadas.</li></ul></section>' +
      '<section><h3>' + F.icon('star') + ' Puntos (XP) y estrellas</h3><ul><li>Correcta al primer intento: <b>' + X.primerIntento + ' XP</b>.</li><li>Correcta después de corregir: <b>' + X.conReintento + ' XP</b>.</li><li>Recuperada en un repaso: <b>' + X.recuperada + ' XP</b>.</li><li>Usar una pista descuenta ' + X.descuentoPista + ' XP (mínimo ' + X.minimoPorAcierto + ').</li><li>Aprobar una misión: <b>+' + X.misionAprobada + ' XP</b>; 3 estrellas: <b>+' + X.tresEstrellas + ' XP</b> (una sola vez).</li><li>Repetir no suma XP otra vez: solo cuenta si mejorás.</li></ul></section>' +
      '<section><h3>' + F.icon('bulb') + ' Errores y ayudas</h3><ul><li>Tenés <b>' + CFG.MAX_INTENTOS + ' intentos</b> por desafío.</li><li>Después del 1.er error recibís una explicación; después del 2.º, una pista; después del 3.º, la solución.</li><li>Equivocarse no resta puntos: ¡corregir también suma!</li><li>Con «Repasar errores» practicás lo pendiente.</li></ul></section>' +
      '<section><h3>' + F.icon('trophy') + ' Estrellas por misión</h3><ul><li>★★★ logro de ' + pct(CFG.ESTRELLAS.tres) + ' o más, con ' + CFG.ESTRELLAS.maxPistasParaTres + ' pista como máximo.</li><li>★★ ' + pct(CFG.ESTRELLAS.dos) + ' o más.</li><li>★ ' + pct(CFG.ESTRELLAS.una) + ' o más.</li><li>Logro: 1 punto por acierto al primer intento, ½ con reintento, ¾ recuperado.</li></ul></section>' +
      '<section><h3>' + F.icon('grid') + ' Teclado y panel táctil</h3><ul><li><b>Tab</b> para moverte entre botones; <b>Enter</b> o <b>Espacio</b> para elegir.</li><li>En las opciones y la cuadrícula podés usar las <b>flechas</b>.</li><li>En los números, <b>Enter</b> comprueba. Usá coma decimal: 6,5.</li></ul></section>' +
      '<section><h3>' + F.icon('report') + ' Tu progreso</h3><ul><li>Se guarda en <b>esta computadora y este navegador</b> (almacenamiento local).</li><li>No pasa a otra Chromebook ni a otra cuenta, y se pierde si se borran los datos del navegador.</li><li>Al final, enviá tu informe a la docente.</li></ul>' +
      '<label class="toggle"><input type="checkbox" id="anim-t"' + (animOn() ? ' checked' : '') + '> Animaciones</label></section></div>' +
      '<details class="teacher"><summary>Área docente</summary><p style="font-size:.88rem">Con la clave docente se desbloquean todas las misiones en este navegador para revisarlas (queda indicado en el informe).</p>' +
      '<div class="row"><input id="tkey" type="password" aria-label="Clave docente" placeholder="Clave"><button class="btn btn-small btn-ghost-dark" id="tunlock">' + (S && S.docente ? 'Volver a bloquear' : 'Desbloquear todo') + '</button><span id="tmsg" style="font-size:.85rem"></span></div>' +
      '<p style="font-size:.85rem;margin-top:.6rem"><b>Pendientes de revisión</b> (actividades de la planificación adaptadas o no incluidas):</p><ul>' + C.pendientes.map((p) => '<li>' + p + '</li>').join('') + '</ul></details>';
    const back = openModal('¿Cómo se juega?', body, [{ t: '¡Entendido!', cls: 'btn-primary' }], true);
    const at = back.querySelector('#anim-t');
    at.addEventListener('change', () => { if (S) { S.anim = at.checked; save(); } applyAnim(); });
    if (!S) at.disabled = true;
    back.querySelector('#tunlock').addEventListener('click', () => {
      const msg = back.querySelector('#tmsg');
      if (!S) { msg.textContent = 'Primero ingresá un nombre en la pantalla de inicio.'; return; }
      if (back.querySelector('#tkey').value !== CFG.CLAVE_DOCENTE) { msg.textContent = 'Clave incorrecta.'; return; }
      S.docente = !S.docente; save(); closeModal();
      if (!RUN) renderMap();
      toast(S.docente ? 'Modo docente: todas las misiones desbloqueadas.' : 'Modo docente desactivado.');
    });
  }

  /* ================= inicio ================= */
  S = null;
  renderWelcome();

  // Ganchos para pruebas automáticas (solo con ?test=1)
  if (/[?&]test=1/.test(location.search)) {
    window.GG = {
      get S() { return S; }, MIS: MIS, E: E, buildReport: buildReport, mStats: mStats, stars: stars, approved: approved, unlocked: unlocked, totalXP: totalXP,
      login: (alias) => { S = fresh(alias || 'Prueba'); save(); renderMap(0); },
      open: (mi, ci) => { RUN = { m: MIS[mi], mode: 'full', queue: [ci], pos: 0, xp: 0, res: {}, nextWasUnlocked: true }; renderChallenge(); },
      startRun: (mi, mode) => startRun(MIS[mi], mode || 'full'), renderReport: renderReport, renderMap: renderMap, renderFinal: renderFinal,
      get CUR() { return CUR; }, check: () => check()
    };
  }
})();
