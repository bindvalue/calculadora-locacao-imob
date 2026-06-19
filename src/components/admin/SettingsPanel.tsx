import { useState, useEffect } from 'react';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, MessageCircle } from 'lucide-react';

const SettingsPanel = () => {
  const { toast } = useToast();

  const { data: whatsappSetting, isLoading } = useSetting('whatsapp_general');
  const { data: yieldBaseSetting } = useSetting('yield_base');
  const { data: useNetSetting } = useSetting('use_net_for_valuation');
  const { data: vacancySetting } = useSetting('vacancy_rate');

  const updateSetting = useUpdateSetting();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [yieldBase, setYieldBase] = useState('0.0045');
  const [useNet, setUseNet] = useState('true');
  const [vacancyRate, setVacancyRate] = useState('0.08');

  useEffect(() => {
    if (whatsappSetting?.value) setWhatsappNumber(whatsappSetting.value);
    if (yieldBaseSetting?.value) setYieldBase(yieldBaseSetting.value);
    if (useNetSetting?.value) setUseNet(useNetSetting.value);
    if (vacancySetting?.value) setVacancyRate(vacancySetting.value);
  }, [whatsappSetting, yieldBaseSetting, useNetSetting, vacancySetting]);

  const formatPhoneDisplay = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setWhatsappNumber(numbers.slice(0, 13));
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'whatsapp_general', value: whatsappNumber }),
        updateSetting.mutateAsync({ key: 'yield_base', value: yieldBase }),
        updateSetting.mutateAsync({ key: 'use_net_for_valuation', value: useNet }),
        updateSetting.mutateAsync({ key: 'vacancy_rate', value: vacancyRate })
      ]);

      toast({
        title: "Configurações salvas",
        description: "Parâmetros atualizados com sucesso.",
      });
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-[2rem] p-8 border border-[#E5E5EA] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">

        <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-6 tracking-tight">
          Parâmetros Financeiros
        </h3>

        <div className="space-y-6">

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1D1D1F]">WhatsApp</Label>
            <Input
              className="h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#5A268F] focus:ring-4 focus:ring-[#5A268F]/10"
              value={formatPhoneDisplay(whatsappNumber)}
              onChange={handleWhatsappChange}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1D1D1F]">Yield Base (a.m)</Label>
            <Input
              className="h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#5A268F] focus:ring-4 focus:ring-[#5A268F]/10"
              value={yieldBase}
              onChange={(e)=>setYieldBase(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1D1D1F]">Vacância (%)</Label>
            <Input
              className="h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#5A268F] focus:ring-4 focus:ring-[#5A268F]/10"
              value={vacancyRate}
              onChange={(e)=>setVacancyRate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold text-[#1D1D1F]">
              Usar NET no valuation
            </Label>

            <div className="flex items-center gap-3">
              
              <button
                type="button"
                onClick={() => setUseNet("true")}
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <span
                  className={`
                    w-4 h-4 rounded-full border flex items-center justify-center
                    ${useNet === "true"
                      ? "border-[#5A268F]"
                      : "border-[#D1D1D6]"}
                  `}
                >
                  {useNet === "true" && (
                    <span className="w-2 h-2 rounded-full bg-[#5A268F]" />
                  )}
                </span>
                <span className={useNet === "true" ? "text-[#5A268F]" : "text-gray-500"}>
                  Sim
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUseNet("false")}
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <span
                  className={`
                    w-4 h-4 rounded-full border flex items-center justify-center
                    ${useNet === "false"
                      ? "border-[#5A268F]"
                      : "border-[#D1D1D6]"}
                  `}
                >
                  {useNet === "false" && (
                    <span className="w-2 h-2 rounded-full bg-[#5A268F]" />
                  )}
                </span>
                <span className={useNet === "false" ? "text-[#5A268F]" : "text-gray-500"}>
                  Não
                </span>
              </button>

            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            className="
              h-12 px-6 rounded-full
              bg-[#5A268F]
              hover:bg-[#4a1f75]
              text-white font-semibold
              transition-all duration-300
              shadow-sm hover:shadow-md
              hover:-translate-y-0.5
            "
          >
            <Save className="w-4 h-4 mr-2"/> Salvar alterações
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPanel;