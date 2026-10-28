"""Recorrido funcional completo usando SOLO la interfaz (clics, teclado y campos).
- Juega las 15 misiones respondiendo correctamente al primer intento,
  salvo algunos desafíos elegidos donde se equivoca a propósito.
- Verifica desbloqueos, XP, estrellas, insignias e informe contra el estado guardado.
Uso: python3 tests/recorrido.py"""
import pathlib, json
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
url = (root / 'index.html').as_uri() + '?test=1'

# Desafíos en los que el estudiante simulado se equivoca:
#   'r' = falla una vez y corrige (s2); 'w' = falla tres veces (ve la solución)
ERRORES = {'m1c4': 'r', 'm2c3': 'w', 'm6c5': 'r', 'm9c7': 'r', 'm13c8': 'w'}

HELPER = r"""
window.__answer = function (wrong) {
  const ch = GG.CUR.ch, E = GG.E, good = E.correct(ch);
  const q = (s) => document.querySelector(s), qa = (s) => Array.from(document.querySelectorAll(s));
  const fire = (el, t) => el.dispatchEvent(new Event(t, { bubbles: true }));
  switch (ch.tipo) {
    case 'choice': { let i = good; if (wrong) i = ch.ops.findIndex(o => !o.ok); qa('.opts .opt')[i].click(); break; }
    case 'multi': { qa('.opts .opt').forEach(b => { if (b.getAttribute('aria-pressed') === 'true') b.click(); }); const sel = wrong ? [ch.ops.findIndex(o => !o.ok)] : good; sel.forEach(i => qa('.opts .opt')[i].click()); break; }
    case 'number': { qa('.nf').forEach((row, i) => { const inp = row.querySelector('input'); inp.value = wrong && i === 0 ? '999' : good[i].v; fire(inp, 'input'); const u = row.querySelector('select'); if (u) { u.value = good[i].u; fire(u, 'change'); } }); break; }
    case 'classify': { qa('.cl-row').forEach((row, i) => { let cat = good[i]; if (wrong && i === 0) cat = ch.cats.find(c => c !== cat); Array.from(row.querySelectorAll('.seg-b')).find(b => b.textContent === cat).click(); }); break; }
    case 'select': { qa('.sel-row').forEach((row, i) => row.querySelectorAll('select').forEach((s, k) => { let v = good[i][k]; if (wrong && i === 0 && k === 0) v = Array.from(s.options).map(o => o.value).find(x => x && x !== v); s.value = v; fire(s, 'change'); })); break; }
    case 'order': {
      const target = ch.pasos.slice(); if (wrong) { target.reverse(); }
      for (let guard = 0; guard < 60; guard++) {
        const txt = qa('.order-t').map(t => t.innerHTML);
        const pos = txt.findIndex((t, i) => t !== target[i]); if (pos < 0) break;
        const j = txt.indexOf(target[pos]); qa('.order-i')[j].querySelector('.up').click();
      }
      break; }
    case 'grid': { const cells = wrong ? ['0,0', '2,0'] : good; cells.forEach(k => { const [c, r] = k.split(',').map(Number); qa('.gcell')[r * ch.cols + c].click(); }); break; }
    case 'triangle': { const inp = q('.tri-range input'); inp.value = wrong ? 4 : good; fire(inp, 'input'); break; }
    case 'point': {
      const p = wrong ? [1, 1] : good, svg = q('.pt-fig svg'), m = svg.getScreenCTM();
      const x = 20 + p[0] * 40, y = 20 + p[1] * 40;
      const ev = (t) => new PointerEvent(t, { bubbles: true, clientX: m.a * x + m.c * y + m.e, clientY: m.b * x + m.d * y + m.f });
      svg.dispatchEvent(ev('pointerdown')); window.dispatchEvent(ev('pointerup')); break; }
    case 'self': { qa('.self-i input').slice(0, 3).forEach(i => i.click()); break; }
  }
};
window.__hunt = function () {
  // juega 10 rondas: elige B si hay figura disponible, si no A, si no "No hay"
  const fx = GG.MIS.find(m => m.id === 'm11').desafios[0].ficha, E = GG.E;
  const geo = fx.figuras.map(f => E.polyomino(f.celdas.map(c => c.join(','))));
  const used = new Set();
  for (let r = 0; r < 10; r++) {
    document.querySelector('.h-roll').click();
    const die = +document.querySelector('.hunt-dtxt b').textContent;
    const candB = geo.findIndex((g, i) => !used.has(i) && g.area === die);
    const candA = geo.findIndex((g, i) => !used.has(i) && g.perim === (die + 1) * 2);
    if (candB >= 0 || candA < 0) document.querySelector('.h-b').click(); else document.querySelector('.h-a').click();
    const pick = candB >= 0 ? candB : candA;
    if (pick >= 0) { used.add(pick); document.querySelector('g.hshape[data-i="' + pick + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    else document.querySelector('.h-none').click();
    if (!document.querySelector('.hunt-msg.ok')) return 'ronda ' + r + ' falló';
    document.querySelector('.h-next').click();
  }
  return 'ok';
};
"""

problems = []
def expect(cond, msg):
    if not cond: problems.append(msg); print('  ✗', msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 650})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(300)
    # bienvenida: validación de alias
    pg.click('button[type=submit]'); expect('al menos 2' in pg.inner_text('#alias-err'), 'alias vacío rechazado')
    pg.fill('#alias', 'ana@mail.com'); pg.click('button[type=submit]'); expect('correo' in pg.inner_text('#alias-err'), 'correo rechazado')
    pg.fill('#alias', 'Valen'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    pg.add_script_tag(content=HELPER)
    n = pg.evaluate('GG.MIS.length')
    expect(pg.locator('.node.locked').count() == n - 1, 'al inicio solo la misión 1 está disponible')
    for mi in range(n):
        mid = pg.evaluate(f'GG.MIS[{mi}].id')
        node = pg.locator(f'.node[data-i="{mi}"]')
        expect('locked' not in (node.get_attribute('class') or ''), f'{mid} desbloqueada al llegar')
        node.click(); pg.click('[data-play]'); pg.wait_for_timeout(50)
        pg.click('[data-start]')
        nc = pg.evaluate(f'GG.MIS[{mi}].desafios.length')
        for ci in range(nc):
            cid = pg.evaluate('GG.CUR.ch.id'); tipo = pg.evaluate('GG.CUR.ch.tipo')
            if tipo == 'hunt':
                r = pg.evaluate('__hunt()'); expect(r == 'ok', f'{cid}: juego {r}')
            else:
                mode = ERRORES.get(cid)
                if mode:
                    tries = 1 if mode == 'r' else 3
                    for t in range(tries):
                        pg.evaluate('__answer(true)'); pg.click('#b-check'); pg.wait_for_timeout(30)
                    fbcls = pg.get_attribute('#fb', 'class')
                    if mode == 'r':
                        expect('bad' in fbcls, f'{cid}: error muestra retroalimentación')
                        pg.evaluate('__answer(false)'); pg.click('#b-check')
                    else:
                        expect('sol' in fbcls, f'{cid}: al 3.er error se muestra la solución')
                else:
                    pg.evaluate('__answer(false)'); pg.click('#b-check')
                pg.wait_for_timeout(30)
                fb = pg.get_attribute('#fb', 'class')
                expect(('ok' in fb) or (mode == 'w' and 'sol' in fb), f'{cid}: resultado esperado (fb={fb}, msg={pg.inner_text("#fb")[:120]})')
            pg.click('#b-next'); pg.wait_for_timeout(30)
        # pantalla final de misión
        expect(pg.locator('.endcard').count() == 1, f'{mid}: pantalla de fin de misión')
        st = pg.evaluate(f'(() => {{ const m = GG.MIS[{mi}]; return {{ s: GG.mStats(m), stars: GG.stars(m), ap: GG.approved(m) }}; }})()')
        expect(st['ap'], f'{mid}: aprobada (logro {st["s"]["logro"]:.2f})')
        pg.click('[data-map]'); pg.wait_for_timeout(50)
        # prueba de la función de repaso en la misión 2
        if mid == 'm2':
            pg.locator('.node[data-i="1"]').click()
            expect(pg.locator('[data-review]').count() == 1, 'm2: botón repasar errores visible')
            pg.click('[data-review]'); pg.click('[data-start]')
            expect(pg.evaluate('GG.CUR.ch.id') == 'm2c3', 'm2: repaso empieza por el desafío fallado')
            pg.evaluate('__answer(false)'); pg.click('#b-check'); pg.click('#b-next')
            expect(pg.evaluate("GG.S.misiones.m2.items.m2c3.s3") == 1, 'm2c3: queda registrado como recuperado')
            pg.click('[data-map]')
    # verificaciones globales
    S = pg.evaluate('GG.S')
    xp_items = sum(it['xp'] for m in S['misiones'].values() for it in m['items'].values())
    bonos = sum((25 if False else 0) for _ in [])
    xp_total = pg.evaluate('GG.totalXP()')
    exp_bonus = sum((20 if v.get('aprobada') else 0) + (15 if v.get('tres') else 0) for v in S['bonos'].values())
    expect(xp_total == xp_items + exp_bonus, f'XP total coherente ({xp_total} = {xp_items} + {exp_bonus})')
    rep = pg.evaluate('GG.buildReport()')
    expect(rep['misionesAprobadas'] == n and rep['misionesCompletadas'] == n, 'informe: todas las misiones completas y aprobadas')
    expect(rep['incorrectas'] == 1, f'informe: 1 incorrecta (m13c8; m2c3 se recuperó en el repaso) (hay {rep["incorrectas"]})')
    tot = rep['actividades']; expect(abs(rep['pctCorrectas'] - (tot - 1) / tot) < 1e-9, 'informe: % correctas = correctas ÷ respondidas')
    expect(len(rep['insignias']) >= 10, f'insignias obtenidas: {len(rep["insignias"])}')
    print('Insignias:', rep['insignias'])
    print('XP', rep['xp'], '· estrellas', rep['estrellas'], '· actividades', tot, '· correctas', rep['correctas'], '· intentos', rep['intentos'])
    print('Por contenido:', [(c['nombre'][:22], c['actividades'], round(c['logro'], 2), c['nivel']['t']) for c in rep['porContenido']])
    # informe en pantalla + envío sin configurar
    pg.click('[data-report]'); pg.wait_for_timeout(100)
    pg.click('[data-send]'); expect('configuró' in pg.inner_text('#sendst'), 'envío sin configurar avisa a la docente')
    pg.screenshot(path='/tmp/claude-0/-home-claude/d4fdec8e-a59d-5cf9-9b3d-7aa1044da3e4/scratchpad/rep_res.png')
    for t in ['cont', 'mis', 'fort']:
        pg.click(f'[data-tab={t}]'); pg.screenshot(path=f'/tmp/claude-0/-home-claude/d4fdec8e-a59d-5cf9-9b3d-7aa1044da3e4/scratchpad/rep_{t}.png')
    # recarga: el progreso persiste
    pg.reload(); pg.wait_for_timeout(300)
    expect('Valen' in pg.inner_text('.continue-card'), 'el progreso persiste al recargar')
    pg.click('[data-continue]'); pg.wait_for_timeout(100)
    pg.screenshot(path='/tmp/claude-0/-home-claude/d4fdec8e-a59d-5cf9-9b3d-7aa1044da3e4/scratchpad/mapa_final.png')
    b.close()
print('errores JS:', errs)
print('PROBLEMAS:', len(problems))
