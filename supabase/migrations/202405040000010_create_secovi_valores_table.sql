-- 1. Criação da tabela para armazenar os valores do Secovi por bairro
CREATE TABLE IF NOT EXISTS public.secovi_valores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bairro TEXT NOT NULL,
    valor_min NUMERIC NOT NULL,
    valor_max NUMERIC NOT NULL,
    valor_default NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Segurança em Nível de Linha (RLS)
ALTER TABLE public.secovi_valores ENABLE ROW LEVEL SECURITY;

-- 3. Permitir leitura pública (para a calculadora usar os dados sem estar logada)
CREATE POLICY "Permitir leitura pública"
    ON public.secovi_valores
    FOR SELECT TO public USING (true);

-- 4. Permitir gerenciamento total apenas para administradores logados
CREATE POLICY "Permitir gerenciamento para admins"
    ON public.secovi_valores
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);