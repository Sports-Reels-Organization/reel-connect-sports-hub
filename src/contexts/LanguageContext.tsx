
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCountries } from '@/hooks/useCountries';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
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
          { code: 'en', name: 'English', flag: '🇺🇸' },
          { code: 'es', name: 'Español', flag: '🇪🇸' },
          { code: 'fr', name: 'Français', flag: '🇫🇷' },
          { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
          { code: 'it', name: 'Italiano', flag: '🇮🇹' },
          { code: 'pt', name: 'Português', flag: '🇵🇹' },
          { code: 'ru', name: 'Русский', flag: '🇷🇺' },
          { code: 'zh', name: '中文', flag: '🇨🇳' },
          { code: 'ja', name: '日本語', flag: '🇯🇵' },
          { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true }
        ];

        if (countries && Array.isArray(countries) && countries.length > 0) {
          // Process countries data to extract languages
          const languageMap = new Map<string, Language>();
          
          countries.forEach((country: any) => {
            if (country?.languages && typeof country.languages === 'object') {
              Object.entries(country.languages).forEach(([code, name]) => {
                if (typeof name === 'string' && !languageMap.has(code)) {
                  languageMap.set(code, {
                    code,
                    name,
                    flag: country.flag || '🏳️'
                  });
                }
              });
            }
          });

          const processedLanguages = Array.from(languageMap.values()).slice(0, 20);
          setAvailableLanguages(processedLanguages.length > 0 ? processedLanguages : fallbackLanguages);
        } else {
          console.warn('Countries data not available, using fallback languages');
          setAvailableLanguages(fallbackLanguages);
        }
      } catch (error) {
        console.error('Error processing languages:', error);
        // Use fallback languages on error
        setAvailableLanguages([
          { code: 'en', name: 'English', flag: '🇺🇸' },
          { code: 'es', name: 'Español', flag: '🇪🇸' },
          { code: 'fr', name: 'Français', flag: '🇫🇷' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableLanguages();
  }, [countries, countriesError]);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
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
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
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
