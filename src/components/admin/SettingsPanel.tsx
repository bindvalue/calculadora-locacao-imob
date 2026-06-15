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
  const updateSetting = useUpdateSetting();
  
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    if (whatsappSetting?.value) {
      setWhatsappNumber(whatsappSetting.value);
    }
  }, [whatsappSetting]);

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
    if (whatsappNumber.length < 10) {
      toast({
        title: "Número inválido",
        description: "Digite um número de WhatsApp válido com DDD.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSetting.mutateAsync({ 
        key: 'whatsapp_general', 
        value: whatsappNumber 
      });
      toast({
        title: "Configurações salvas",
        description: "O número do WhatsApp foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
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
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#E5E5EA] shadow-sm">
        <div className="flex items-start gap-4 mb-4 pb-4 border-b border-[#E5E5EA]">
           <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
             <MessageCircle className="w-6 h-6 text-green-600" />
           </div>
           <div>
             <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight">WhatsApp da Administração</h3>
             <p className="text-[#86868B] font-medium mt-1">
               Configure o número que receberá as mensagens e os contatos gerados na plataforma.
             </p>
           </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-sm font-bold text-[#1D1D1F]">Número do WhatsApp</Label>
            <div className="relative w-full">
              <Input
                id="whatsapp"
                type="tel"
                placeholder="55 11 99999-9999"
                value={formatPhoneDisplay(whatsappNumber)}
                onChange={handleWhatsappChange}
                className="h-14 bg-white border-[#E5E5EA] rounded-xl focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 text-base shadow-sm transition-all"
              />
            </div>
            <p className="text-xs text-[#86868B] font-medium">
              Inclua o código do país (ex: 55) + DDD (ex: 31) + número.
            </p>
          </div>
          
          {whatsappNumber.length >= 10 && (
            <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5EA]">
              <p className="text-sm text-[#86868B] font-medium flex flex-wrap items-center gap-2">
                <strong className="text-[#1D1D1F]">Prévia do link:</strong>
                <a 
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6E2FAE] hover:text-[#5a268f] hover:underline transition-colors break-all font-semibold"
                >
                  wa.me/{whatsappNumber}
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[#E5E5EA] flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateSetting.isPending}
            className="h-12 px-8 rounded-full bg-[#6E2FAE] hover:bg-[#5a268f] text-white font-bold shadow-sm transition-all hover:-translate-y-0.5"
          >
            {updateSetting.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
