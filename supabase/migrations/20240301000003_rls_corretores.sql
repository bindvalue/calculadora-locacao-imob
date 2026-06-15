-- ==============================================================================
-- Políticas RLS: corretores
-- ==============================================================================

ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;

-- 1. Política de Leitura: Todos podem ver os corretores (pois aparecem no site público)
CREATE POLICY "Permitir leitura pública de corretores"
    ON public.corretores
    FOR SELECT
    TO public
    USING (true);

-- 2. Política de Modificação: Apenas administradores autenticados podem inserir/editar/deletar
CREATE POLICY "Permitir modificação apenas por administradores"
    ON public.corretores
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);