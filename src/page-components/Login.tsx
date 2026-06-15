"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoPurple from "@/assets/logo-sonho-real-purple.png";

const Login: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o e-mail e a senha.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao painel de controle.",
        });
        
        // Redireciona o usuário para o painel admin
        router.push("/admin");
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: error.message === "Invalid login credentials" 
          ? "E-mail ou senha incorretos." 
          : "Ocorreu um erro ao tentar fazer login.",
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

      <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 text-gray-500 hover:text-[#6E2FAE] transition-colors font-medium">
        <ArrowLeft className="w-5 h-5" /> Voltar ao site
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <img src={logoPurple.src} alt="Sonho Real Netimóveis" className="h-16 object-contain" />
        </div>

        <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] p-4 sm:p-6 bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-bold text-[#1D1D1F]">Acesso Restrito</CardTitle>
            <CardDescription className="text-base text-[#86868B]">
              Insira suas credenciais para gerenciar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input id="email" type="email" placeholder="admin@sonhoreal.com.br" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-12 bg-white border-gray-200 rounded-2xl focus:border-[#6E2FAE] focus:ring-[#6E2FAE]/10 text-base" />
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
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-12 bg-white border-gray-200 rounded-2xl focus:border-[#6E2FAE] focus:ring-[#6E2FAE]/10 text-base" />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-full bg-[#6E2FAE] hover:bg-[#5a268f] text-white font-semibold text-lg transition-all shadow-sm hover:-translate-y-1 mt-4">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entrar no Sistema"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;