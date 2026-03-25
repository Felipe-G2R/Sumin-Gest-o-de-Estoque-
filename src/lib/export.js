// Export utility - generates CSV and triggers download
export function exportToCSV(data, filename, columns) {
  // columns = [{ key: 'nome', label: 'Nome' }, { key: 'quantidade', label: 'Quantidade' }]
  if (!data || data.length === 0) return;

  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = c.key.includes('.')
        ? c.key.split('.').reduce((obj, k) => obj?.[k], row)
        : row[c.key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'string') val = val.replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados como PDF abrindo janela de impressão do navegador
 * @param {string} title - Título do relatório
 * @param {Array} data - Array de objetos
 * @param {Array} columns - [{ key, label }]
 */
export function exportToPDF(title, data, columns) {
  if (!data || data.length === 0) return;

  const now = new Date().toLocaleString('pt-BR');

  const getVal = (row, key) => {
    const val = key.includes('.')
      ? key.split('.').reduce((obj, k) => obj?.[k], row)
      : row[key];
    if (val === null || val === undefined) return '—';
    return String(val);
  };

  const headerCells = columns.map(c => `<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #333;font-size:12px;background:#f0f0f0">${c.label}</th>`).join('');
  const bodyRows = data.map((row, i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8f8f8'}">` +
    columns.map(c => `<td style="padding:6px 12px;font-size:12px;border-bottom:1px solid #ddd">${getVal(row, c.key)}</td>`).join('') +
    '</tr>'
  ).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .footer { margin-top: 24px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>${title}</h1>
  <div class="meta">Gerado em ${now} · ${data.length} registros · LogControl</div>
  <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
  <div class="footer">Relatório gerado pelo LogControl — Sistema de Gestão de Estoque</div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

export function formatValueForExport(value, type = 'text') {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'currency':
      return Number(value).toFixed(2);
    case 'date':
      return value ? new Date(value).toLocaleDateString('pt-BR') : '';
    case 'datetime':
      return value ? new Date(value).toLocaleString('pt-BR') : '';
    case 'boolean':
      return value ? 'Sim' : 'Não';
    default:
      return String(value);
  }
}
