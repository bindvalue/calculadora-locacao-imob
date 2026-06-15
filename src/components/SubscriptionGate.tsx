import React, { useState, useEffect } from 'react';
import { AlertCircle, CreditCard, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

// Trial banner component
const TrialBanner: React.FC<{ daysLeft: number }> = ({ daysLeft }) => {
  return (
    <Alert className="mb-4 border-primary/50 bg-primary/10">
      <Clock className="h-4 w-4 text-primary" />
      <AlertDescription className="text-sm">
        <span className="font-medium">Período de teste:</span> Você tem{' '}
        <span className="font-bold text-primary">{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</span>{' '}
        restantes. Após esse período, será necessário assinar para continuar usando a plataforma.
      </AlertDescription>
    </Alert>
  );
};

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { subscription, isActive, isOverdue, isPending, isInTrial, trialDaysLeft, isLoading, getPaymentLink } = useSubscription();
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);

  useEffect(() => {
    const fetchPaymentLink = async () => {
      if (isOverdue || isPending) {
        setLoadingLink(true);
        const link = await getPaymentLink();
        setPaymentLink(link);
        setLoadingLink(false);
      }
    };

    fetchPaymentLink();
  }, [isOverdue, isPending, getPaymentLink]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // If subscription is active (including valid trial), render children
  if (isActive) {
    return (
      <>
        {isInTrial && trialDaysLeft > 0 && <TrialBanner daysLeft={trialDaysLeft} />}
        {children}
      </>
    );
  }

  // If subscription is overdue (including expired trial) or pending, show payment screen
  if (isOverdue || isPending) {
    const isTrialExpired = subscription?.status === 'TRIAL';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">
              {isTrialExpired 
                ? 'Período de Teste Encerrado' 
                : isOverdue 
                  ? 'Pagamento Pendente' 
                  : 'Aguardando Pagamento'}
            </CardTitle>
            <CardDescription>
              {isTrialExpired
                ? 'Seu período de teste de 14 dias terminou. Assine agora para continuar usando a plataforma.'
                : isOverdue
                  ? 'Sua assinatura está vencida. Regularize o pagamento para continuar usando a plataforma.'
                  : 'Complete o pagamento para ativar sua assinatura e começar a usar a plataforma.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Valor da mensalidade</p>
              <p className="text-3xl font-bold text-primary">R$ 75,90</p>
              <p className="text-xs text-muted-foreground mt-1">por mês</p>
            </div>

            {loadingLink ? (
              <Button disabled className="w-full" size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </Button>
            ) : paymentLink ? (
              <Button
                asChild
                className="w-full"
                size="lg"
              >
                <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isTrialExpired ? 'Assinar Agora' : 'Regularizar Agora'}
                </a>
              </Button>
            ) : (
              <Button asChild className="w-full" size="lg">
                <a href="/assinatura">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ver Opções de Pagamento
                </a>
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Após o pagamento, sua assinatura será ativada automaticamente.
              <br />
              Dúvidas? Entre em contato pelo WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no subscription or cancelled, show subscription required message
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
          <CardDescription>
            Para acessar esta área, você precisa ter uma assinatura ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Plano mensal</p>
            <p className="text-3xl font-bold text-primary">R$ 75,90</p>
            <p className="text-xs text-muted-foreground mt-1">/mês</p>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Acesso completo à plataforma
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Gerenciamento de corretores
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Sistema de avaliações
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Suporte prioritário
            </li>
          </ul>

          <Button asChild className="w-full" size="lg">
            <a href="/cadastro">Assinar Agora</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;
