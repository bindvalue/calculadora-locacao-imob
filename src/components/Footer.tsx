"use client";
import Link from "next/link";
import logoWhite from "@/assets/logo-sonho-real-white.png";
import { Heart, Cookie, Instagram, Facebook, Linkedin, MapPin, Phone, Mail, Lock } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

const Footer = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <footer className="pt-20 pb-10 bg-[#1C1C1E] text-white border-t border-gray-800">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 max-w-7xl mx-auto">
          
          {/* Coluna 1: Marca e Redes Sociais */}
          <div className="space-y-6 lg:col-span-1">
            <img 
              src={logoWhite.src} 
              alt="Sonho Real Netimóveis" 
              className="h-14"
            />
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
              Transformando sonhos em endereços desde 2010. Especialistas em conectar você ao imóvel ideal com segurança e transparência.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://www.instagram.com/sonhorealnetimoveis/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#6E2FAE] hover:text-white transition-all duration-300 hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/people/Sonho-Real-Netim%C3%B3veis/100088437953278/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#6E2FAE] hover:text-white transition-all duration-300 hover:-translate-y-1">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://br.linkedin.com/in/sonho-real-netim%C3%B3veis-b1b6a5360" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#6E2FAE] hover:text-white transition-all duration-300 hover:-translate-y-1">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links Institucionais */}
          <div className="lg:col-start-2">
            <h4 className="text-lg font-bold mb-6 tracking-tight text-white">Institucional</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidade" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-uso" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <button onClick={openPreferences} className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
                  <Cookie className="w-4 h-4" /> Configurar Cookies
                </button>
              </li>
              <li>
                <Link href="/auth" className="text-gray-400 hover:text-[#6E2FAE] transition-colors text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Acesso Restrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div className="md:col-span-2 lg:col-span-2 lg:col-start-3">
            <h4 className="text-lg font-bold mb-6 tracking-tight text-white">Fale Conosco</h4>
            <div className="space-y-5">
              <a href="https://wa.me/553135860209" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group w-fit">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#6E2FAE] transition-colors shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">(31) 3586-0209</span>
              </a>
              <a href="mailto:contato@sonhorealnetimoveis.com.br" className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group w-fit">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#6E2FAE] transition-colors shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">contato@sonhorealnetimoveis.com.br</span>
              </a>
              <div className="flex items-start gap-4 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#6E2FAE] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium leading-relaxed pt-2">
                  Rua Dr Júlio Otaviano Ferreira nº 814<br />
                  Bairro Cidade Nova, Belo Horizonte - MG<br />
                  PJ 3694
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright e Créditos */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium max-w-7xl mx-auto">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} Sonho Real Netimóveis. Todos os direitos
            reservados.
          </p>
          <p className="flex items-center justify-center gap-1">
            Desenvolvido por{" "}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#87CEEB" />
                  <stop offset="100%" stopColor="#0D47A1" />
                </linearGradient>
              </defs>
            </svg>
            <Heart 
              className="inline-block w-[1em] h-[1em]" 
              style={{ fill: 'url(#blue-gradient)', stroke: 'url(#blue-gradient)' }}
            />
            {" "}
            <a
              href="https://www.bindvalue.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-opacity hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, #87CEEB 0%, #0D47A1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              BindValue.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
