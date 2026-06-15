-- Adiciona a coluna 'visualizado' na tabela de leads
ALTER TABLE public.leads_calculadora ADD COLUMN IF NOT EXISTS visualizado BOOLEAN DEFAULT false;

-- Permite que administradores possam atualizar o status do lead (caso ainda não exista a política)
DO $$ 
BEGIN
    CREATE POLICY "Permitir update para admins" ON public.leads_calculadora FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;