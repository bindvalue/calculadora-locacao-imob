"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building,
  Calculator,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Ruler,
  User,
  Loader2,
  TrendingUp,
  Calendar,
  Zap,
  BarChart,
} from "lucide-react";

// Supondo que o logo esteja disponível neste caminho
import logoBlack from "@/assets/logo-sonho-real-black.png";

// Componentes Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

// Cliente Supabase (supondo o caminho)
import { supabase } from "@/integrations/supabase/client";

// Schema do Formulário com Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  whatsapp: z.string().min(10, { message: "Por favor, insira um WhatsApp válido." }),
  cep: z.string().regex(/^\d{5}-\d{3}$/, { message: "CEP inválido." }),
  street: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  area: z.coerce.number().positive({ message: "Área deve ser um número positivo." }),
  saleValue: z.coerce.number().positive({ message: "Valor deve ser um número positivo." }),
});

type FormData = z.infer<typeof formSchema>;

// Helpers
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

const RentalCalculatorPage = () => {
  const [m2Value, setM2Value] = useState([17]);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingStreet, setIsSearchingStreet] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      cep: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      area: "" as unknown as number,
      saleValue: "" as unknown as number,
    },
    mode: "onChange",
  });

  const { area, saleValue } = form.watch();
  const formIsValid = form.formState.isValid;
  const canCalculate = area > 0 && saleValue > 0;

  const handleCepBlur = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      if (!response.ok) throw new Error("CEP não encontrado.");
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado.");

      form.setValue("street", data.logradouro, { shouldValidate: true });
      form.setValue("neighborhood", data.bairro, { shouldValidate: true });
      form.setValue("city", data.localidade, { shouldValidate: true });
      form.setValue("state", data.uf, { shouldValidate: true });
      toast.success("Endereço preenchido automaticamente!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao buscar CEP.");
      form.setValue("street", "");
      form.setValue("neighborhood", "");
      form.setValue("city", "");
      form.setValue("state", "");
    } finally {
      setIsFetchingCep(false);
    }
  };

  const searchStreet = async (streetText: string) => {
    const { city, state } = form.getValues();
    
    if (streetText.length >= 3 && city?.length >= 3 && state?.length === 2) {
      setIsSearchingStreet(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${state}/${city}/${streetText}/json/`);
        if (!response.ok) throw new Error("Erro na busca por endereço");
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error(error);
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

  const { monthlyRent, annualIncome, monthlyYield, returnOnSaleYears } = useMemo(() => {
    if (!canCalculate) {
      return { monthlyRent: 0, annualIncome: 0, monthlyYield: 0, returnOnSaleYears: 0 };
    }
    const rent = area * m2Value[0];
    const income = rent * 12;
    const yieldValue = (rent / saleValue) * 100;
    const returnYears = saleValue / income;

    return {
      monthlyRent: rent,
      annualIncome: income,
      monthlyYield: yieldValue,
      returnOnSaleYears: returnYears,
    };
  }, [area, saleValue, m2Value, canCalculate]);

  const getMaturityInfo = () => {
    const val = m2Value[0];
    if (val <= 14) { // Rápido
      return {
        title: "Curto prazo / alta liquidez",
        description: "Locação esperada em até 60-90 dias. Preço agressivo, ideal para quem prioriza ocupação imediata.",
        className: "text-green-600 border-green-500/50 bg-green-500/10",
      };
    }
    if (val > 14 && val <= 19) { // Mercado
      return {
        title: "Médio prazo / valor de mercado",
        description: "Locação esperada entre 90 e 180 dias. Equilíbrio entre rentabilidade e tempo de exposição.",
        className: "text-blue-600 border-blue-500/50 bg-blue-500/10",
      };
    }
    // Teto
    return {
      title: "Longo prazo / valorização",
      description: "Acima de 180 dias de exposição. Maior rentabilidade, mas pode levar mais tempo para alugar.",
      className: "text-orange-600 border-orange-500/50 bg-orange-500/10",
    };
  };
  const maturityInfo = getMaturityInfo();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leads_calculadora").insert([
        {
          name: data.name,
          contact: `Email: ${data.email}, WhatsApp: ${data.whatsapp}`,
          address: `${data.street}, ${data.neighborhood}, ${data.city}-${data.state}, CEP: ${data.cep}`,
          area: data.area,
          sale_value: data.saleValue,
          suggested_rent: monthlyRent,
        },
      ]);

      if (error) throw error;

      toast.success("Simulação salva! Entraremos em contato em breve.");

      const message = `Olá! Fiz uma simulação na Calculadora de Locação e gostaria de falar com um especialista.\n\n*Dados do Imóvel:*\n- Endereço: ${data.street}, ${data.neighborhood}, ${data.city}\n- Aluguel Simulado: ${formatCurrency(monthlyRent)}/mês`;
      const whatsappUrl = `https://wa.me/553135860209?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Erro ao salvar simulação.", {
        description: "Por favor, tente novamente ou entre em contato conosco.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-5xl mx-auto text-center mb-8">
        <img src={logoBlack.src} alt="Sonho Real Netimóveis" className="h-12 mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Calculadora de Avaliação de Locação
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Estudo de posicionamento de preço baseado nos parâmetros reais de mercado da sua região.
        </p>
      </header>

      <main className="w-full max-w-5xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-2 gap-8">
            {/* Coluna de Inputs */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-6 h-6 text-primary" />
                  Dados do Imóvel e Contato
                </CardTitle>
                <CardDescription>Preencha os campos para iniciar a simulação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium text-foreground">Seus Dados</h3>
                  <FormField name="name" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Nome Completo</FormLabel> <FormControl><Input placeholder="Seu nome" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField name="email" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>E-mail</FormLabel> <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="whatsapp" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>WhatsApp</FormLabel> <FormControl><Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(maskWhatsApp(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium text-foreground">Dados do Imóvel</h3>
                  <FormField name="cep" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="00000-000" {...field} onChange={e => field.onChange(maskCep(e.target.value))} onBlur={() => handleCepBlur(field.value)} />
                          {isFetchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField name="street" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Rua</FormLabel> <FormControl><Input disabled placeholder="Preenchimento automático" {...field} /></FormControl> </FormItem> )} />
                    <FormField name="neighborhood" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Bairro</FormLabel> <FormControl><Input disabled placeholder="Preenchimento automático" {...field} /></FormControl> </FormItem> )} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField name="area" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Área Construída (m²)</FormLabel> <FormControl><Input type="number" placeholder="120" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="saleValue" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Valor de Venda (R$)</FormLabel> <FormControl><Input type="number" placeholder="500000" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coluna de Resultados */}
            <div className="space-y-8">
              <Card className={`w-full transition-opacity duration-500 ${!canCalculate ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"> <Calculator className="w-6 h-6 text-primary" /> Resultado da Simulação </CardTitle>
                  {!canCalculate && <CardDescription>Preencha a área e o valor de venda para ver os resultados.</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="font-medium">Valor do m² de locação: <span className="text-primary font-bold">{formatCurrency(m2Value[0])}</span></Label>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-muted-foreground">Rápido</span>
                      <Slider value={m2Value} onValueChange={setM2Value} min={12} max={22} step={1} />
                      <span className="text-sm text-muted-foreground">Teto</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg"> <p className="text-sm text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3"/> Aluguel Mensal</p> <p className="text-xl font-bold text-foreground">{formatCurrency(monthlyRent)}</p> </div>
                    <div className="p-4 bg-muted/50 rounded-lg"> <p className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Renda Anual</p> <p className="text-xl font-bold text-foreground">{formatCurrency(annualIncome)}</p> </div>
                    <div className="p-4 bg-muted/50 rounded-lg"> <p className="text-sm text-muted-foreground flex items-center gap-1"><BarChart className="w-3 h-3"/> Yield a.m.</p> <p className="text-xl font-bold text-foreground">{monthlyYield.toFixed(2)}%</p> </div>
                    <div className="p-4 bg-muted/50 rounded-lg"> <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Retorno s/ Venda</p> <p className="text-xl font-bold text-foreground">{isFinite(returnOnSaleYears) ? `${returnOnSaleYears.toFixed(1)} anos` : 'N/A'}</p> </div>
                  </div>

                  <div className={`p-4 border rounded-lg ${maturityInfo.className}`}> <h4 className="font-semibold">{maturityInfo.title}</h4> <p className="text-sm mt-1">{maturityInfo.description}</p> </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle>Recomendação Sonho Real</CardTitle>
                  <CardDescription> Os valores são uma estimativa. Para uma avaliação precisa e uma estratégia de locação vencedora, fale com nossos especialistas. </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="submit" size="lg" className="w-full" disabled={!formIsValid || isSubmitting}>
                    {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> ) : ( <><Phone className="mr-2 h-4 w-4" /> Falar com a Sonho Real</> )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default RentalCalculatorPage;