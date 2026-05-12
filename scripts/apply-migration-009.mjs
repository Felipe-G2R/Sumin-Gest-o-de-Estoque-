// Aplica supabase/migrations/009_super_admin_user_creation.sql via Management API.
// Token lido do .env (chave MASTER KEY).
import { readFileSync } from 'node:fs';

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const tokenMatch = envText.match(/sbp_[a-f0-9]+/);
if (!tokenMatch) {
  console.error('Token sbp_ não encontrado em .env');
  process.exit(1);
}
const TOKEN = tokenMatch[0];
const PROJECT_REF = 'dwlaygqmbzidlwzyzkiv';

const sql = readFileSync(
  new URL('../supabase/migrations/009_super_admin_user_creation.sql', import.meta.url),
  'utf8'
);

console.log(`Aplicando migration 009 no projeto ${PROJECT_REF}…`);
console.log(`Tamanho do SQL: ${sql.length} chars`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
);

const text = await res.text();
let body;
try { body = JSON.parse(text); } catch { body = text; }

if (!res.ok) {
  console.error(`\n[FALHA ${res.status}]`);
  console.error(body);
  process.exit(2);
}

console.log('\n[OK] Migration aplicada com sucesso.');
console.log('Resposta:', JSON.stringify(body, null, 2).slice(0, 500));
