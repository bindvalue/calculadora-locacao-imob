import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface CookiePreferences {
  essential: true;
  performance: boolean;
  functionality: boolean;
  advertising: boolean;
  consentDate: string;
  consentVersion: string;
}

interface CookieConsentContextType {
  hasConsented: boolean;
  preferences: CookiePreferences | null;
  showBanner: boolean;
  showPreferencesModal: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: Omit<CookiePreferences, 'essential' | 'consentDate' | 'consentVersion'>) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  closeBanner: () => void;
}

const CONSENT_KEY = 'cookie_consent';
const CONSENT_VERSION = '1.0';

const defaultPreferences: CookiePreferences = {
  essential: true,
  performance: false,
  functionality: false,
  advertising: false,
  consentDate: '',
  consentVersion: CONSENT_VERSION,
};

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        if (parsed.consentVersion === CONSENT_VERSION) {
          setPreferences(parsed);
        } else {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveToStorage = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferencesModal(false);
  }, []);

  const acceptAll = useCallback(() => {
    const prefs: CookiePreferences = {
      essential: true,
      performance: true,
      functionality: true,
      advertising: true,
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    saveToStorage(prefs);
  }, [saveToStorage]);

  const rejectNonEssential = useCallback(() => {
    const prefs: CookiePreferences = {
      essential: true,
      performance: false,
      functionality: false,
      advertising: false,
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    saveToStorage(prefs);
  }, [saveToStorage]);

  const savePreferences = useCallback((customPrefs: Omit<CookiePreferences, 'essential' | 'consentDate' | 'consentVersion'>) => {
    const prefs: CookiePreferences = {
      ...customPrefs,
      essential: true,
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    saveToStorage(prefs);
  }, [saveToStorage]);

  const openPreferences = useCallback(() => {
    setShowPreferencesModal(true);
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferencesModal(false);
  }, []);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        hasConsented: preferences !== null,
        preferences,
        showBanner,
        showPreferencesModal,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        openPreferences,
        closePreferences,
        closeBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
