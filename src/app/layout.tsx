import "../index.css"; // Se o seu arquivo se chamar globals.css, troque o nome aqui
import { Toaster } from "sonner";
import { CookieConsentProvider } from "@/hooks/useCookieConsent";
import { AuthProvider } from "@/hooks/useAuth";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "Calculadora de Locação | Sonho Real",
  description: "Descubra o valor ideal do seu aluguel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            <CookieConsentProvider>
              {children}
              {/* Toaster global para os avisos de sucesso/erro */}
              <Toaster richColors position="top-right" />
            </CookieConsentProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}