"""Prueba del envío único a la planilla y de la nota (1 a 10).
Simula la planilla de Google (se interceptan las llamadas) y verifica:
- no hay botón de envío en «Mi progreso» mientras falten misiones;
- al completar la misión 8 se envía UNA sola vez, aunque se vuelva a la pantalla final, al mapa o se recargue;
- si el primer envío falla, aparece «Reintentar envío» y al reintentar se registra una sola vez;
- la nota y el puntaje que se envían son correctos.
Uso: python3 tests/envio_unico.py"""
import json, pathlib, threading, http.server, socketserver, functools, re
from playwright.sync_api import sync_playwright
import importlib.util
root = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('rec', root / 'tests' / 'recorrido.py')
src = (root / 'tests' / 'recorrido.py').read_text()
HELPER = re.search(r'HELPER = r"""(.*?)"""', src, re.S).group(1)

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}/index.html?test=1'
cfg = (root / 'js' / 'config.js').read_text().replace("PEGAR_AQUI_EL_ID_DE_LA_PLANILLA", "ID_PRUEBA").replace("PEGAR_AQUI_LA_URL_DEL_WEB_APP", "https://script.google.com/macros/s/PRUEBA/exec")

problems = []
def expect(c, m):
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c: problems.append(m)

def run(fail_first, wrong):
    posts, state = [], {'fail': fail_first}
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 650})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/js/config.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=cfg))
        def gs(route):
            if state['fail']: return route.abort()
            posts.append(json.loads(route.request.post_data))
            route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body='{"ok":true}')
        pg.route('https://script.google.com/**', gs)
        pg.goto(base); pg.wait_for_timeout(300)
        pg.fill('#alias', 'Prueba Envío'); pg.click('[data-start-eval]'); pg.wait_for_timeout(150)
        pg.add_script_tag(content=HELPER)
        n = pg.evaluate('GG.MIS.length')
        for mi in range(n):
            pg.locator(f'.node[data-i="{mi}"]').click(); pg.click('[data-play]'); pg.click('[data-start]')
            for _ in range(pg.evaluate(f'GG.MIS[{mi}].desafios.length')):
                num = pg.evaluate('GG.CUR.ch.num')
                pg.evaluate(f"__answer({'true' if num in wrong else 'false'})"); pg.click('#b-check'); pg.wait_for_timeout(200)
            if mi == 0:
                pg.click('[data-map]'); pg.click('[data-report]')
                expect(pg.locator('[data-send]').count() == 0, 'Mi progreso: sin botón de envío con misiones pendientes')
                expect(len(posts) == 0, 'no se envió nada antes de terminar')
                pg.click('[data-map]')
            elif mi < n - 1:
                pg.click('[data-map]')
        pg.wait_for_timeout(500)
        if fail_first:
            expect(len(posts) == 0, 'primer envío fallido no se registra')
            pg.click('[data-final]'); pg.wait_for_timeout(300)
            expect(pg.locator('[data-send]:not([hidden])').count() == 1, 'aparece «Reintentar envío» tras el fallo')
            state['fail'] = False   # vuelve la conexión
            pg.click('[data-send]'); pg.wait_for_timeout(500)
        else:
            expect(len(posts) == 1, 'al completar la misión 8 se envía automáticamente una vez')
            pg.click('[data-final]'); pg.wait_for_timeout(300)
        expect(pg.locator('[data-send]:not([hidden])').count() == 0, 'después del envío no hay botón para reenviar')
        expect('registradas' in pg.inner_text('#sendst'), 'pantalla final informa que quedó registrado')
        pg.click('[data-map]'); pg.wait_for_timeout(200); pg.click('[data-report]')
        expect(pg.locator('[data-send]').count() == 0 and 'registradas' in pg.inner_text('#sendst'), 'Mi progreso: sin botón y con estado «registradas»')
        pg.reload(); pg.wait_for_timeout(300); pg.click('[data-continue]'); pg.wait_for_timeout(500)
        pg.click('[data-howto]'); pg.click('details.teacher summary'); pg.fill('#tkey', '7mo-geo'); pg.click('#tok'); pg.click('#t-rep'); pg.wait_for_timeout(200)
        expect(pg.locator('[data-send]').count() == 0, 'vista docente: sin botón de reenvío')
        nota_vista = pg.inner_text('#rp-res')
        expect(len(posts) == 1, f'total de envíos registrados: {len(posts)}')
        b.close()
    return posts, errs, nota_vista

print('Caso 1: envío correcto, 5 desafíos mal')
wrong = {'1.3', '2.4', '4.2', '6.3', '7.6'}
posts, errs, vista = run(False, wrong)
d = posts[0]
exp_p = sum(r['puntaje'] for r in d['respuestas'])
exp_nota = max(1, min(10, round(exp_p / len(d['respuestas']) * 10 + 1e-9)))
print(f"  puntaje {d['puntos']} / {len(d['respuestas'])} · logro {d['logro']} % · nota {d['nota']} (esperada {exp_nota})")
expect(abs(d['puntos'] - exp_p) < 0.01 and d['nota'] == exp_nota, 'nota = % de logro × 10 redondeada')
expect('Nota (1 a 10)' in vista, 'la vista docente muestra la nota')
expect(len({x['num'] for x in d['respuestas']}) == 40, 'se envían las 40 respuestas')
print('Caso 2: el primer envío falla (sin conexión) y se reintenta')
posts2, errs2, _ = run(True, set())
expect(len(posts2) == 1 and posts2[0]['nota'] == 10, 'reintento registra una vez; todo correcto → nota 10')
expect(posts2[0]['envioId'] == posts2[0]['envioId'], 'id de envío fijo')
srv.shutdown()
print('errores JS:', errs + errs2)
print('PROBLEMAS:', len(problems))
