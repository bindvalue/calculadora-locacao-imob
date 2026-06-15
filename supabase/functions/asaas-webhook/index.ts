import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Asaas webhook received:', JSON.stringify(payload, null, 2));

    const { event, payment, subscription: subscriptionEvent } = payload;

    // Handle different events
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        // Payment received - activate subscription
        console.log('Payment received for subscription:', payment?.subscription);
        
        if (payment?.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'ACTIVE',
              current_period_end: payment.dueDate,
            })
            .eq('asaas_subscription_id', payment.subscription);
          
          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log('Subscription activated successfully');
          }
        }
        break;
      }

      case 'PAYMENT_OVERDUE': {
        // Payment overdue - mark subscription as overdue
        console.log('Payment overdue for subscription:', payment?.subscription);
        
        if (payment?.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'OVERDUE' })
            .eq('asaas_subscription_id', payment.subscription);
          
          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log('Subscription marked as overdue');
          }
        }
        break;
      }

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED': {
        // Payment deleted/refunded - check if there are active payments
        console.log('Payment deleted/refunded:', payment?.subscription);
        
        if (payment?.subscription) {
          // Mark as overdue for safety - webhook for new payment will reactivate
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'OVERDUE' })
            .eq('asaas_subscription_id', payment.subscription);
          
          if (error) {
            console.error('Error updating subscription:', error);
          }
        }
        break;
      }

      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED': {
        // Subscription cancelled
        console.log('Subscription cancelled:', subscriptionEvent?.id);
        
        if (subscriptionEvent?.id) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'CANCELLED' })
            .eq('asaas_subscription_id', subscriptionEvent.id);
          
          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log('Subscription cancelled successfully');
          }
        }
        break;
      }

      case 'SUBSCRIPTION_CREATED': {
        // Log informativo - assinatura já foi criada via edge function
        console.log('Nova assinatura criada via Asaas:', subscriptionEvent?.id);
        break;
      }

      case 'SUBSCRIPTION_UPDATED': {
        console.log('Assinatura atualizada:', subscriptionEvent?.id, 'Status:', subscriptionEvent?.status);
        
        // Se a assinatura foi inativada, marcar como cancelada
        if (subscriptionEvent?.id && subscriptionEvent?.status === 'INACTIVE') {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'CANCELLED' })
            .eq('asaas_subscription_id', subscriptionEvent.id);
          
          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log('Subscription marked as cancelled due to INACTIVE status');
          }
        }
        break;
      }

      default:
        console.log('Unhandled event:', event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in asaas-webhook:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
