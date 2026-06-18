"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import logoPurple from "../../assets/logo-sonho-real-purple.png";

// Rota para digitar a nova senha após recuperação (/update-password)
const UpdatePasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres.");
    }

    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error("Erro ao atualizar a senha.");
    } else {
      toast.success("Senha atualizada com sucesso!");
      router.push("/admin"); // Ou a rota principal de login do seu sistema
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
            Nova senha
          </h1>
          <p className="text-[#86868B] font-medium text-lg mt-3">
            Digite sua nova senha abaixo
          </p>
        </div>

        <div className="space-y-4 text-left">
          <Input
            type="password"
            placeholder="Sua nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 bg-[#F5F5F7] border-gray-200/80 rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-lg font-medium"
          />

          <Input
            type="password"
            placeholder="Confirme sua nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-14 bg-[#F5F5F7] border-gray-200/80 rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-lg font-medium"
          />
        </div>

        <Button onClick={handleUpdate} disabled={loading} className="w-full bg-[#6E2FAE] hover:bg-[#5a268f] text-white h-14 rounded-full font-semibold text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center">
          {loading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Atualizando...</> : "Atualizar senha"}
        </Button>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;