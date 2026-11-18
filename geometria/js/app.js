/* =========================================================
   app.js — MODO EVALUACIÓN
   - Desafíos y opciones en orden aleatorio.
   - Una sola respuesta por desafío, sin indicar si es correcta.
   - Los resultados solo los ve la docente (informe docente y Google Sheets).
   ========================================================= */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG, C = window.CONTENIDOS, E = window.Engine, F = window.F;
  const MIS = C.misiones;
  const KEY = 'guardianes7mo_eval_v2';
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  let storageOK = true, S = null, RUN = null, CUR = null;

  /* ================= almacenamiento ================= */
  function load() { try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; } catch (e) { storageOK = false; return null; } }
  function save() { if (!S) return; try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; } catch (e) { storageOK = false; } }
  function fresh(alias) { return { v: 2, alias: alias, creado: Date.now(), tiempoMs: 0, misiones: {}, insignias: [], envios: [], docente: false, anim: true }; }
  function mstate(m) { return S.misiones[m.id] || (S.misiones[m.id] = { orden: null, resp: {}, completa: false }); }

  /* ================= tiempo ================= */
  let lastTick = Date.now(), wasVisible = document.visibilityState === 'visible';
  function tick() {
    const now = Date.now();
    if (S && wasVisible) { const d = now - lastTick; if (d > 0 && d < 60000) S.tiempoMs += d; }
    lastTick = now; wasVisible = document.visibilityState === 'visible'; if (S) save();
  }
  setInterval(tick, 10000); document.addEventListener('visibilitychange', tick); window.addEventListener('pagehide', tick);

  /* ================= utilidades ================= */
  const $ = (s, r) => (r || document).querySelector(s);
  const pct = (x) => Math.round(x * 100) + ' %';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const strip = (s) => String(s || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const byId = (id) => MIS.find((m) => m.id === id);
  const idxOf = (m) => MIS.indexOf(m);
  const EPS = 1e-9;
  function on(root, sel, ev, fn) { root.querySelectorAll(sel).forEach((n) => n.addEventListener(ev, fn)); }
  function screen(html) {
    app.innerHTML = '<div class="screen">' + (storageOK ? '' : '<div class="banner">Este navegador no permite guardar el progreso: si cerrás la pestaña, se perderá lo realizado.</div>') + html + '</div>';
    window.scrollTo(0, 0); return app.firstChild;
  }
  function brandMark() {
    return '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l14 5v11c0 9-6 15-14 18C12 34 6 28 6 19V8z" fill="#142545" stroke="#3fd6c6" stroke-width="2.4"/><path d="M13 27l7-14 7 14z" fill="none" stroke="#ffbf3c" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 27h14" stroke="#ffbf3c" stroke-width="2.4"/></svg>';
  }
  function toast(html) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 4500); }
  const animOn = () => (S ? S.anim !== false : true);
  function applyAnim() { document.body.classList.toggle('no-anim', !animOn()); }
  function confetti(host) {
    if (!animOn() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    const cols = ['#ffbf3c', '#3fd6c6', '#ff6d5e', '#9b8cff', '#8fd14f'];
    for (let i = 0; i < 46; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length]; p.style.animationDelay = Math.random() * 0.6 + 's'; c.appendChild(p); }
    host.appendChild(c); setTimeout(() => c.remove(), 2800);
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ================= mezcla de opciones ================= */
  /** copia del desafío con opciones/elementos/pasos en orden aleatorio (la validación usa esta copia) */
  function shuffled(ch) {
    const c = Object.assign({}, ch);
    if (!CFG.MEZCLAR_OPCIONES) { if (c.tipo === 'order') c.inicio = ch.inicio; return c; }
    if (c.tipo === 'choice' || c.tipo === 'multi') c.ops = shuffle(ch.ops);
    if (c.tipo === 'classify') c.items = shuffle(ch.items);
    if (c.tipo === 'select') {
      if (ch.ops) c.ops = shuffle(ch.ops);
      c.filas = ch.filas.map((r) => r.ops ? Object.assign({}, r, { ops: Array.isArray(r.ops[0]) ? r.ops.map(shuffle) : shuffle(r.ops) }) : r);
    }
    if (c.tipo === 'order') {
      const n = ch.pasos.length; let p;
      do { p = shuffle(ch.pasos.map((_, i) => i)); } while (p.every((v, i) => v === i) && n > 1);
      c.inicio = p;
    }
    return c;
  }
  /** texto legible de una respuesta (para el informe docente) */
  function describe(ch, r) {
    const acc = (a) => (Array.isArray(a) ? a : [a]);
    switch (ch.tipo) {
      case 'choice': return r == null ? '—' : strip(ch.ops[r].t);
      case 'multi': return (r || []).map((i) => strip(ch.ops[i].t)).join(' · ') || '—';
      case 'number': return ch.campos.map((f, i) => strip(f.et) + ': ' + (r[i].v || '—') + (r[i].u ? ' ' + r[i].u : f.suf && f.suf.length < 4 ? f.suf : '')).join(' · ');
      case 'classify': return ch.items.map((it, i) => strip(it.t) + ' → ' + (r[i] || '—')).join(' · ');
      case 'select': return ch.filas.map((row, i) => strip(row.t).replace(/→?\s*_{3}/g, '').replace(/:\s*$/, '').trim().slice(0, 50) + ': ' + (r[i] || []).join(' / ')).join(' · ');
      case 'order': return (r || []).map((i) => i + 1).join(' – ') + ' (números de paso en el orden correcto)';
      default: return '';
    }
  }
  function correctText(ch) {
    if (ch.tipo === 'select') return ch.filas.map((row) => row.ans.map((a) => (Array.isArray(a) ? a.join(' o ') : a)).join(' / ')).join(' · ');
    if (ch.tipo === 'order') return '1 – 2 – ' + ch.pasos.slice(2).map((_, i) => i + 3).join(' – ');
    if (ch.tipo === 'number') return ch.campos.map((f) => strip(f.et) + ': ' + E.fmt(f.ans) + (f.unidad ? ' ' + f.unidad : f.suf && f.suf.length < 4 ? f.suf : '')).join(' · ');
    return describe(ch, E.correct(ch));
  }

  /* ================= estado de misiones ================= */
  const answered = (m) => Object.keys(mstate(m).resp).length;
  const complete = (m) => !!(S.misiones[m.id] && S.misiones[m.id].completa);
  function unlocked(i) {
    if (S.docente || i === 0) return true;
    if (MIS[i].final) return MIS.slice(0, i).every(complete);
    return complete(MIS[i - 1]);
  }
  function stateOf(i) { const m = MIS[i]; if (!unlocked(i)) return 'locked'; if (complete(m)) return 'done'; return answered(m) ? 'prog' : 'avail'; }
  function totalXP() {
    let x = 0; MIS.forEach((m) => { const s = S.misiones[m.id]; if (s) { x += Object.keys(s.resp).length * CFG.XP.porRespuesta; if (s.completa) x += CFG.XP.misionCompleta; } }); return x;
  }
  const totalAnswered = () => MIS.reduce((a, m) => a + (S.misiones[m.id] ? Object.keys(S.misiones[m.id].resp).length : 0), 0);
  const totalItems = MIS.reduce((a, m) => a + m.desafios.length, 0);
  function checkBadges() {
    const n = [];
    C.insignias.forEach((b) => { if (S.insignias.indexOf(b.id) < 0 && b.regla.completadas.every((id) => complete(byId(id)))) { S.insignias.push(b.id); n.push(b); } });
    return n;
  }

  /* ================= BIENVENIDA ================= */
  function welcomeArt() {
    return '<svg viewBox="0 0 520 460" role="img" aria-label="Composición de figuras geométricas."><defs><linearGradient id="wg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fd6c6" stop-opacity=".5"/><stop offset="1" stop-color="#9b8cff" stop-opacity=".15"/></linearGradient><linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbf3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff6d5e" stop-opacity=".2"/></linearGradient></defs>' +
      '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="260" cy="230" r="205" stroke="rgba(120,170,255,.22)" stroke-width="1.5" stroke-dasharray="3 9"/><circle cx="260" cy="230" r="150" stroke="rgba(120,170,255,.18)" stroke-width="1.5"/>' +
      '<path d="M260 40 L430 230 L260 420 L90 230 Z" fill="url(#wg1)" stroke="#3fd6c6" stroke-width="3"/><path d="M260 40V420M90 230H430" stroke="#3fd6c6" stroke-width="1.5" stroke-dasharray="6 7"/>' +
      '<path d="M200 300 L200 180 L360 300 Z" fill="url(#wg2)" stroke="#ffbf3c" stroke-width="3"/><path d="M200 288h12v12" stroke="#ffbf3c" stroke-width="2"/>' +
      '<path d="M200 180 h-120 v120 h120" stroke="rgba(255,109,94,.9)" stroke-width="2.4"/><path d="M200 300 L200 420 L360 420 L360 300" stroke="rgba(155,140,255,.9)" stroke-width="2.4"/><path d="M200 180 L320 20 L480 140 L360 300" stroke="rgba(143,209,79,.85)" stroke-width="2.4"/>' +
      '<g transform="translate(408 60) rotate(18)"><circle cx="0" cy="0" r="8" stroke="#eef3ff" stroke-width="2.4"/><path d="M-3 7 L-26 92 M3 7 L26 92 M-16 52 H16" stroke="#eef3ff" stroke-width="2.6"/></g>' +
      '<text x="250" y="246" fill="#eef3ff" font-family="Space Grotesk, sans-serif" font-size="22" font-weight="700">a²+b²=c²</text><g fill="#ffbf3c" stroke="none"><circle cx="260" cy="40" r="5"/><circle cx="430" cy="230" r="5"/><circle cx="260" cy="420" r="5"/><circle cx="90" cy="230" r="5"/></g></g></svg>';
  }
  function renderWelcome() {
    const s = load();
    const root = screen('<div class="topbar"><div class="brand">' + brandMark() + '<span>Guardianes de la Geometría</span></div><div class="spacer"></div>' +
      '<button class="btn btn-ghost btn-small" data-howto>' + F.icon('help') + ' ¿Cómo funciona?</button></div>' +
      '<main class="welcome"><div><div class="eyebrow">Evaluación de Matemática · ' + esc(CFG.CURSO) + '</div>' +
      '<h1>La Liga de los <em>Guardianes</em> de la Geometría</h1>' +
      '<p class="lead">' + MIS.length + ' misiones con ' + totalItems + ' desafíos sobre ángulos, triángulos, Pitágoras, cuadriláteros y áreas. Respondé con atención: <b>cada desafío se responde una sola vez</b>.</p>' +
      (s ? '<div class="continue-card"><b>¡Hola de nuevo, ' + esc(s.alias) + '!</b><p>Tus respuestas están guardadas en esta computadora (' + MIS.filter((m) => s.misiones[m.id] && s.misiones[m.id].completa).length + ' de ' + MIS.length + ' misiones completas).</p><div class="row"><button class="btn btn-primary btn-big" data-continue>' + F.icon('play') + ' Continuar</button><button class="btn btn-ghost" data-other>Soy otro estudiante</button></div></div>' :
        '<div class="start"><div class="field"><label for="alias">Tu nombre y apellido</label><input id="alias" maxlength="40" autocomplete="off" aria-describedby="alias-help alias-err"><span class="help" id="alias-help">Así te va a reconocer tu docente. No hace falta correo ni contraseña.</span><span class="err" id="alias-err" role="alert"></span></div>' +
        '<div class="row"><button class="btn btn-primary btn-big" type="button" data-start-eval>' + F.icon('play') + ' Comenzar</button><button class="btn btn-ghost btn-big" type="button" data-howto>' + F.icon('help') + ' ¿Cómo funciona?</button></div></div>') +
      '<p class="note">Tus respuestas se guardan solo en esta computadora y se envían a tu docente al terminar.</p></div><div class="welcome-art">' + welcomeArt() + '</div></main>');
    on(root, '[data-howto]', 'click', () => openHowto());
    const startBtn = root.querySelector('[data-start-eval]');
    if (startBtn) {
      // Sin <form>: algunos visores (vista previa, iframes) bloquean el envío de formularios.
      const begin = () => {
        const v = $('#alias').value.trim().replace(/\s+/g, ' ');
        if (v.length < 2) { $('#alias-err').textContent = 'Escribí tu nombre (al menos 2 letras).'; $('#alias').focus(); return; }
        if (/@/.test(v)) { $('#alias-err').textContent = 'No escribas tu correo: alcanza con tu nombre.'; $('#alias').focus(); return; }
        S = fresh(v); save(); applyAnim(); renderMap(0);
      };
      startBtn.addEventListener('click', begin);
      $('#alias').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); begin(); } });
      setTimeout(() => { try { $('#alias') && $('#alias').focus(); } catch (e) { } }, 50);
    }
    on(root, '[data-continue]', 'click', () => { S = s; applyAnim(); renderMap(); });
    on(root, '[data-other]', 'click', () => askChangeStudent(s));
  }
  /** el resultado ya quedó registrado en la planilla (se envía una sola vez) */
  function alreadySent(st) { return ((st || S).envios || []).some((e) => e.estado === 'recibido' || e.estado === 'sin confirmación'); }
  const sentAfterLastAnswer = alreadySent;
  function askChangeStudent(st) {
    const ok = sentAfterLastAnswer(st);
    const body = '<p>Se van a borrar de esta computadora las respuestas de <b>' + esc(st.alias) + '</b>.</p>' +
      (ok ? '<p>Sus respuestas ya fueron enviadas a la docente.</p>' : '<p><b>Sus respuestas todavía no fueron enviadas.</b> Para borrarlas hace falta la clave docente.</p><div class="row"><input id="ck" type="password" aria-label="Clave docente" placeholder="Clave docente" style="height:2.4rem;border-radius:8px;border:2px solid #c3baa6;padding:0 .6rem"><span id="ckm" style="font-size:.85rem;color:#8d2116"></span></div>');
    const back = openModal('Cambiar de estudiante', body, [{ t: 'Cancelar', cls: 'btn-ghost-dark' }, { t: 'Borrar y empezar', cls: 'btn-primary', keep: true, fn: () => {
      if (!ok && $('#ck').value !== CFG.CLAVE_DOCENTE) { $('#ckm').textContent = 'Clave incorrecta.'; return false; }
      try { localStorage.removeItem(KEY); } catch (e) { } S = null; renderWelcome(); return true;
    } }]);
    return back;
  }

  /* ================= MAPA ================= */
  const POS = [[12, 26], [36, 26], [60, 26], [84, 26], [84, 72], [60, 72], [36, 72], [12, 72]];
  function topbarMain() {
    return '<div class="topbar"><div class="brand">' + brandMark() + '<span>Guardianes de la Geometría</span></div>' +
      '<span class="chip">Estudiante: <b>' + esc(S.alias) + '</b></span><div class="spacer"></div>' +
      '<span class="chip">' + F.icon('map') + ' ' + MIS.filter(complete).length + ' / ' + MIS.length + ' misiones</span>' +
      '<span class="chip chip-amber xp">' + totalXP() + ' XP</span>' +
      '<button class="btn btn-ghost btn-small" data-badges>' + F.icon('medal') + ' Insignias ' + S.insignias.length + '/' + C.insignias.length + '</button>' +
      '<button class="btn btn-ghost btn-small" data-report>' + F.icon('report') + ' Mi progreso</button>' +
      '<button class="btn btn-ghost btn-small" data-howto aria-label="¿Cómo funciona?">' + F.icon('help') + '</button></div>';
  }
  function wireTop(root) {
    on(root, '[data-badges]', 'click', openBadges);
    on(root, '[data-report]', 'click', () => renderProgress());
    on(root, '[data-howto]', 'click', () => openHowto());
  }
  function renderMap(sel) {
    RUN = null; CUR = null;
    if (MIS.every(complete) && !alreadySent() && configured() && navigator.onLine) sendReport();
    if (sel == null) { sel = MIS.findIndex((m, i) => unlocked(i) && !complete(m)); if (sel < 0) sel = MIS.length - 1; }
    let path = '', done = '';
    POS.forEach((p, i) => { path += (i ? 'L' : 'M') + p[0] + ' ' + p[1]; });
    for (let i = 1; i < MIS.length; i++) if (complete(MIS[i - 1])) done += 'M' + POS[i - 1][0] + ' ' + POS[i - 1][1] + 'L' + POS[i][0] + ' ' + POS[i][1];
    const lbl = { locked: 'Bloqueada', avail: 'Disponible', prog: 'En curso', done: 'Completada' };
    const nodes = MIS.map((m, i) => {
      const st = stateOf(i);
      return '<button class="node ' + (st === 'prog' ? 'avail' : st) + (m.final ? ' final' : '') + (i === sel ? ' sel' : '') + '" style="left:' + POS[i][0] + '%;top:' + POS[i][1] + '%" data-i="' + i + '" aria-pressed="' + (i === sel) + '" aria-label="' + esc('Misión ' + (i + 1) + ': ' + m.titulo + '. ' + lbl[st]) + '">' +
        F.icon(m.icono) + '<span class="num">' + (m.final ? 'FINAL' : i + 1) + '</span>' + (st === 'locked' ? '<span class="lock">' + F.icon('lock') + '</span>' : '') +
        (st === 'done' ? '<span class="node-done" aria-hidden="true">' + F.icon('check') + '</span>' : '') + '</button>' +
        '<span class="zone" style="left:' + POS[i][0] + '%;top:' + (POS[i][1] + 11) + '%">' + esc(m.titulo) + '</span>';
    }).join('');
    const root = screen(topbarMain() + '<main class="mapwrap"><div class="map" role="group" aria-label="Mapa de misiones">' +
      '<svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="map-path" d="' + path + '" vector-effect="non-scaling-stroke"/><path class="map-path-done" d="' + done + '" vector-effect="non-scaling-stroke"/></svg>' +
      nodes + '</div><aside class="side card paper" id="side" aria-live="polite"></aside></main>');
    wireTop(root);
    on(root, '.node', 'click', (e) => {
      const i = +e.currentTarget.getAttribute('data-i');
      root.querySelectorAll('.node').forEach((n) => { n.classList.toggle('sel', n === e.currentTarget); n.setAttribute('aria-pressed', n === e.currentTarget); });
      side(i);
    });
    side(sel);
  }
  function side(i) {
    const m = MIS[i], st = stateOf(i), n = answered(m), el = $('#side'), b = C.insignias.find((x) => x.id === m.id);
    const stTxt = { locked: F.icon('lock') + ' Bloqueada', avail: F.icon('play') + ' Disponible', prog: F.icon('play') + ' En curso', done: F.icon('check') + ' Completada' }[st];
    el.innerHTML = '<div class="kicker">' + F.icon(m.icono) + ' Misión ' + (i + 1) + '</div><h2>' + esc(m.titulo) + '</h2><p class="desc">' + esc(m.descripcion) + '</p>' +
      '<span class="status ' + (st === 'prog' ? 'avail' : st) + '">' + stTxt + '</span>' +
      '<dl class="kv"><dt>Desafíos</dt><dd>' + m.desafios.length + '</dd><dt>Respondidos</dt><dd>' + n + ' de ' + m.desafios.length + '</dd>' +
      '<dt>Recompensa</dt><dd>' + (m.desafios.length * CFG.XP.porRespuesta + CFG.XP.misionCompleta) + ' XP' + (b ? ' · insignia «' + esc(b.nombre) + '»' : '') + '</dd></dl>' +
      (st === 'locked' ? '<p class="lockmsg">' + (m.final ? 'Se habilita cuando completes todas las misiones anteriores.' : 'Se habilita cuando completes la misión ' + i + ' («' + esc(MIS[i - 1].titulo) + '»).') + '</p>' : '') +
      (st === 'done' ? '<p class="lockmsg">Ya respondiste todos los desafíos de esta misión. Tus respuestas quedaron registradas.</p>' : '') +
      '<div class="actions-col">' + (st === 'avail' || st === 'prog' ? '<button class="btn btn-primary btn-big" data-play>' + F.icon('play') + (n ? ' Continuar misión' : ' Comenzar misión') + '</button>' : '') + '</div>';
    on(el, '[data-play]', 'click', () => startRun(m));
  }

  /* ================= MISIÓN ================= */
  function startRun(m) {
    const ms = mstate(m);
    if (!ms.orden || ms.orden.length !== m.desafios.length || ms.orden.some((id) => !m.desafios.find((c) => c.id === id))) {
      ms.orden = CFG.MEZCLAR_DESAFIOS ? shuffle(m.desafios.map((c) => c.id)) : m.desafios.map((c) => c.id); save();
    }
    RUN = { m: m, gained: 0 };
    if (answered(m)) renderChallenge(); else renderIntro();
  }
  function pending(m) { const ms = mstate(m); return ms.orden.filter((id) => !ms.resp[id]); }
  function topbarPlay() {
    const m = RUN.m, ms = mstate(m), cur = CUR && CUR.ch.id;
    const steps = ms.orden.map((id) => '<span class="step ' + (id === cur ? 'cur' : ms.resp[id] ? 'done' : '') + '"></span>').join('');
    return '<div class="topbar"><button class="btn btn-ghost btn-small" data-exit>' + F.icon('back') + ' Mapa</button>' +
      '<div class="tb-title">' + F.icon(m.icono) + '<span>Misión ' + (idxOf(m) + 1) + ' · ' + esc(m.titulo) + '</span></div>' +
      '<div class="spacer"></div><div class="steps" aria-hidden="true">' + steps + '</div><span class="chip chip-amber xp">' + totalXP() + ' XP</span></div>';
  }
  function renderIntro() {
    const m = RUN.m, ej = m.ejemplo || {};
    CUR = null;
    const root = screen(topbarPlay() + '<main class="intro' + (ej.fig ? '' : ' intro-one') + '"><section class="card paper task"><div class="task-head"><span class="num">Misión ' + (idxOf(m) + 1) + '</span></div>' +
      '<h2 tabindex="-1" id="intro-h">' + esc(m.titulo) + '</h2>' +
      '<div class="goal">' + F.icon('flag') + '<div><b>Objetivo:</b> ' + m.objetivo + '</div></div>' +
      (m.puntos && m.puntos.length ? '<p style="margin:.2rem 0 .4rem;font-weight:600">Recordatorio:</p><ul class="concepts">' + m.puntos.map((p) => '<li><span>' + p + '</span></li>').join('') + '</ul>' : '') +
      (ej.html ? '<div class="example"><b>Ejemplo</b>' + ej.html + '</div>' : '') +
      '<div class="evalnote">' + F.icon('eye') + '<div><b>Antes de empezar:</b> esta misión tiene ' + m.desafios.length + ' desafíos. Cada uno se responde <b>una sola vez</b> y no vas a ver si es correcto: tu docente recibirá los resultados. Leé con atención y revisá antes de confirmar.</div></div>' +
      '<div class="actions"><div class="spacer"></div><button class="btn btn-primary btn-big" data-start>Comenzar ' + F.icon('play') + '</button></div></section>' +
      (ej.fig ? '<section class="card paper visual">' + ej.fig() + '</section>' : '') + '</main>');
    on(root, '[data-exit]', 'click', () => renderMap(idxOf(m)));
    on(root, '[data-start]', 'click', () => renderChallenge());
    $('#intro-h').focus();
  }
  const TYPE_LABEL = { choice: 'Elegí una respuesta', multi: 'Marcá todas las correctas', number: 'Calculá', classify: 'Clasificá', select: 'Completá', order: 'Ordená los pasos' };
  function renderChallenge(forceId) {
    if (typeof forceId !== 'string') forceId = null;
    const m = RUN.m, ms = mstate(m), pend = forceId ? [forceId] : pending(m);
    if (!pend.length) { endMission(); return; }
    const orig = m.desafios.find((c) => c.id === pend[0]), ch = shuffled(orig);
    CUR = { ch: ch, orig: orig, done: false };
    const pos = ms.orden.indexOf(orig.id) + 1, figFn = orig.fig;
    const layout = figFn && orig.layout !== 'nofig' ? (orig.layout === 'narrowfig' ? 'narrowfig' : '') : 'nofig';
    const last = pending(m).length <= 1;
    const root = screen(topbarPlay() + '<main class="play ' + layout + '">' +
      (layout !== 'nofig' ? '<section class="card paper visual" id="vis"></section>' : '') +
      '<section class="card paper task"><div class="task-head"><span class="num">Desafío ' + pos + ' de ' + ms.orden.length + '</span><span>' + TYPE_LABEL[ch.tipo] + '</span></div>' +
      '<h2 class="consigna" id="consigna" tabindex="-1">' + ch.consigna + '</h2><div class="answer" id="ans"></div>' +
      '<div class="feedback" id="fb" role="status" aria-live="polite"></div>' +
      '<div class="actions">' + (CFG.MOSTRAR_PISTAS && ch.pista ? '<button class="btn btn-hint" id="b-hint">' + F.icon('bulb') + ' Pista</button>' : '') +
      '<div class="spacer"></div><span class="attempts">Una sola respuesta · no se puede cambiar</span>' +
      '<button class="btn btn-primary" id="b-check">' + (last ? 'Confirmar y terminar misión' : 'Confirmar y seguir') + ' ' + F.icon('play') + '</button></div></section></main>');
    if ($('#vis')) $('#vis').innerHTML = figFn();
    on(root, '[data-exit]', 'click', () => renderMap(idxOf(m)));
    CUR.ctrl = E.render(ch, { fig: $('#vis'), ans: $('#ans'), wide: layout === 'nofig', changed: () => { CUR.touched = true; const fb = $('#fb'); fb.className = 'feedback'; fb.innerHTML = ''; }, submit: () => { }, customDone: () => { } });
    $('#b-check').addEventListener('click', () => confirmAnswer());
    const bh = $('#b-hint'); if (bh) bh.addEventListener('click', () => { CUR.pista = true; showFb('hint', '<p><b>Pista:</b> ' + ch.pista + '</p>'); bh.disabled = true; });
    $('#consigna').focus();
  }
  function showFb(kind, html) { const fb = $('#fb'); fb.className = 'feedback show ' + kind; fb.innerHTML = F.icon(kind === 'hint' ? 'bulb' : 'help') + '<div class="fb-body">' + html + '</div>'; }
  function confirmAnswer() {
    if (!CUR || CUR.done) return;
    const ch = CUR.ch, resp = CUR.ctrl.get(), res = E.validate(ch, resp);
    if (res.empty) { showFb('hint', '<p>' + res.msg + '</p>'); return; }
    if (ch.tipo === 'order' && !CUR.touched) { showFb('hint', '<p>Usá las flechas para ordenar los pasos antes de confirmar.</p>'); return; }
    CUR.done = true; CUR.ctrl.lock(true); $('#b-check').disabled = true;
    const parts = (res.parts || []).filter((p) => p !== null);
    const parcial = ch.tipo === 'choice' || ch.tipo === 'multi' ? (res.ok ? 1 : 0) : (parts.length ? parts.filter(Boolean).length / parts.length : (res.ok ? 1 : 0));
    const ms = mstate(RUN.m);
    ms.resp[ch.id] = { ok: !!res.ok, parcial: Math.round(parcial * 1000) / 1000, resp: describe(ch, resp), t: Date.now(), pista: !!CUR.pista };
    RUN.gained += CFG.XP.porRespuesta;
    save();
    setTimeout(() => { if (pending(RUN.m).length) { renderChallenge(); toast(F.icon('check') + ' Respuesta registrada'); } else endMission(); }, 150);
  }
  function endMission() {
    const m = RUN.m, i = idxOf(m), ms = mstate(m), first = !ms.completa;
    if (first) { ms.completa = true; ms.fin = Date.now(); RUN.gained += CFG.XP.misionCompleta; }
    const nuevos = checkBadges(); save();
    const allDone = MIS.every(complete);
    if (allDone) sendReport();
    const nextUnlocked = i + 1 < MIS.length && unlocked(i + 1);
    const root = screen(topbarPlay() + '<main class="endwrap"><section class="card paper endcard" id="endcard">' +
      '<div class="eyebrow" style="color:var(--violet-ink)">Misión ' + (i + 1) + ' · ' + esc(m.titulo) + '</div>' +
      '<h2 tabindex="-1" id="end-h">¡Misión completada!</h2>' +
      '<p class="endmsg">Respondiste los ' + m.desafios.length + ' desafíos. Tus respuestas quedaron registradas y tu docente va a recibir los resultados.</p>' +
      '<div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><div class="v">' + answered(m) + ' / ' + m.desafios.length + '</div><div class="k">Desafíos respondidos</div></div>' +
      '<div class="stat"><div class="v">+' + RUN.gained + '</div><div class="k">XP ganados</div></div>' +
      '<div class="stat"><div class="v">' + MIS.filter(complete).length + ' / ' + MIS.length + '</div><div class="k">Misiones completas</div></div></div>' +
      (nuevos.length ? '<div class="newbadges">' + nuevos.map((b) => '<span class="badge-mini"><span class="bic">' + F.icon(b.icono) + '</span>' + esc(b.nombre) + '</span>').join('') + '</div>' : '') +
      (first && nextUnlocked && !allDone ? '<p><span class="unlock">' + F.icon('play') + ' ¡Se habilitó la misión ' + (i + 2) + ': ' + esc(MIS[i + 1].titulo) + '!</span></p>' : '') +
      '<div class="row">' + '<button class="btn btn-ghost-dark" data-map>' + F.icon('map') + ' Volver al mapa</button>' +
      (allDone ? '<button class="btn btn-primary" data-final>' + F.icon('trophy') + ' Finalizar evaluación</button>' :
        (nextUnlocked && !complete(MIS[i + 1]) ? '<button class="btn btn-primary" data-next>Siguiente misión ' + F.icon('play') + '</button>' : '')) + '</div></section></main>');
    on(root, '[data-exit]', 'click', () => renderMap(i));
    on(root, '[data-map]', 'click', () => renderMap());
    on(root, '[data-next]', 'click', () => startRun(MIS[i + 1]));
    on(root, '[data-final]', 'click', renderFinal);
    nuevos.forEach((b) => toast('<b>¡Nueva insignia!</b> ' + esc(b.nombre)));
    confetti($('#endcard')); $('#end-h').focus();
  }

  /* ================= FINAL ================= */
  function renderFinal() {
    const root = screen(topbarMain() + '<main class="endwrap"><section class="card paper cert" id="cert"><div class="seal">' + F.icon('crown') + '</div>' +
      '<div class="eyebrow" style="color:var(--violet-ink);margin-top:1rem">' + esc(CFG.NOMBRE_AVENTURA) + '</div>' +
      '<h2 tabindex="-1" id="cert-h">¡' + esc(S.alias) + ', completaste la evaluación!</h2>' +
      '<p class="endmsg">Respondiste ' + totalAnswered() + ' desafíos en ' + MIS.length + ' misiones. Tu docente va a corregir tus respuestas.</p>' +
      '<div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><div class="v">' + totalXP() + '</div><div class="k">XP</div></div><div class="stat"><div class="v">' + S.insignias.length + '</div><div class="k">Insignias</div></div><div class="stat"><div class="v">' + Math.round(S.tiempoMs / 60000) + ' min</div><div class="k">Tiempo</div></div></div>' +
      '<div class="row">' + (alreadySent() ? '' : '<button class="btn btn-primary" data-send hidden>' + F.icon('refresh') + ' Reintentar envío</button>') + '<button class="btn btn-ghost-dark" data-map>' + F.icon('map') + ' Volver al mapa</button></div>' +
      '<p class="sendst-dark" id="sendst" role="status">' + sendStatusText() + '</p></section></main>');
    wireTop(root);
    on(root, '[data-map]', 'click', () => renderMap());
    on(root, '[data-send]', 'click', (e) => sendReport(e.currentTarget));
    confetti($('#cert')); $('#cert-h').focus();
    if (!alreadySent()) { if (SENDING) setStatus('', 'Enviando tus respuestas…'); else sendReport($('[data-send]')); }
  }

  /* ================= PROGRESO (estudiante, sin resultados) ================= */
  function renderProgress() {
    const rows = MIS.map((m, i) => '<tr><td>' + (i + 1) + '. ' + esc(m.titulo) + '</td><td class="n">' + (S.misiones[m.id] ? answered(m) : 0) + ' / ' + m.desafios.length + '</td><td>' +
      (complete(m) ? '<span class="lvl c">Completada</span>' : unlocked(i) ? '<span class="lvl p">' + (S.misiones[m.id] && answered(m) ? 'En curso' : 'Disponible') + '</span>' : '<span class="lvl s">Bloqueada</span>') + '</td></tr>').join('');
    const root = screen(topbarMain() + '<main class="report" style="grid-template-rows:minmax(0,1fr) auto"><section class="card paper rpanel">' +
      '<div class="rhead"><div><h2>Progreso de ' + esc(S.alias) + '</h2><div class="meta">' + esc(CFG.NOMBRE_AVENTURA) + ' · ' + esc(CFG.CURSO) + '</div></div><div class="meta" style="text-align:right">Tiempo registrado: <b>' + Math.round(S.tiempoMs / 60000) + ' min</b></div></div>' +
      '<div class="cols2"><div><table class="rt"><thead><tr><th>Misión</th><th>Respondidos</th><th>Estado</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div><div class="rgrid" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="v">' + totalAnswered() + ' / ' + totalItems + '</div><div class="k">Desafíos respondidos</div></div><div class="stat"><div class="v">' + totalXP() + '</div><div class="k">XP</div></div></div>' +
      '<p class="rnote">Los resultados (respuestas correctas e incorrectas) los ve solamente tu docente. Tus respuestas se envían <b>una sola vez</b>, automáticamente, al completar las ' + MIS.length + ' misiones.</p></div></div></section>' +
      '<div class="rbar">' + (MIS.every(complete) && !alreadySent() ? '<button class="btn btn-primary" data-send>' + F.icon('refresh') + ' Reintentar envío</button>' : '') +
      '<span class="sendst" id="sendst" role="status">' + sendStatusText() + '</span><div class="spacer"></div><button class="btn btn-ghost" data-map>' + F.icon('map') + ' Volver al mapa</button></div></main>');
    wireTop(root);
    on(root, '[data-map]', 'click', () => renderMap());
    on(root, '[data-send]', 'click', (e) => sendReport(e.currentTarget));
  }

  /* ================= INFORME DOCENTE ================= */
  function levelOf(n, logro) {
    if (n < CFG.MIN_ACTIVIDADES_COMENTARIO) return { k: 's', t: 'Sin datos suficientes' };
    if (logro >= CFG.NIVELES.consolidado - EPS) return { k: 'c', t: 'Logro consolidado' };
    if (logro >= CFG.NIVELES.enProceso - EPS) return { k: 'p', t: 'En proceso de consolidación' };
    return { k: 'a', t: 'Requiere acompañamiento' };
  }
  /** nota en escala de 1 a 10: % de logro × 10, con mínimo y redondeo configurables */
  function notaDe(logro) {
    const N = CFG.NOTA, k = Math.pow(10, N.decimales || 0);
    const v = Math.round(logro * N.maxima * k + 1e-9) / k;
    return Math.min(N.maxima, Math.max(N.minima, v));
  }
  function buildReport() {
    const per = {}, order = [], items = [];
    MIS.forEach((m, mi) => {
      const k = m.contenido;
      if (!per[k]) { per[k] = { key: k, nombre: C.contenidos[k].nombre, n: 0, ok: 0, sum: 0, total: 0 }; order.push(per[k]); }
      const ms = S.misiones[m.id];
      m.desafios.forEach((ch) => {
        per[k].total++;
        const r = ms && ms.resp[ch.id];
        items.push({ num: ch.num, mision: (mi + 1) + '. ' + m.titulo, contenido: C.contenidos[k].nombre, consigna: strip(ch.consigna), respuesta: r ? r.resp : '', correcta: correctText(ch), respondida: !!r, ok: r ? r.ok : null, parcial: r ? r.parcial : null });
        if (r) { per[k].n++; per[k].ok += r.ok ? 1 : 0; per[k].sum += r.parcial; }
      });
    });
    order.forEach((p) => { p.logro = p.n ? p.sum / p.n : 0; p.nivel = levelOf(p.n, p.logro); });
    const resp = items.filter((x) => x.respondida), ok = resp.filter((x) => x.ok).length;
    return {
      alias: S.alias, aventura: CFG.NOMBRE_AVENTURA, curso: CFG.CURSO, fecha: new Date().toLocaleString('es-AR'), fechaISO: new Date().toISOString(),
      tiempoMin: Math.round((S.tiempoMs || 0) / 60000), misionesCompletadas: MIS.filter(complete).length,
      respondidas: resp.length, total: items.length, correctas: ok, incorrectas: resp.length - ok,
      pctCorrectas: resp.length ? ok / resp.length : 0, logro: resp.length ? resp.reduce((a, x) => a + x.parcial, 0) / resp.length : 0,
      puntos: Math.round(resp.reduce((a, x) => a + x.parcial, 0) * 100) / 100, logroTotal: resp.reduce((a, x) => a + x.parcial, 0) / items.length,
      nota: MIS.every(complete) ? notaDe(resp.reduce((a, x) => a + x.parcial, 0) / items.length) : null,
      xp: totalXP(), insignias: S.insignias.map((id) => (C.insignias.find((b) => b.id === id) || {}).nombre).filter(Boolean),
      porContenido: order, porMision: MIS.map((m, i) => { const its = items.filter((x) => x.mision.startsWith((i + 1) + '. ')), rs = its.filter((x) => x.respondida); return { n: i + 1, titulo: m.titulo, completa: complete(m), respondidas: rs.length, total: its.length, correctas: rs.filter((x) => x.ok).length, logro: rs.length ? rs.reduce((a, x) => a + x.parcial, 0) / rs.length : 0 }; }),
      items: items, docente: !!S.docente
    };
  }
  function renderTeacher(tab) {
    tab = tab || 'res';
    const R = buildReport();
    const st = (v, k) => '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
    const mark = (x) => !x.respondida ? '<span class="lvl s">Sin responder</span>' : x.ok ? '<span class="lvl c">✓ Correcta</span>' : x.parcial > 0 ? '<span class="lvl p">◐ Parcial (' + pct(x.parcial) + ')</span>' : '<span class="lvl a">✗ Incorrecta</span>';
    const root = screen(topbarMain() + '<main class="report">' +
      '<div class="tabs" role="tablist">' + [['res', 'Resumen'], ['det', 'Respuestas detalladas']].map((t) => '<button class="tab" role="tab" aria-selected="' + (t[0] === tab) + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') +
      '<span class="chip chip-amber" style="margin-left:auto">' + F.icon('lock') + ' Vista docente</span></div><div style="min-height:0;display:grid">' +
      '<section class="card paper rpanel" id="rp-res"' + (tab === 'res' ? '' : ' hidden') + '><div class="rhead"><div><h2>Informe de ' + esc(R.alias) + '</h2><div class="meta">' + esc(R.aventura) + ' · ' + esc(R.curso) + ' · ' + esc(R.fecha) + '</div></div><div class="meta" style="text-align:right">Tiempo registrado: <b>' + R.tiempoMin + ' min</b></div></div>' +
      '<div class="rgrid" style="grid-template-columns:repeat(6,1fr)">' + st(R.misionesCompletadas + ' / ' + MIS.length, 'Misiones completas') + st(R.respondidas + ' / ' + R.total, 'Desafíos respondidos') + st(R.correctas + ' / ' + R.incorrectas, 'Correctas / no correctas') + st(pct(R.pctCorrectas) + ' · ' + pct(R.logroTotal), '% correctas · % de logro') + st(E.fmt(R.puntos) + ' / ' + R.total, 'Puntaje') + st(R.nota == null ? '—' : E.fmt(R.nota), 'Nota (1 a 10)') + '</div>' +
      '<div class="cols2" style="margin-top:.7rem"><div><h3 class="rsub">Por contenido</h3><table class="rt"><thead><tr><th>Contenido</th><th>Resp.</th><th>Correctas</th><th>Logro</th><th>Nivel</th></tr></thead><tbody>' +
      R.porContenido.map((p) => '<tr><td>' + esc(p.nombre) + '</td><td class="n">' + p.n + '/' + p.total + '</td><td class="n">' + p.ok + '</td><td class="n">' + (p.n ? pct(p.logro) : '—') + '</td><td><span class="lvl ' + p.nivel.k + '">' + p.nivel.t + '</span></td></tr>').join('') + '</tbody></table></div>' +
      '<div><h3 class="rsub">Por misión</h3><table class="rt"><thead><tr><th>Misión</th><th>Resp.</th><th>Correctas</th><th>Logro</th></tr></thead><tbody>' +
      R.porMision.map((x) => '<tr><td>' + x.n + '. ' + esc(x.titulo) + '</td><td class="n">' + x.respondidas + '/' + x.total + '</td><td class="n">' + x.correctas + '</td><td class="n">' + (x.respondidas ? pct(x.logro) : '—') + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<p class="rnote"><b>% correctas</b> = desafíos totalmente correctos ÷ respondidos. <b>% de logro</b> = promedio del puntaje de cada desafío, donde los de varias partes (cálculos, clasificar, completar, ordenar) suman la fracción de partes correctas; opción única y múltiple valen 1 o 0. <b>Nota</b> = % de logro sobre los ' + R.total + ' desafíos × 10 (mínimo ' + CFG.NOTA.minima + (CFG.NOTA.decimales ? '' : ', redondeada a entero') + '); se calcula al completar las ' + MIS.length + ' misiones. Niveles: consolidado ≥ ' + pct(CFG.NIVELES.consolidado) + ', en proceso ≥ ' + pct(CFG.NIVELES.enProceso) + '.' + (R.docente ? ' <b>Modo docente activo en este equipo.</b>' : '') + '</p></section>' +
      '<section class="card paper rpanel" id="rp-det"' + (tab === 'det' ? '' : ' hidden') + '><table class="rt rt-det"><thead><tr><th>N.º</th><th>Consigna</th><th>Respuesta del estudiante</th><th>Respuesta correcta</th><th>Resultado</th></tr></thead><tbody>' +
      R.items.map((x) => '<tr><td class="n">' + x.num + '</td><td>' + esc(x.consigna.length > 140 ? x.consigna.slice(0, 140) + '…' : x.consigna) + '</td><td>' + esc(x.respuesta || '—') + '</td><td>' + esc(x.correcta) + '</td><td>' + mark(x) + '</td></tr>').join('') + '</tbody></table></section></div>' +
      '<div class="rbar">' + (MIS.every(complete) && !alreadySent() ? '<button class="btn btn-primary" data-send>' + F.icon('send') + ' Enviar a la planilla</button>' : '') + '<button class="btn btn-ghost" data-print>' + F.icon('print') + ' Imprimir / PDF</button>' +
      '<span class="sendst" id="sendst" role="status">' + sendStatusText() + '</span><div class="spacer"></div><button class="btn btn-ghost" data-map>' + F.icon('map') + ' Salir de la vista docente</button></div></main>');
    wireTop(root);
    on(root, '[data-tab]', 'click', (e) => { const t = e.currentTarget.getAttribute('data-tab'); root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b === e.currentTarget)); root.querySelectorAll('.rpanel').forEach((p) => { p.hidden = p.id !== 'rp-' + t; }); });
    on(root, '[data-map]', 'click', () => renderMap());
    on(root, '[data-print]', 'click', () => { root.querySelectorAll('.rpanel').forEach((p) => { p.hidden = false; }); window.print(); renderTeacher(tab); });
    on(root, '[data-send]', 'click', (e) => sendReport(e.currentTarget));
  }

  /* ================= ENVÍO ================= */
  function configured() { return CFG.APPS_SCRIPT_URL && /^https:\/\/script\.google\.com\//.test(CFG.APPS_SCRIPT_URL) && CFG.GOOGLE_SHEET_ID && !/PEGAR/.test(CFG.GOOGLE_SHEET_ID); }
  function payload() {
    const R = buildReport();
    if (!S.envioId) { S.envioId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); save(); }
    const id = S.envioId;   // fijo por estudiante: la planilla descarta cualquier envío repetido
    const r1 = (x) => Math.round(x * 1000) / 10;
    return { clave: CFG.CLAVE_ENVIO, sheetId: CFG.GOOGLE_SHEET_ID, envioId: id, version: 'evaluacion-v2',
      alias: R.alias, curso: R.curso, fecha: R.fechaISO, tiempoMin: R.tiempoMin, misionesCompletadas: R.misionesCompletadas,
      respondidas: R.respondidas, total: R.total, correctas: R.correctas, incorrectas: R.incorrectas, pctCorrectas: r1(R.pctCorrectas), logro: r1(R.logroTotal), puntos: R.puntos, nota: R.nota,
      xp: R.xp, insignias: R.insignias.join(', '), modoDocente: R.docente,
      porContenido: R.porContenido.map((p) => ({ contenido: p.nombre, respondidas: p.n, correctas: p.ok, logro: r1(p.logro), nivel: p.nivel.t })),
      porMision: R.porMision.map((x) => ({ mision: x.n + '. ' + x.titulo, completa: x.completa, respondidas: x.respondidas, correctas: x.correctas, logro: r1(x.logro) })),
      respuestas: R.items.map((x) => ({ num: x.num, mision: x.mision, contenido: x.contenido, consigna: x.consigna.slice(0, 300), respuesta: x.respuesta, correcta: x.correcta, resultado: !x.respondida ? 'Sin responder' : x.ok ? 'Correcta' : x.parcial > 0 ? 'Parcial' : 'Incorrecta', puntaje: x.parcial == null ? '' : x.parcial })) };
  }
  let SENDING = false;
  function sendStatusText() {
    const l = (S.envios || []).filter((e) => e.estado === 'recibido' || e.estado === 'sin confirmación').pop();
    if (l) return '✓ Respuestas registradas el ' + new Date(l.t).toLocaleString('es-AR') + (l.estado === 'sin confirmación' ? ' (sin confirmación de la planilla)' : '') + '.';
    if (!MIS.every(complete)) return 'Tus respuestas se enviarán automáticamente al completar las ' + MIS.length + ' misiones.';
    if (!configured()) return 'La docente todavía no configuró la planilla. Tus respuestas quedan guardadas en esta computadora.';
    return 'Tus respuestas todavía no se enviaron.';
  }
  function setStatus(cls, t) { const st = $('#sendst'); if (st) { st.className = (st.classList.contains('sendst-dark') ? 'sendst-dark ' : 'sendst ') + cls; st.textContent = t; } }
  /** envía el resultado UNA sola vez, solo cuando las 8 misiones están completas */
  function sendReport(btn) {
    if (!S || alreadySent() || SENDING || !MIS.every(complete)) return;
    const showBtn = (v) => { const b = btn || $('[data-send]'); if (b) { b.hidden = !v; b.disabled = !v; } };
    if (!configured()) { setStatus('bad', 'La docente todavía no configuró la planilla (archivo config.js). Tus respuestas quedan guardadas en esta computadora.'); showBtn(false); return; }
    if (!navigator.onLine) { setStatus('bad', 'No hay conexión a internet. Conectate y tocá «Reintentar envío».'); showBtn(true); return; }
    SENDING = true; showBtn(false); setStatus('', 'Enviando tus respuestas…');
    const body = JSON.stringify(payload());
    const done = (estado, cls, msg) => {
      SENDING = false;
      if (estado) { S.envios.push({ t: Date.now(), estado: estado }); save(); }
      if (!S || !document.body.contains($('#sendst') || document.body)) return;
      setStatus(cls, msg); showBtn(!estado);
    };
    fetch(CFG.APPS_SCRIPT_URL, { method: 'POST', body: body, redirect: 'follow' }).then((r) => r.json())
      .then((j) => { if (j && j.ok) done('recibido', 'ok', '✓ ¡Respuestas registradas! La planilla confirmó la recepción.'); else done(null, 'bad', 'La planilla respondió con un error: ' + ((j && j.error) || 'desconocido') + '. Avisale a tu docente y tocá «Reintentar envío».'); })
      .catch(() => fetch(CFG.APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: body })
        .then(() => done('sin confirmación', 'ok', '✓ Respuestas enviadas. (El navegador no pudo leer la confirmación: tu docente puede verificar la planilla.)'))
        .catch(() => done(null, 'bad', 'No se pudo enviar. Revisá la conexión y tocá «Reintentar envío».')));
  }

  /* ================= MODALES ================= */
  let lastFocus = null;
  function openModal(title, body, buttons, wide) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"' + (wide ? '' : ' style="width:min(36rem,100%)"') + '>' +
      '<div class="modal-h"><h2 id="mh">' + title + '</h2><button class="ib" data-close aria-label="Cerrar">' + F.icon('x') + '</button></div><div class="modal-b">' + body + '</div>' +
      (buttons && buttons.length ? '<div class="modal-f">' + buttons.map((b, i) => '<button class="btn ' + (b.cls || 'btn-ghost-dark') + '" data-mb="' + i + '">' + esc(b.t) + '</button>').join('') + '</div>' : '') + '</div></div>';
    const back = modalRoot.firstChild;
    back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
    on(back, '[data-close]', 'click', closeModal);
    on(back, '[data-mb]', 'click', (e) => { const b = buttons[+e.currentTarget.getAttribute('data-mb')]; if (b.keep) { if (b.fn() !== false) closeModal(true); return; } closeModal(); if (b.fn) b.fn(); });
    const f = back.querySelector('input') || back.querySelector('.modal-f .btn:last-child') || back.querySelector('[data-close]'); f.focus();
    return back;
  }
  function closeModal(noRefocus) { modalRoot.innerHTML = ''; if (!noRefocus && lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalRoot.firstChild) closeModal();
    if (e.key === 'Tab' && modalRoot.firstChild) {
      const f = modalRoot.querySelectorAll('button, input, select, summary, a[href]'); if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  function openBadges() {
    openModal('Insignias', '<div class="badges">' + C.insignias.map((b) => { const o = S.insignias.indexOf(b.id) >= 0; return '<div class="badge ' + (o ? 'on' : '') + '"><span class="bic">' + F.icon(b.icono) + '</span><div><div class="bn">' + esc(b.nombre) + '</div><div class="bd">' + (o ? '✓ Obtenida · ' : 'Por obtener · ') + esc(b.desc) + '</div></div></div>'; }).join('') + '</div>', [{ t: 'Cerrar', cls: 'btn-primary' }], true);
  }
  function openHowto() {
    const body = '<div class="howto">' +
      '<section><h3>' + F.icon('map') + ' Cómo avanzar</h3><ul><li>Elegí la misión disponible en el mapa.</li><li>Cada misión se habilita al <b>completar</b> la anterior.</li><li>El desafío final se habilita al completar todas las misiones.</li></ul></section>' +
      '<section><h3>' + F.icon('eye') + ' Es una evaluación</h3><ul><li>Cada desafío se responde <b>una sola vez</b>: después de confirmar no se puede cambiar.</li><li>No vas a ver si tu respuesta es correcta: los resultados los recibe tu docente.</li><li>Los desafíos y las opciones aparecen en orden distinto para cada estudiante.</li></ul></section>' +
      '<section><h3>' + F.icon('star') + ' XP e insignias</h3><ul><li>Cada respuesta suma <b>' + CFG.XP.porRespuesta + ' XP</b> y cada misión completa, <b>' + CFG.XP.misionCompleta + ' XP</b>.</li><li>Al completar cada misión ganás una insignia.</li><li>Los XP no dependen de los aciertos.</li></ul></section>' +
      '<section><h3>' + F.icon('grid') + ' Teclado y panel táctil</h3><ul><li><b>Tab</b> para moverte; <b>Enter</b> o <b>Espacio</b> para elegir.</li><li>En las opciones podés usar las <b>flechas</b>.</li><li>Usá coma decimal: 6,5.</li></ul></section>' +
      '<section><h3>' + F.icon('report') + ' Tus respuestas</h3><ul><li>Se guardan en <b>esta computadora y este navegador</b>.</li><li>Al terminar, se envían a tu docente.</li></ul></section>' +
      '<section><h3>' + F.icon('play') + ' Pantalla</h3><label class="toggle"><input type="checkbox" id="anim-t"' + (animOn() ? ' checked' : '') + '> Animaciones</label></section></div>' +
      '<details class="teacher"><summary>Área docente</summary><div class="row" style="margin-top:.5rem"><input id="tkey" type="password" aria-label="Clave docente" placeholder="Clave docente"><button class="btn btn-small btn-ghost-dark" id="tok">Ingresar</button><span id="tmsg" style="font-size:.85rem"></span></div>' +
      '<div id="tpanel" hidden><div class="row" style="margin-top:.6rem"><button class="btn btn-small btn-primary" id="t-rep">Ver informe con resultados</button><button class="btn btn-small btn-ghost-dark" id="t-unl">' + (S && S.docente ? 'Volver a bloquear misiones' : 'Habilitar todas las misiones') + '</button><button class="btn btn-small btn-ghost-dark" id="t-del">Borrar respuestas de este estudiante</button></div>' +
      '<p style="font-size:.85rem;margin-top:.6rem"><b>Notas sobre las correcciones aplicadas:</b></p><ul>' + C.pendientes.map((p) => '<li>' + p + '</li>').join('') + '</ul></div></details>';
    const back = openModal('¿Cómo funciona?', body, [{ t: '¡Entendido!', cls: 'btn-primary' }], true);
    const at = back.querySelector('#anim-t'); at.addEventListener('change', () => { if (S) { S.anim = at.checked; save(); } applyAnim(); }); if (!S) at.disabled = true;
    const enter = () => {
      if (back.querySelector('#tkey').value !== CFG.CLAVE_DOCENTE) { back.querySelector('#tmsg').textContent = 'Clave incorrecta.'; return; }
      if (!S) { back.querySelector('#tmsg').textContent = 'Primero tiene que ingresar un estudiante.'; return; }
      back.querySelector('#tpanel').hidden = false; back.querySelector('#tmsg').textContent = '';
    };
    back.querySelector('#tok').addEventListener('click', enter);
    back.querySelector('#tkey').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
    back.querySelector('#t-rep').addEventListener('click', () => { closeModal(true); renderTeacher(); });
    back.querySelector('#t-unl').addEventListener('click', () => { S.docente = !S.docente; save(); closeModal(true); renderMap(); toast(S.docente ? 'Todas las misiones habilitadas en este equipo.' : 'Misiones bloqueadas otra vez.'); });
    back.querySelector('#t-del').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) { } S = null; closeModal(true); renderWelcome(); });
  }

  /* ================= inicio ================= */
  renderWelcome();
  if (/[?&]test=1/.test(location.search)) {
    window.GG = { get S() { return S; }, MIS: MIS, E: E, buildReport: buildReport, payload: payload, shuffled: shuffled,
      login: (a) => { S = fresh(a || 'Prueba'); save(); renderMap(0); }, startRun: (i) => startRun(MIS[i]), renderTeacher: renderTeacher, renderProgress: renderProgress, renderMap: renderMap, renderFinal: renderFinal,
      get CUR() { return CUR; }, confirm: () => confirmAnswer(),
      open: (mi, ci) => { RUN = { m: MIS[mi], gained: 0 }; mstate(MIS[mi]).orden = MIS[mi].desafios.map((c) => c.id); renderChallenge(MIS[mi].desafios[ci].id); } };
  }
})();
