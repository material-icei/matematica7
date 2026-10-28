"""Genera una versión de UN SOLO ARCHIVO (dist/guardianes_un_archivo.html) con el CSS y el JS incluidos.
Sirve para subirla a Google Apps Script (como archivo HTML "app") o compartir un único archivo.
Uso: python3 herramientas/armar_un_archivo.py   (ejecutar después de editar js/config.js)"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css' / 'styles.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    src = (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return '<script>\n' + src + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
out = root / 'dist'; out.mkdir(exist_ok=True)
(out / 'guardianes_un_archivo.html').write_text(html, encoding='utf-8')
print('Listo:', out / 'guardianes_un_archivo.html', len(html) // 1024, 'KB')
