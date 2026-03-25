// ============================================
// UTILITÁRIOS GERAIS DO LOGCONTROL
// ============================================

/**
 * Valida formato de CNPJ (XX.XXX.XXX/XXXX-XX)
 * Não valida dígitos verificadores, apenas formato
 */
export function validarCNPJ(cnpj) {
  if (!cnpj) return true; // CNPJ é opcional
  const regex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  return regex.test(cnpj);
}

/**
 * Formata CNPJ (somente números) para XX.XXX.XXX/XXXX-XX
 */
export function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Remove formatação do CNPJ, retornando somente números
 */
export function limparCNPJ(cnpj) {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatarData(data) {
  if (!data) return '—';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibição (DD/MM/YYYY HH:mm)
 */
export function formatarDataHora(data) {
  if (!data) return '—';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Retorna tempo relativo (Há X minutos, Há X horas, etc.)
 */
export function tempoRelativo(data) {
  if (!data) return '';
  const agora = new Date();
  const d = new Date(data);
  const diffMs = agora - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin}min`;
  if (diffHoras < 24) return `Há ${diffHoras}h`;
  if (diffDias < 7) return `Há ${diffDias}d`;
  return formatarData(data);
}

/**
 * Calcula dias até o vencimento
 * Retorna número negativo se já venceu
 */
export function diasParaVencimento(dataValidade) {
  if (!dataValidade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(dataValidade);
  validade.setHours(0, 0, 0, 0);
  const diffMs = validade - hoje;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Retorna status textual do vencimento
 */
export function statusVencimento(dataValidade) {
  const dias = diasParaVencimento(dataValidade);
  if (dias === null) return { texto: 'Sem validade', cor: 'gray', urgencia: 0 };
  if (dias < 0) return { texto: `Vencido há ${Math.abs(dias)} dias`, cor: 'red', urgencia: 4 };
  if (dias === 0) return { texto: 'Vence hoje!', cor: 'red', urgencia: 4 };
  if (dias <= 7) return { texto: `Vence em ${dias} dias`, cor: 'red', urgencia: 3 };
  if (dias <= 15) return { texto: `Vence em ${dias} dias`, cor: 'orange', urgencia: 2 };
  if (dias <= 30) return { texto: `Vence em ${dias} dias`, cor: 'yellow', urgencia: 1 };
  return { texto: `Vence em ${dias} dias`, cor: 'green', urgencia: 0 };
}

/**
 * Retorna status textual do estoque
 */
export function statusEstoque(quantidadeAtual, quantidadeMinima) {
  if (quantidadeAtual === 0) return { texto: 'Sem estoque', cor: 'red', urgencia: 3 };
  if (quantidadeAtual <= quantidadeMinima) return { texto: 'Estoque baixo', cor: 'orange', urgencia: 2 };
  return { texto: 'Normal', cor: 'green', urgencia: 0 };
}

/**
 * Formata valor monetário para BRL
 */
export function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Gera parâmetros de paginação para Supabase
 */
export function paginacao(pagina = 1, porPagina = 20) {
  const from = (pagina - 1) * porPagina;
  const to = from + porPagina - 1;
  return { from, to };
}

/**
 * Calcula diferenças entre dois objetos (para logs)
 */
export function calcularDiff(antes, depois) {
  if (!antes || !depois) return { antes, depois };

  const mudancas = {};
  const anteriores = {};

  for (const key of Object.keys(depois)) {
    if (JSON.stringify(antes[key]) !== JSON.stringify(depois[key])) {
      anteriores[key] = antes[key];
      mudancas[key] = depois[key];
    }
  }

  return {
    dados_anteriores: anteriores,
    dados_novos: mudancas,
  };
}

/**
 * Categorias padrão para produtos odontológicos
 */
export const CATEGORIAS = [
  'Restauração',
  'Endodontia',
  'Cirurgia',
  'Prótese',
  'Ortodontia',
  'Periodontia',
  'Descartáveis',
  'Materiais de Limpeza',
  'Outros',
];

/**
 * Unidades de medida disponíveis
 */
export const UNIDADES_MEDIDA = [
  { codigo: 'UN', descricao: 'Unidade' },
  { codigo: 'CX', descricao: 'Caixa' },
  { codigo: 'PC', descricao: 'Pacote' },
  { codigo: 'TB', descricao: 'Tubo' },
  { codigo: 'FR', descricao: 'Frasco' },
  { codigo: 'AMP', descricao: 'Ampola' },
  { codigo: 'RL', descricao: 'Rolo' },
  { codigo: 'KIT', descricao: 'Kit' },
  { codigo: 'ML', descricao: 'Mililitro' },
  { codigo: 'G', descricao: 'Grama' },
];

/**
 * Motivos de entrada pré-definidos
 */
export const MOTIVOS_ENTRADA = [
  'Compra/Reposição',
  'Devolução de procedimento',
  'Ajuste de inventário',
  'Doação/Bonificação',
  'Outro',
];

/**
 * Motivos de saída pré-definidos
 */
export const MOTIVOS_SAIDA = [
  'Uso em procedimento',
  'Produto vencido (descarte)',
  'Produto danificado',
  'Transferência',
  'Perda/Extravio',
  'Outro',
];
