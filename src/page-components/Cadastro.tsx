"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Cadastro: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'account' | 'company'>('account');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    cpfCnpj: '',
    phone: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value);
    setFormData((prev) => ({ ...prev, cpfCnpj: formatted }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não coincidem.',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    setStep('company');
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cpfCnpjNumbers = formData.cpfCnpj.replace(/\D/g, '');
    if (cpfCnpjNumbers.length !== 11 && cpfCnpjNumbers.length !== 14) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'CPF ou CNPJ inválido.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // 2. Get session for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      
      // 3. Create customer in Asaas and subscription with TRIAL status
      const customerResponse = await supabase.functions.invoke('asaas-create-customer', {
        body: {
          name: formData.companyName,
          cpfCnpj: formData.cpfCnpj,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          startTrial: true, // Flag to start trial period
        },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });

      if (customerResponse.error) {
        console.error('Customer error:', customerResponse.error);
        throw new Error('Erro ao criar cliente no sistema de pagamentos');
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você tem 14 dias de teste grátis. Aproveite!',
      });

      // Redirect to admin panel (user is already in trial)
      router.push('/admin');

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Cadastro de Imobiliária</CardTitle>
          <CardDescription>
            {step === 'account' 
              ? 'Crie sua conta para começar'
              : 'Dados da sua imobiliária'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6">
            <div className={`h-2 w-16 rounded-full ${step === 'account' ? 'bg-primary' : 'bg-primary/30'}`} />
            <div className={`h-2 w-16 rounded-full ${step === 'company' ? 'bg-primary' : 'bg-primary/30'}`} />
          </div>

          {step === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continuar
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Já tenho conta
              </Button>
            </form>
          )}

          {step === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Imobiliária</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Sua Imobiliária LTDA"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  name="cpfCnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cpfCnpj}
                  onChange={handleCpfCnpjChange}
                  maxLength={18}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength={15}
                  required
                />
              </div>

              {/* Trial info instead of price */}
              <div className="rounded-lg bg-primary/10 p-4 text-center border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <p className="font-medium text-primary">14 dias grátis!</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Teste todas as funcionalidades sem compromisso.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Após o período de teste: R$ 75,90/mês
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Iniciar Teste Grátis'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('account')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
