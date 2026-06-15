-- ==============================================================================
-- Políticas RLS: avaliacoes
-- ==============================================================================

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- 1. Política de Leitura: Todos (público) podem ler as avaliações
CREATE POLICY "Permitir leitura pública de avaliações"
    ON public.avaliacoes
    FOR SELECT
    TO public
    USING (true);

-- 2. Política de Inserção: Anônimos ou usuários podem inserir avaliações
CREATE POLICY "Permitir inserção pública de avaliações"
    ON public.avaliacoes
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Deleção/Atualização não permitidas publicamente (apenas super admin dashboard se configurado)