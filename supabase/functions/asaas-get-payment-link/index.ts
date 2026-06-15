import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = 'https://api.asaas.com/v3';

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

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.asaas_subscription_id) {
      console.error('Subscription error:', subError);
      throw new Error('Assinatura não encontrada');
    }

    console.log('Getting payment link for subscription:', subscription.asaas_subscription_id);

    // Get pending payments for this subscription
    const paymentsResponse = await fetch(
      `${ASAAS_API_URL}/payments?subscription=${subscription.asaas_subscription_id}&status=PENDING&status=OVERDUE`,
      {
        headers: {
          'access_token': asaasApiKey,
        },
      }
    );

    const paymentsData = await paymentsResponse.json();
    console.log('Payments data:', paymentsData);

    if (!paymentsResponse.ok) {
      console.error('Asaas error:', paymentsData);
      throw new Error('Erro ao buscar pagamentos');
    }

    // Get the first pending/overdue payment
    const payment = paymentsData.data?.[0];
    
    if (!payment) {
      // No pending payments, check for all payments
      const allPaymentsResponse = await fetch(
        `${ASAAS_API_URL}/payments?subscription=${subscription.asaas_subscription_id}&limit=1`,
        {
          headers: {
            'access_token': asaasApiKey,
          },
        }
      );
      
      const allPaymentsData = await allPaymentsResponse.json();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentLink: allPaymentsData.data?.[0]?.invoiceUrl || null,
          status: subscription.status,
          message: 'Nenhum pagamento pendente encontrado',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentLink: payment.invoiceUrl,
        paymentId: payment.id,
        value: payment.value,
        dueDate: payment.dueDate,
        status: payment.status,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in asaas-get-payment-link:', error);
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
