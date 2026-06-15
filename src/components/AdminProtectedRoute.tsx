"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // 1. Verificar se o usuário possui uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        // 2. Verificar o papel (role) do usuário na tabela user_roles
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (error || !roleData || roleData.role !== "admin") {
          toast({
            variant: "destructive",
            title: "Acesso Negado",
            description: "Você não tem permissão de administrador para acessar esta área.",
          });
          router.replace("/");
          return;
        }

        // 3. Usuário é admin, permitir acesso
        setIsAuthorized(true);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] w-full">
        <Loader2 className="w-10 h-10 animate-spin text-[#6E2FAE]" />
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}