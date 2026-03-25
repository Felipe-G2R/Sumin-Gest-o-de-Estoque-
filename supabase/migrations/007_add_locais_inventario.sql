-- ============================================
-- LogControl — Locais de Estoque + Inventário Físico
-- Migration 007: Novas tabelas e colunas
-- ============================================

-- ============================================
-- 1. TABELA: locais (locais de estoque)
-- ============================================
CREATE TABLE IF NOT EXISTS locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'SALA' CHECK (tipo IN ('SALA', 'ARMARIO', 'DEPOSITO', 'FILIAL')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locais_ativo ON locais(ativo);
CREATE INDEX IF NOT EXISTS idx_locais_tipo ON locais(tipo);

-- Trigger atualizado_em
CREATE OR REPLACE TRIGGER trigger_locais_atualizado
  BEFORE UPDATE ON locais
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- RLS
ALTER TABLE locais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler locais" ON locais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar locais" ON locais
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar locais" ON locais
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- 2. ADD local_id FK nos produtos
-- ============================================
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES locais(id);
CREATE INDEX IF NOT EXISTS idx_produtos_local ON produtos(local_id);

-- ============================================
-- 3. ADD campos extras ao perfil do usuário
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cro TEXT;

-- ============================================
-- 4. TABELA: inventarios (sessões de inventário físico)
-- ============================================
CREATE TABLE IF NOT EXISTS inventarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO')),
  local_id UUID REFERENCES locais(id),
  usuario_id UUID NOT NULL REFERENCES users(id),
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventarios_status ON inventarios(status);
CREATE INDEX IF NOT EXISTS idx_inventarios_usuario ON inventarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_local ON inventarios(local_id);

-- Trigger atualizado_em
CREATE OR REPLACE TRIGGER trigger_inventarios_atualizado
  BEFORE UPDATE ON inventarios
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- RLS
ALTER TABLE inventarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler inventarios" ON inventarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar inventarios" ON inventarios
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar inventarios" ON inventarios
  FOR UPDATE TO authenticated USING (true);

-- ============================================
-- 5. TABELA: inventario_itens (contagem por produto)
-- ============================================
CREATE TABLE IF NOT EXISTS inventario_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade_sistema INTEGER NOT NULL DEFAULT 0,
  quantidade_contada INTEGER,
  diferenca INTEGER GENERATED ALWAYS AS (COALESCE(quantidade_contada, 0) - quantidade_sistema) STORED,
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_itens_inventario ON inventario_itens(inventario_id);
CREATE INDEX IF NOT EXISTS idx_inventario_itens_produto ON inventario_itens(produto_id);

-- Unique constraint: um produto por inventário
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventario_itens_unique
  ON inventario_itens(inventario_id, produto_id);

-- RLS
ALTER TABLE inventario_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler inventario_itens" ON inventario_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem criar inventario_itens" ON inventario_itens
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar inventario_itens" ON inventario_itens
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticados podem deletar inventario_itens" ON inventario_itens
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- Políticas de leitura de logs para todos (acesso próprio)
-- ============================================
-- Permite que usuários vejam seus próprios logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'logs' AND policyname = 'Users podem ler seus próprios logs'
  ) THEN
    CREATE POLICY "Users podem ler seus próprios logs" ON logs
      FOR SELECT TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;
