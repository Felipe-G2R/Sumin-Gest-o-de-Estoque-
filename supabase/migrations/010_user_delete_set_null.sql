-- =============================================
-- 010_user_delete_set_null.sql
-- Permite hard delete de usuários sem perder histórico de auditoria.
-- FKs em movimentacoes/logs/inventarios passam para ON DELETE SET NULL,
-- preservando a linha mas anonimizando o autor (usuario_id = NULL).
-- =============================================

-- movimentacoes.usuario_id
ALTER TABLE movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_usuario_id_fkey;
ALTER TABLE movimentacoes
  ADD CONSTRAINT movimentacoes_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL;

-- logs.usuario_id
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_usuario_id_fkey;
ALTER TABLE logs
  ADD CONSTRAINT logs_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL;

-- inventarios.usuario_id
ALTER TABLE inventarios DROP CONSTRAINT IF EXISTS inventarios_usuario_id_fkey;
ALTER TABLE inventarios
  ADD CONSTRAINT inventarios_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- FIM 010
-- =============================================
