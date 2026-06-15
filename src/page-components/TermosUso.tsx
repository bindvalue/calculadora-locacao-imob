import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import logoPurple from "@/assets/logo-sonho-real-purple.png";
import Footer from "@/components/Footer";

const TermosUso = () => {
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
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: Janeiro de 2026
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1. Aceitação dos Termos */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar o site da Sonho Real Netimóveis ("Site"), você declara ter lido, 
                compreendido e aceito integralmente estes Termos de Uso. Caso não concorde com 
                qualquer disposição aqui estabelecida, solicitamos que não utilize nossos serviços. 
                O uso continuado do Site constitui aceitação de quaisquer alterações nestes Termos.
              </p>
            </section>

            {/* 2. Descrição dos Serviços */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                2. Descrição dos Serviços
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Sonho Real Netimóveis é uma plataforma que conecta pessoas interessadas em 
                comprar, vender ou alugar imóveis a corretores de imóveis qualificados. 
                Nossos serviços incluem:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Catálogo de corretores especializados em diferentes segmentos;</li>
                <li>Sistema de busca e filtro por especialidade;</li>
                <li>Canal de contato direto com corretores via WhatsApp;</li>
                <li>Sistema de avaliação de corretores;</li>
                <li>Consultoria imobiliária personalizada.</li>
              </ul>
            </section>

            {/* 3. Cadastro e Conta */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                3. Cadastro e Responsabilidades do Usuário
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ao utilizar nossos serviços, você se compromete a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Fornecer informações verdadeiras, precisas e atualizadas;</li>
                <li>Não utilizar identidade falsa ou se passar por outra pessoa;</li>
                <li>Manter a confidencialidade de suas credenciais de acesso;</li>
                <li>Notificar imediatamente sobre qualquer uso não autorizado;</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta.</li>
              </ul>
            </section>

            {/* 4. Conduta do Usuário */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                4. Conduta do Usuário
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                É expressamente proibido:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violar qualquer lei, regulamento ou direitos de terceiros;</li>
                <li>Transmitir conteúdo ilegal, ofensivo, difamatório ou discriminatório;</li>
                <li>Utilizar o Site para fins fraudulentos ou ilegais;</li>
                <li>Tentar acessar áreas restritas do sistema sem autorização;</li>
                <li>Interferir no funcionamento do Site ou de seus servidores;</li>
                <li>Coletar dados de outros usuários sem consentimento;</li>
                <li>Publicar avaliações falsas ou manipular o sistema de avaliações;</li>
                <li>Utilizar robôs, crawlers ou ferramentas automatizadas não autorizadas.</li>
              </ul>
            </section>

            {/* 5. Avaliações */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                5. Sistema de Avaliações
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As avaliações de corretores devem seguir as seguintes diretrizes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Devem refletir experiências reais com o corretor avaliado;</li>
                <li>Não podem conter linguagem ofensiva, calúnia ou difamação;</li>
                <li>Não podem incluir informações pessoais de terceiros;</li>
                <li>Devem ser imparciais e baseadas em fatos;</li>
                <li>Podem ser moderadas ou removidas se violarem estas diretrizes.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Reservamo-nos o direito de remover avaliações que violem estes Termos ou que 
                consideremos inadequadas, a nosso exclusivo critério.
              </p>
            </section>

            {/* 6. Propriedade Intelectual */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                6. Propriedade Intelectual
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo do Site, incluindo, mas não se limitando a textos, gráficos, 
                logotipos, ícones, imagens, clipes de áudio, downloads digitais e compilações 
                de dados, é propriedade da Sonho Real Netimóveis ou de seus licenciadores e é 
                protegido pelas leis brasileiras de propriedade intelectual. A reprodução, 
                distribuição, modificação ou uso não autorizado de qualquer conteúdo é 
                expressamente proibida.
              </p>
            </section>

            {/* 7. Limitação de Responsabilidade */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                7. Limitação de Responsabilidade
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Sonho Real Netimóveis atua como plataforma de conexão entre usuários e 
                corretores. Portanto:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Não garantimos a conclusão de qualquer negociação imobiliária;</li>
                <li>Não nos responsabilizamos por atos, omissões ou conduta dos corretores;</li>
                <li>Não garantimos a disponibilidade, precisão ou qualidade dos imóveis apresentados;</li>
                <li>Não nos responsabilizamos por perdas ou danos decorrentes do uso do Site;</li>
                <li>O usuário assume os riscos inerentes às transações imobiliárias;</li>
                <li>Recomendamos sempre a verificação independente de informações.</li>
              </ul>
            </section>

            {/* 8. Isenção de Garantias */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                8. Isenção de Garantias
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O Site é fornecido "no estado em que se encontra" e "conforme disponível". 
                Não oferecemos garantias de qualquer tipo, expressas ou implícitas, incluindo, 
                mas não se limitando a garantias de comerciabilidade, adequação a um propósito 
                específico, não violação de direitos ou garantias decorrentes de negociação ou uso. 
                Não garantimos que o Site será ininterrupto, seguro ou livre de erros.
              </p>
            </section>

            {/* 9. Indenização */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                9. Indenização
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em indenizar, defender e isentar a Sonho Real Netimóveis, seus 
                diretores, funcionários, parceiros e agentes de qualquer reclamação, demanda, 
                perda, responsabilidade e despesa (incluindo honorários advocatícios) decorrentes 
                de: (i) seu uso do Site; (ii) violação destes Termos; (iii) violação de direitos 
                de terceiros; (iv) qualquer conteúdo que você submeta ou transmita através do Site.
              </p>
            </section>

            {/* 10. Links de Terceiros */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                10. Links para Sites de Terceiros
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Nosso Site pode conter links para sites de terceiros. Esses links são fornecidos 
                apenas para conveniência e não implicam em endosso ou responsabilidade pelo 
                conteúdo, produtos ou serviços desses sites. Você acessa sites de terceiros por 
                sua conta e risco, e deve revisar os termos de uso e políticas de privacidade 
                aplicáveis a esses sites.
              </p>
            </section>

            {/* 11. Modificações */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                11. Modificações dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
                Alterações significativas serão comunicadas através do Site ou por e-mail. 
                O uso continuado do Site após a publicação das alterações constitui aceitação 
                dos novos Termos. Recomendamos que você revise periodicamente esta página.
              </p>
            </section>

            {/* 12. Rescisão */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                12. Rescisão
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos suspender ou encerrar seu acesso ao Site a qualquer momento, com ou sem 
                motivo, e sem aviso prévio. Você pode encerrar sua relação conosco deixando de 
                usar o Site. Todas as disposições destes Termos que, por sua natureza, devam 
                sobreviver à rescisão, sobreviverão, incluindo disposições de propriedade 
                intelectual, limitações de responsabilidade e indenização.
              </p>
            </section>

            {/* 13. Disposições Gerais */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                13. Disposições Gerais
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Integralidade:</strong> Estes Termos constituem o acordo integral entre você e a Sonho Real Netimóveis;</li>
                <li><strong>Renúncia:</strong> A não exigência de qualquer direito não constitui renúncia;</li>
                <li><strong>Divisibilidade:</strong> Se qualquer disposição for considerada inválida, as demais permanecerão em vigor;</li>
                <li><strong>Cessão:</strong> Você não pode ceder seus direitos sem nosso consentimento prévio.</li>
              </ul>
            </section>

            {/* 14. Lei Aplicável */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                14. Lei Aplicável e Foro
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil, 
                especialmente pelo Código de Defesa do Consumidor (Lei nº 8.078/1990), 
                Código Civil (Lei nº 10.406/2002) e Marco Civil da Internet (Lei nº 12.965/2014). 
                Fica eleito o foro da comarca de Poços de Caldas/MG para dirimir quaisquer 
                controvérsias oriundas destes Termos, com renúncia expressa a qualquer outro, 
                por mais privilegiado que seja.
              </p>
            </section>

            {/* 15. Contato */}
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
                15. Contato
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-muted-foreground">
                <p><strong>Sonho Real Netimóveis</strong></p>
                <p>E-mail: contato@sonhorealnetimoveis.com.br</p>
                <p>Endereço: Rua Dr Júlio Otaviano Ferreira nº814, Bairro Cidade Nova, PJ 3694</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermosUso;
