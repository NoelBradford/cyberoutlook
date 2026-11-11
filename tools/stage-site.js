// Builds the folder that gets deployed to Cloudflare. Usage: node tools/stage-site.js <outDir> [--preview]
// It copies only what the site serves (no source, docs, tools, tests or the Worker), and:
//   - with the email capture switched on in src/pages/config.json, it LEAVES OUT the two gated PDFs, so the deployed site cannot serve
//     them and the only way to them is the Worker's single-use link from private storage;
//   - with --preview it adds a _headers file marking every page noindex (for the workers.dev preview).
// The PDFs in the GitHub repo and on GitHub Pages are not touched by this. Removing them from the repo and its history is a separate
// decision for the owner (see docs/email-platform-design.md). Run tools/build.py first.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), preview = args.includes('--preview');
const out = args.find(a => !a.startsWith('--'));
if (!out) { console.error('Usage: node tools/stage-site.js <outDir> [--preview]'); process.exit(2); }

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'pages', 'config.json'), 'utf8'));
const gated = !!cfg.captureEndpoint;
const GATED = ['assets/UK-Small-Business-Cyber-Outlook-2027.pdf', 'linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'src', 'docs', '.github', 'worker']);
const SKIP_FILES = new Set(['CNAME', 'README.md', 'package.json', 'package-lock.json', '.gitignore', '.nojekyll']);

fs.rmSync(out, { recursive: true, force: true });
let copied = 0, left = [];
(function walk(rel) {
  for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      if (!rel && SKIP_DIRS.has(e.name)) continue;
      walk(r);
    } else {
      if (!rel && SKIP_FILES.has(e.name)) continue;
      if (rel === 'tools' && e.name !== 'index.html') continue; // the tools hub page lives in tools/ next to the scripts
      if (gated && GATED.includes(r)) { left.push(r); continue; }
      fs.mkdirSync(path.dirname(path.join(out, r)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, r), path.join(out, r)); copied++;
    }
  }
})('');
if (preview) fs.writeFileSync(path.join(out, '_headers'), '/*\n  X-Robots-Tag: noindex\n  X-Content-Type-Options: nosniff\n');
console.log(`staged ${copied} files in ${out}${preview ? ' (preview: noindex)' : ''}${gated ? `; capture is ON, so left out: ${left.join(', ')}` : '; capture is off, so the PDFs are included'}`);
