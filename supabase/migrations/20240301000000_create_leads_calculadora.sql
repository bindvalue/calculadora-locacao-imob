-- ==============================================================================
-- Criação da tabela: leads_calculadora
-- Objetivo: Armazenar as simulações e contatos gerados pela Landpage
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.leads_calculadora (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Dados de Contato
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    relacao_imovel TEXT NOT NULL,
    tempo_estimado TEXT,
    
    -- Endereço
    cep TEXT NOT NULL,
    estado TEXT NOT NULL,
    cidade TEXT NOT NULL,
    bairro TEXT NOT NULL,
    rua TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    
    -- Características do Imóvel
    tipo_imovel TEXT NOT NULL,
    area_m2 NUMERIC NOT NULL,
    valor_venda NUMERIC NOT NULL,
    quartos INTEGER DEFAULT 0,
    suites INTEGER DEFAULT 0,
    banheiros INTEGER DEFAULT 0,
    vagas INTEGER DEFAULT 0,
    
    -- Custos
    valor_condominio NUMERIC DEFAULT 0,
    paga_iptu BOOLEAN DEFAULT false,
    valor_iptu_anual NUMERIC DEFAULT 0,
    
    -- Resultados da Simulação (O que a inteligência gerou)
    aluguel_bruto NUMERIC NOT NULL,
    aluguel_liquido NUMERIC NOT NULL,
    yield_liquido NUMERIC NOT NULL,
    
    -- Controle Interno do Painel Admin
    status TEXT DEFAULT 'Novo'
);

-- Comentários para documentação no banco de dados
COMMENT ON TABLE public.leads_calculadora IS 'Armazena os leads (potenciais clientes) gerados pela Calculadora de Locação.';