"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  User, 
  MapPin, 
  Calendar, 
  Home, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign, 
  Info,
  Eye,
  TrendingUp,
  Download,
  Trash2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import logoPurple from "@/assets/logo-sonho-real-purple.png";

interface Lead {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  whatsapp: string;
  relacao_imovel: string;
  tempo_estimado: string | null;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string | null;
  tipo_imovel: string;
  area_m2: number;
  valor_venda: number;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  valor_condominio: number;
  paga_iptu: boolean;
  valor_iptu_anual: number;
  aluguel_bruto: number;
  aluguel_liquido: number;
  yield_liquido: number;
  visualizado: boolean;
}

// Dicionário de Valor de m² por Bairro (Idêntico ao usado na Calculadora)
const NEIGHBORHOOD_M2_RATES: Record<string, { min: number, max: number, default: number }> = {
  "lourdes": { min: 40, max: 90, default: 65 },
  "savassi": { min: 40, max: 85, default: 60 },
  "funcionarios": { min: 35, max: 80, default: 55 },
  "belvedere": { min: 35, max: 80, default: 50 },
  "vila da serra": { min: 35, max: 80, default: 50 },
  "santo agostinho": { min: 35, max: 75, default: 50 },
  "sion": { min: 30, max: 70, default: 45 },
  "cruzeiro": { min: 25, max: 60, default: 40 },
  "anchieta": { min: 25, max: 60, default: 40 },
  "cidade nova": { min: 20, max: 55, default: 35 },
  "castelo": { min: 20, max: 45, default: 30 },
  "buritis": { min: 20, max: 45, default: 30 },
  "centro": { min: 15, max: 45, default: 25 },
  "padrao": { min: 12, max: 35, default: 20 }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getNeighborhoodRates = (bairro: string) => {
  const normalizedBairro = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  let rate = NEIGHBORHOOD_M2_RATES["padrao"];

  for (const [key, value] of Object.entries(NEIGHBORHOOD_M2_RATES)) {
    if (normalizedBairro.includes(key)) {
      rate = value;
      break;
    }
  }
  return rate;
};

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isPrintingList, setIsPrintingList] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => setIsPrintingList(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Resetar a paginação ao fazer uma nova busca
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads_calculadora")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Não foi possível carregar os leads.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.nome.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.bairro.toLowerCase().includes(searchLower) ||
      lead.whatsapp.includes(searchLower)
    );
  });

  // Recriando a lógica de inteligência baseada no Lead Selecionado
  const m2Range = selectedLead ? getNeighborhoodRates(selectedLead.bairro) : NEIGHBORHOOD_M2_RATES["padrao"];
  const third1 = Math.floor(m2Range.min + (m2Range.max - m2Range.min) * 0.33);
  const third2 = Math.floor(m2Range.min + (m2Range.max - m2Range.min) * 0.66);
  const m2Value = selectedLead && selectedLead.area_m2 > 0 ? (selectedLead.aluguel_bruto / selectedLead.area_m2) : 0;
  const isShortTerm = m2Value <= third1;
  const isMediumTerm = m2Value > third1 && m2Value <= third2;
  const isLongTerm = m2Value > third2;

  const handleViewLead = async (lead: Lead) => {
    setSelectedLead(lead);
    
    // Se o lead ainda não foi visualizado, marca como visto localmente e no banco
    if (!lead.visualizado) {
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, visualizado: true } : l));
      try {
        const { error } = await supabase
          .from("leads_calculadora")
          .update({ visualizado: true })
          .eq("id", lead.id);
        if (error) throw error;
      } catch (error: any) {
        console.error("Erro ao marcar lead como visualizado:", error);
      }
    }
  };

  const handlePrintLead = (lead: Lead) => {
    handleViewLead(lead);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintList = () => {
    setIsPrintingList(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDeleteLead = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("leads_calculadora")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      
      toast.success("Lead excluído com sucesso!");
      setLeads((prev) => prev.filter(lead => lead.id !== deleteId));
    } catch (error: any) {
      console.error("Erro ao excluir lead:", error);
      toast.error("Não foi possível excluir o lead.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filter and Export */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por nome, e-mail, bairro ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-[#E5E5EA] rounded-full focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 text-base shadow-sm transition-all"
          />
        </div>
        <Button 
          onClick={handlePrintList}
          variant="outline"
          className="h-12 sm:h-14 px-6 rounded-full border-[#E5E5EA] bg-white hover:bg-gray-50 hover:text-[#6E2FAE] text-[#1D1D1F] font-bold shadow-sm transition-all shrink-0"
        >
          <FileText className="w-5 h-5 mr-2 text-[#6E2FAE]" />
          Exportar Lista
        </Button>
      </div>

      {/* Results Count */}
      {!isLoading && (
        <p className="text-sm text-[#86868B] font-medium px-1">
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead encontrado" : "leads encontrados"}
        </p>
      )}

      {/* Leads List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-[#E5E5EA] animate-pulse h-32"></div>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E5E5EA] text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#86868B]" />
          </div>
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-2 tracking-tight">Nenhum lead encontrado</h3>
          <p className="text-[#86868B] font-medium">Não há leads capturados que correspondam a essa busca.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {filteredLeads.slice(0, visibleCount).map((lead) => (
            <div 
              key={lead.id} 
              className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6E2FAE]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#6E2FAE] font-bold text-lg">{lead.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-lg leading-none transition-colors ${lead.visualizado ? 'text-[#86868B]' : 'text-[#1D1D1F]'}`}>{lead.nome}</h3>
                      {!lead.visualizado ? (
                        <span className="bg-[#6E2FAE] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Novo</span>
                      ) : (
                        <Eye className="w-4 h-4 text-[#86868B] opacity-60" title="Visualizado" />
                      )}
                    </div>
                    <p className="text-sm text-[#86868B] font-medium mt-1">{lead.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-[#86868B] font-medium">
                  <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-3 py-1.5 rounded-full">
                    <Phone className="w-4 h-4" /> {lead.whatsapp}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4" /> {lead.bairro}, {lead.cidade}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-3 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4" /> {formatDate(lead.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:border-l border-[#E5E5EA] sm:pl-6 pt-4 sm:pt-0">
                <div className="text-left sm:text-right hidden sm:block">
                  <p className="text-xs text-[#86868B] font-bold uppercase tracking-wider mb-0.5">Aluguel Sugerido</p>
                  <p className="text-xl font-extrabold text-[#6E2FAE]">{formatCurrency(lead.aluguel_bruto)}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setDeleteId(lead.id)}
                    variant="outline"
                    className="h-12 w-12 rounded-full border-[#E5E5EA] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400 shrink-0 p-0 flex items-center justify-center shadow-sm transition-colors"
                    title="Excluir Lead"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => handlePrintLead(lead)}
                    variant="outline"
                    className="h-12 w-12 rounded-full border-[#E5E5EA] bg-white hover:bg-gray-100 hover:text-[#1D1D1F] text-[#86868B] shrink-0 p-0 flex items-center justify-center shadow-sm transition-colors"
                    title="Exportar PDF"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button 
                    onClick={() => handleViewLead(lead)}
                    className="flex-1 sm:flex-none h-12 px-6 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-bold shadow-none transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </div>
          ))}
          </div>

          {visibleCount < filteredLeads.length && (
            <div className="flex justify-center pt-2">
              <Button 
                onClick={() => setVisibleCount(prev => prev + 10)}
                variant="outline"
                className="h-12 px-8 rounded-full border-[#E5E5EA] bg-white hover:bg-gray-50 text-[#1D1D1F] font-bold shadow-sm transition-all hover:scale-105"
              >
                Carregar mais leads
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lead Details Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[700px] bg-[#F5F5F7] p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem] print:shadow-none print:bg-white print:border-none print:w-full print:max-w-none">
          {selectedLead && (
            <div className="flex flex-col max-h-[85vh] print:max-h-none print:h-auto print:block">
              <style>
                {`
                  @media print {
                    body * { visibility: hidden; }
                    [role="dialog"], [role="dialog"] * { visibility: visible; }
                    [role="dialog"] { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; transform: none !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; max-height: none !important; border: none !important; box-shadow: none !important; }
                    html, body { height: auto !important; overflow: visible !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @page { size: auto; margin: 15mm; }
                    [role="dialog"] > button { display: none !important; } /* Oculta o ícone X padrão do fechar */
                  }
                `}
              </style>
              {/* Header */}
              <DialogHeader className="p-6 pb-4 bg-white border-b border-[#E5E5EA] shrink-0 sticky top-0 z-10 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#6E2FAE]/10 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-[#6E2FAE]" />
                    </div>
                    <div className="text-left">
                      <DialogTitle className="text-2xl font-bold text-[#1D1D1F] tracking-tight mb-1">
                        {selectedLead.nome}
                      </DialogTitle>
                      <p className="text-[#86868B] font-medium text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Realizado em: {formatDate(selectedLead.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handlePrintLead(selectedLead)}
                    variant="outline" 
                    className="print:hidden rounded-full font-bold border-[#E5E5EA] bg-white hover:bg-gray-100 text-[#1D1D1F] hover:text-[#1D1D1F] shrink-0 shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar PDF</span>
                  </Button>
                </div>
              </DialogHeader>

              {/* Content (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full print:overflow-visible print:p-0 print:space-y-8 print:block">
                
                {/* Cabeçalho de Impressão */}
                <div className="hidden print:flex flex-col items-center pb-6 border-b border-gray-200 text-center">
                  <img src={logoPurple.src} alt="Sonho Real Netimóveis" className="h-16 object-contain mb-6" />
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{selectedLead.nome}</h1>
                  <p className="text-sm text-gray-500 font-medium">
                    Ficha de Lead • Realizado em: {formatDate(selectedLead.created_at)}
                  </p>
                </div>

                {/* Section: Contato */}
                <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA] shadow-sm print:break-inside-avoid print:shadow-none print:border-gray-200">
                  <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Dados de Contato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#86868B] font-medium">E-mail</p>
                      <p className="font-bold text-[#1D1D1F]">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B] font-medium">WhatsApp</p>
                      <p className="font-bold text-[#1D1D1F]">{selectedLead.whatsapp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B] font-medium">Relação</p>
                      <Badge variant="secondary" className="mt-1 font-semibold">{selectedLead.relacao_imovel}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B] font-medium">Urgência</p>
                      <Badge variant="outline" className="mt-1 font-semibold border-[#6E2FAE] text-[#6E2FAE]">
                        {selectedLead.tempo_estimado || "Não informada"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Section: Imóvel */}
                <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA] shadow-sm print:break-inside-avoid print:shadow-none print:border-gray-200">
                  <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Home className="w-4 h-4" /> Detalhes do Imóvel
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="sm:col-span-2">
                      <p className="text-sm text-[#86868B] font-medium">Endereço</p>
                      <p className="font-bold text-[#1D1D1F]">{selectedLead.rua}, {selectedLead.numero} {selectedLead.complemento ? `- ${selectedLead.complemento}` : ''}</p>
                      <p className="font-medium text-gray-500 text-sm">{selectedLead.bairro}, {selectedLead.cidade} - {selectedLead.estado} ({selectedLead.cep})</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B] font-medium">Tipo</p>
                      <p className="font-bold text-[#1D1D1F]">{selectedLead.tipo_imovel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B] font-medium">Área Útil</p>
                      <p className="font-bold text-[#1D1D1F]">{selectedLead.area_m2} m²</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E5E5EA]">
                    <div className="bg-[#F5F5F7] px-3 py-1.5 rounded-lg text-sm font-semibold text-[#1D1D1F]">🛏️ {selectedLead.quartos} Quartos</div>
                    <div className="bg-[#F5F5F7] px-3 py-1.5 rounded-lg text-sm font-semibold text-[#1D1D1F]">🚿 {selectedLead.banheiros} Banheiros</div>
                    <div className="bg-[#F5F5F7] px-3 py-1.5 rounded-lg text-sm font-semibold text-[#1D1D1F]">🛁 {selectedLead.suites} Suítes</div>
                    <div className="bg-[#F5F5F7] px-3 py-1.5 rounded-lg text-sm font-semibold text-[#1D1D1F]">🚗 {selectedLead.vagas} Vagas</div>
                  </div>
                </div>

                {/* Section: Financeiro */}
                <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA] shadow-sm print:break-inside-avoid print:shadow-none print:border-gray-200">
                  <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Valores Simulados
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <p className="text-[#86868B] font-medium mb-1">Pacote Aluguel (Bruto)</p>
                      <p className="font-extrabold text-[#1D1D1F] text-lg">{formatCurrency(selectedLead.aluguel_bruto)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <p className="text-emerald-800 font-medium mb-1">Aluguel Líquido</p>
                      <p className="font-extrabold text-emerald-700 text-lg">{formatCurrency(selectedLead.aluguel_liquido)}</p>
                    </div>
                    <div>
                      <p className="text-[#86868B] font-medium">Venda Estimada</p>
                      <p className="font-bold text-[#1D1D1F]">{formatCurrency(selectedLead.valor_venda)}</p>
                    </div>
                    <div>
                      <p className="text-[#86868B] font-medium">Custos (Cond. + IPTU)</p>
                      <p className="font-bold text-rose-600">
                        {formatCurrency(selectedLead.valor_condominio + (selectedLead.paga_iptu ? selectedLead.valor_iptu_anual / 12 : 0))} /mês
                      </p>
                    </div>
                    <div>
                      <p className="text-[#86868B] font-medium">Yield Líquido (a.m.)</p>
                      <p className="font-bold text-blue-600">{(selectedLead.yield_liquido || 0).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                {/* Section: Inteligência & Estratégia de Mercado */}
                <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA] shadow-sm print:break-inside-avoid print:shadow-none print:border-gray-200">
                  <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Estratégia de Mercado Apresentada
                  </h4>
                  
                  <div className="space-y-3 mb-5">
                    <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isShortTerm ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50' : 'border-[#E5E5EA] bg-[#F5F5F7]/50'}`}>
                      <div className="flex-1">
                        <h4 className={`font-extrabold text-sm mb-0.5 ${isShortTerm ? 'text-emerald-800' : 'text-[#1D1D1F]'}`}>Curto prazo</h4>
                        <p className={`text-xs font-medium ${isShortTerm ? 'text-emerald-900/80' : 'text-[#86868B]'}`}>Até 60–90 dias. Prioriza ocupação rápida.</p>
                      </div>
                      <p className={`text-sm font-extrabold sm:text-right ${isShortTerm ? 'text-emerald-900' : 'text-[#1D1D1F]'}`}>
                        {formatCurrency(selectedLead.area_m2 * m2Range.min)} <span className="text-xs opacity-50 font-medium px-1">a</span> {formatCurrency(selectedLead.area_m2 * third1)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isMediumTerm ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50' : 'border-[#E5E5EA] bg-[#F5F5F7]/50'}`}>
                      <div className="flex-1">
                        <h4 className={`font-extrabold text-sm mb-0.5 ${isMediumTerm ? 'text-blue-800' : 'text-[#1D1D1F]'}`}>Médio prazo</h4>
                        <p className={`text-xs font-medium ${isMediumTerm ? 'text-blue-900/80' : 'text-[#86868B]'}`}>90 a 180 dias. Equilíbrio de rentabilidade.</p>
                      </div>
                      <p className={`text-sm font-extrabold sm:text-right ${isMediumTerm ? 'text-blue-900' : 'text-[#1D1D1F]'}`}>
                        {formatCurrency(selectedLead.area_m2 * (third1 + 1))} <span className="text-xs opacity-50 font-medium px-1">a</span> {formatCurrency(selectedLead.area_m2 * third2)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isLongTerm ? 'border-orange-500 ring-2 ring-orange-500/10 bg-orange-50' : 'border-[#E5E5EA] bg-[#F5F5F7]/50'}`}>
                      <div className="flex-1">
                        <h4 className={`font-extrabold text-sm mb-0.5 ${isLongTerm ? 'text-orange-800' : 'text-[#1D1D1F]'}`}>Longo prazo</h4>
                        <p className={`text-xs font-medium ${isLongTerm ? 'text-orange-900/80' : 'text-[#86868B]'}`}>Acima de 180 dias. Aposta na valorização máxima.</p>
                      </div>
                      <p className={`text-sm font-extrabold sm:text-right ${isLongTerm ? 'text-orange-900' : 'text-[#1D1D1F]'}`}>
                        {formatCurrency(selectedLead.area_m2 * (third2 + 1))} <span className="text-xs opacity-50 font-medium px-1">a</span> {formatCurrency(selectedLead.area_m2 * m2Range.max)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-sm font-bold text-[#1D1D1F] mb-1">Recomendação da IA no envio:</h4>
                    <p className="text-[#86868B] text-xs font-medium leading-relaxed">
                      Pacote sugerido a <strong className="text-[#1D1D1F]">{formatCurrency(selectedLead.aluguel_bruto)}/mês</strong> com margem de negociação até <strong className="text-[#1D1D1F]">{formatCurrency(selectedLead.area_m2 * Math.max(m2Range.min, m2Value - 2))}</strong> – garantindo um aluguel líquido seguro de <strong className="text-emerald-700">{formatCurrency(selectedLead.aluguel_liquido)}</strong>. Posicionamento para liquidez no bairro <strong className="text-[#1D1D1F]">{selectedLead.bairro}</strong>.
                    </p>
                  </div>
                </div>

                {/* Rodapé de Impressão */}
                <div className="hidden print:flex w-full items-end justify-between pt-6 mt-10 border-t border-gray-200 text-[11px] text-gray-400 font-medium print:break-inside-avoid">
                  <div className="space-y-1 text-left">
                    <p suppressHydrationWarning>© {new Date().getFullYear()} Sonho Real Netimóveis. Todos os direitos reservados.</p>
                    <p>Desenvolvido por <strong className="text-gray-500">BindValue.dev</strong></p>
                  </div>
                  <div className="text-right tracking-wide">
                    Ficha de Lead
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print List Container */}
      {isPrintingList && (
        <div className="print-list-container bg-white p-8">
          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                .print-list-container, .print-list-container * { visibility: visible; }
                .print-list-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; transform: none !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; max-height: none !important; border: none !important; box-shadow: none !important; }
                html, body { height: auto !important; overflow: visible !important; background: white !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                @page { size: auto; margin: 10mm; }
              }
            `}
          </style>
          
          <div className="flex flex-col items-center mb-6 border-b border-gray-200 pb-6 text-center">
            <img src={logoPurple.src} alt="Sonho Real Netimóveis" className="h-12 object-contain mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Relatório de Leads Capturados</h1>
            <p className="text-sm text-gray-500 font-medium">
              Filtro ativo: {searchTerm ? `"${searchTerm}"` : "Todos os leads"} • Total: {filteredLeads.length} • Gerado em: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-900">
                <th className="py-2 px-2">Nome</th>
                <th className="py-2 px-2">Contato</th>
                <th className="py-2 px-2">Endereço</th>
                <th className="py-2 px-2">Imóvel</th>
                <th className="py-2 px-2 text-right">Aluguel Sugerido</th>
                <th className="py-2 px-2 text-right">Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="border-b border-gray-200 break-inside-avoid">
                  <td className="py-3 px-2 font-bold text-gray-900">{lead.nome}</td>
                  <td className="py-3 px-2 text-gray-600 font-medium">
                    {lead.whatsapp} <br />
                    <span className="text-gray-400">{lead.email}</span>
                  </td>
                  <td className="py-3 px-2 text-gray-600 font-medium">
                    {lead.bairro}, {lead.cidade} - {lead.estado}
                  </td>
                  <td className="py-3 px-2 text-gray-600 font-medium">
                    {lead.tipo_imovel} <br />
                    <span className="text-gray-400">{lead.area_m2} m²</span>
                  </td>
                  <td className="py-3 px-2 text-right font-extrabold text-[#6E2FAE]">
                    {formatCurrency(lead.aluguel_bruto)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-500 font-medium">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 text-center text-[10px] text-gray-400 font-medium">
            © {new Date().getFullYear()} Sonho Real Netimóveis. Todos os direitos reservados.
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsList;