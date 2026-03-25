-- ============================================
-- 003_setup_storage.sql
-- Configuração do Storage para Fotos de Perfil
-- ============================================

-- 1. CRIAR BUCKET (SE NÃO EXISTIR)
-- O bucket 'avatars' será público para leitura, permitindo visualizar fotos via URL direta.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE SEGURANÇA (RLS) PARA O BUCKET 'avatars'
-- Localização: storage.objects

-- Permitir que qualquer pessoa (mesmo não autenticada) veja as fotos de perfil
CREATE POLICY "Avatar público para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload apenas para a sua própria pasta
-- O caminho esperado será: avatars/UID/nome_da_foto.jpg
CREATE POLICY "Usuários autenticados podem fazer upload de seu próprio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários atualizem (sobrescrevam) seu próprio avatar
CREATE POLICY "Usuários autenticados podem atualizar seu próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários deletem seu próprio avatar
CREATE POLICY "Usuários autenticados podem deletar seu próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
