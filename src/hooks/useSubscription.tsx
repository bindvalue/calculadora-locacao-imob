import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  user_id: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  status: 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'CANCELLED' | 'TRIAL';
  billing_type: string | null;
  value: number;
  current_period_end: string | null;
  trial_ends_at: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isActive: boolean;
  isOverdue: boolean;
  isPending: boolean;
  isCancelled: boolean;
  isInTrial: boolean;
  trialDaysLeft: number;
  isLoading: boolean;
  hasSubscription: boolean;
  checkSubscription: () => Promise<void>;
  getPaymentLink: () => Promise<string | null>;
  startSubscriptionNow: () => Promise<{ success: boolean; paymentLink?: string; error?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  const checkSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
      } else {
        setSubscription(data as Subscription | null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentLink = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('asaas-get-payment-link', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Error getting payment link:', response.error);
        return null;
      }

      return response.data?.paymentLink || null;
    } catch (error) {
      console.error('Error getting payment link:', error);
      return null;
    }
  };

  const startSubscriptionNow = async (): Promise<{ success: boolean; paymentLink?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Sessão expirada' };

      const response = await supabase.functions.invoke('asaas-create-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          billingType: 'UNDEFINED',
          immediate: true 
        },
      });

      if (response.error) {
        console.error('Error creating subscription:', response.error);
        return { success: false, error: response.error.message };
      }

      if (!response.data?.success) {
        return { success: false, error: response.data?.error || 'Erro ao criar assinatura' };
      }

      // Refresh subscription data
      await checkSubscription();

      return { 
        success: true, 
        paymentLink: response.data.paymentLink 
      };
    } catch (error) {
      console.error('Error starting subscription:', error);
      return { success: false, error: 'Erro ao iniciar assinatura' };
    }
  };

  useEffect(() => {
    if (!authLoading) {
      checkSubscription();
    }
  }, [user, authLoading]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription change:', payload);
          if (payload.eventType === 'DELETE') {
            setSubscription(null);
          } else {
            setSubscription(payload.new as Subscription);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check if user is in active trial period
  const isInTrial = subscription?.status === 'TRIAL' && 
    subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) > new Date();

  // Calculate days left in trial
  const trialDaysLeft = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // isActive includes both ACTIVE status and valid trial
  const isActive = subscription?.status === 'ACTIVE' || isInTrial;
  const isOverdue = subscription?.status === 'OVERDUE';
  const isPending = subscription?.status === 'PENDING';
  const isCancelled = subscription?.status === 'CANCELLED';
  
  // Trial expired but not paid
  const trialExpired = subscription?.status === 'TRIAL' && 
    subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) <= new Date();
  
  const hasSubscription = !!subscription;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isActive,
        isOverdue: isOverdue || trialExpired,
        isPending,
        isCancelled,
        isInTrial: !!isInTrial,
        trialDaysLeft,
        isLoading: isLoading || authLoading,
        hasSubscription,
        checkSubscription,
        getPaymentLink,
        startSubscriptionNow,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
