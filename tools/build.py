"""Bundle the interactive layer: src/core.* + src/features/* -> assets/app.js, assets/app.css.
Run from the repo root: python3 tools/build.py
It also stamps index.html with a content hash so browsers fetch the new bundle.
Files are read with universal newlines and always written with LF, and paths in the bundle headers use
forward slashes, so the output is byte-identical on Windows (including CRLF checkouts), macOS and Linux."""
import hashlib, json, os, re, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def cat(ext):
    files = [os.path.join(ROOT, 'src', 'core.' + ext)] + sorted(glob.glob(os.path.join(ROOT, 'src', 'features', '*.' + ext)))
    parts = []
    for f in files:
        if os.path.exists(f):
            rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
            parts.append(f'/* --- {rel} --- */\n' + open(f, encoding='utf-8').read().strip() + '\n')
    return '\n'.join(parts)
js, css = cat('js'), cat('css')
os.makedirs(os.path.join(ROOT, 'assets'), exist_ok=True)
open(os.path.join(ROOT, 'assets', 'app.js'), 'w', encoding='utf-8', newline='\n').write('/* Built by tools/build.py. Edit src/, not this file. */\n' + js)
open(os.path.join(ROOT, 'assets', 'app.css'), 'w', encoding='utf-8', newline='\n').write('/* Built by tools/build.py. Edit src/, not this file. */\n' + css)
v = hashlib.sha1((js + css).encode()).hexdigest()[:10]
p = os.path.join(ROOT, 'index.html'); s = open(p, encoding='utf-8').read()
s2 = re.sub(r'assets/app\.(js|css)(\?v=[0-9a-f]+)?"', lambda m: f'assets/app.{m.group(1)}?v={v}"', s)
if s2 != s: open(p, 'w', encoding='utf-8', newline='\n').write(s2)
print('built', v, len(js), 'js bytes', len(css), 'css bytes')

# ---- Standalone tool pages (src/pages/pages.json) -------------------------------------------------------------
# Each entry becomes <slug>/index.html plus assets/tool-<slug>.js and assets/tool-<slug>.css. The tool bundles are
# src/core.* plus only the listed features, so assets/app.js and assets/app.css above are never affected.
import sys

def fail(msg):
    sys.exit('build.py: ' + msg)

def rd(path):
    return open(path, encoding='utf-8').read()

def wr(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8', newline='\n').write(text)

PAGES_DIR = os.path.join(ROOT, 'src', 'pages')
SITE_URL = 'https://cyberoutlook.sbcsg.uk/'
SLUG_RE = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
OPEN_RE = re.compile(r'^([A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*)?$')
# Slugs that would collide with real site folders. "tools" is allowed on purpose (UX-07 uses /tools/ for the hub).
RESERVED = {'assets', 'src', 'docs', 'linkedin', 'index'}
MARK = '<!-- Built by tools/build.py from src/pages/shell.html. Edit src/pages/, not this file. -->'
HEADER = '/* Built by tools/build.py. Edit src/, not this file. */\n'

def esc(v):
    return v.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def feature_files(fid):
    return sorted(glob.glob(os.path.join(ROOT, 'src', 'features', fid + '-*.js'))), sorted(glob.glob(os.path.join(ROOT, 'src', 'features', fid + '-*.css')))

def part(path, body=None):
    rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
    return f'/* --- {rel} --- */\n' + (rd(path) if body is None else body).strip() + '\n'

def page_bundles(ids):
    js, css = [], []
    css.append(part(os.path.join(PAGES_DIR, 'shell.css')))
    js.append(part(os.path.join(ROOT, 'src', 'core.js')))
    css.append(part(os.path.join(ROOT, 'src', 'core.css')))
    # core.js assigns window.CV outright, so the flag goes straight after it, not in the page.
    js.append('/* --- standalone page flag (tools/build.py) --- */\nCV.standalone = true;\n')
    for fid in ids:
        fjs, fcss = feature_files(fid)
        for f in fjs: js.append(part(f))
        for f in fcss: css.append(part(f))
    return '\n'.join(js), '\n'.join(css)

manifest = json.loads(rd(os.path.join(PAGES_DIR, 'pages.json')))
if not isinstance(manifest, list): fail('src/pages/pages.json must be a list')
shell = rd(os.path.join(PAGES_DIR, 'shell.html'))
m = re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]+)"', s)
if not m: fail('could not find the Content-Security-Policy meta tag in index.html')
CSP = m.group(1)   # taken from index.html, so every tool page carries exactly the report page policy
mc = re.search(r"const CACHE = '([^']+)'", rd(os.path.join(ROOT, 'sw.js')))
if not mc: fail('could not find the CACHE name in sw.js')
CACHE_NAME = mc.group(1)   # tool pages write into the service worker's cache, so the name comes from sw.js

# The report's three action tables, lifted from index.html so a tool page that needs them (the check and My plan read
# them through CV.actions()) never carries its own copy of the wording. Ids are positional (t1-1, t3-6), so the
# order and count matter: fail unless there are exactly three.
tables = re.findall(r'<table class="actions">.*?</table>', s, re.S)
if len(tables) != 3: fail(f'expected exactly three <table class="actions"> blocks in index.html, found {len(tables)}')
ACTIONS_HTML = '<div id="report-actions" hidden>\n' + '\n'.join(tables) + '\n</div>\n'

seen, wanted_files, listing = set(), set(), []
for i, e in enumerate(manifest):
    where = f'pages.json entry {i + 1}'
    for k in ('slug', 'title', 'description'):
        if not isinstance(e.get(k), str) or not e[k].strip(): fail(f'{where}: "{k}" must be a non-empty string')
    slug = e['slug']; where = f'pages.json entry "{slug}"'
    if not SLUG_RE.match(slug): fail(f'{where}: slug must be lower case letters, digits and single hyphens')
    if slug in RESERVED: fail(f'{where}: slug is reserved')
    if slug in seen: fail(f'{where}: duplicate slug')
    seen.add(slug)
    ids = e.get('features', [])
    if not isinstance(ids, list) or not all(isinstance(x, str) and re.match(r'^\d{3}$', x) for x in ids): fail(f'{where}: "features" must be a list of three-digit ids as strings')
    for fid in ids:
        fjs, fcss = feature_files(fid)
        if not fjs and not fcss: fail(f'{where}: feature {fid} matches no file in src/features')
    ids = sorted(set(ids), key=int)
    opn = e.get('open', '')
    if not isinstance(opn, str) or not OPEN_RE.match(opn): fail(f'{where}: "open" must be a dotted function path such as CV.openCheck')
    og = e.get('ogImage', 'assets/og-image.png')
    if not isinstance(og, str) or og.startswith('/') or '..' in og or not os.path.isfile(os.path.join(ROOT, *og.split('/'))): fail(f'{where}: ogImage must be an existing file path inside the repo')
    pjs, pcss = page_bundles(ids)
    v = hashlib.sha1((pjs + pcss).encode()).hexdigest()[:10]
    wr(os.path.join(ROOT, 'assets', f'tool-{slug}.js'), HEADER + pjs)
    wr(os.path.join(ROOT, 'assets', f'tool-{slug}.css'), HEADER + pcss)
    intro = e.get('intro', '')
    if not isinstance(intro, str): fail(f'{where}: "intro" must be a string')
    needs_actions = e.get('reportActions', False)
    if not isinstance(needs_actions, bool): fail(f'{where}: "reportActions" must be true or false')
    values = {'CSP': CSP, 'TITLE': e['title'], 'HEADING': e['title'], 'DESCRIPTION': e['description'], 'URL': f'{SITE_URL}{slug}/',
              'OG_IMAGE': SITE_URL + og, 'SLUG': slug, 'HASH': v, 'OPEN': opn, 'CACHE': CACHE_NAME}
    out = shell
    # These two are markup, filled before the escaped plain-text values. Their own text is escaped here.
    out = out.replace('{{INTRO}}', f'<p class="page-intro">{esc(intro)}</p>\n' if intro.strip() else '')
    out = out.replace('{{ACTIONS}}', ACTIONS_HTML if needs_actions else '')
    for k, val in values.items(): out = out.replace('{{' + k + '}}', esc(val))
    if '{{' in out: fail(f'{where}: shell.html has a placeholder build.py does not fill')
    out = out.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + MARK + '\n', 1)
    wr(os.path.join(ROOT, slug, 'index.html'), out)
    wanted_files |= {f'assets/tool-{slug}.js', f'assets/tool-{slug}.css', f'{slug}/index.html'}
    listing.append(slug)
    print(f'page /{slug}/: {len(out)} html, {len(pjs) + len(HEADER)} js, {len(pcss) + len(HEADER)} css bytes, features {",".join(ids) or "none"}, v={v}')

# Remove generated files for pages that are no longer listed. Only files carrying the generated marker, and
# never a directory.
for f in glob.glob(os.path.join(ROOT, 'assets', 'tool-*.js')) + glob.glob(os.path.join(ROOT, 'assets', 'tool-*.css')):
    if os.path.relpath(f, ROOT).replace(os.sep, '/') not in wanted_files and rd(f).startswith(HEADER): os.remove(f)
for f in glob.glob(os.path.join(ROOT, '*', 'index.html')):
    rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
    if rel not in wanted_files and rd(f).startswith('<!DOCTYPE html>\n' + MARK): os.remove(f)

# One source of truth for CI: tools/pages.txt is generated from pages.json.
wr(os.path.join(ROOT, 'tools', 'pages.txt'),
   '# Generated by tools/build.py from src/pages/pages.json. Do not edit.\n'
   '# CI runs: node tools/check.js http://127.0.0.1:8080/ --profile tool --path <path>\n'
   + ''.join(f'/{slug}/\n' for slug in listing))
