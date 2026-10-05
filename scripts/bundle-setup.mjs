// Joins every migration and the generated seed into one file, so the whole
// database can be set up with a single paste in the Supabase SQL editor.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const migrations = join(root, 'supabase', 'migrations');

const parts = [
  '-- Study Nowie 2.0 — complete setup',
  '-- Run this once in the Supabase SQL editor. It creates every table, policy,',
  '-- index and storage bucket, then loads the subjects, all 97 chapters and the',
  '-- starter days.',
  '',
];

for (const file of readdirSync(migrations).filter((f) => f.endsWith('.sql')).sort()) {
  parts.push(`-- ==== ${file} ====`, readFileSync(join(migrations, file), 'utf8'), '');
}

parts.push('-- ==== seed ====', readFileSync(join(root, 'supabase', 'seed', '0001_content.sql'), 'utf8'));

const out = join(root, 'supabase', 'setup.sql');
writeFileSync(out, parts.join('\n'), 'utf8');
console.log(`Wrote ${out}`);
