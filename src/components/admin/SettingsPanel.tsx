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
      <div className="bg-white rounded-3xl p-6 border shadow-sm">

        <h3 className="text-xl font-bold mb-4">Parâmetros Financeiros</h3>

        <div className="space-y-4">

          <div>
            <Label>WhatsApp</Label>
            <Input value={formatPhoneDisplay(whatsappNumber)} onChange={handleWhatsappChange}/>
          </div>

          <div>
            <Label>Yield Base (a.m)</Label>
            <Input value={yieldBase} onChange={(e)=>setYieldBase(e.target.value)}/>
          </div>

          <div>
            <Label>Vacância (%)</Label>
            <Input value={vacancyRate} onChange={(e)=>setVacancyRate(e.target.value)}/>
          </div>

          <div>
            <Label>Usar NET no valuation</Label>
            <select value={useNet} onChange={(e)=>setUseNet(e.target.value)}>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2"/> Salvar
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPanel;