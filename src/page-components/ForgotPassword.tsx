"use client";

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return toast.error("Informe um e-mail");

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast.error("Erro ao enviar e-mail");
    } else {
      toast.success("E-mail de recuperação enviado!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <p className="text-gray-500 text-sm">
          Informe seu e-mail para receber o link de redefinição
        </p>

        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button onClick={handleReset} disabled={loading} className="w-full">
          {loading ? "Enviando..." : "Enviar link"}
        </Button>
      </div>
    </div>
  );
};

export default ForgotPassword;