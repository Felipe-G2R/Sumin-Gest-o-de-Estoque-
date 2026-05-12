// Verifica as FKs que referenciam users e seu ON DELETE
import { readFileSync } from 'node:fs';
const TOKEN = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/sbp_[a-f0-9]+/)[0];
async function q(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/dwlaygqmbzidlwzyzkiv/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) { console.error(r.status, await r.text()); return null; }
  return JSON.parse(await r.text());
}

console.log('=== FKs apontando para public.users ===');
console.log(await q(`
  SELECT
    conrelid::regclass AS tabela,
    conname AS fk,
    pg_get_constraintdef(oid) AS definicao
  FROM pg_constraint
  WHERE contype = 'f'
    AND confrelid = 'public.users'::regclass;
`));

console.log('\n=== FKs apontando para auth.users ===');
console.log(await q(`
  SELECT
    conrelid::regclass AS tabela,
    conname AS fk,
    pg_get_constraintdef(oid) AS definicao
  FROM pg_constraint
  WHERE contype = 'f'
    AND confrelid = 'auth.users'::regclass;
`));
