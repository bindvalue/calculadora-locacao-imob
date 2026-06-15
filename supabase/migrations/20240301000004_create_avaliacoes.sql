-- ==============================================================================
-- Criação da tabela: avaliacoes
-- Objetivo: Armazenar as avaliações e notas dos corretores
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    corretor_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    author_name TEXT NOT NULL,
    
    -- Chave Estrangeira vinculando à tabela de corretores
    CONSTRAINT fk_corretor
      FOREIGN KEY(corretor_id) 
      REFERENCES public.corretores(id)
      ON DELETE CASCADE
);