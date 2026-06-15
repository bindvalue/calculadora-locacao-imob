-- ==============================================================================
-- Criação da tabela de Perfis/Roles e Inserção do Primeiro Admin
-- ==============================================================================

-- 1. Habilitar a extensão pgcrypto para criptografia de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Criar a tabela de controle de permissões (user_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'corretor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 3. Políticas de Segurança (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura do próprio perfil"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Script para Inserir o Usuário Admin Padrão
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- 4.1 Inserir na tabela nativa do Supabase (auth.users)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated', 
    'admin@sonhoreal.com.br', -- <== TROQUE O E-MAIL AQUI SE DESEJAR
    crypt('Admin123!', gen_salt('bf')), -- <== TROQUE A SENHA AQUI SE DESEJAR
    now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

  -- 4.2 Inserir na tabela de identidades (auth.identities)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(), admin_uid, 
    format('{"sub":"%s","email":"%s"}', admin_uid::text, 'admin@sonhoreal.com.br')::jsonb, 
    'email', now(), now(), now(), admin_uid::text
  );

  -- 4.3 Vincular o usuário à role 'admin' na nossa tabela
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin');
END $$;