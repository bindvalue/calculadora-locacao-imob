"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import logoPurple from "../../assets/logo-sonho-real-purple.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      return toast.error("Por favor, informe seu e-mail.");
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast.error("Erro ao enviar o e-mail de recuperação.");
    } else {
      toast.success("E-mail de recuperação enviado!");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-6">
      <div className="w-full max-w-md space-y-8 text-center bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100">
        <img
          src={(logoPurple as any).src || logoPurple}
          alt="Sonho Real Netimóveis"
          className="h-16 mx-auto"
        />
        <div>
          <h1 className="text-3xl font-semibold text-[#1D1D1F] tracking-tight">
            Recuperar senha
          </h1>
          <p className="text-[#86868B] font-medium text-lg mt-3">
            Informe seu e-mail para receber o link
          </p>
        </div>

        <div className="space-y-4 text-left">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 bg-[#F5F5F7] border-gray-200/80 rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-lg font-medium"
          />
        </div>

        <Button onClick={handleReset} disabled={loading} className="w-full bg-[#6E2FAE] hover:bg-[#5a268f] text-white h-14 rounded-full font-semibold text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center">
          {loading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Enviando...</> : "Enviar link"}
        </Button>

        <Button variant="ghost" onClick={() => router.push("/admin")} className="w-full text-[#6E2FAE] hover:text-[#5a268f] hover:bg-transparent text-base font-semibold mt-4">
          Voltar para o login
        </Button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;