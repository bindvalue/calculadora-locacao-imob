"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, AlertCircle, XCircle, Loader2, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import AdminFooter from '@/components/AdminFooter';

const Subscription: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    subscription, 
    isActive, 
    isOverdue, 
    isPending, 
    isCancelled, 
    isInTrial,
    trialDaysLeft,
    isLoading, 
    getPaymentLink,
    startSubscriptionNow 
  } = useSubscription();
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

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

  const handleSubscribeNow = async () => {
    setLoadingSubscribe(true);
    try {
      const result = await startSubscriptionNow();
      
      if (result.success && result.paymentLink) {
        toast.success('Link de pagamento gerado!', {
          description: 'Você será redirecionado para a página de pagamento.',
        });
        window.open(result.paymentLink, '_blank');
      } else {
        toast.error('Erro ao gerar link de pagamento', {
          description: result.error || 'Tente novamente mais tarde.',
        });
      }
    } catch (error) {
      toast.error('Erro ao processar solicitação');
    } finally {
      setLoadingSubscribe(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = () => {
    if (isInTrial) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <Clock className="mr-1 h-3 w-3" />
          Período de Testes
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          Ativa
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Vencida
        </Badge>
      );
    }
    if (isPending) {
      return (
        <Badge variant="secondary">
          <Calendar className="mr-1 h-3 w-3" />
          Aguardando Pagamento
        </Badge>
      );
    }
    if (isCancelled) {
      return (
        <Badge variant="outline">
          <XCircle className="mr-1 h-3 w-3" />
          Cancelada
        </Badge>
      );
    }
    return null;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Painel
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Minha Assinatura</CardTitle>
                  <CardDescription>Gerencie sua assinatura da plataforma</CardDescription>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Imobiliária</p>
                      <p className="font-medium">{subscription.company_name || '-'}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-medium">{subscription.cpf_cnpj || '-'}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Valor Mensal</p>
                      <p className="font-medium text-primary">
                        R$ {Number(subscription.value).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">
                        {isInTrial ? 'Período de Testes até' : 'Próximo Vencimento'}
                      </p>
                      <p className="font-medium">
                        {isInTrial 
                          ? formatDate(subscription.trial_ends_at)
                          : formatDate(subscription.current_period_end)
                        }
                      </p>
                    </div>
                  </div>

                  {/* Seção para usuários em Trial */}
                  {isInTrial && (
                    <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        <p className="font-medium text-blue-600 dark:text-blue-400">
                          Período de Testes Gratuito
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Você está aproveitando <strong>{trialDaysLeft} dias</strong> restantes do período gratuito.
                        Não quer esperar? Assine agora e garanta acesso ininterrupto à plataforma.
                      </p>
                      <Button 
                        onClick={handleSubscribeNow}
                        disabled={loadingSubscribe}
                        className="w-full sm:w-auto"
                      >
                        {loadingSubscribe ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando link...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Assinar Agora - R$ 75,90/mês
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {(isOverdue || isPending) && !isInTrial && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="font-medium text-destructive">
                          {isOverdue ? 'Pagamento em Atraso' : 'Pagamento Pendente'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isOverdue 
                          ? 'Sua assinatura está vencida. Regularize para continuar usando a plataforma.'
                          : 'Complete o pagamento para ativar sua assinatura.'}
                      </p>
                      {loadingLink ? (
                        <Button disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregando...
                        </Button>
                      ) : paymentLink ? (
                        <Button asChild>
                          <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pagar Agora - R$ 75,90
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  )}

                  {isActive && !isInTrial && (
                    <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="font-medium text-green-600 dark:text-green-400">Assinatura Ativa</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Você tem acesso completo a todas as funcionalidades da plataforma.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Criada em: {formatDate(subscription.created_at)}
                      <br />
                      E-mail: {subscription.email || user?.email || '-'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Você ainda não possui uma assinatura.
                  </p>
                  <Button asChild>
                    <a href="/cadastro">Assinar Agora - R$ 75,90/mês</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AdminFooter />
    </div>
  );
};

export default Subscription;