-- ==============================================================================
-- Criação da tabela: corretores
-- Objetivo: Armazenar a lista de especialistas do painel
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.corretores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    creci TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    foto_url TEXT
);

-- Comentários
COMMENT ON TABLE public.corretores IS 'Armazena o catálogo de corretores especialistas exibidos na plataforma.';