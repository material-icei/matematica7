"""Prueba de interfaz: recorre todas las pantallas y desafíos a varias resoluciones,
detecta errores de JavaScript y desbordes (scroll) y guarda capturas.
Uso: python3 tests/ui_check.py [ancho alto] [--shots]"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
url = (root / 'index.html').as_uri() + '?test=1'
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 and sys.argv[1].isdigit() else (1366, 650)
shots = '--shots' in sys.argv
out = pathlib.Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else root / 'tests' / 'shots'
out.mkdir(parents=True, exist_ok=True)

OVER = """() => {
  const r = [];
  const de = document.documentElement;
  if (de.scrollHeight > innerHeight + 2) r.push('página ' + de.scrollHeight + '>' + innerHeight);
  document.querySelectorAll('.answer, .side, .rpanel:not([hidden]), .modal-b, .task, .visual').forEach(e => {
    if (e.scrollHeight > e.clientHeight + 3) r.push(e.className.split(' ').slice(-1)[0] + ' ' + e.scrollHeight + '>' + e.clientHeight);
  });
  return r;
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': H})
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.goto(url)
    pg.wait_for_timeout(400)
    if shots: pg.screenshot(path=str(out / '00_bienvenida.png'))
    pg.evaluate("GG.login('Sofi')")
    pg.wait_for_timeout(200)
    issues = {}
    o = pg.evaluate(OVER)
    if o: issues['mapa'] = o
    if shots: pg.screenshot(path=str(out / '01_mapa.png'))
    n = pg.evaluate("GG.MIS.length")
    for mi in range(n):
        pg.evaluate(f"GG.startRun({mi})")
        pg.wait_for_timeout(320 if shots else 120)
        o = pg.evaluate(OVER)
        if o: issues[f'intro m{mi+1}'] = o
        if shots: pg.screenshot(path=str(out / f'm{mi+1:02d}_intro.png'))
        nc = pg.evaluate(f"GG.MIS[{mi}].desafios.length")
        for ci in range(nc):
            pg.evaluate(f"GG.open({mi},{ci})")
            pg.wait_for_timeout(320 if shots else 80)
            o = pg.evaluate(OVER)
            if o: issues[f'm{mi+1}c{ci+1}'] = o
            if shots: pg.screenshot(path=str(out / f'm{mi+1:02d}_c{ci+1}.png'))
    pg.evaluate("GG.renderReport()")
    pg.wait_for_timeout(100)
    for t in ['res', 'cont', 'mis', 'fort']:
        pg.click(f'[data-tab={t}]')
        o = pg.evaluate(OVER)
        if o: issues['informe ' + t] = o
        if shots: pg.screenshot(path=str(out / f'zz_informe_{t}.png'))
    pg.evaluate("GG.renderMap()")
    pg.click('[data-howto]')
    o = pg.evaluate(OVER)
    if o: issues['ayuda'] = o
    if shots: pg.screenshot(path=str(out / 'zz_ayuda.png'))
    b.close()
print(f'{W}x{H}: errores JS: {len(errors)}')
for e in errors[:20]: print('  ', e)
print(f'desbordes: {len(issues)}')
for k, v in issues.items(): print('  ', k, v)
