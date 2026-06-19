"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UploadCloud, Plus, Trash2, MapPin, ArrowDownAZ, ArrowUpZA, ArrowDown10, ArrowUp10 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as xlsx from "xlsx";

import { fetchGooglePlaces } from "./google-places";

const ESTIMATED_YIELD_AM = 0.0045;
const MAX_REASONABLE_RENT_M2 = 300;

const normalizeRentM2Value = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > MAX_REASONABLE_RENT_M2 ? Number((value * ESTIMATED_YIELD_AM).toFixed(2)) : value;
};

const normalizeBairroRentValues = (bairro: any) => ({
  ...bairro,
  valor_min: normalizeRentM2Value(Number(bairro.valor_min)),
  valor_max: normalizeRentM2Value(Number(bairro.valor_max)),
  valor_default: normalizeRentM2Value(Number(bairro.valor_default)),
});

// Mapa de conversão do Google (que pode retornar o estado por extenso) para Siglas
const stateMap: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
  "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
  "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "State of Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB",
  "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ",
  "State of Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "State of Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
  "Santa Catarina": "SC", "State of Santa Catarina": "SC", "São Paulo": "SP",
  "State of São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
};

export const SecoviManager = () => {
  const [bairros, setBairros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para inserção manual
  const [searchQuery, setSearchQuery] = useState("");
  const [placesOptions, setPlacesOptions] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{bairro: string, cidade: string, estado: string} | null>(null);
  const [newValue, setNewValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState<"bairro" | "valor_default">("bairro");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  useEffect(() => {
    fetchBairros();
  }, []);

  const fetchBairros = async () => {
    setIsLoading(true);
    try {
const { data, error } = await (supabase as any)
        .from("secovi_valores")
        .select("*"); // A ordenação será feita no frontend
      if (error) throw error;
      setBairros((data || []).map(normalizeBairroRentValues));
    } catch (err) {
      toast.error("Erro ao carregar a tabela de preços.");
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para buscar os bairros na API do Google Places via rota interna
  useEffect(() => {
    const searchGooglePlaces = async () => {
      if (searchQuery.length >= 3 && !selectedPlace) {
        setIsSearching(true);
        try {
          const predictions = await fetchGooglePlaces(searchQuery);
          setPlacesOptions(predictions);
        } catch (err) {
          console.error("Erro na busca do Google:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setPlacesOptions([]);
      }
    };

    const debounce = setTimeout(() => {
      searchGooglePlaces();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery, selectedPlace]);

  const handleSelectPlace = (prediction: any) => {
    const terms = prediction.terms;
    if (terms && terms.length >= 3) {
      const bairro = terms[0].value;
      const cidade = terms[1].value;
      const estadoBruto = terms[2].value;
      const estado = stateMap[estadoBruto] || estadoBruto.substring(0, 2).toUpperCase();

      setSelectedPlace({ bairro, cidade, estado });
      setSearchQuery(`${bairro}, ${cidade} - ${estado}`);
    }
    setPlacesOptions([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (selectedPlace) setSelectedPlace(null); // Libera o input para nova busca
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Lê e processa o arquivo no navegador (client-side)
      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(worksheet);

      if (!rawData || rawData.length === 0) {
        throw new Error("A planilha está vazia ou em formato inválido.");
      }

      // 2. Envia os dados já processados (JSON) para a API
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/upload-secovi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ spreadsheetData: rawData }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      toast.success(`Planilha processada! ${result.count} bairros atualizados.`);
      fetchBairros(); // Recarrega a tabela na tela

    } catch (error: any) {
      toast.error(error.message || "Falha ao processar o arquivo da planilha.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddManual = async () => {
    if (!selectedPlace || !newValue) {
      toast.error("Selecione um bairro na lista e informe o valor do m².");
      return;
    }

    let formattedValue = newValue;
    // Se tem vírgula, assume formato brasileiro: remove pontos de milhar e troca vírgula por ponto
    if (formattedValue.includes(",")) {
      formattedValue = formattedValue.replace(/\./g, "").replace(",", ".");
    }
    const parsedValue = parseFloat(formattedValue);

    if (isNaN(parsedValue)) {
      toast.error("O valor deve ser um número válido.");
      return;
    }

    const valor = normalizeRentM2Value(parsedValue);

    try {
      // Verifica se o bairro já existe (Upsert lógico)
      const { data: existing } = await (supabase as any)
        .from("secovi_valores")
        .select("id")
        .ilike("bairro", selectedPlace.bairro.trim())
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updateError } = await (supabase as any).from("secovi_valores").update({
          estado: selectedPlace.estado,
          cidade: selectedPlace.cidade,
          valor_min: Number((valor * 0.85).toFixed(2)),
          valor_max: Number((valor * 1.15).toFixed(2)),
          valor_default: Number(valor.toFixed(2)),
        }).eq("id", existing.id);
        error = updateError;
        if (!error) toast.success("Bairro atualizado com sucesso!");
      } else {
        const { error: insertError } = await (supabase as any).from("secovi_valores").insert([{
          estado: selectedPlace.estado,
          cidade: selectedPlace.cidade,
          bairro: selectedPlace.bairro.toUpperCase(),
          valor_min: Number((valor * 0.85).toFixed(2)),
          valor_max: Number((valor * 1.15).toFixed(2)),
          valor_default: Number(valor.toFixed(2)),
        }]);
        error = insertError;
        if (!error) toast.success("Bairro adicionado com sucesso!");
      }

      if (error) throw error;
      setSearchQuery("");
      setSelectedPlace(null);
      setNewValue("");
      fetchBairros();
    } catch (error) {
      toast.error("Erro ao adicionar bairro manualmente.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await (supabase as any).from("secovi_valores").delete().eq("id", deleteId);
      if (error) throw error;
      setBairros((prev) => prev.filter((b) => b.id !== deleteId));
      toast.success("Bairro removido.");
    } catch (error) {
      toast.error("Erro ao remover o bairro.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E5EA] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6 pb-6 border-b border-[#E5E5EA]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#6E2FAE]/10 rounded-2xl flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-[#6E2FAE]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Tabela de Preços Base</h3>
                {!isLoading && (
                  <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full">
                    {bairros.length} bairros cadastrados
                  </span>
                )}
              </div>
              <p className="text-[#86868B] font-medium mt-1">
            Importe a planilha de dados de mercado ou adicione manualmente os bairros.
              </p>
            </div>
          </div>
          
          <div className="shrink-0">
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline" className="h-12 px-6 rounded-full border-[#E5E5EA] bg-white text-[#6E2FAE] hover:bg-[#6E2FAE]/10 hover:text-[#5a268f] hover:border-[#6E2FAE]/30 font-bold shadow-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {isUploading ? "Processando..." : "Upload Planilha"}
            </Button>
          </div>
        </div>

        {/* Inserção Manual */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-[#F5F5F7] p-4 rounded-2xl border border-[#E5E5EA] items-end">
          <div className="w-full sm:flex-[2] space-y-1 relative">
            <label className="text-xs font-bold text-[#86868B] uppercase px-1">Buscar Bairro e Cidade (Google)</label>
            <div className="relative">
              <Input 
                placeholder="Ex: Savassi, Belo Horizonte" 
                value={searchQuery} 
                onChange={handleSearchChange} 
                className="h-12 bg-white border-[#E5E5EA] rounded-xl text-base shadow-sm pr-10"
              />
              {isSearching && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-4 text-[#86868B]" />}
            </div>
            
            {/* Autocomplete Dropdown */}
            {placesOptions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-[#E5E5EA] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {placesOptions.map((place) => (
                  <button
                    key={place.place_id}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-4 py-3 hover:bg-[#F5F5F7] border-b border-[#E5E5EA] last:border-0 transition-colors focus:bg-[#F5F5F7] outline-none"
                  >
                    <p className="font-bold text-[#1D1D1F]">
                      {place.terms?.[0]?.value || place.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      {place.structured_formatting.secondary_text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full sm:w-32 space-y-1 shrink-0">
            <label className="text-xs font-bold text-[#86868B] uppercase px-1">Valor m²</label>
            <Input 
              placeholder="Ex: 65,50" 
              value={newValue} onChange={(e) => setNewValue(e.target.value)} 
              className="h-12 bg-white border-[#E5E5EA] rounded-xl text-base shadow-sm"
            />
          </div>

          <Button onClick={handleAddManual} disabled={!selectedPlace || !newValue} className="h-12 px-6 rounded-full bg-[#6E2FAE] hover:bg-[#5a268f] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            {selectedPlace && bairros.some(b => b.bairro.toLowerCase() === selectedPlace.bairro.toLowerCase()) ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>

        {/* Listagem da Tabela */}
        <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden relative">
          <div className="max-h-[500px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-track]:rounded-r-2xl [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#B475F3]/70 hover:[&::-webkit-scrollbar-thumb]:bg-[#6E2FAE]/75">
          {/* Barra de Filtro e Ordenação */}
          <div className="p-4 bg-gray-50/50 border-b border-[#E5E5EA] flex flex-col sm:flex-row items-center gap-4 sticky top-0 z-20 backdrop-blur-sm">
            <div className="w-full sm:flex-1">
              <Input 
                placeholder="Pesquisar bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl bg-white border-[#E5E5EA]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-[#86868B] uppercase shrink-0 hidden sm:block">Ordenar por:</label>
              <Select value={sortBy} onValueChange={(value: "bairro" | "valor_default") => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl bg-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bairro">Nome</SelectItem>
                  <SelectItem value="valor_default">Valor m²</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="h-10 w-10 rounded-xl bg-white border-[#E5E5EA] shrink-0 group hover:bg-[#6E2FAE]/5 hover:border-[#6E2FAE]/20 transition-colors" title={`Ordenar por ${sortOrder === 'asc' ? 'Decrescente' : 'Crescente'}`}>
                {sortBy === 'bairro' ? (
                  sortOrder === 'asc' ? <ArrowDownAZ className="w-5 h-5 text-gray-500 group-hover:text-[#6E2FAE] transition-colors" /> : <ArrowUpZA className="w-5 h-5 text-gray-500 group-hover:text-[#6E2FAE] transition-colors" />
                ) : (
                  sortOrder === 'asc' ? <ArrowDown10 className="w-5 h-5 text-gray-500 group-hover:text-[#6E2FAE] transition-colors" /> : <ArrowUp10 className="w-5 h-5 text-gray-500 group-hover:text-[#6E2FAE] transition-colors" />
                )}
              </Button>
            </div>
          </div>

          <table className="w-full text-left text-sm relative">
            <thead className="bg-[#F5F5F7] text-[#86868B] font-bold uppercase tracking-wider text-[11px] sticky top-[72px] z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4">Bairro</th>
                <th className="px-5 py-4 text-right">Valor m² Base</th>
                <th className="px-5 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] text-[#1D1D1F] font-medium bg-white">
              {isLoading ? (
                <tr><td colSpan={3} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300" /></td></tr>
              ) : bairros.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-[#86868B]">Nenhum bairro cadastrado.</td></tr>
              ) : (
                bairros
                  .filter((bairro) => 
                    bairro.bairro.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .sort((a, b) => {
                    if (sortBy === "bairro") {
                      return sortOrder === "asc" ? a.bairro.localeCompare(b.bairro) : b.bairro.localeCompare(a.bairro);
                    } else {
                      return sortOrder === "asc" ? a.valor_default - b.valor_default : b.valor_default - a.valor_default;
                    }
                  })
                  .map((bairro) => (
                  <tr key={bairro.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold">{bairro.bairro}</td>
                    <td className="px-5 py-3 text-right text-[#6E2FAE] font-extrabold">R$ {bairro.valor_default.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <button 
                        onClick={() => setDeleteId(bairro.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover Bairro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
            Tem certeza que deseja excluir este bairro da base de preços? Isso poderá afetar as simulações da calculadora em andamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
