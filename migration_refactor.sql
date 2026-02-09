-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
ON public.plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
ON public.plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
ON public.plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
ON public.plans FOR DELETE
USING (auth.uid() = user_id);

-- Modify patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('particular', 'plano')) DEFAULT 'particular',
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('ativo', 'inativo', 'alta')) DEFAULT 'ativo';
