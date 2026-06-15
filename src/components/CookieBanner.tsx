"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Cookie, X, Shield, BarChart3, Settings2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CookieBanner = () => {
  const {
    showBanner,
    showPreferencesModal,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openPreferences,
    closePreferences,
    preferences,
  } = useCookieConsent();

  const [tempPrefs, setTempPrefs] = useState({
    performance: preferences?.performance ?? false,
    functionality: preferences?.functionality ?? false,
    advertising: preferences?.advertising ?? false,
  });

  const handleSavePreferences = () => {
    savePreferences(tempPrefs);
  };

  const handleOpenPreferences = () => {
    setTempPrefs({
      performance: preferences?.performance ?? false,
      functionality: preferences?.functionality ?? false,
      advertising: preferences?.advertising ?? false,
    });
    openPreferences();
  };

  if (!showBanner && !showPreferencesModal) return null;

  return (
    <>
      {/* Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="container max-w-4xl mx-auto">
            <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-secondary/20 rounded-xl shrink-0">
                    <Cookie className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-lg">
                      Utilizamos cookies
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Usamos cookies para melhorar sua experiência de navegação, personalizar conteúdo 
                      e analisar nosso tráfego. Ao clicar em "Aceitar Todos", você concorda com o uso 
                      de todos os cookies. Saiba mais em nossa{' '}
                      <Link 
                        href="/politica-privacidade" 
                        className="text-secondary hover:underline font-medium"
                      >
                        Política de Privacidade
                      </Link>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={handleOpenPreferences}
                    className="order-3 sm:order-1"
                  >
                    Personalizar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={rejectNonEssential}
                    className="order-2"
                  >
                    Recusar Não Essenciais
                  </Button>
                  <Button
                    onClick={acceptAll}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground order-1 sm:order-3"
                  >
                    Aceitar Todos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preferências */}
      <Dialog open={showPreferencesModal} onOpenChange={closePreferences}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Preferências de Cookies
            </DialogTitle>
            <DialogDescription>
              Personalize quais cookies você permite. Cookies essenciais são necessários 
              para o funcionamento do site e não podem ser desativados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Essenciais */}
            <div className="flex items-start justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Cookies Essenciais</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Necessários para o funcionamento básico do site. Incluem autenticação, 
                    segurança e preferências de sessão.
                  </p>
                </div>
              </div>
              <Switch checked disabled className="mt-1" />
            </div>

            {/* Desempenho */}
            <div className="flex items-start justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Cookies de Desempenho</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nos ajudam a entender como você interage com o site, coletando 
                    informações anônimas para análise e melhorias.
                  </p>
                </div>
              </div>
              <Switch
                checked={tempPrefs.performance}
                onCheckedChange={(checked) => 
                  setTempPrefs(prev => ({ ...prev, performance: checked }))
                }
                className="mt-1"
              />
            </div>

            {/* Funcionalidade */}
            <div className="flex items-start justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Settings2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Cookies de Funcionalidade</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permitem lembrar suas preferências e escolhas para proporcionar 
                    uma experiência mais personalizada.
                  </p>
                </div>
              </div>
              <Switch
                checked={tempPrefs.functionality}
                onCheckedChange={(checked) => 
                  setTempPrefs(prev => ({ ...prev, functionality: checked }))
                }
                className="mt-1"
              />
            </div>

            {/* Publicidade */}
            <div className="flex items-start justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Megaphone className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Cookies de Publicidade</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usados para exibir anúncios relevantes e medir a eficácia 
                    de campanhas publicitárias.
                  </p>
                </div>
              </div>
              <Switch
                checked={tempPrefs.advertising}
                onCheckedChange={(checked) => 
                  setTempPrefs(prev => ({ ...prev, advertising: checked }))
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closePreferences} className="sm:flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePreferences}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground sm:flex-1"
            >
              Salvar Preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;
