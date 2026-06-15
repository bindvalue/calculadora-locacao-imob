"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UploadCloud, Plus, Trash2, MapPin } from "lucide-react";
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
import { fetchGooglePlaces } from "./google-places";

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

  useEffect(() => {
    fetchBairros();
  }, []);

  const fetchBairros = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("secovi_valores")
        .select("*")
        .order("bairro", { ascending: true });
      if (error) throw error;
      setBairros(data || []);
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
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-secovi", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);
      
      toast.success(`Planilha processada! ${result.count} bairros atualizados.`);
      fetchBairros(); // Recarrega a tabela na tela
    } catch (error: any) {
      toast.error(error.message || "Falha ao processar arquivo do Secovi.");
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
    const valor = parseFloat(formattedValue);

    if (isNaN(valor)) {
      toast.error("O valor deve ser um número válido.");
      return;
    }

    try {
      // Verifica se o bairro já existe (Upsert lógico)
      const { data: existing } = await supabase
        .from("secovi_valores")
        .select("id")
        .ilike("bairro", selectedPlace.bairro.trim())
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updateError } = await supabase.from("secovi_valores").update({
          estado: selectedPlace.estado,
          cidade: selectedPlace.cidade,
          valor_min: Number((valor * 0.85).toFixed(2)),
          valor_max: Number((valor * 1.15).toFixed(2)),
          valor_default: Number(valor.toFixed(2)),
        }).eq("id", existing.id);
        error = updateError;
        if (!error) toast.success("Bairro atualizado com sucesso!");
      } else {
        const { error: insertError } = await supabase.from("secovi_valores").insert([{
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
      const { error } = await supabase.from("secovi_valores").delete().eq("id", deleteId);
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
              <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Tabela de Preços (Secovi)</h3>
              <p className="text-[#86868B] font-medium mt-1">
                Importe a planilha oficial do Secovi ou adicione manualmente os bairros.
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
        <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto relative [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-[#F5F5F7] text-[#86868B] font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-sm">
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
                bairros.map((bairro) => (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este bairro da tabela do Secovi? Isso poderá afetar as simulações da calculadora em andamento.
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