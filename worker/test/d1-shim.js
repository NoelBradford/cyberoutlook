// A just-enough D1 on node:sqlite (the same engine): prepare(sql).bind(...).first() / all() / run(). Used by the unit tests and by
// tools/capture-check.js, which runs the real Worker handler behind the real pages. Needs Node 22.5 or newer.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const SCHEMA = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

export function makeDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON'); // D1 enforces foreign keys
  db.exec(SCHEMA);
  return {
    raw: db,
    prepare(sql) {
      const st = db.prepare(sql); let args = [];
      const o = {
        bind(...a) { args = a; return o; },
        async first() { return st.get(...args) ?? null; },
        async all() { return { results: st.all(...args) }; },
        async run() { const r = st.run(...args); return { meta: { changes: r.changes } }; },
      };
      return o;
    },
  };
}

// An R2 stand-in holding named files.
export function makeFiles(files) { return { async get(k) { return k in files ? { body: files[k] } : null; } }; }
