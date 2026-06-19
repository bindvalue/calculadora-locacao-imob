-- ==============================================================================
-- MIGRATION: Add yield fields to secovi_valores (unified pricing model)
-- ==============================================================================

ALTER TABLE public.secovi_valores
ADD COLUMN IF NOT EXISTS yield_min NUMERIC,
ADD COLUMN IF NOT EXISTS yield_max NUMERIC,
ADD COLUMN IF NOT EXISTS yield_default NUMERIC;

-- Valores padrão iniciais (fallback seguro baseado no yield global)
UPDATE public.secovi_valores
SET 
  yield_min = COALESCE(yield_min, 0.0035),
  yield_max = COALESCE(yield_max, 0.0065),
  yield_default = COALESCE(yield_default, 0.0045);

COMMENT ON COLUMN public.secovi_valores.yield_default IS 'Yield padrão mensal utilizado no valuation por bairro';