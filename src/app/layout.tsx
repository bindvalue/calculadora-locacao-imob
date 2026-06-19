import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "Calculadora de Locação | Sonho Real",
  description: "Descubra o valor ideal do seu aluguel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
