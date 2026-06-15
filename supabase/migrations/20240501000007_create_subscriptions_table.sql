-- Criação da tabela de assinaturas (subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados do sistema de pagamento (Asaas)
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'TRIAL', -- 'TRIAL', 'ACTIVE', 'OVERDUE', 'PENDING', 'CANCELLED'
    
    -- Dados da Empresa/Cliente
    company_name TEXT,
    cpf_cnpj TEXT,
    email TEXT,
    phone TEXT,
    
    -- Dados Financeiros e de Período
    value NUMERIC(10, 2) DEFAULT 75.90,
    trial_start_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Segurança em Nível de Linha (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política de leitura: O usuário autenticado só pode ver a sua própria assinatura
CREATE POLICY "Permitir leitura da própria assinatura"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Nota: Políticas de INSERT e UPDATE geralmente não são necessárias para o cliente web, 
-- pois as inserções/atualizações devem vir da sua Edge Function (asaas-create-customer) 
-- usando a service_role key que ignora o RLS.