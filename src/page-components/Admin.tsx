"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCorretores, CorretorWithRating } from '@/hooks/useCorretores';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Plus, Users, Settings, Inbox } from 'lucide-react';
import CorretorList from '@/components/admin/CorretorList';
import CorretorForm from '@/components/admin/CorretorForm';
import SettingsPanel from '@/components/admin/SettingsPanel';
import { SecoviManager } from '@/components/admin/SecoviManager';
import LeadsList from '@/components/admin/LeadsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminFooter from '@/components/AdminFooter';
import logoPurple from '@/assets/logo-sonho-real-purple.png';

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { data: corretores, isLoading: corretoresLoading } = useCorretores(false);
  const [editingCorretor, setEditingCorretor] = useState<CorretorWithRating | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error("Erro ao fazer logoff:", error);
    }
  };

  const handleNewCorretor = () => {
    setEditingCorretor(null);
    setIsFormOpen(true);
  };

  const handleEditCorretor = (corretor: CorretorWithRating) => {
    setEditingCorretor(corretor);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingCorretor(null);
    setIsFormOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans antialiased selection:bg-[#6E2FAE] selection:text-white">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoPurple.src} alt="Sonho Real Netimóveis" className="h-10 object-contain hidden sm:block" />
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                Painel Administrativo
              </h1>
              <p className="text-xs text-[#86868B] font-medium">
                Gestão da Plataforma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#86868B] font-medium hidden sm:block">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full border-[#E5E5EA] text-[#1D1D1F] hover:bg-gray-50 hover:text-[#1D1D1F] font-semibold">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 flex-1">
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="inline-flex flex-wrap h-auto bg-gray-200/50 p-1.5 rounded-2xl">
            <TabsTrigger value="leads" className="gap-2 rounded-xl px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#6E2FAE] transition-all">
              <Inbox className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="corretores" disabled className="hidden gap-2 rounded-xl px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#6E2FAE] transition-all">
              <Users className="w-4 h-4" />
              Corretores
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-2 rounded-xl px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#6E2FAE] transition-all">
              <Settings className="w-4 h-4" />
              Ajustes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6 focus:outline-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Leads Capturados</h2>
                <p className="text-[#86868B] font-medium">
                  Contatos gerados pela calculadora de locação.
                </p>
              </div>
            </div>
            <LeadsList />
          </TabsContent>

          <TabsContent value="corretores" className="space-y-6 focus:outline-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Corretores</h2>
                <p className="text-[#86868B] font-medium">
                  Gerencie os corretores cadastrados
                </p>
              </div>
              <Button onClick={handleNewCorretor} className="rounded-full bg-[#6E2FAE] hover:bg-[#5a268f] text-white font-semibold shadow-sm transition-all hover:-translate-y-0.5">
                <Plus className="w-4 h-4 mr-2" />
                Novo Corretor
              </Button>
            </div>

            {corretoresLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <CorretorList 
                corretores={corretores || []} 
                onEdit={handleEditCorretor}
              />
            )}
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6 focus:outline-none">
            <div>
              <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Configurações</h2>
              <p className="text-[#86868B] font-medium">
                Gerencie as configurações gerais do site
              </p>
            </div>
            
            <div className="flex flex-col gap-6 w-full">
              <SettingsPanel />
              <SecoviManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AdminFooter />

      {/* Form Modal */}
      {isFormOpen && (
        <CorretorForm 
          corretor={editingCorretor} 
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Admin;
