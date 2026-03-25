-- ============================================
-- LogControl — Script de criação do banco de dados
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard → SQL Editor → New query → Cole e execute

-- ============================================
-- 1. TABELA: users (perfil dos usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. TABELA: fornecedores
-- ============================================
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. TABELA: produtos
-- ============================================
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_barras TEXT UNIQUE,
  fornecedor_id UUID REFERENCES fornecedores(id),
  categoria TEXT,
  unidade_medida TEXT NOT NULL DEFAULT 'UN',
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 5,
  preco_unitario DECIMAL(10, 2),
  lote TEXT,
  data_validade DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. TABELA: movimentacoes
-- ============================================
CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  usuario_id UUID NOT NULL REFERENCES users(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo TEXT,
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. TABELA: notificacoes
-- ============================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('VENCIMENTO', 'ESTOQUE_BAIXO', 'SEM_ESTOQUE')),
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. TABELA: logs (auditoria)
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES users(id),
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES (performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_validade ON produtos(data_validade);
CREATE INDEX IF NOT EXISTS idx_produtos_quantidade ON produtos(quantidade_atual);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario ON movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_criado ON movimentacoes(criado_em);

CREATE INDEX IF NOT EXISTS idx_notificacoes_produto ON notificacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);

CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs(acao);
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON logs(entidade);
CREATE INDEX IF NOT EXISTS idx_logs_criado ON logs(criado_em);

-- ============================================
-- TRIGGER: Atualiza atualizado_em automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_users_atualizado
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE OR REPLACE TRIGGER trigger_fornecedores_atualizado
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE OR REPLACE TRIGGER trigger_produtos_atualizado
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Habilita RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ler/escrever
-- (controle mais granular de ADMIN é feito no frontend/services)

-- USERS
CREATE POLICY "Users podem ver todos os perfis" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users podem atualizar seu próprio perfil" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users podem inserir seu perfil" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ADMINs podem atualizar qualquer user (via service_role no backend)
CREATE POLICY "Admin pode atualizar qualquer user" ON users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- FORNECEDORES
CREATE POLICY "Autenticados podem ler fornecedores" ON fornecedores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar fornecedores" ON fornecedores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar fornecedores" ON fornecedores
  FOR UPDATE TO authenticated USING (true);

-- PRODUTOS
CREATE POLICY "Autenticados podem ler produtos" ON produtos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar produtos" ON produtos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar produtos" ON produtos
  FOR UPDATE TO authenticated USING (true);

-- MOVIMENTACOES
CREATE POLICY "Autenticados podem ler movimentacoes" ON movimentacoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar movimentacoes" ON movimentacoes
  FOR INSERT TO authenticated WITH CHECK (true);

-- NOTIFICACOES
CREATE POLICY "Autenticados podem ler notificacoes" ON notificacoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar notificacoes" ON notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar notificacoes" ON notificacoes
  FOR UPDATE TO authenticated USING (true);

-- LOGS
CREATE POLICY "Autenticados podem criar logs" ON logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin pode ler logs" ON logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================
-- FUNÇÃO: Verificar vencimentos (para CRON)
-- ============================================
CREATE OR REPLACE FUNCTION verificar_vencimentos()
RETURNS void AS $$
BEGIN
  INSERT INTO notificacoes (produto_id, tipo, mensagem)
  SELECT 
    p.id,
    'VENCIMENTO',
    'Produto "' || p.nome || '" (Lote: ' || COALESCE(p.lote, 'N/A') || ') vence em ' 
      || (p.data_validade - CURRENT_DATE) || ' dias.'
  FROM produtos p
  WHERE p.ativo = true
    AND p.data_validade IS NOT NULL
    AND (p.data_validade - CURRENT_DATE) IN (30, 15, 7, 3, 1, 0)
    AND NOT EXISTS (
      SELECT 1 FROM notificacoes n 
      WHERE n.produto_id = p.id 
        AND n.tipo = 'VENCIMENTO'
        AND DATE(n.criado_em) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Para agendar execução diária, use Supabase pg_cron:
-- SELECT cron.schedule('verificar-vencimentos', '0 8 * * *', 'SELECT verificar_vencimentos()');
