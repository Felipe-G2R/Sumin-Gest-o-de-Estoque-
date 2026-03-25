// ============================================
// CONSTANTES DO SISTEMA
// ============================================

/**
 * Roles disponíveis para usuários
 */
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

/**
 * Tipos de movimentação
 */
export const TIPO_MOVIMENTACAO = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
};

/**
 * Tipos de notificação
 */
export const TIPO_NOTIFICACAO = {
  VENCIMENTO: 'VENCIMENTO',
  ESTOQUE_BAIXO: 'ESTOQUE_BAIXO',
  SEM_ESTOQUE: 'SEM_ESTOQUE',
};

/**
 * Ações para registro de log
 */
export const ACOES_LOG = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  DEACTIVATE: 'DEACTIVATE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FALHO: 'LOGIN_FALHO',
  ENTRADA_ESTOQUE: 'ENTRADA_ESTOQUE',
  SAIDA_ESTOQUE: 'SAIDA_ESTOQUE',
  ROLE_CHANGED: 'ROLE_CHANGED',
  MARKED_READ: 'MARKED_READ',
  MARKED_ALL_READ: 'MARKED_ALL_READ',
};

/**
 * Entidades rastreáveis por log
 */
export const ENTIDADES = {
  PRODUTO: 'produto',
  FORNECEDOR: 'fornecedor',
  MOVIMENTACAO: 'movimentacao',
  USUARIO: 'usuario',
  NOTIFICACAO: 'notificacao',
  AUTH: 'auth',
};

/**
 * Configurações padrão
 */
export const CONFIG = {
  QUANTIDADE_MINIMA_PADRAO: 5,
  DIAS_ALERTA_VENCIMENTO: [30, 15, 7, 3, 1, 0],
  ITENS_POR_PAGINA: 20,
  MAX_ITENS_POR_PAGINA: 100,
};

/**
 * Tipos de local de estoque
 */
export const TIPO_LOCAL = {
  SALA: 'SALA',
  ARMARIO: 'ARMARIO',
  DEPOSITO: 'DEPOSITO',
  FILIAL: 'FILIAL',
};

/**
 * Status de inventário
 */
export const STATUS_INVENTARIO = {
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
};

/**
 * Classificação ABC
 */
export const CLASSIFICACAO_ABC = {
  A: 'A',
  B: 'B',
  C: 'C',
};

/**
 * Tipos de procedimento odontológico
 */
export const TIPOS_PROCEDIMENTO = [
  'Restauração',
  'Endodontia',
  'Exodontia',
  'Profilaxia',
  'Ortodontia',
  'Periodontia',
  'Implante',
  'Prótese',
  'Clareamento',
  'Radiografia',
  'Consulta/Avaliação',
  'Cirurgia',
  'Outro',
];
