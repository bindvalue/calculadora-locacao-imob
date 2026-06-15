-- ==============================================================================
-- Políticas RLS: leads_calculadora
-- ==============================================================================

-- 1. Habilitar o RLS na tabela
ALTER TABLE public.leads_calculadora ENABLE ROW LEVEL SECURITY;

-- 2. Política de Inserção: Permite que visitantes anônimos (do site) enviem dados
CREATE POLICY "Permitir inserção anônima de leads"
    ON public.leads_calculadora
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 3. Política de Leitura: Apenas usuários logados no painel Admin podem ler os leads
CREATE POLICY "Permitir leitura apenas para usuários autenticados"
    ON public.leads_calculadora
    FOR SELECT
    TO authenticated
    USING (true);