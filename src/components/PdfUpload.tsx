"use client";

import { useState } from "react";
import { Loader2, UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExtractedData = {
  bairro: string;
  valor_m2: number;
  tipo: string;
};

export default function PdfUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [tipoIndice, setTipoIndice] = useState<string>("");
  const [previewData, setPreviewData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleProcessPdf = async () => {
    if (!file) return toast.error("Selecione um arquivo PDF.");

    // Validação de Segurança (Evita que o servidor trave)
    if (file.type !== "application/pdf") {
      return toast.error("Formato inválido. Por favor, envie apenas arquivos .pdf");
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB de limite
      return toast.error("Arquivo muito pesado. Extraia apenas a página da sua cidade e tente novamente.");
    }

    if (!tipoIndice) return toast.error("Selecione o tipo de índice (Venda ou Locação).");

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipoIndice", tipoIndice);

    try {
      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      // Verifica se o servidor retornou HTML ao invés de JSON (Erro fatal do Next.js)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Erro interno no servidor. O PDF pode estar corrompido ou ser muito complexo para leitura.");
      }

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);
      if (result.data.length === 0) throw new Error("Nenhum dado encontrado no PDF. Verifique o layout.");

      setPreviewData(result.data);
      setStep(2); // Avança para a tela de Preview
      toast.success(`${result.data.length} registros extraídos com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    setIsSaving(true);

    try {
      /*
       * ATENÇÃO AO SCHEMA DO SUPABASE:
       * 1. A tabela (ex: 'secovi_valores' ou 'fipezap_valores') precisa da coluna 'tipo' (varchar/enum).
       * 2. É FUNDAMENTAL criar uma constraint UNIQUE (bairro, tipo) no Supabase.
       *    Isso garante que a instrução onConflict abaixo atualize o registro correto sem
       *    sobrescrever a locação com a venda de um mesmo bairro.
       */
      const { error } = await supabase
        .from("secovi_valores") // Substitua pelo nome correto da sua tabela
        .upsert(
          previewData.map((item) => ({
            bairro: item.bairro,
            valor_default: item.valor_m2,
            valor_min: item.valor_m2 * 0.8, // Regra de negócio opcional
            valor_max: item.valor_m2 * 1.2, // Regra de negócio opcional
            tipo: item.tipo,
          })),
          { onConflict: "bairro, tipo" } // Chave composta essencial
        );

      if (error) throw error;

      toast.success("Dados salvos no banco com sucesso!");
      // Reseta o estado
      setStep(1);
      setFile(null);
      setTipoIndice("");
      setPreviewData([]);
    } catch (error: any) {
      toast.error("Erro ao salvar no banco de dados.", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm mt-8">
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Importação FipeZAP</h2>
            <p className="text-gray-500 text-sm">Selecione o tipo de índice e envie o arquivo PDF para extração.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <strong className="block mb-1 text-amber-950">Aviso do Sistema:</strong>
              O relatório completo do FipeZAP é muito pesado e causa travamento no servidor. <strong>Extraia apenas a página da sua cidade</strong> (usando sites como o <i>ilovepdf.com</i>) e faça o upload do arquivo reduzido (máx. 2MB).
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tipo de Índice</label>
              <Select value={tipoIndice} onValueChange={setTipoIndice}>
                <SelectTrigger className="h-14 rounded-2xl">
                  <SelectValue placeholder="Selecione Venda ou Locação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Arquivo PDF</label>
              <Input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="h-14 rounded-2xl pt-3.5 cursor-pointer file:text-gray-500 file:font-semibold"
              />
            </div>
          </div>

          <Button onClick={handleProcessPdf} disabled={isProcessing || !file || !tipoIndice} className="w-full h-14 rounded-2xl bg-[#6E2FAE] hover:bg-[#5a268f] text-lg font-bold">
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Extraindo Dados...</> : <><UploadCloud className="w-5 h-5 mr-2" /> Extrair PDF</>}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pré-visualização</h2>
              <p className="text-gray-500 text-sm">{previewData.length} registros extraídos do tipo: <strong className="uppercase">{tipoIndice}</strong></p>
            </div>
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">Cancelar</Button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-2xl">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold">Bairro</th>
                  <th className="px-6 py-4 font-semibold">Valor (m²)</th>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.bairro}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium text-xs">R$</span>
                        <Input 
                          type="number" 
                          value={item.valor_m2} 
                          onChange={(e) => {
                            const newData = [...previewData];
                            newData[idx].valor_m2 = Number(e.target.value);
                            setPreviewData(newData);
                          }}
                          className="w-24 h-9 text-sm font-semibold text-emerald-600 rounded-lg border-gray-200"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 uppercase text-xs font-bold">{item.tipo}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewData(previewData.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8">
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={handleConfirmAndSave} disabled={isSaving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-bold">
            {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...</> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Confirmar e Salvar no Banco</>}
          </Button>
        </div>
      )}
    </div>
  );
}