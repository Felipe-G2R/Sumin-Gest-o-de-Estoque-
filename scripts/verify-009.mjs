// Verifica estado do projeto pós-migration 009.
import { readFileSync } from 'node:fs';

const TOKEN = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/sbp_[a-f0-9]+/)[0];
const PROJECT_REF = 'dwlaygqmbzidlwzyzkiv';

async function q(sql) {
  const r = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    }
  );
  const t = await r.text();
  if (!r.ok) {
    console.error('[ERRO]', r.status, t);
    return null;
  }
  return JSON.parse(t);
}

console.log('=== POLICY "SUPER_ADMIN cria perfis" ===');
console.log(await q(`SELECT policyname, cmd FROM pg_policies WHERE tablename='users' AND policyname='SUPER_ADMIN cria perfis';`));

console.log('\n=== TRIGGER enforce_loja_id_on_user ===');
console.log(await q(`SELECT tgname FROM pg_trigger WHERE tgname='trg_enforce_loja_id_on_user';`));

console.log('\n=== Função log_user_created ===');
console.log(await q(`SELECT proname FROM pg_proc WHERE proname='log_user_created';`));

console.log('\n=== Usuários por role ===');
console.log(await q(`SELECT role, count(*) FROM users GROUP BY role ORDER BY role;`));

console.log('\n=== Existe algum SUPER_ADMIN? ===');
console.log(await q(`SELECT id, email, nome, loja_id, ativo FROM users WHERE role='SUPER_ADMIN';`));

console.log('\n=== Lojas cadastradas ===');
console.log(await q(`SELECT id, nome, ativo FROM lojas ORDER BY criado_em;`));

console.log('\n=== Produtos com codigo_barras vazio (deve ser 0) ===');
console.log(await q(`SELECT count(*) FROM produtos WHERE codigo_barras = '';`));
