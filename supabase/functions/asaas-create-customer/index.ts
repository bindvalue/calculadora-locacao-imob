import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = 'https://api.asaas.com/v3';
const TRIAL_DAYS = 14;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      console.error('ASAAS_API_KEY not configured');
      throw new Error('Configuração do Asaas não encontrada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Usuário não encontrado');
    }

    const { name, cpfCnpj, email, phone, companyName, startTrial } = await req.json();

    console.log('Creating Asaas customer:', { name, cpfCnpj, email, phone, companyName, startTrial });

    // Create customer in Asaas
    const asaasResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        name: companyName || name,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
        email,
        phone: phone?.replace(/\D/g, ''),
        notificationDisabled: false,
      }),
    });

    const asaasData = await asaasResponse.json();
    console.log('Asaas response:', asaasData);

    if (!asaasResponse.ok) {
      console.error('Asaas error:', asaasData);
      throw new Error(asaasData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    // Create subscription record with TRIAL status if startTrial is true
    const subscriptionData = {
      user_id: user.id,
      asaas_customer_id: asaasData.id,
      company_name: companyName || name,
      cpf_cnpj: cpfCnpj,
      email,
      phone,
      status: startTrial ? 'TRIAL' : 'PENDING',
      trial_ends_at: startTrial ? trialEndsAt.toISOString() : null,
    };

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription error:', subError);
      throw new Error('Erro ao salvar dados da assinatura');
    }

    console.log('Subscription created:', subscription);

    // Assign admin role to the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin',
      }, {
        onConflict: 'user_id,role',
      });

    if (roleError) {
      console.error('Role error:', roleError);
      // Don't throw here, subscription was created successfully
      console.warn('Warning: Could not assign admin role');
    } else {
      console.log('Admin role assigned to user:', user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: asaasData.id,
        subscription,
        trialEndsAt: startTrial ? trialEndsAt.toISOString() : null,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in asaas-create-customer:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
