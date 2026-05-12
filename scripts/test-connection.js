// Teste de conectividade com o Supabase usando as credenciais do .env.local
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', url);
console.log('Key (prefixo):', key?.slice(0, 24) + '…');

if (!url || !key || url.includes('placeholder')) {
  console.error('\n[FALHA] Credenciais ausentes ou placeholder no .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

const tabelas = ['users', 'fornecedores', 'produtos', 'movimentacoes', 'locais_inventario'];
let okCount = 0;
let erroAuth = false;

console.log('\n--- Teste de leitura (apenas count, respeitando RLS) ---');
for (const t of tabelas) {
  const { error, count } = await supabase
    .from(t)
    .select('*', { count: 'exact', head: true });

  if (error) {
    const msg = error.message || JSON.stringify(error);
    console.log(`  [ERRO ] ${t.padEnd(20)} → ${msg}`);
    if (/JWT|api key|Invalid API key/i.test(msg)) erroAuth = true;
  } else {
    console.log(`  [ OK  ] ${t.padEnd(20)} → ${count ?? 0} linhas visíveis`);
    okCount++;
  }
}

console.log('\n--- Teste de auth endpoint ---');
const { data: sess, error: sessErr } = await supabase.auth.getSession();
if (sessErr) {
  console.log('  [ERRO ] getSession:', sessErr.message);
} else {
  console.log('  [ OK  ] getSession respondeu (sessão:', sess.session ? 'ativa' : 'nenhuma', ')');
}

console.log('\n--- Resumo ---');
if (erroAuth) {
  console.error('Chave inválida ou URL não corresponde ao projeto.');
  process.exit(2);
}
if (okCount === 0) {
  console.error('Conexão respondeu mas nenhuma tabela foi acessada. Verifique migrations e RLS.');
  process.exit(3);
}
console.log(`Conexão funcional. ${okCount}/${tabelas.length} tabelas respondêram.`);
