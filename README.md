# Calculadora de Locação Imobiliária

Um sistema completo de simulação de aluguel imobiliário construído com Next.js, focado em captura de leads e gestão administrativa de valores baseados no mercado (Secovi), corretores e avaliações.

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (App Router & Server Actions)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) e componentes baseados no [shadcn/ui](https://ui.shadcn.com/)
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/)
- **Integração de APIs:** Google Places API (Autocompletar Inteligente de Endereços)
- **Ícones:** [Lucide React](https://lucide.dev/)

## ⚙️ Funcionalidades

### Portal Público
- **Calculadora Inteligente:** Estimativa de valores de locação com base na metragem e localização.
- **Captura de Leads:** Geração de oportunidades de negócio enviadas diretamente para o painel administrativo.
- **Vitrine de Corretores:** Exibição de especialistas imobiliários e suas avaliações para passar credibilidade ao lead.

### Painel Administrativo (Restrito)
- **Autenticação Segura:** Login, redefinição e recuperação de senha ("Esqueci minha senha") gerenciados nativamente via Supabase Auth.
- **Gestão de Leads:** Visualização e acompanhamento de contatos gerados pela calculadora pública.
- **Gestão de Corretores & Avaliações:** Cadastro e edição de perfil de corretores.
- **Gestão de Preços (Secovi):** 
  - Importação em lote (Planilhas Excel .xlsx / .csv).
  - Cadastro manual inteligente integrado ao **Google Places API** para padronização rigorosa de bairros, cidades e estados, impedindo erros de digitação e atrelando-os ao valor do metro quadrado correto.

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn
- Conta no [Supabase](https://supabase.com/) (com banco de dados PostgreSQL provisionado)
- Chave da API do Google Cloud com a **Places API** habilitada.

### Passos de Instalação

1. **Clone o repositório e acesse a pasta do projeto:**
   ```bash
   git clone https://github.com/bindvalue/calculadora-locacao-imob.git
   cd calculadora-locacao-imob/especialistas-imobili-rios
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto (`especialistas-imobili-rios/.env.local`) com as seguintes chaves:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_para_bypasses_no_backend
   GOOGLE_PLACES_API_KEY=sua_chave_da_api_do_google_places
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador para ver o sistema rodando.

## 📄 Licença

Este projeto é de uso exclusivo para a gestão interna e operações relacionadas aos Especialistas Imobiliários da plataforma.