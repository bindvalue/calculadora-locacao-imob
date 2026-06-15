import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = 'https://api.asaas.com/v3';
const SUBSCRIPTION_VALUE = 75.90;

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

    const { billingType = 'UNDEFINED', immediate = false } = await req.json();

    // Get subscription with customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription error:', subError);
      throw new Error('Assinatura não encontrada. Cadastre-se primeiro.');
    }

    let customerId = subscription.asaas_customer_id;

    // If no Asaas customer exists, create one now (for trial users)
    if (!customerId) {
      console.log('Creating Asaas customer for trial user');
      
      // Verify required data
      if (!subscription.cpf_cnpj || !subscription.email) {
        throw new Error('Dados incompletos. Atualize seu cadastro.');
      }
      
      // Create customer in Asaas
      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: subscription.company_name || subscription.email,
          cpfCnpj: subscription.cpf_cnpj.replace(/\D/g, ''),
          email: subscription.email,
          phone: subscription.phone?.replace(/\D/g, '') || null,
          notificationDisabled: false,
        }),
      });

      const customerData = await customerResponse.json();
      console.log('Asaas customer response:', customerData);
      
      if (!customerResponse.ok) {
        console.error('Asaas customer error:', customerData);
        throw new Error(customerData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
      }
      
      customerId = customerData.id;
      
      // Update subscription with customer_id
      const { error: customerUpdateError } = await supabase
        .from('subscriptions')
        .update({ asaas_customer_id: customerId })
        .eq('user_id', user.id);
        
      if (customerUpdateError) {
        console.error('Customer update error:', customerUpdateError);
      }
      
      console.log('Customer created and saved:', customerId);
    }

    // Check if subscription already exists in Asaas
    if (subscription.asaas_subscription_id) {
      console.log('Subscription already exists, getting payment link');
      // Get payment link for existing subscription
      const paymentsResponse = await fetch(
        `${ASAAS_API_URL}/payments?subscription=${subscription.asaas_subscription_id}&limit=1`,
        {
          headers: {
            'access_token': asaasApiKey,
          },
        }
      );

      const paymentsData = await paymentsResponse.json();
      const paymentLink = paymentsData.data?.[0]?.invoiceUrl || null;

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscriptionId: subscription.asaas_subscription_id,
          paymentLink,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('Creating Asaas subscription for customer:', customerId);

    // Calculate next due date
    // If immediate = true (user wants to pay now), set to today
    // Otherwise, set to 7 days from now
    const nextDueDate = new Date();
    if (!immediate) {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    }
    const formattedDate = nextDueDate.toISOString().split('T')[0];

    // Create subscription in Asaas
    const asaasResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType, // BOLETO, CREDIT_CARD, PIX or UNDEFINED (customer chooses)
        value: SUBSCRIPTION_VALUE,
        nextDueDate: formattedDate,
        cycle: 'MONTHLY',
        description: 'Assinatura Mensal - Plataforma Sonho Real',
        maxPayments: null, // Indefinite
      }),
    });

    const asaasData = await asaasResponse.json();
    console.log('Asaas subscription response:', asaasData);

    if (!asaasResponse.ok) {
      console.error('Asaas error:', asaasData);
      throw new Error(asaasData.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas');
    }

    // Update subscription record
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        asaas_subscription_id: asaasData.id,
        billing_type: billingType,
        status: 'PENDING',
        current_period_end: asaasData.nextDueDate,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Erro ao atualizar assinatura');
    }

    // Get payment link for first payment
    const paymentsResponse = await fetch(
      `${ASAAS_API_URL}/payments?subscription=${asaasData.id}&limit=1`,
      {
        headers: {
          'access_token': asaasApiKey,
        },
      }
    );

    const paymentsData = await paymentsResponse.json();
    console.log('Payments data:', paymentsData);

    let paymentLink = null;
    if (paymentsData.data?.[0]) {
      paymentLink = paymentsData.data[0].invoiceUrl;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscriptionId: asaasData.id,
        paymentLink,
        nextDueDate: asaasData.nextDueDate,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in asaas-create-subscription:', error);
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
