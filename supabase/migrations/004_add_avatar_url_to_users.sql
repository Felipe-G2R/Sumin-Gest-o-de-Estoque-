-- ============================================
-- 004_add_avatar_url_to_users.sql
-- Adiciona coluna avatar_url na tabela de usuários
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentário para documentar a coluna
COMMENT ON COLUMN users.avatar_url IS 'URL pública da foto de perfil armazenada no Supabase Storage';
