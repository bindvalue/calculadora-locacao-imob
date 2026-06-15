import { MessageCircle } from "lucide-react";
import { useSetting } from "@/hooks/useSettings";

const WhatsAppButton = () => {
  const { data: whatsappSetting } = useSetting('whatsapp_general');
  const whatsappNumber = whatsappSetting?.value || '5511999999999';
  
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de mais informações sobre os especialistas.`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300"
      aria-label="WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};

export default WhatsAppButton;
