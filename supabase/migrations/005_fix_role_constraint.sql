-- ============================================
-- 005_fix_role_constraint.sql
-- Relaxa e corrige a constraint de roles para aceitar variações comuns
-- ============================================

-- 1. Remover a constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Adicionar nova constraint que aceita 'ADMIN', 'USER' e 'ADM' (normalizando para os nomes corretos)
-- Nota: O ideal é manter ADMIN e USER, mas vamos permitir ADM como alias se necessário na inserção.
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('USER', 'ADMIN', 'ADM'));

-- 3. Opcional: Converter qualquer 'ADM' existente para 'ADMIN' para manter consistência
UPDATE users SET role = 'ADMIN' WHERE role = 'ADM';
