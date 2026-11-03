"""Bundle the interactive layer: src/core.* + src/features/* -> assets/app.js, assets/app.css.
Run from the repo root: python3 tools/build.py
It also stamps index.html with a content hash so browsers fetch the new bundle."""
import hashlib, os, re, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def cat(ext):
    files = [os.path.join(ROOT, 'src', 'core.' + ext)] + sorted(glob.glob(os.path.join(ROOT, 'src', 'features', '*.' + ext)))
    parts = []
    for f in files:
        if os.path.exists(f):
            parts.append(f'/* --- {os.path.relpath(f, ROOT)} --- */\n' + open(f, encoding='utf-8').read().strip() + '\n')
    return '\n'.join(parts)
js, css = cat('js'), cat('css')
os.makedirs(os.path.join(ROOT, 'assets'), exist_ok=True)
open(os.path.join(ROOT, 'assets', 'app.js'), 'w', encoding='utf-8').write('/* Built by tools/build.py. Edit src/, not this file. */\n' + js)
open(os.path.join(ROOT, 'assets', 'app.css'), 'w', encoding='utf-8').write('/* Built by tools/build.py. Edit src/, not this file. */\n' + css)
v = hashlib.sha1((js + css).encode()).hexdigest()[:10]
p = os.path.join(ROOT, 'index.html'); s = open(p, encoding='utf-8').read()
s2 = re.sub(r'assets/app\.(js|css)(\?v=[0-9a-f]+)?"', lambda m: f'assets/app.{m.group(1)}?v={v}"', s)
if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
print('built', v, len(js), 'js bytes', len(css), 'css bytes')
