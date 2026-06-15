import React from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtectedRoute>
      {/* Opcional: Aqui você pode colocar uma Sidebar (Menu Lateral) ou um Header fixo do Painel Admin que envolverá todas as páginas */}
      {children}
    </AdminProtectedRoute>
  );
}