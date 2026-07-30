// ============================================
// Geração visual de código de barras (Code128)
// Usa JsBarcode para renderizar o código interno (ex: SUM-000123) em SVG,
// tanto para preview na tela quanto para impressão de etiqueta.
// ============================================
import JsBarcode from 'jsbarcode';

const OPCOES_PADRAO = {
  format: 'CODE128',
  displayValue: true,
  fontSize: 14,
  height: 60,
  margin: 8,
  lineColor: '#1a1a1a',
};

/**
 * Renderiza o código de barras em um elemento <svg> já existente no DOM.
 * @param {SVGElement} svgEl - elemento SVG alvo
 * @param {string} valor - texto do código (ex: "SUM-000123")
 * @param {object} opcoes - overrides das opções do JsBarcode
 * @returns {boolean} true se renderizou, false se o valor era inválido
 */
export function renderBarcode(svgEl, valor, opcoes = {}) {
  if (!svgEl || !valor) return false;
  try {
    JsBarcode(svgEl, valor, { ...OPCOES_PADRAO, ...opcoes });
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre a janela de impressão com a etiqueta do código de barras.
 * Gera o SVG fora do DOM principal e injeta no HTML de impressão.
 * @param {string} valor - texto do código
 * @param {string} nomeProduto - exibido acima do código (opcional)
 */
export function imprimirEtiqueta(valor, nomeProduto = '') {
  if (!valor) return;

  // Cria um SVG temporário para extrair o markup gerado
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const ok = renderBarcode(svg, valor, { height: 70, fontSize: 16 });
  if (!ok) return;
  const svgMarkup = new XMLSerializer().serializeToString(svg);

  const titulo = nomeProduto
    ? `<div style="font-size:13px;font-weight:600;margin-bottom:4px;text-align:center">${nomeProduto}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Etiqueta ${valor}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 16px; }
  .etiqueta { display: inline-block; border: 1px dashed #bbb; padding: 12px 16px; border-radius: 6px; text-align: center; }
  @media print { body { padding: 0; } .etiqueta { border: none; } }
</style></head><body>
  <div class="etiqueta">
    ${titulo}
    ${svgMarkup}
  </div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
