-- ==============================================================================
-- MIGRATION: Add dynamic yield and cost controls
-- Objetivo: Tornar o modelo de valuation mais realista (yield dinâmico + uso de NET)
-- ==============================================================================

-- Inserir novas configurações no sistema (settings)

INSERT INTO public.settings (key, value, description)
VALUES 
  ('yield_base', '0.0045', 'Yield base mensal utilizado no cálculo de valuation'),
  ('use_net_for_valuation', 'true', 'Define se o cálculo de valor do imóvel usa Net ao invés de Rent'),
  ('vacancy_rate', '0.08', 'Taxa de vacância média do imóvel'),
  ('cost_penalty_enabled', 'true', 'Ativa penalização por altos custos operacionais')
ON CONFLICT (key) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.settings IS 'Tabela de configurações dinâmicas do sistema, incluindo parâmetros financeiros da calculadora.';