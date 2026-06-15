"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import logoPurple from '@/assets/logo-sonho-real-purple.png';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({
          title: 'Erro de validação',
          description: validation.error.errors[0].message,
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(email, password);

      if (error) {
        let message = error.message;
        if (error.message.includes('Invalid login credentials')) {
          message = 'Credenciais inválidas. Verifique seu e-mail e senha.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Por favor, confirme seu e-mail antes de fazer login.';
        }
        
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-[#6E2FAE] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-[#B475F3] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none"></div>

      <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 text-gray-500 hover:text-[#6E2FAE] transition-colors font-medium z-20">
        <ArrowLeft className="w-5 h-5" /> Voltar ao site
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <img src={logoPurple.src} alt="Sonho Real Netimóveis" className="h-16 object-contain" />
        </div>

        <div className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] p-6 sm:p-8 bg-white/80 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-[#1D1D1F] text-center mb-2">Acesso Restrito</h1>
          <p className="text-base text-[#86868B] text-center mb-8">
            Insira suas credenciais para gerenciar a plataforma.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sonhoreal.com.br"
                  required
                  className="h-14 pl-12 bg-white border-[#E5E5EA] rounded-2xl focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 text-base shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 ml-1">Senha</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[#6E2FAE] hover:underline">
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-14 pl-12 bg-white border-[#E5E5EA] rounded-2xl focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 text-base shadow-sm"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-full bg-[#6E2FAE] hover:bg-[#5a268f] text-white font-semibold text-lg transition-all shadow-sm hover:-translate-y-1 mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
