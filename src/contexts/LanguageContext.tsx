
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCountries } from '@/hooks/useCountries';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
  nativeName?: string;
}

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: Language[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Basic translations - can be expanded
const translations: Record<string, Record<string, string>> = {
  en: {
    'welcome': 'Welcome',
    'dashboard': 'Dashboard',
    'players': 'Players',
    'videos': 'Videos',
    'profile': 'Profile',
    'messages': 'Messages',
    'timeline': 'Timeline',
    'explore': 'Explore',
    'notifications': 'Notifications',
    'contracts': 'Contracts',
    'logout': 'Logout',
    'login': 'Login',
    'signup': 'Sign Up',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'signInWithGoogle': 'Sign in with Google',
    'termsDescription': 'I accept the terms and conditions and privacy policy',
    'save': 'Save',
    'cancel': 'Cancel',
  },
  es: {
    'welcome': 'Bienvenido',
    'dashboard': 'Panel',
    'players': 'Jugadores',
    'videos': 'Videos',
    'profile': 'Perfil',
    'messages': 'Mensajes',
    'timeline': 'Cronología',
    'explore': 'Explorar',
    'notifications': 'Notificaciones',
    'contracts': 'Contratos',
    'logout': 'Cerrar Sesión',
    'login': 'Iniciar Sesión',
    'signup': 'Registrarse',
    'loading': 'Cargando...',
    'error': 'Error',
    'success': 'Éxito',
    'signInWithGoogle': 'Iniciar sesión con Google',
    'termsDescription': 'Acepto los términos y condiciones y la política de privacidad',
    'save': 'Guardar',
    'cancel': 'Cancelar',
  },
  fr: {
    'welcome': 'Bienvenue',
    'dashboard': 'Tableau de Bord',
    'players': 'Joueurs',
    'videos': 'Vidéos',
    'profile': 'Profil',
    'messages': 'Messages',
    'timeline': 'Chronologie',
    'explore': 'Explorer',
    'notifications': 'Notifications',
    'contracts': 'Contrats',
    'logout': 'Déconnexion',
    'login': 'Connexion',
    'signup': 'S\'inscrire',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'signInWithGoogle': 'Se connecter avec Google',
    'termsDescription': 'J\'accepte les termes et conditions et la politique de confidentialité',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { countries, loading: countriesLoading, error: countriesError } = useCountries();

  useEffect(() => {
    const fetchAvailableLanguages = async () => {
      try {
        setIsLoading(true);
        
        // Fallback languages if countries data is not available
        const fallbackLanguages: Language[] = [
          { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
          { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
          { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
          { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
          { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
          { code: 'pt', name: 'Português', flag: '🇵🇹', nativeName: 'Português' },
          { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
          { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
          { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
          { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true, nativeName: 'العربية' }
        ];

        if (countries && Array.isArray(countries) && countries.length > 0) {
          // Process countries data to extract languages
          const languageMap = new Map<string, Language>();
          
          countries.forEach((country: any) => {
            if (country?.languages && typeof country.languages === 'object') {
              Object.entries(country.languages).forEach(([code, name]) => {
                // Ensure code and name are valid strings and not empty
                if (typeof name === 'string' && 
                    typeof code === 'string' && 
                    code.trim() !== '' && 
                    name.trim() !== '' &&
                    code !== null &&
                    code !== undefined &&
                    !languageMap.has(code)) {
                  languageMap.set(code, {
                    code: code.trim(),
                    name: name.trim(),
                    flag: country.flag || '🏳️',
                    nativeName: name.trim()
                  });
                }
              });
            }
          });

          const processedLanguages = Array.from(languageMap.values())
            .filter(lang => lang.code && lang.code.trim() !== '' && lang.name && lang.name.trim() !== '')
            .slice(0, 20);
          
          setAvailableLanguages(processedLanguages.length > 0 ? processedLanguages : fallbackLanguages);
        } else {
          console.warn('Countries data not available, using fallback languages');
          setAvailableLanguages(fallbackLanguages);
        }
      } catch (error) {
        console.error('Error processing languages:', error);
        // Use fallback languages on error
        setAvailableLanguages([
          { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
          { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
          { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableLanguages();
  }, [countries, countriesError]);

  const setLanguage = (lang: string) => {
    // Ensure we're not setting an empty language code
    if (lang && lang.trim() !== '') {
      setCurrentLanguage(lang.trim());
      localStorage.setItem('preferred-language', lang.trim());
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  };

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && savedLanguage.trim() !== '') {
      setCurrentLanguage(savedLanguage.trim());
    }
  }, []);

  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage, 
        setLanguage, 
        t, 
        availableLanguages, 
        isLoading: isLoading || countriesLoading 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
