import { Target, Sparkles, Shield } from "lucide-react";
const features = [{
  icon: Target,
  title: "Especialização",
  description: "Cada corretor é especialista em um 'sabor' de mercado: Investimento, Luxo, Primeiro Imóvel e muito mais."
}, {
  icon: Sparkles,
  title: "Experiência Curada",
  description: "Profissionais selecionados com formação comprovada e histórico de sucesso em suas áreas."
}, {
  icon: Shield,
  title: "Confiança Total",
  description: "Avaliações reais de clientes e transparência em cada atendimento para sua segurança."
}];
const ConceptSection = () => {
  return <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          
          
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => <div key={feature.title} className="glass-card p-6 rounded-2xl text-center animate-fade-up" style={{
          animationDelay: `${index * 100}ms`
        }}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>)}
        </div>
      </div>
    </section>;
};
export default ConceptSection;