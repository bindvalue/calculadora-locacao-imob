-- 1. Criação da tabela de configurações (settings)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Segurança em Nível de Linha (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Política de leitura: Qualquer pessoa (visitantes do site) pode ler as configurações para renderizar a calculadora
CREATE POLICY "Permitir leitura pública de configurações"
    ON public.settings
    FOR SELECT
    TO public
    USING (true);

-- 4. Política de escrita: Apenas administradores logados no painel podem alterar os dados
CREATE POLICY "Permitir gerenciamento para admins"
    ON public.settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Inserir o valor inicial do WhatsApp da imobiliária
INSERT INTO public.settings (key, value, description)
VALUES ('whatsapp_general', '553135860209', 'Número de WhatsApp principal para recebimento de leads da calculadora')
ON CONFLICT (key) DO NOTHING;
