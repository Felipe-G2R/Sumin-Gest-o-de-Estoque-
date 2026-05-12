// Diagnóstico do isolamento multi-tenant atual.
import { readFileSync } from 'node:fs';
const TOKEN = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/sbp_[a-f0-9]+/)[0];
const PROJECT_REF = 'dwlaygqmbzidlwzyzkiv';
async function q(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) { console.error(r.status, await r.text()); return null; }
  return JSON.parse(await r.text());
}

console.log('=== LOJAS ===');
console.log(await q(`SELECT id, nome FROM lojas ORDER BY criado_em;`));

console.log('\n=== USERS por loja ===');
console.log(await q(`
  SELECT u.email, u.role, u.loja_id, l.nome AS loja_nome
    FROM users u
    LEFT JOIN lojas l ON l.id = u.loja_id
    ORDER BY u.criado_em;
`));

console.log('\n=== PRODUTOS por loja ===');
console.log(await q(`
  SELECT l.nome AS loja, count(p.*) AS qtd
    FROM lojas l
    LEFT JOIN produtos p ON p.loja_id = l.id
    GROUP BY l.nome
    UNION ALL
  SELECT 'SEM LOJA' AS loja, count(*) FROM produtos WHERE loja_id IS NULL
    ORDER BY loja;
`));

console.log('\n=== ÚLTIMOS 10 PRODUTOS criados ===');
console.log(await q(`
  SELECT p.nome, p.criado_em, l.nome AS loja, p.loja_id
    FROM produtos p
    LEFT JOIN lojas l ON l.id = p.loja_id
    ORDER BY p.criado_em DESC
    LIMIT 10;
`));

console.log('\n=== ÚLTIMOS 10 MOVIMENTOS ===');
console.log(await q(`
  SELECT m.tipo, m.quantidade, m.criado_em, l.nome AS loja, u.email AS quem
    FROM movimentacoes m
    LEFT JOIN lojas l ON l.id = m.loja_id
    LEFT JOIN users u ON u.id = m.usuario_id
    ORDER BY m.criado_em DESC
    LIMIT 10;
`));

console.log('\n=== Política completa em PRODUTOS ===');
console.log(await q(`
  SELECT policyname, cmd, qual, with_check
    FROM pg_policies WHERE tablename='produtos';
`));

console.log('\n=== Default da coluna loja_id em produtos ===');
console.log(await q(`
  SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_name='produtos' AND column_name='loja_id';
`));
