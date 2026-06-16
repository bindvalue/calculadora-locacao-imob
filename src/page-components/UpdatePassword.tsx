"use client";

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      return toast.error("Senha deve ter no mínimo 6 caracteres");
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error("Erro ao atualizar senha");
    } else {
      toast.success("Senha atualizada com sucesso!");
      router.push("/auth");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <p className="text-gray-500 text-sm">
          Digite sua nova senha para acessar sua conta
        </p>

        <Input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button onClick={handleUpdate} disabled={loading} className="w-full">
          {loading ? "Atualizando..." : "Atualizar senha"}
        </Button>
      </div>
    </div>
  );
};

export default UpdatePassword;