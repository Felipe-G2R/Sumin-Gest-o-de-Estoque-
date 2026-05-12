// Lê logs recentes da Edge Function delete-store-user via Management API
import { readFileSync } from 'node:fs';
const TOKEN = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/sbp_[a-f0-9]+/)[0];
const PROJECT_REF = 'dwlaygqmbzidlwzyzkiv';

// SQL via análise de logs do projeto
const sql = `
  SELECT
    cast(timestamp AS text) AS ts,
    event_message,
    metadata
  FROM function_edge_logs
  WHERE timestamp > now() - interval '30 minutes'
  ORDER BY timestamp DESC
  LIMIT 30;
`;

const r = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  }
);

console.log('Status:', r.status);
const text = await r.text();
try { console.log(JSON.stringify(JSON.parse(text), null, 2).slice(0, 5000)); }
catch { console.log(text.slice(0, 5000)); }
