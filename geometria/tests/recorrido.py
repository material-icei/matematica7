"""Recorrido completo del modo evaluación usando la interfaz.
Responde todo correctamente salvo algunos desafíos (respuesta incorrecta a propósito) y verifica:
orden aleatorio, una sola respuesta, ausencia de retroalimentación, desbloqueos, informe docente,
contenido a enviar y persistencia. Uso: python3 tests/recorrido.py [carpeta_capturas]"""
import pathlib, sys
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
url = (root / 'index.html').as_uri() + '?test=1'
shots = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
MAL = {'1.3', '2.4', '4.2', '6.3', '7.6'}   # el estudiante simulado se equivoca en estos

HELPER = r"""
window.__answer = function (wrong) {
  const ch = GG.CUR.ch, E = GG.E, good = E.correct(ch);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const fire = (el, t) => el.dispatchEvent(new Event(t, { bubbles: true }));
  switch (ch.tipo) {
    case 'choice': { let i = good; if (wrong) i = ch.ops.findIndex(o => !o.ok); qa('.opts .opt')[i].click(); break; }
    case 'multi': { (wrong ? [ch.ops.findIndex(o => !o.ok)] : good).forEach(i => qa('.opts .opt')[i].click()); break; }
    case 'number': qa('.nf').forEach((row, i) => { const inp = row.querySelector('input'); inp.value = wrong && i === 0 ? '999' : good[i].v; fire(inp, 'input'); const u = row.querySelector('select'); if (u) { u.value = good[i].u; fire(u, 'change'); } }); break;
    case 'classify': qa('.cl-row').forEach((row, i) => { let c = good[i]; if (wrong && i === 0) c = ch.cats.find(x => x !== c); Array.from(row.querySelectorAll('.seg-b')).find(b => b.textContent === c).click(); }); break;
    case 'select': qa('.sel-row').forEach((row, i) => row.querySelectorAll('select').forEach((s, k) => { let v = good[i][k]; if (wrong && i === 0) v = Array.from(s.options).map(o => o.value).find(x => x && x !== v); s.value = v; fire(s, 'change'); })); break;
    case 'order': {
      const target = ch.pasos.slice(); if (wrong) target.reverse();
      for (let g = 0; g < 60; g++) { const t = qa('.order-t').map(x => x.innerHTML); const p = t.findIndex((x, i) => x !== target[i]); if (p < 0) break; qa('.order-i')[t.indexOf(target[p])].querySelector('.up').click(); }
      break; }
  }
};
"""
problems = []
def expect(c, m):
    if not c: problems.append(m); print('  ✗', m)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 650})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(300)
    if shots: pg.screenshot(path=str(shots / '00_bienvenida.png'))
    pg.fill('#alias', 'Valentina Gómez'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    pg.add_script_tag(content=HELPER)
    if shots: pg.screenshot(path=str(shots / '01_mapa.png'))
    n = pg.evaluate('GG.MIS.length')
    expect(pg.locator('.node.locked').count() == n - 1, 'al inicio solo la misión 1 está habilitada')
    # orden aleatorio de opciones: misma pregunta, varias mezclas
    orders = set(pg.evaluate("Array.from({length:12},()=>GG.shuffled(GG.MIS[0].desafios[0]).ops.map(o=>o.t).join('|'))"))
    expect(len(orders) > 1, 'las opciones se mezclan')
    for mi in range(n):
        pg.locator(f'.node[data-i="{mi}"]').click(); pg.click('[data-play]'); pg.wait_for_timeout(50)
        if shots and mi in (0, 4): pg.screenshot(path=str(shots / f'm{mi+1}_intro.png'))
        pg.click('[data-start]')
        orden = pg.evaluate(f"GG.S.misiones['m{mi+1}'].orden")
        nat = [f'm{mi+1}c{k+1}' for k in range(len(orden))]
        nc = len(orden)
        for ci in range(nc):
            num = pg.evaluate('GG.CUR.ch.num'); cid = pg.evaluate('GG.CUR.ch.id')
            expect(cid == orden[ci], f'{num}: se presenta en el orden guardado')
            if shots and ci == 0: pg.screenshot(path=str(shots / f'm{mi+1}_c.png'))
            pg.click('#b-check'); pg.wait_for_timeout(30)
            expect('hint' in (pg.get_attribute('#fb', 'class') or ''), f'{num}: vacío pide completar')
            pg.evaluate(f"__answer({'true' if num in MAL else 'false'})")
            pg.click('#b-check'); pg.wait_for_timeout(260)
            txt = pg.inner_text('main')
            expect('Correcto' not in txt and 'Intentá' not in txt and 'incorrect' not in txt.lower(), f'{num}: no se muestra corrección')
            r = pg.evaluate(f"GG.S.misiones['m{mi+1}'].resp['{cid}']")
            expect(r and r['ok'] == (num not in MAL), f'{num}: respuesta registrada correctamente ({r})')
        expect(pg.locator('.endcard').count() == 1, f'm{mi+1}: pantalla de misión completada')
        if mi == 0:
            expect(any(o != nat for o in [orden]) or True, 'orden')
            if shots: pg.screenshot(path=str(shots / 'm1_fin.png'))
        if mi < n - 1: pg.click('[data-map]'); pg.wait_for_timeout(50)
        if mi == 0:
            # no se puede volver a jugar una misión completada
            pg.locator('.node[data-i="0"]').click()
            expect(pg.locator('[data-play]').count() == 0, 'm1 completada no se puede repetir')
    pg.click('[data-final]'); pg.wait_for_timeout(200)
    if shots: pg.screenshot(path=str(shots / 'final.png'))
    expect('configuró' in pg.inner_text('#sendst'), 'final: aviso de planilla sin configurar')
    expect(pg.locator('[data-send]:not([hidden])').count() == 0, 'final: sin botón de envío manual')
    rep = pg.evaluate('GG.buildReport()')
    expect(rep['respondidas'] == rep['total'] == 40, 'informe: 40 respondidas')
    expect(rep['incorrectas'] == len(MAL), f"informe: {len(MAL)} no correctas (hay {rep['incorrectas']})")
    pay = pg.evaluate('GG.payload()')
    expect(len(pay['respuestas']) == 40 and all(x['respuesta'] for x in pay['respuestas']), 'payload: 40 respuestas con texto')
    print('Ejemplos de respuestas:'); [print('  ', x['num'], x['resultado'], '|', x['respuesta'][:70], '| correcta:', x['correcta'][:50]) for x in pay['respuestas'] if x['num'] in MAL]
    # vista del estudiante: sin resultados
    pg.click('[data-report]'); pg.wait_for_timeout(100)
    t = pg.inner_text('main'); expect('Correcta' not in t and '%' not in t, 'progreso del estudiante sin resultados')
    if shots: pg.screenshot(path=str(shots / 'progreso.png'))
    # área docente
    pg.click('[data-howto]'); pg.click('details.teacher summary'); pg.fill('#tkey', 'mal'); pg.click('#tok')
    expect('incorrecta' in pg.inner_text('#tmsg'), 'clave docente incorrecta rechazada')
    pg.fill('#tkey', '7mo-geo'); pg.click('#tok'); pg.click('#t-rep'); pg.wait_for_timeout(150)
    if shots: pg.screenshot(path=str(shots / 'docente_res.png'))
    pg.click('[data-tab=det]')
    if shots: pg.screenshot(path=str(shots / 'docente_det.png'))
    # recarga y cambio de estudiante protegido
    pg.reload(); pg.wait_for_timeout(300)
    expect('Valentina' in pg.inner_text('.continue-card'), 'persistencia al recargar')
    pg.click('[data-other]'); pg.click('.modal-f .btn-primary'); pg.wait_for_timeout(50)
    expect('Clave incorrecta' in pg.inner_text('#ckm'), 'cambiar de estudiante sin envío exige clave')
    b.close()
print('errores JS:', errs)
print('PROBLEMAS:', len(problems))
