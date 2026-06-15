import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import logoPurple from "@/assets/logo-sonho-real-purple.png";
import Footer from "@/components/Footer";

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar ao site</span>
          </Link>
          <img src={logoPurple.src} alt="Sonho Real Netimóveis" className="h-10" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: Janeiro de 2026
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1. Introdução */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                1. Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A Sonho Real Netimóveis ("nós", "nosso" ou "Empresa") está comprometida com a proteção 
                da privacidade e dos dados pessoais de nossos usuários, clientes e visitantes. Esta 
                Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos 
                suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados 
                Pessoais (Lei nº 13.709/2018 - LGPD) e demais legislações aplicáveis.
              </p>
            </section>

            {/* 2. Dados Coletados */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                2. Dados Pessoais Coletados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Coletamos os seguintes tipos de dados pessoais:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Dados de identificação:</strong> nome completo, CPF, RG, data de nascimento;</li>
                <li><strong>Dados de contato:</strong> e-mail, telefone, endereço residencial;</li>
                <li><strong>Dados profissionais:</strong> profissão, renda, empresa onde trabalha;</li>
                <li><strong>Dados de navegação:</strong> endereço IP, cookies, páginas visitadas, tempo de permanência;</li>
                <li><strong>Preferências de imóveis:</strong> tipo de imóvel, localização desejada, faixa de preço;</li>
                <li><strong>Dados de avaliação:</strong> comentários e notas sobre corretores.</li>
              </ul>
            </section>

            {/* 3. Finalidade do Tratamento */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                3. Finalidade do Tratamento de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos seus dados pessoais para as seguintes finalidades:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Intermediação e consultoria imobiliária;</li>
                <li>Contato para apresentação de imóveis compatíveis com seu perfil;</li>
                <li>Envio de propostas, contratos e documentação;</li>
                <li>Comunicação sobre atualizações de imóveis de interesse;</li>
                <li>Envio de newsletters e materiais promocionais (mediante consentimento);</li>
                <li>Análise de crédito e financiamento imobiliário;</li>
                <li>Cumprimento de obrigações legais e regulatórias;</li>
                <li>Melhoria dos nossos serviços e experiência do usuário.</li>
              </ul>
            </section>

            {/* 4. Base Legal */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                4. Base Legal para o Tratamento
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O tratamento de dados pessoais é realizado com fundamento nas seguintes bases legais 
                previstas na LGPD:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Consentimento (Art. 7º, I):</strong> para envio de comunicações de marketing;</li>
                <li><strong>Execução de contrato (Art. 7º, V):</strong> para prestação de serviços de intermediação imobiliária;</li>
                <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> para atender exigências do CRECI e órgãos reguladores;</li>
                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para análise de perfil e melhoria dos serviços.</li>
              </ul>
            </section>

            {/* 5. Compartilhamento de Dados */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                5. Compartilhamento de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Seus dados pessoais podem ser compartilhados com:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Corretores associados:</strong> para atendimento personalizado;</li>
                <li><strong>Instituições financeiras:</strong> para análise de crédito e financiamento;</li>
                <li><strong>Cartórios:</strong> para registro de documentos;</li>
                <li><strong>Prestadores de serviços:</strong> como empresas de tecnologia e marketing;</li>
                <li><strong>Órgãos públicos:</strong> quando exigido por lei ou ordem judicial.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Não vendemos, alugamos ou comercializamos seus dados pessoais para terceiros.
              </p>
            </section>

            {/* 6. Direitos do Titular */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                6. Direitos do Titular dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Conforme a LGPD, você possui os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e obter cópia;</li>
                <li><strong>Correção:</strong> solicitar a atualização de dados incompletos ou incorretos;</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou excessivos;</li>
                <li><strong>Portabilidade:</strong> transferir seus dados para outro fornecedor;</li>
                <li><strong>Eliminação:</strong> solicitar a exclusão dos dados tratados com base no consentimento;</li>
                <li><strong>Revogação do consentimento:</strong> retirar o consentimento a qualquer momento;</li>
                <li><strong>Oposição:</strong> opor-se ao tratamento em determinadas situações.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato conosco através dos canais indicados na seção 9.
              </p>
            </section>

            {/* 7. Segurança dos Dados */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                7. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e administrativas adequadas para proteger seus dados 
                pessoais contra acesso não autorizado, destruição, perda, alteração ou divulgação 
                indevida. Estas medidas incluem criptografia, controles de acesso, firewalls, 
                monitoramento de sistemas e treinamento de colaboradores. No entanto, nenhum sistema 
                é completamente seguro, e não podemos garantir segurança absoluta.
              </p>
            </section>

            {/* 8. Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                8. Cookies e Tecnologias Similares
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Cookies essenciais:</strong> necessários para o funcionamento do site;</li>
                <li><strong>Cookies de desempenho:</strong> para análise de uso e melhoria da experiência;</li>
                <li><strong>Cookies de funcionalidade:</strong> para lembrar suas preferências;</li>
                <li><strong>Cookies de publicidade:</strong> para exibir anúncios relevantes.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            {/* 9. Contato */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                9. Contato e Encarregado de Dados (DPO)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para questões relacionadas à privacidade e proteção de dados, entre em contato:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-muted-foreground">
                <p><strong>Sonho Real Netimóveis</strong></p>
                <p>E-mail: contato@sonhorealnetimoveis.com.br</p>
                <p>Endereço: Rua Dr Júlio Otaviano Ferreira nº814, Bairro Cidade Nova, PJ 3694</p>
              </div>
            </section>

            {/* 10. Atualizações */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                10. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças 
                em nossas práticas ou na legislação aplicável. Recomendamos que você revise esta página 
                regularmente. Alterações significativas serão comunicadas através do nosso site ou 
                por e-mail, quando aplicável.
              </p>
            </section>

            {/* 11. Lei Aplicável */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                11. Lei Aplicável e Foro
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política é regida pelas leis da República Federativa do Brasil. Fica eleito o 
                foro da comarca de Poços de Caldas/MG para dirimir quaisquer questões oriundas deste 
                documento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaPrivacidade;
