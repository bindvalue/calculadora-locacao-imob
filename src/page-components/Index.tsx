"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator,
  Phone,
  Loader2,
  TrendingUp,
  Calendar,
  Zap,
  BarChart,
  MapPin,
  Target,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Download,
  FileText,
  Cpu,
  FileDown,
  Building,
} from "lucide-react";

import logoPurple from "../assets/logo-sonho-real-purple.png";
import logoWhite from "../assets/logo-sonho-real-white.png";
import resultadoImg from "../assets/resultado_calcu_img.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClasses = "h-12 xl:h-14 px-4 bg-gray-50 border-gray-200/80 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-sm xl:text-base";
const labelClasses = "text-xs xl:text-sm font-bold text-gray-700 ml-1 mb-1 xl:mb-1.5 block";

// Dicionário de Valor de m² por Bairro (Fallback Inicial)
const DEFAULT_NEIGHBORHOOD_RATES: Record<string, { min: number, max: number, default: number }> = {
  "lourdes": { min: 40, max: 90, default: 65 },
  "savassi": { min: 40, max: 85, default: 60 },
  "funcionarios": { min: 35, max: 80, default: 55 },
  "belvedere": { min: 35, max: 80, default: 50 },
  "vila da serra": { min: 35, max: 80, default: 50 },
  "santo agostinho": { min: 35, max: 75, default: 50 },
  "sion": { min: 30, max: 70, default: 45 },
  "cruzeiro": { min: 25, max: 60, default: 40 },
  "anchieta": { min: 25, max: 60, default: 40 },
  "cidade nova": { min: 20, max: 55, default: 35 },
  "castelo": { min: 20, max: 45, default: 30 },
  "buritis": { min: 20, max: 45, default: 30 },
  "centro": { min: 15, max: 45, default: 25 },
  "padrao": { min: 12, max: 35, default: 20 } // Fallback genérico para bairros não mapeados
};

const ESTIMATED_YIELD_AM = 0.0045;
const MAX_REASONABLE_RENT_M2 = 300;

const normalizeRentM2Value = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > MAX_REASONABLE_RENT_M2 ? Number((value * ESTIMATED_YIELD_AM).toFixed(2)) : value;
};

const normalizeRentM2Range = (rate: { min: number, max: number, default: number }) => {
  const normalized = {
    min: normalizeRentM2Value(Number(rate.min)),
    max: normalizeRentM2Value(Number(rate.max)),
    default: normalizeRentM2Value(Number(rate.default)),
  };

  const orderedMin = Math.min(normalized.min, normalized.max, normalized.default);
  const orderedMax = Math.max(normalized.min, normalized.max, normalized.default);

  return {
    min: Number(orderedMin.toFixed(2)),
    max: Number(orderedMax.toFixed(2)),
    default: Number(normalized.default.toFixed(2)),
  };
};

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  whatsapp: z.string().min(10, { message: "Por favor, insira um WhatsApp válido." }),
  relationship: z.string().min(1, { message: "Selecione sua relação com o imóvel." }),
  cep: z.string().regex(/^\d{5}-\d{3}$/, { message: "CEP inválido." }),
  propertyType: z.string().min(1, { message: "Selecione o tipo de imóvel." }),
  state: z.string().length(2, { message: "UF inválida." }),
  city: z.string().min(2, { message: "Cidade inválida." }),
  street: z.string(),
  houseNumber: z.string().min(1, { message: "Obrigatório." }),
  complement: z.string().optional(),
  neighborhood: z.string(),
  area: z.coerce.number().positive({ message: "Área deve ser positiva." }),
  saleValue: z.coerce.number().optional(),
  bathrooms: z.number().min(0),
  bedrooms: z.number().min(0),
  suites: z.number().min(0),
  parkingSpots: z.number().min(0),
  condominium: z.coerce.number().nonnegative({ message: "Valor deve ser positivo." }).optional(),
  hasIptu: z.boolean({ required_error: "Por favor, selecione uma opção." }),
  iptuValue: z.coerce.number().nonnegative({ message: "Valor deve ser positivo." }).optional(),
  estimatedTime: z.string().optional(),
  customPropertyType: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const maskWhatsApp = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCep = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const Index = () => {
  const [neighborhoodRates, setNeighborhoodRates] = useState(DEFAULT_NEIGHBORHOOD_RATES);
  const [m2Range, setM2Range] = useState(DEFAULT_NEIGHBORHOOD_RATES["padrao"]);
  const [m2Value, setM2Value] = useState([DEFAULT_NEIGHBORHOOD_RATES["padrao"].default]);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingStreet, setIsSearchingStreet] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [adminPhone, setAdminPhone] = useState("553135860209");
  const [whatsappLink, setWhatsappLink] = useState(`https://wa.me/553135860209`);
  const [step, setStep] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      relationship: "",
      cep: "",
      propertyType: "",
      state: "",
      city: "",
      street: "",
      houseNumber: "",
      complement: "",
      neighborhood: "",
      area: "" as unknown as number,
      saleValue: "" as unknown as number,
      bathrooms: 0,
      bedrooms: 0,
      suites: 0,
      parkingSpots: 0,
      condominium: "" as unknown as number,
      hasIptu: undefined as unknown as boolean,
      iptuValue: "" as unknown as number,
      estimatedTime: "",
      customPropertyType: "",
    },
    mode: "onChange",
  });

  // Busca o WhatsApp dinâmico configurado no painel de Administração
  useEffect(() => {
    const fetchAdminPhone = async () => {
      try {
const { data } = await (supabase as any)
          .from("settings")
          .select("value")
          .eq("key", "whatsapp_general")
          .maybeSingle();
        if (data?.value) {
          setAdminPhone(data.value);
          setWhatsappLink(`https://wa.me/${data.value}`);
        }
      } catch (err) {}
    };
    fetchAdminPhone();
  }, []);

  const { area, saleValue, condominium, hasIptu, iptuValue, street, houseNumber, complement, neighborhood, city, state, cep, propertyType, customPropertyType } = form.watch();
  const canCalculate = area > 0;

  useEffect(() => {
    setHasCalculated(false);
  }, [area, saleValue, condominium, hasIptu, iptuValue]);

  // Efeito: Busca a tabela de preços do Secovi dinamicamente no Supabase
  useEffect(() => {
    const fetchSecoviRates = async () => {
      try {
const { data, error } = await (supabase as any).from("secovi_valores").select("*");
        if (data && !error && data.length > 0) {
          const dynamicRates: Record<string, { min: number, max: number, default: number }> = { ...DEFAULT_NEIGHBORHOOD_RATES };
          data.forEach((item) => {
            // Normalizamos para minúsculo sem acento para facilitar a busca do cliente
            const key = item.bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            dynamicRates[key] = normalizeRentM2Range({
              min: Number(item.valor_min),
              max: Number(item.valor_max),
              default: Number(item.valor_default),
            });
          });
          setNeighborhoodRates(dynamicRates);
        }
      } catch (err) {
        console.error("Erro ao buscar tabela Secovi:", err);
      }
    };
    fetchSecoviRates();
  }, []);

  // Efeito: Atualiza os limites e valores sugeridos do m² quando o bairro mudar
  useEffect(() => {
    let rate = neighborhoodRates["padrao"];

    if (neighborhood) {
      const normalizedBairro = neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      for (const [key, value] of Object.entries(neighborhoodRates)) {
        if (normalizedBairro.includes(key)) {
          rate = value;
          break;
        }
      }
    }

    setM2Range(rate);
    setM2Value([rate.default]);
  }, [neighborhood, neighborhoodRates]);

  useEffect(() => {
    if (canCalculate && hasCalculated && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [canCalculate, hasCalculated]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['cep', 'state', 'city', 'street', 'houseNumber', 'neighborhood'];
    if (step === 2) fieldsToValidate = ['propertyType', 'customPropertyType', 'area', 'saleValue'];
    if (step === 3) fieldsToValidate = ['bathrooms', 'bedrooms', 'suites', 'parkingSpots'];
    if (step === 4) fieldsToValidate = ['condominium', 'hasIptu', 'iptuValue'];
    
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCepBlur = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      if (!response.ok) throw new Error("CEP não encontrado.");
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado.");

      form.setValue("street", data.logradouro || "", { shouldValidate: true });
      form.setValue("neighborhood", data.bairro || "", { shouldValidate: true });
      form.setValue("city", data.localidade || "", { shouldValidate: true });
      form.setValue("state", data.uf || "", { shouldValidate: true });
      toast.success("Endereço preenchido automaticamente!");
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleAddressSearch = async () => {
    const { street, city, state } = form.getValues();
    if (street?.length >= 3 && city?.length >= 3 && state?.length === 2) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${state}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`);
        if (!response.ok) throw new Error("Erro na busca por endereço");
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const address = data[0];
          form.setValue("cep", address.cep, { shouldValidate: true });
          form.setValue("neighborhood", address.bairro, { shouldValidate: true });
          form.setValue("street", address.logradouro, { shouldValidate: true });
          form.setValue("city", address.localidade, { shouldValidate: true });
          toast.success("CEP e bairro encontrados!");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const searchStreet = async (streetText: string) => {
    const { city, state } = form.getValues();
    if (streetText.length >= 3 && city?.length >= 3 && state?.length === 2) {
      setIsSearchingStreet(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${state}/${encodeURIComponent(city)}/${encodeURIComponent(streetText)}/json/`);
        if (!response.ok) throw new Error("Erro na busca");
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearchingStreet(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const { monthlyRent, annualIncome, monthlyYield, returnOnSaleYears, estimatedIptu, netRent, netYield, totalExpenses, estimatedSaleValue, estimatedSaleM2 } = useMemo(() => {
    if (!canCalculate) {
      return { monthlyRent: 0, annualIncome: 0, monthlyYield: 0, returnOnSaleYears: 0, estimatedIptu: 0, netRent: 0, netYield: 0, totalExpenses: 0, estimatedSaleValue: 0, estimatedSaleM2: 0 };
    }
    const rent = area * m2Value[0]; // Gross Rent (Pacote)
    const condoCost = Number(condominium) || 0;
    const iptuCost = hasIptu ? (Number(iptuValue) || 0) / 12 : 0; // Valor anual dividido por 12
    
    const net = Math.max(0, rent - condoCost - iptuCost);
    const totalExp = condoCost + iptuCost;
    
    const income = net * 12; // Renda anual baseada no líquido
    // Novo indicador baseado em eficiência (não depende do valor do imóvel)
    const yieldValue = rent > 0 ? (net / rent) * 100 : 0; // % do que sobra do bruto
    const nYield = yieldValue;
    const returnYears = 0;

    // Estimativa de venda baseada em um Yield médio de mercado de 0.45% a.m.
    const estSaleM2 = m2Value[0] / ESTIMATED_YIELD_AM;
    const estSaleValue = rent / ESTIMATED_YIELD_AM;

    return {
      monthlyRent: rent,
      annualIncome: income,
      monthlyYield: yieldValue,
      returnOnSaleYears: returnYears,
      estimatedIptu: iptuCost,
      netRent: net,
      netYield: nYield,
      totalExpenses: totalExp,
      estimatedSaleValue: estSaleValue,
      estimatedSaleM2: estSaleM2,
    };
  }, [area, saleValue, m2Value, canCalculate, condominium, hasIptu, iptuValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const finalPropertyType = data.propertyType === "Outro" && data.customPropertyType ? data.customPropertyType : data.propertyType;

      // Salvando no Supabase para o CRM dos administradores
const { error } = await (supabase as any).from("leads_calculadora").insert([
        {
          nome: data.name,
          email: data.email,
          whatsapp: data.whatsapp,
          relacao_imovel: data.relationship,
          tempo_estimado: data.estimatedTime || null,
          cep: data.cep,
          estado: data.state,
          cidade: data.city,
          bairro: data.neighborhood,
          rua: data.street,
          numero: data.houseNumber,
          complemento: data.complement || null,
          tipo_imovel: finalPropertyType,
          area_m2: data.area,
          valor_venda: estimatedSaleValue,
          quartos: data.bedrooms,
          suites: data.suites,
          banheiros: data.bathrooms,
          vagas: data.parkingSpots,
          valor_condominio: data.condominium || 0,
          paga_iptu: data.hasIptu,
          valor_iptu_anual: data.iptuValue || 0,
          aluguel_bruto: monthlyRent,
          aluguel_liquido: netRent,
          yield_liquido: netYield,
        },
      ]);

      if (error) throw error;

      toast.success("Simulação concluída com sucesso!");
      setHasCalculated(true);

      const urgencyText = data.estimatedTime ? `\n- Urgência: ${data.estimatedTime}` : "";
      const message = `Olá! Fiz uma simulação na Calculadora de Locação e gostaria de falar com um especialista.\n\n*Meus Dados:*\n- Relação: ${data.relationship}${urgencyText}\n\n*Dados do Imóvel:*\n- Tipo: ${finalPropertyType}\n- Características: ${data.bedrooms} Quartos (${data.suites} suítes), ${data.bathrooms} Banheiros, ${data.parkingSpots} Vagas\n- Custos: Condomínio ${data.condominium ? formatCurrency(data.condominium) : 'Não informado'}, IPTU: ${data.hasIptu ? `Sim (${formatCurrency(data.iptuValue || 0)}/ano)` : 'Não'}\n- Endereço: ${data.street}, ${data.neighborhood}, ${data.city}\n- Pacote de Locação: ${formatCurrency(monthlyRent)}/mês\n- Aluguel Líquido: ${formatCurrency(netRent)}/mês`;
      setWhatsappLink(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`);

    } catch (error) {
      console.error("Submission error:", JSON.stringify(error, null, 2));
      toast.error("Erro ao salvar simulação.", {
        description: "Por favor, tente novamente ou entre em contato conosco.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define os terços (Faixas) da régua baseados no bairro do cliente
  const third1 = Math.floor(m2Range.min + (m2Range.max - m2Range.min) * 0.33);
  const third2 = Math.floor(m2Range.min + (m2Range.max - m2Range.min) * 0.66);
  
  const isShortTerm = m2Value[0] <= third1;
  const isMediumTerm = m2Value[0] > third1 && m2Value[0] <= third2;
  const isLongTerm = m2Value[0] > third2;

  return (
    <main className="w-full font-sans antialiased selection:bg-[#6E2FAE] selection:text-white">
      {/* Controle de Escala Global para Notebooks */}
      <style>
        {`
          @media (min-width: 1024px) and (max-height: 800px) {
            html { font-size: 85%; }
          }
        `}
      </style>
      
      {/* HERO SECTION: Calculadora Split-Screen */}
      <section className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-white w-full relative z-10 shadow-xl print:hidden">
      {/* COLUNA ESQUERDA: Formulário & Resultados (Rolagem Interna) */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col h-full bg-white relative z-10">
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-100 w-full sticky top-0 left-0 z-30 shrink-0">
          <div className="h-full bg-[#6E2FAE] transition-all duration-500 ease-out" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>

        {/* Header Mobile Only */}
        <header className="lg:hidden w-full bg-white/95 backdrop-blur-xl py-2 px-6 flex items-center justify-between border-b border-gray-100 shrink-0 z-20 sticky top-1.5">
<img src={(logoPurple as any).src || logoPurple} alt="Sonho Real" className="h-14" />
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#6E2FAE] bg-[#6E2FAE]/10 hover:bg-[#6E2FAE]/20 px-4 py-2 rounded-full transition-colors">
            Falar com consultor
          </a>
        </header>

        {/* Header Desktop */}
        <header className="hidden lg:flex w-full pt-4 xl:pt-6 pb-2 px-6 xl:px-10 items-center justify-between shrink-0">
<img src={(logoPurple as any).src || logoPurple} alt="Sonho Real" className="h-12 xl:h-16" />
        </header>

        {/* Container do Wizard (Formulário) */}
        <div className="flex-grow flex flex-col justify-start px-6 sm:px-12 pt-4 xl:pt-8 pb-0 max-w-2xl mx-auto w-full min-h-0">
          
          {/* Contexto Mobile (Oculto no Desktop) */}
          {step === 1 && (
            <div className="lg:hidden mb-6 pb-6 border-b border-gray-100 animate-in fade-in slide-in-from-top-4 duration-700 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#6E2FAE]/10 rounded-full text-xs font-bold text-[#6E2FAE] mb-4">
                <Sparkles className="w-3 h-3" /> Avaliação Inteligente
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                Calcule o <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B475F3] to-[#6E2FAE]">aluguel ideal</span>
              </h1>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                Descubra o valor ideal para locação do seu imóvel baseado em dados reais de mercado.
              </p>
            </div>
          )}

          {/* Step Info */}
          <div className="mb-4 xl:mb-6 shrink-0">
            <span className="text-xs font-bold text-[#6E2FAE] tracking-widest uppercase mb-3 block">
              Passo {step} de 5
            </span>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold text-gray-900 tracking-tight mb-2 xl:mb-3">
              {step === 1 && "Onde está localizado?"}
              {step === 2 && "Sobre o imóvel"}
              {step === 3 && "Características do imóvel"}
              {step === 4 && "Custos do imóvel"}
              {step === 5 && "Seus dados de contato"}
            </h2>
            <p className="text-gray-500 font-medium text-sm xl:text-lg leading-relaxed">
              {step === 1 && "Precisamos do endereço exato para nossa IA buscar os dados reais da sua região."}
              {step === 2 && "Conte-nos os detalhes principais para podermos iniciar a avaliação precisa do seu imóvel."}
              {step === 3 && "Precisamos saber a distribuição dos cômodos para uma avaliação justa."}
              {step === 4 && "Informe os custos fixos para calcularmos a rentabilidade real."}
              {step === 5 && "Para quem enviaremos o resultado detalhado dessa simulação de mercado?"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
              
              {/* ÁREA ROLÁVEL DOS CAMPOS */}
              <div className="flex-grow overflow-y-auto pr-3 sm:pr-4 pb-4 space-y-4 xl:space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 transition-colors">
               {/* Step 1 Fields: Endereço */}
               <div className={step === 1 ? "block space-y-4 xl:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" : "hidden"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField name="cep" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClasses}>CEP</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="00000-000" {...field} onChange={e => field.onChange(maskCep(e.target.value))} onBlur={() => handleCepBlur(field.value)} className={inputClasses} />
                            {isFetchingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-[#6E2FAE]" />}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-12 gap-5">
                    <div className="col-span-4">
                      <FormField name="state" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>Estado</FormLabel> <FormControl><Input placeholder="UF" maxLength={2} {...field} onBlur={(e) => { field.onBlur(); handleAddressSearch(); }} className={`${inputClasses} uppercase`} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <div className="col-span-8">
                      <FormField name="city" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>Cidade</FormLabel> <FormControl><Input placeholder="Ex: Belo Horizonte" {...field} onBlur={(e) => { field.onBlur(); handleAddressSearch(); }} className={inputClasses} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-5">
                    <div className="col-span-8 sm:col-span-9">
                      <FormField name="street" control={form.control} render={({ field }) => (
                        <FormItem className="relative">
                          <div className="mb-2">
                            <FormLabel className="text-sm font-bold text-gray-700 ml-1 mb-0.5 block">Rua</FormLabel>
                            <p className="text-xs text-gray-500 ml-1 font-medium">Para buscar pelo nome da rua, preencha o Estado e a Cidade primeiro.</p>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Ex: Afonso Pena" {...field} onChange={(e) => { field.onChange(e); searchStreet(e.target.value); }} onBlur={() => { field.onBlur(); setTimeout(() => setShowSuggestions(false), 200); }} className={`${inputClasses} pr-12`} />
                              {isSearchingStreet && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
                            </div>
                          </FormControl>
                          {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-auto top-[calc(100%+0.5rem)] left-0 p-2 animate-in fade-in-0 zoom-in-95">
                              {suggestions.map((suggestion, idx) => (
                                <li key={idx} className="px-4 py-3 hover:bg-gray-50 hover:text-gray-900 cursor-pointer rounded-xl text-sm transition-colors" onClick={() => { form.setValue("street", suggestion.logradouro, { shouldValidate: true }); form.setValue("neighborhood", suggestion.bairro, { shouldValidate: true }); form.setValue("cep", suggestion.cep, { shouldValidate: true }); setShowSuggestions(false); toast.success("Endereço preenchido!"); }}>
                                  <p className="font-bold leading-none mb-1 text-gray-800">{suggestion.logradouro}</p>
                                  <p className="text-xs text-gray-500 font-medium">{suggestion.bairro} - CEP: {suggestion.cep}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <FormField name="houseNumber" control={form.control} render={({ field }) => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-sm font-bold text-gray-700 ml-1 mb-0.5 block">Número</FormLabel>
                            <p className="text-xs text-transparent ml-1 font-medium select-none pointer-events-none">.</p>
                          </div>
                          <FormControl>
                            <Input placeholder="Ex: 123" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField name="neighborhood" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>Bairro</FormLabel> <FormControl><Input placeholder="Bairro" {...field} className={inputClasses} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="complement" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>Complemento</FormLabel> <FormControl><Input placeholder="Apto 101" {...field} className={inputClasses} /></FormControl> <FormMessage /> </FormItem> )} />
                  </div>
               </div>

               {/* Step 2 Fields: Sobre o imóvel */}
               <div className={step === 2 ? "block space-y-4 xl:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" : "hidden"}>
                  <FormField name="propertyType" control={form.control} render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={labelClasses}>Tipo de Imóvel</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {["Apartamento", "Casa", "Casa de Condomínio", "Cobertura", "Studio", "Sala Comercial", "Galpão", "Outro"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                field.onChange(type);
                                if (type !== "Outro") form.setValue("customPropertyType", "");
                              }}
                              className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                field.value === type
                                  ? "bg-[#6E2FAE] text-white border-[#6E2FAE] shadow-md"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-[#6E2FAE]/50 hover:bg-gray-50"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {propertyType === "Outro" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
                      <FormField name="customPropertyType" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClasses}>Qual o tipo do imóvel?</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Sítio, Chácara, Ponto Comercial..." {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField name="area" control={form.control} render={({ field }) => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel className="text-sm font-bold text-gray-700 ml-1 mb-0.5 block">Área (m²)</FormLabel>
                          <p className="text-xs text-gray-500 ml-1 font-medium">Insira um valor aproximado se não souber o exato.</p>
                        </div>
                        <FormControl>
                          <Input type="text" placeholder="Ex: 120 m²" {...field} value={field.value ? `${field.value} m²` : ""} onChange={(e) => { const rawValue = e.target.value.replace(/\D/g, ""); if (!rawValue) return field.onChange("" as unknown as number); field.onChange(Number(rawValue)); }} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
               </div>

               {/* Step 3 Fields: Características */}
               <div className={step === 3 ? "block space-y-3 animate-in fade-in slide-in-from-right-4 duration-500" : "hidden"}>
                  {/* Card Banheiros */}
                  <FormField name="bathrooms" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-[#E5E5EA]">
                      <div className="space-y-0.5 mb-3 sm:mb-0 pr-4">
                        <FormLabel className="text-base sm:text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight">Qual o número de banheiros?</FormLabel>
                        <p className="text-xs sm:text-sm text-[#86868B] font-medium">Não incluir lavabo e serviço</p>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-3 sm:gap-4 bg-[#F2F2F7] p-1.5 rounded-full w-fit shrink-0">
                          <button type="button" onClick={() => field.onChange(Math.max(0, field.value - 1))} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="w-6 text-center font-semibold text-[#1D1D1F] text-lg sm:text-xl">{field.value}</span>
                          <button type="button" onClick={() => field.onChange(field.value + 1)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                  
                  {/* Card Quartos */}
                  <FormField name="bedrooms" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-[#E5E5EA]">
                      <div className="space-y-0.5 mb-3 sm:mb-0 pr-4">
                        <FormLabel className="text-base sm:text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight">Qual o número de quartos?</FormLabel>
                        <p className="text-xs sm:text-sm text-[#86868B] font-medium">Incluindo suítes</p>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-3 sm:gap-4 bg-[#F2F2F7] p-1.5 rounded-full w-fit shrink-0">
                          <button type="button" onClick={() => field.onChange(Math.max(0, field.value - 1))} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="w-6 text-center font-semibold text-[#1D1D1F] text-lg sm:text-xl">{field.value}</span>
                          <button type="button" onClick={() => field.onChange(field.value + 1)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* Card Suítes */}
                  <FormField name="suites" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-[#E5E5EA]">
                      <div className="space-y-0.5 mb-3 sm:mb-0 pr-4">
                        <FormLabel className="text-base sm:text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight">Destes, quantos são suítes?</FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-3 sm:gap-4 bg-[#F2F2F7] p-1.5 rounded-full w-fit shrink-0">
                          <button type="button" onClick={() => field.onChange(Math.max(0, field.value - 1))} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="w-6 text-center font-semibold text-[#1D1D1F] text-lg sm:text-xl">{field.value}</span>
                          <button type="button" onClick={() => field.onChange(field.value + 1)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* Card Vagas */}
                  <FormField name="parkingSpots" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-[#E5E5EA]">
                      <div className="space-y-0.5 mb-3 sm:mb-0 pr-4">
                        <FormLabel className="text-base sm:text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight">Qual o número de vagas de garagem?</FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-3 sm:gap-4 bg-[#F2F2F7] p-1.5 rounded-full w-fit shrink-0">
                          <button type="button" onClick={() => field.onChange(Math.max(0, field.value - 1))} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="w-6 text-center font-semibold text-[#1D1D1F] text-lg sm:text-xl">{field.value}</span>
                          <button type="button" onClick={() => field.onChange(field.value + 1)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 shadow-sm text-[#1D1D1F] flex items-center justify-center transition-all duration-300">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                 {hasIptu && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                     <FormField name="iptuValue" control={form.control} render={({ field }) => (
                       <FormItem className="space-y-3 pt-2">
                         <div>
                           <FormLabel className="text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight block">Valor total anual do IPTU</FormLabel>
                           <p className="text-sm text-[#86868B] font-medium mt-1">Considere os custos adicionais do IPTU (ex: garagem, depósito, etc.)</p>
                         </div>
                         <FormControl>
                           <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">R$</span>
                             <Input 
                               type="text" 
                               placeholder="0,00" 
                               {...field} 
                               value={field.value ? formatCurrency(field.value).replace('R$', '').trim() : ""} 
                               onChange={(e) => { 
                                 const rawValue = e.target.value.replace(/\D/g, ""); 
                                 if (!rawValue) return field.onChange("" as unknown as number); 
                                 const numericValue = Number(rawValue) / 100; 
                                 field.onChange(numericValue); 
                               }} 
                               className="h-14 pl-12 pr-4 bg-white border-[#E5E5EA] rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-lg font-medium"
                             />
                           </div>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )} />
                   </div>
                 )}
               </div>

               {/* Step 4 Fields: Custos do imóvel */}
               <div className={step === 4 ? "block space-y-4 xl:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" : "hidden"}>
                 <FormField name="condominium" control={form.control} render={({ field }) => (
                   <FormItem className="space-y-3">
                     <div>
                       <FormLabel className="text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight block">Valor mensal do condomínio</FormLabel>
                       <p className="text-sm text-[#86868B] font-medium mt-1">Não incluir despesas pontuais (aluguel de salão ou churrasqueira, etc.)</p>
                     </div>
                     <FormControl>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">R$</span>
                         <Input 
                           type="text" 
                           placeholder="0,00" 
                           {...field} 
                           value={field.value ? formatCurrency(field.value).replace('R$', '').trim() : ""} 
                           onChange={(e) => { 
                             const rawValue = e.target.value.replace(/\D/g, ""); 
                             if (!rawValue) return field.onChange("" as unknown as number); 
                             const numericValue = Number(rawValue) / 100; 
                             field.onChange(numericValue); 
                           }} 
                           className="h-14 pl-12 pr-4 bg-white border-[#E5E5EA] rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-lg font-medium"
                         />
                       </div>
                     </FormControl>
                     <div className="relative group w-fit mt-2">
                       <button type="button" className="text-sm font-semibold text-[#6E2FAE] hover:text-[#5a268f] transition-colors text-left flex items-center gap-1.5 focus:outline-none">
                         <Info className="w-4 h-4" /> O que incluir nesse valor?
                       </button>
                       <div className="absolute top-full left-0 mt-3 z-50 w-[85vw] sm:w-[22rem] bg-[#1D1D1F] text-white p-5 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-200 origin-top-left pointer-events-none">
                         <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#1D1D1F] rotate-45 rounded-sm"></div>
                         <p className="text-sm font-medium leading-relaxed mb-3">
                           Para um cálculo preciso da rentabilidade, considere apenas a <strong className="text-white font-bold">cota ordinária fixa</strong>.
                         </p>
                         <ul className="list-disc pl-4 text-sm text-[#A1A1A6] space-y-2 marker:text-[#6E2FAE]">
                           <li><strong className="text-gray-200">Não inclua:</strong> Fundo de reserva, taxa de obras ou chamadas extras.</li>
                           <li><strong className="text-gray-200">Não inclua:</strong> Consumos individuais se cobrados no mesmo boleto (água, luz, gás).</li>
                         </ul>
                       </div>
                     </div>
                     <FormMessage />
                   </FormItem>
                 )} />

                 <FormField name="hasIptu" control={form.control} render={({ field }) => (
                   <FormItem className="space-y-4 pt-6">
                     <div className="flex flex-col relative group w-fit">
                       <div className="flex items-center gap-2">
                         <FormLabel className="text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight block">Você paga IPTU?</FormLabel>
                         <button type="button" className="text-gray-400 hover:text-[#6E2FAE] transition-colors focus:outline-none">
                           <Info className="w-4 h-4" />
                         </button>
                       </div>
                       <div className="absolute top-full left-0 mt-3 z-50 w-[85vw] sm:w-72 bg-[#1D1D1F] text-white p-4 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-200 pointer-events-none">
                         <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#1D1D1F] rotate-45 rounded-sm"></div>
                         <p className="text-sm font-medium leading-relaxed text-[#A1A1A6]">
                            Caso marque sim, o valor anual informado será dividido por 12 e descontado do pacote de locação para projetar sua <strong className="text-white">rentabilidade líquida real</strong>.
                         </p>
                       </div>
                     </div>
                     <FormControl>
                       <div className="flex gap-4">
                         <button type="button" onClick={() => field.onChange(true)} className={`flex-1 h-12 xl:h-14 rounded-full font-semibold text-sm xl:text-base transition-all border shadow-sm ${field.value === true ? "bg-white text-[#6E2FAE] border-[#6E2FAE] ring-1 ring-[#6E2FAE]" : "bg-white text-[#1D1D1F] border-[#E5E5EA] hover:bg-gray-50"}`}>
                           Sim
                         </button>
                         <button type="button" onClick={() => { 
                           field.onChange(false);
                           form.setValue("iptuValue", "" as unknown as number, { shouldValidate: true });
                         }} className={`flex-1 h-12 xl:h-14 rounded-full font-semibold text-sm xl:text-base transition-all border shadow-sm ${field.value === false ? "bg-white text-[#6E2FAE] border-[#6E2FAE] ring-1 ring-[#6E2FAE]" : "bg-white text-[#1D1D1F] border-[#E5E5EA] hover:bg-gray-50"}`}>
                           Não
                         </button>
                       </div>
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )} />

                 {hasIptu && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                     <FormField name="iptuValue" control={form.control} render={({ field }) => (
                       <FormItem className="space-y-3 pt-2">
                         <div>
                           <FormLabel className="text-lg font-semibold text-[#1D1D1F] m-0 tracking-tight block">Valor total anual do IPTU</FormLabel>
                           <p className="text-sm text-[#86868B] font-medium mt-1">Considere os custos adicionais do IPTU (ex: garagem, depósito, etc.)</p>
                         </div>
                         <FormControl>
                           <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">R$</span>
                             <Input 
                               type="text" 
                               placeholder="0,00" 
                               {...field} 
                               value={field.value ? formatCurrency(field.value).replace('R$', '').trim() : ""} 
                               onChange={(e) => { 
                                 const rawValue = e.target.value.replace(/\D/g, ""); 
                                 if (!rawValue) return field.onChange("" as unknown as number); 
                                 const numericValue = Number(rawValue) / 100; 
                                 field.onChange(numericValue); 
                               }} 
                               className="h-14 pl-12 pr-4 bg-white border-[#E5E5EA] rounded-2xl text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:border-[#6E2FAE] focus:ring-4 focus:ring-[#6E2FAE]/10 transition-all shadow-sm text-lg font-medium"
                             />
                           </div>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )} />
                   </div>
                 )}
               </div>

               {/* Step 5 Fields */}
               <div className={step === 5 ? "block space-y-4 xl:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" : "hidden"}>
                  <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>Nome Completo</FormLabel> <FormControl><Input placeholder="Seu nome" {...field} className={inputClasses} /></FormControl> <FormMessage /> </FormItem> )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField name="whatsapp" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>WhatsApp</FormLabel> <FormControl><Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(maskWhatsApp(e.target.value))} className={inputClasses} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="email" control={form.control} render={({ field }) => ( <FormItem> <FormLabel className={labelClasses}>E-mail</FormLabel> <FormControl><Input type="email" placeholder="seu@email.com" {...field} className={inputClasses} /></FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                  <FormField name="relationship" control={form.control} render={({ field }) => (
                    <FormItem className="space-y-3 pt-2">
                      <FormLabel className={labelClasses}>Qual sua relação com esse imóvel?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-lg border-gray-100">
                          <SelectItem value="Proprietário" className="rounded-lg cursor-pointer">Proprietário</SelectItem>
                          <SelectItem value="Corretor / Representante" className="rounded-lg cursor-pointer">Corretor / Representante</SelectItem>
                          <SelectItem value="Interessado" className="rounded-lg cursor-pointer">Interessado</SelectItem>
                          <SelectItem value="Outro" className="rounded-lg cursor-pointer">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                 <FormField name="estimatedTime" control={form.control} render={({ field }) => (
                   <FormItem className="space-y-3 pt-2">
                     <div className="mb-2">
                       <FormLabel className="text-sm font-bold text-gray-700 ml-1 mb-0.5 block">Tempo estimado para alugar?</FormLabel>
                       <p className="text-xs text-gray-500 ml-1 font-medium">Opcional. Para entendermos a sua urgência.</p>
                     </div>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                         <SelectTrigger className={inputClasses}>
                           <SelectValue placeholder="Selecione o prazo (Opcional)" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent className="rounded-xl shadow-lg border-gray-100">
                         <SelectItem value="O quanto antes" className="rounded-lg cursor-pointer">O quanto antes</SelectItem>
                         <SelectItem value="Em até 30 dias" className="rounded-lg cursor-pointer">Em até 30 dias</SelectItem>
                         <SelectItem value="De 1 a 3 meses" className="rounded-lg cursor-pointer">De 1 a 3 meses</SelectItem>
                         <SelectItem value="Apenas pesquisando" className="rounded-lg cursor-pointer">Apenas pesquisando</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )} />
               </div>

              </div>

               {/* RODAPÉ FIXO: Controles Multi-step */}
               <div className="pt-4 xl:pt-6 pb-6 lg:pb-8 flex gap-3 xl:gap-4 mt-auto shrink-0 border-t border-gray-100 bg-white">
                 {step > 1 && (
                   <Button type="button" onClick={prevStep} className="h-12 xl:h-14 px-4 sm:px-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-semibold text-sm xl:text-base shrink-0 shadow-none border-none transition-colors">
                     <ArrowLeft className="w-5 h-5 sm:mr-2" />
                     <span className="hidden sm:inline">Voltar</span>
                   </Button>
                 )}
                 {step < 5 ? (
                   <Button type="button" onClick={nextStep} className="flex-1 bg-[#6E2FAE] hover:bg-[#5a268f] text-white h-12 xl:h-14 rounded-full font-semibold text-base xl:text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                     Continuar <ArrowRight className="ml-2 w-5 h-5"/>
                   </Button>
                 ) : (
                   <div className="relative group flex-1">
                     <div className="absolute -inset-1 bg-gradient-to-r from-[#B475F3] to-[#6E2FAE] rounded-full blur-md opacity-60 animate-pulse"></div>
                     <Button type="submit" disabled={isSubmitting} className="relative w-full bg-gradient-to-r from-[#B475F3] to-[#6E2FAE] hover:from-[#9c5ee0] hover:to-[#5a268f] text-white h-12 xl:h-14 rounded-full font-semibold text-base xl:text-lg shadow-sm hover:-translate-y-1 transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <Calculator className="w-6 h-6 mr-2" />} 
                        Simular Valor
                     </Button>
                   </div>
                 )}
               </div>
            </form>
          </Form>
        </div>
      </div>

      {/* COLUNA DIREITA: Área Visual Estática */}
      <div 
        className="hidden lg:flex lg:w-[55%] xl:w-[60%] h-full flex-col items-center justify-center p-8 xl:p-12 relative overflow-hidden shrink-0"
        style={{ background: 'radial-gradient(circle at top center, rgba(138, 43, 226, 0.15) 0%, transparent 60%), #121214' }}
      >

        {/* Camada da Imagem de Fundo */}
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay"
          style={{
backgroundImage: `url(${(resultadoImg as any).src || resultadoImg})`,
            backgroundSize: 'contain',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="absolute top-6 right-6 xl:top-8 xl:right-10 z-20 animate-in fade-in duration-1000">
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-xs xl:text-sm font-bold text-[#B475F3] bg-[#6E2FAE]/20 hover:bg-[#6E2FAE]/30 transition-colors flex items-center gap-2 px-4 py-2 xl:px-6 xl:py-3 rounded-full">
            <Phone className="w-4 h-4 xl:w-5 xl:h-5" /> Falar com consultor
          </a>
        </div>

        <div className="relative z-10 max-w-2xl text-left space-y-6 xl:space-y-10 w-full pl-4 xl:pl-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 mt-16 xl:mt-0">
          <h1 className="text-[clamp(2.5rem,4vw,4rem)] font-extrabold leading-[1.05] tracking-tight text-white">
            Quanto vale o <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B475F3] to-[#6E2FAE]">aluguel do seu imóvel?</span>
          </h1>

          <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-300 font-medium leading-relaxed max-w-lg">
            Descubra o valor ideal para locação em poucos passos. Nossa calculadora utiliza inteligência de mercado para sugerir o preço mais competitivo para o seu perfil.
          </p>

          <div className="flex flex-col gap-4 xl:gap-6 pt-4 xl:pt-6">
            <div className="flex items-center gap-4 xl:gap-5 bg-[#1E1E24] p-4 xl:p-5 rounded-2xl shadow-sm border border-white/5 max-w-lg">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-[#6E2FAE]/20 rounded-[1rem] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 xl:w-6 xl:h-6 text-[#B475F3]" />
              </div>
              <p className="font-semibold text-gray-200 text-base xl:text-lg leading-snug">Análise baseada em <strong className="text-[#B475F3]">dados reais</strong> da sua região.</p>
            </div>
            <div className="flex items-center gap-4 xl:gap-5 bg-[#1E1E24] p-4 xl:p-5 rounded-2xl shadow-sm border border-white/5 max-w-lg">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-[#6E2FAE]/20 rounded-[1rem] flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 xl:w-6 xl:h-6 text-[#B475F3]" />
              </div>
              <p className="font-semibold text-gray-200 text-base xl:text-lg leading-snug">Estratégias de preço para <strong className="text-[#B475F3]">alugar mais rápido</strong>.</p>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* RESULTADOS DA AVALIAÇÃO (Full Width / Single Column) */}
      <div ref={resultsRef}>
        {canCalculate && hasCalculated && (
          <section className="py-20 lg:py-28 bg-gray-50/50 border-t border-b border-gray-200 print:py-6 print:bg-white print:border-none">
            <div className="container mx-auto px-6 max-w-[800px] space-y-10 print:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Cabeçalho para Impressão */}
              <div className="hidden print:flex flex-col items-center mb-8 pb-8 print:mb-4 print:pb-4 border-b border-gray-200">
<img src={(logoPurple as any).src || logoPurple} alt="Sonho Real Netimóveis" className="h-24 object-contain" />
                <h1 className="text-2xl font-bold text-gray-800 mt-4">Relatório de Simulação de Aluguel</h1>
                <p suppressHydrationWarning className="text-sm text-gray-500 mb-6 print:mb-4">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                
                <div className="w-full bg-gray-50 p-4 rounded-xl text-center border border-gray-100 mt-2">
                  <p className="text-xs font-bold text-[#6E2FAE] uppercase tracking-widest mb-1">{propertyType === "Outro" && customPropertyType ? customPropertyType : (propertyType || "Imóvel Avaliado")}</p>
                  <p className="text-gray-900 font-medium text-lg leading-relaxed">
                    {street}, {houseNumber}{complement ? ` - ${complement}` : ''} <br/>
                    {neighborhood}, {city} - {state} | CEP: {cep}
                  </p>
                </div>
              </div>

              {/* Título da Seção (Visível apenas no Navegador) */}
              <div className="text-center print:hidden">
                <div className="inline-flex items-center justify-center p-3 bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl mb-4">
                  <Calculator className="w-8 h-8 text-[#6E2FAE]" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Resultado da Simulação</h2>
                <p className="text-gray-500 font-medium mt-2 text-lg">Ajuste a régua para ver as estratégias de locação.</p>
                <button onClick={() => window.print()} className="mt-6 inline-flex items-center justify-center gap-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors text-sm font-bold px-6 py-3 rounded-full shadow-sm border border-[#E5E5EA]">
                  <Download className="w-4 h-4" /> Baixar Relatório em PDF
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm print:break-inside-avoid print:p-6">
                <Label className="font-semibold text-lg sm:text-xl text-gray-700 block text-center mb-8">
                  Valor do m² de locação: <span className="text-[#6E2FAE] font-extrabold text-3xl sm:text-4xl ml-3 tracking-tight">{formatCurrency(m2Value[0])}</span>
                </Label>
                <div className="flex items-center gap-6 px-2 sm:px-6">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider w-16 text-right">Rápido</span>
                  <Slider value={m2Value} onValueChange={setM2Value} min={m2Range.min} max={m2Range.max} step={1} className="flex-1 [&_[role=slider]]:bg-white [&_[role=slider]]:border-[3px] [&_[role=slider]]:border-[#6E2FAE] [&_[role=slider]]:shadow-lg [&_[role=slider]]:w-6 [&_[role=slider]]:h-6 [&_.relative>div]:bg-[#6E2FAE]" />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider w-16">Teto</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-3xl p-6 sm:p-8 border border-[#C7D2FE] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 group print:break-inside-avoid">
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full mb-3">
                    <Building className="w-4 h-4 text-indigo-700" />
                    <span className="text-sm font-bold text-indigo-800">Estimativa de Venda</span>
                  </div>
                  <p className="text-indigo-900/80 text-sm font-medium leading-relaxed max-w-xl">
                    Com base na rentabilidade média de mercado (<strong className="text-indigo-900">0.45% a.m.</strong>), o valor estimado para venda deste imóvel seria de aproximadamente:
                  </p>
                </div>
                <div className="text-center sm:text-right shrink-0">
                  <p className="text-3xl sm:text-4xl font-extrabold text-indigo-900 tracking-tight">{formatCurrency(estimatedSaleValue)}</p>
                  <p className="text-sm text-indigo-700/80 font-semibold mt-1">{formatCurrency(estimatedSaleM2)} / m²</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:break-inside-avoid">
                <div className="p-4 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center"> 
                  <div className="p-3 bg-amber-50 rounded-2xl mb-3"><Zap className="w-5 h-5 text-amber-500"/></div> 
                  <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Pacote Mensal</p> 
                  <p className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tighter whitespace-nowrap">{formatCurrency(monthlyRent)}</p> 
                </div>
                <div className="p-4 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group"> 
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="p-3 bg-emerald-100 rounded-2xl mb-3"><TrendingUp className="w-5 h-5 text-emerald-600"/></div> 
                    <p className="text-xs font-semibold text-emerald-800 mb-1 uppercase tracking-wide">Aluguel Líquido</p> 
                    <p className="text-base sm:text-xl font-extrabold text-emerald-700 tracking-tighter whitespace-nowrap">{formatCurrency(netRent)}</p> 
                  </div>
                </div>
                <div className="p-4 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center"> 
                  <div className="p-3 bg-blue-50 rounded-2xl mb-3"><BarChart className="w-5 h-5 text-blue-500"/></div> 
                  <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Renda Anual</p> 
                  <p className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tighter whitespace-nowrap">{formatCurrency(annualIncome)}</p> 
                </div>
              </div>

              {/* Resumo de Despesas */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#86868B] bg-white py-4 px-6 rounded-3xl border border-[#E5E5EA] shadow-sm mt-2 print:break-inside-avoid">
                <span className="font-semibold text-[#1D1D1F]">Despesas deduzidas (Mês):</span>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <span>Condomínio: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(Number(condominium) || 0)}</strong></span>
                  <span className="text-[#E5E5EA] hidden sm:block">|</span>
                  <span>IPTU: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(estimatedIptu)}</strong></span>
                  <span className="text-[#E5E5EA] hidden sm:block">|</span>
                  <span className="text-rose-600 font-medium">Total: <strong>{formatCurrency(totalExpenses)}</strong></span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 group print:break-inside-avoid">
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#6E2FAE]/10 rounded-full mb-3">
                    <BarChart className="w-4 h-4 text-[#6E2FAE]" />
                    <span className="text-sm font-bold text-[#6E2FAE]">Resultado Financeiro</span>
                  </div>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">
                    Seu imóvel pode gerar aproximadamente <strong className="text-gray-700">{formatCurrency(annualIncome)} por ano</strong>, já descontando <strong className="text-gray-700">Condomínio ({formatCurrency(Number(condominium) || 0)})</strong> e <strong className="text-gray-700">IPTU ({formatCurrency(estimatedIptu)}/mês)</strong>. Esse valor representa o potencial real de renda com base nas condições atuais do mercado.
                  </p>
                </div>
                <div className="w-[120px] flex flex-col items-center relative shrink-0">
                  <style>
                    {`
                      @keyframes drawYield {
                        from { stroke-dashoffset: 282.74; }
                        to { stroke-dashoffset: ${282.74 * (1 - Math.min(netYield / 1.0, 1))}; }
                      }
                      .animate-yield {
                        animation: drawYield 1.5s ease-out forwards;
                      }
                    `}
                  </style>
                  <svg viewBox="-10 -10 220 120" className="w-full overflow-visible drop-shadow-sm">
                    <defs>
                      <linearGradient id="yieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#B475F3" />
                        <stop offset="100%" stopColor="#6E2FAE" />
                      </linearGradient>
                    </defs>
                    <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#F3F4F6" strokeWidth="16" strokeLinecap="round" />
                    <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="url(#yieldGradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray="282.74" className="animate-yield" />
                  </svg>
                  <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                    <span className="text-lg font-extrabold text-gray-900">{netYield.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 print:break-inside-avoid">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center mb-6">Maturidade da Locação</h3>
                <div className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isShortTerm ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-emerald-50 shadow-md scale-100 md:scale-105 z-10' : 'border-gray-200 bg-white opacity-60'}`}>
                  <div className="flex-1">
                    <h4 className={`font-extrabold text-lg mb-1 ${isShortTerm ? 'text-emerald-800' : 'text-gray-800'}`}>Curto prazo</h4>
                    <p className={`text-sm font-medium ${isShortTerm ? 'text-emerald-900/80' : 'text-gray-500'}`}>Locação em até 60–90 dias. Ideal para priorizar ocupação.</p>
                  </div>
                  <p className={`text-2xl font-extrabold sm:text-right ${isShortTerm ? 'text-emerald-900' : 'text-gray-900'}`}>{formatCurrency(area * m2Range.min)} <br className="hidden sm:block" /><span className="text-lg font-medium opacity-50">a</span> {formatCurrency(area * third1)}</p>
                </div>
                <div className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isMediumTerm ? 'border-blue-500 ring-4 ring-blue-500/10 bg-blue-50 shadow-md scale-100 md:scale-105 z-10' : 'border-gray-200 bg-white opacity-60'}`}>
                  <div className="flex-1">
                    <h4 className={`font-extrabold text-lg mb-1 ${isMediumTerm ? 'text-blue-800' : 'text-gray-800'}`}>Médio prazo</h4>
                    <p className={`text-sm font-medium ${isMediumTerm ? 'text-blue-900/80' : 'text-gray-500'}`}>Locação entre 90 e 180 dias. Equilíbrio de rentabilidade.</p>
                  </div>
                  <p className={`text-2xl font-extrabold sm:text-right ${isMediumTerm ? 'text-blue-900' : 'text-gray-900'}`}>{formatCurrency(area * (third1 + 1))} <br className="hidden sm:block" /><span className="text-lg font-medium opacity-50">a</span> {formatCurrency(area * third2)}</p>
                </div>
                <div className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isLongTerm ? 'border-orange-500 ring-4 ring-orange-500/10 bg-orange-50 shadow-md scale-100 md:scale-105 z-10' : 'border-gray-200 bg-white opacity-60'}`}>
                  <div className="flex-1">
                    <h4 className={`font-extrabold text-lg mb-1 ${isLongTerm ? 'text-orange-800' : 'text-gray-800'}`}>Longo prazo</h4>
                    <p className={`text-sm font-medium ${isLongTerm ? 'text-orange-900/80' : 'text-gray-500'}`}>Acima de 180 dias. Aposta na valorização do mercado.</p>
                  </div>
                  <p className={`text-2xl font-extrabold sm:text-right ${isLongTerm ? 'text-orange-900' : 'text-gray-900'}`}>{formatCurrency(area * (third2 + 1))} <br className="hidden sm:block" /><span className="text-lg font-medium opacity-50">a</span> {formatCurrency(area * m2Range.max)}</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm print:break-inside-avoid print:p-6">
                <h4 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">Recomendação Sonho Real:</h4>
                <p className="text-gray-600 font-medium leading-relaxed">
                  Sugestão: anunciar o pacote de locação a <strong className="text-gray-900">{formatCurrency(monthlyRent)}/mês</strong> com margem de negociação até <strong className="text-gray-900">{formatCurrency(area * Math.max(m2Range.min, m2Value[0] - 2))}</strong> – garantindo um aluguel líquido seguro de <strong className="text-emerald-700">{formatCurrency(netRent)}</strong>. Posicionamento calculado para manter alta liquidez no mercado da região do <strong className="text-gray-900">{neighborhood || "imóvel"}</strong>.
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#6E2FAE] to-[#B475F3] p-10 sm:p-14 text-center text-white shadow-2xl relative overflow-hidden mt-10 print:hidden w-screen relative left-1/2 -translate-x-1/2 rounded-none">
                <div className="absolute top-0 right-0 w-[25rem] h-[25rem] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-3xl mx-auto">
                  <p className="text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                    Próximo passo
                  </p>

                  <img src={(logoWhite as any).src || logoWhite} alt="Sonho Real Netimóveis" className="h-10 sm:h-14 mx-auto mb-6 object-contain" />

                  <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight leading-tight">
                    Anuncie seu imóvel agora!
                  </h3>

                  <p className="text-white/90 mb-8 text-lg font-medium leading-relaxed">
                    Ficou com dúvida? Nossos especialistas estão prontos para te ajudar a entender melhor esses números e traçar a melhor estratégia para alugar mais rápido e pelo melhor valor.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a 
                      href={whatsappLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center justify-center gap-3 bg-white text-[#6E2FAE] hover:bg-gray-100 hover:scale-105 text-lg h-16 px-10 rounded-2xl shadow-xl transition-all duration-300 font-extrabold w-full sm:w-auto"
                    >
                      <Phone className="w-5 h-5" /> Falar com Especialista
                    </a>

                    <button 
                      onClick={() => window.print()} 
                      className="inline-flex items-center justify-center gap-3 bg-white/20 backdrop-blur text-white hover:bg-white/30 hover:scale-105 text-lg h-16 px-10 rounded-2xl shadow-xl transition-all duration-300 font-extrabold w-full sm:w-auto border border-white/20"
                    >
                      <Download className="w-5 h-5" /> Salvar PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Rodapé de Impressão */}
              <div className="hidden print:flex w-full items-end justify-between pt-6 mt-16 border-t border-gray-200 text-[11px] text-gray-400 font-medium">
                <div className="space-y-1 text-left">
                  <p suppressHydrationWarning>© {new Date().getFullYear()} Sonho Real Netimóveis. Todos os direitos reservados.</p>
                  <p>Desenvolvido por <strong className="text-gray-500">BindValue.dev</strong></p>
                </div>
                <div className="text-right tracking-wide">
                  Página 1 de 1
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* NOVA SEÇÃO: Como Funciona (Apple HIG Style) */}
      <section className="py-24 lg:py-32 bg-white relative z-0 print:hidden border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Cabeçalho da Seção */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-[#6E2FAE]/10 rounded-full text-sm font-bold text-[#6E2FAE] mb-6">
              Transparência e Precisão
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] mb-6 tracking-tight">
              Como nossa inteligência calcula o seu aluguel?
            </h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto font-medium leading-relaxed">
              Conectamos os dados do seu imóvel com a realidade do mercado para entregar a estimativa mais precisa em três passos simples.
            </p>
          </div>

          {/* Grid de Passos */}
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16 mb-24">
            {/* Passo 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:-translate-y-2">
                <FileText className="w-10 h-10 text-[#1D1D1F]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">1. Coleta de Dados</h3>
              <p className="text-[#86868B] leading-relaxed font-medium text-lg">
                Você nos informa as características principais do imóvel, como localização, área útil, quartos e custos fixos.
              </p>
            </div>
            
            {/* Passo 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:-translate-y-2">
                <Cpu className="w-10 h-10 text-[#1D1D1F]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">2. Cruzamento de Mercado</h3>
              <p className="text-[#86868B] leading-relaxed font-medium text-lg">
                Nosso algoritmo analisa milhares de imóveis similares ativos na sua região para entender o teto e o piso de preços atuais.
              </p>
            </div>
            
            {/* Passo 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:-translate-y-2">
                <Target className="w-10 h-10 text-[#1D1D1F]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">3. Cenários de Locação</h3>
              <p className="text-[#86868B] leading-relaxed font-medium text-lg">
                Entregamos não apenas um preço, mas três estratégias de liquidez (rápido, mercado e valorização) para você escolher.
              </p>
            </div>
          </div>

          {/* Destaque Final: Relatório em PDF */}
          <div className="bg-[#F5F5F7] rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative group transition-all duration-500 hover:bg-[#ebebe5]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-40 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="flex-1 text-center md:text-left relative z-10">
              <h3 className="text-3xl md:text-4xl font-semibold text-[#1D1D1F] mb-5 tracking-tight">Tenha os números em mãos.</h3>
              <p className="text-xl text-[#86868B] font-medium leading-relaxed max-w-2xl">
                Ao finalizar a simulação, você pode exportar um relatório completo em PDF com todos os dados, comparativos e parâmetros utilizados na avaliação. Perfeito para documentar ou compartilhar.
              </p>
            </div>
            <div className="w-full md:w-auto flex justify-center shrink-0 relative z-10">
              <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] group-hover:scale-105 transition-transform duration-500">
                <FileDown className="w-16 h-16 text-[#6E2FAE]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: Benefícios (Apple HIG Style) */}
      <section className="py-24 lg:py-32 bg-[#F5F5F7] relative z-0 print:hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] mb-5 tracking-tight">
              Por que anunciar com a Sonho Real?
            </h2>
            <p className="text-xl text-[#86868B] max-w-2xl mx-auto font-medium">
              Nossa equipe é especializada em garantir a locação mais rápida, rentável e segura para o seu patrimônio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-[2rem] p-10 text-center transition-all duration-500 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mx-auto mb-8 transition-transform duration-500 hover:scale-110">
                <Target className="w-8 h-8 text-[#1D1D1F]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">Avaliação Precisa</h3>
              <p className="text-[#86868B] leading-relaxed font-medium text-lg">
                Cruzamos dados reais de mercado para posicionar seu imóvel com o valor exato, maximizando seus ganhos.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white rounded-[2rem] p-10 text-center transition-all duration-500 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mx-auto mb-8 transition-transform duration-500 hover:scale-110">
                <Zap className="w-8 h-8 text-[#1D1D1F]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">Locação Ágil</h3>
              <p className="text-[#86868B] leading-relaxed font-medium text-lg">
                Sua propriedade nas maiores vitrines imobiliárias do país. Maior exposição significa fechar negócio em tempo recorde.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-white rounded-[2rem] p-10 text-center transition-all duration-500 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mx-auto mb-8 transition-transform duration-500 hover:scale-110">
                <CheckCircle2 className="w-8 h-8 text-[#1D1D1F]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">Gestão Segura</h3>
              <p className="text-[#86868B] leading-relaxed font-medium text-lg">
                Cuidamos de toda a burocracia, elaboração de contratos e vistorias para que você receba seu aluguel sem dores de cabeça.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: CTA (Apple HIG Style) */}
      <section className="py-24 lg:py-32 bg-white relative z-0 overflow-hidden print:hidden">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1D1D1F] mb-6 tracking-tight leading-tight">
            Pronto para alugar <br className="hidden md:block" />o seu imóvel?
          </h2>
          <p className="text-xl md:text-2xl text-[#86868B] mb-12 font-medium max-w-2xl mx-auto">
            Fale com um de nossos especialistas e descubra a melhor estratégia para o seu patrimônio.
          </p>
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center justify-center gap-3 bg-[#6E2FAE] hover:bg-[#5a268f] text-white text-lg px-10 py-5 rounded-full font-medium transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(110,47,174,0.4)] duration-300"
          >
            <Phone className="w-5 h-5" /> Entrar em Contato
          </a>
        </div>
      </section>

      {/* FOOTER OFICIAL */}
      <div className="print:hidden">
        <Footer />
      </div>

      {/* Botão Flutuante (Voltar ao Topo / Calculadora) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 p-4 bg-[#6E2FAE] hover:bg-[#5a268f] text-white rounded-full shadow-[0_8px_30px_rgba(110,47,174,0.4)] transition-all duration-300 hover:scale-110 hover:-translate-y-1 print:hidden animate-in fade-in slide-in-from-bottom-8 flex items-center justify-center group"
          aria-label="Voltar para a calculadora"
        >
          <Calculator className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          
          {/* Tooltip de Hover */}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1D1D1F] text-white text-sm font-medium rounded-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none shadow-lg">
            Voltar para o cálculo
            <span className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-[#1D1D1F] rotate-45 rounded-sm"></span>
          </span>
        </button>
      )}
    </main>
  );
};

export default Index;
