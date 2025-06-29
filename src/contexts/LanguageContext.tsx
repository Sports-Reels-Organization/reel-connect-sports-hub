import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

export interface Translation {
    // Auth
    welcome: string;
    signInWithGoogle: string;
    termsAccepted: string;
    termsDescription: string;

    // Navigation
    dashboard: string;
    players: string;
    videos: string;
    timeline: string;
    explore: string;
    messages: string;
    notifications: string;
    contracts: string;
    profile: string;
    signOut: string;

    // Common
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    create: string;
    search: string;
    filter: string;
    view: string;
    download: string;

    // Dashboard
    teamDashboard: string;
    agentDashboard: string;
    overview: string;
    recentActivity: string;

    // Players
    playerManagement: string;
    addPlayer: string;
    playerName: string;
    position: string;
    nationality: string;
    age: string;
    height: string;
    weight: string;

    // Videos
    videoManagement: string;
    uploadVideo: string;
    videoTitle: string;
    videoDescription: string;
    videoType: string;
    matchDate: string;

    // Contracts
    contractManagement: string;
    newContract: string;
    contractDetails: string;
    contractCreation: string;
    transferFee: string;
    currency: string;
    transferType: string;
    serviceCharge: string;

    // Notifications
    notificationCenter: string;
    markAllRead: string;
    notificationPreferences: string;
    emailNotifications: string;
    inAppNotifications: string;

    // Messages
    messaging: string;
    sendMessage: string;
    messageSubject: string;
    messageContent: string;

    // Explore
    exploreRequests: string;
    createRequest: string;
    requestTitle: string;
    requestDescription: string;
    budget: string;

    // Profile
    profileSettings: string;
    personalInfo: string;
    teamInfo: string;
    preferences: string;
}

const translations: Record<string, Translation> = {
    en: {
        // Auth
        welcome: "Welcome to Sports Reels!",
        signInWithGoogle: "Continue with Google",
        termsAccepted: "I accept the terms and conditions",
        termsDescription: "By continuing, you agree to our Terms of Service and Privacy Policy.",

        // Navigation
        dashboard: "Dashboard",
        players: "Players",
        videos: "Videos",
        timeline: "Timeline",
        explore: "Explore",
        messages: "Messages",
        notifications: "Notifications",
        contracts: "Contracts",
        profile: "Profile",
        signOut: "Sign Out",

        // Common
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        create: "Create",
        search: "Search",
        filter: "Filter",
        view: "View",
        download: "Download",

        // Dashboard
        teamDashboard: "Team Dashboard",
        agentDashboard: "Agent Dashboard",
        overview: "Overview",
        recentActivity: "Recent Activity",

        // Players
        playerManagement: "Player Management",
        addPlayer: "Add Player",
        playerName: "Player Name",
        position: "Position",
        nationality: "Nationality",
        age: "Age",
        height: "Height",
        weight: "Weight",

        // Videos
        videoManagement: "Video Management",
        uploadVideo: "Upload Video",
        videoTitle: "Video Title",
        videoDescription: "Video Description",
        videoType: "Video Type",
        matchDate: "Match Date",

        // Contracts
        contractManagement: "Contract Management",
        newContract: "New Contract",
        contractDetails: "Contract Details",
        contractCreation: "Contract Creation",
        transferFee: "Transfer Fee",
        currency: "Currency",
        transferType: "Transfer Type",
        serviceCharge: "Service Charge",

        // Notifications
        notificationCenter: "Notification Center",
        markAllRead: "Mark All Read",
        notificationPreferences: "Notification Preferences",
        emailNotifications: "Email Notifications",
        inAppNotifications: "In-App Notifications",

        // Messages
        messaging: "Messaging",
        sendMessage: "Send Message",
        messageSubject: "Subject",
        messageContent: "Message",

        // Explore
        exploreRequests: "Explore Requests",
        createRequest: "Create Request",
        requestTitle: "Request Title",
        requestDescription: "Request Description",
        budget: "Budget",

        // Profile
        profileSettings: "Profile Settings",
        personalInfo: "Personal Information",
        teamInfo: "Team Information",
        preferences: "Preferences",
    },
    es: {
        // Auth
        welcome: "¡Bienvenido a Sports Reels!",
        signInWithGoogle: "Continuar con Google",
        termsAccepted: "Acepto los términos y condiciones",
        termsDescription: "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.",

        // Navigation
        dashboard: "Panel",
        players: "Jugadores",
        videos: "Videos",
        timeline: "Cronología",
        explore: "Explorar",
        messages: "Mensajes",
        notifications: "Notificaciones",
        contracts: "Contratos",
        profile: "Perfil",
        signOut: "Cerrar Sesión",

        // Common
        loading: "Cargando...",
        error: "Error",
        success: "Éxito",
        cancel: "Cancelar",
        save: "Guardar",
        edit: "Editar",
        delete: "Eliminar",
        create: "Crear",
        search: "Buscar",
        filter: "Filtrar",
        view: "Ver",
        download: "Descargar",

        // Dashboard
        teamDashboard: "Panel del Equipo",
        agentDashboard: "Panel del Agente",
        overview: "Resumen",
        recentActivity: "Actividad Reciente",

        // Players
        playerManagement: "Gestión de Jugadores",
        addPlayer: "Agregar Jugador",
        playerName: "Nombre del Jugador",
        position: "Posición",
        nationality: "Nacionalidad",
        age: "Edad",
        height: "Altura",
        weight: "Peso",

        // Videos
        videoManagement: "Gestión de Videos",
        uploadVideo: "Subir Video",
        videoTitle: "Título del Video",
        videoDescription: "Descripción del Video",
        videoType: "Tipo de Video",
        matchDate: "Fecha del Partido",

        // Contracts
        contractManagement: "Gestión de Contratos",
        newContract: "Nuevo Contrato",
        contractDetails: "Detalles del Contrato",
        contractCreation: "Creación de Contrato",
        transferFee: "Tarifa de Transferencia",
        currency: "Moneda",
        transferType: "Tipo de Transferencia",
        serviceCharge: "Cargo por Servicio",

        // Notifications
        notificationCenter: "Centro de Notificaciones",
        markAllRead: "Marcar Todo como Leído",
        notificationPreferences: "Preferencias de Notificación",
        emailNotifications: "Notificaciones por Email",
        inAppNotifications: "Notificaciones en la App",

        // Messages
        messaging: "Mensajería",
        sendMessage: "Enviar Mensaje",
        messageSubject: "Asunto",
        messageContent: "Mensaje",

        // Explore
        exploreRequests: "Explorar Solicitudes",
        createRequest: "Crear Solicitud",
        requestTitle: "Título de la Solicitud",
        requestDescription: "Descripción de la Solicitud",
        budget: "Presupuesto",

        // Profile
        profileSettings: "Configuración del Perfil",
        personalInfo: "Información Personal",
        teamInfo: "Información del Equipo",
        preferences: "Preferencias",
    },
    fr: {
        // Auth
        welcome: "Bienvenue sur Sports Reels !",
        signInWithGoogle: "Continuer avec Google",
        termsAccepted: "J'accepte les termes et conditions",
        termsDescription: "En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.",

        // Navigation
        dashboard: "Tableau de bord",
        players: "Joueurs",
        videos: "Vidéos",
        timeline: "Chronologie",
        explore: "Explorer",
        messages: "Messages",
        notifications: "Notifications",
        contracts: "Contrats",
        profile: "Profil",
        signOut: "Se déconnecter",

        // Common
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        cancel: "Annuler",
        save: "Enregistrer",
        edit: "Modifier",
        delete: "Supprimer",
        create: "Créer",
        search: "Rechercher",
        filter: "Filtrer",
        view: "Voir",
        download: "Télécharger",

        // Dashboard
        teamDashboard: "Tableau de bord de l'équipe",
        agentDashboard: "Tableau de bord de l'agent",
        overview: "Aperçu",
        recentActivity: "Activité récente",

        // Players
        playerManagement: "Gestion des joueurs",
        addPlayer: "Ajouter un joueur",
        playerName: "Nom du joueur",
        position: "Position",
        nationality: "Nationalité",
        age: "Âge",
        height: "Taille",
        weight: "Poids",

        // Videos
        videoManagement: "Gestion des vidéos",
        uploadVideo: "Télécharger une vidéo",
        videoTitle: "Titre de la vidéo",
        videoDescription: "Description de la vidéo",
        videoType: "Type de vidéo",
        matchDate: "Date du match",

        // Contracts
        contractManagement: "Gestion des contrats",
        newContract: "Nouveau contrat",
        contractDetails: "Détails du contrat",
        contractCreation: "Création de contrat",
        transferFee: "Frais de transfert",
        currency: "Devise",
        transferType: "Type de transfert",
        serviceCharge: "Frais de service",

        // Notifications
        notificationCenter: "Centre de notifications",
        markAllRead: "Tout marquer comme lu",
        notificationPreferences: "Préférences de notification",
        emailNotifications: "Notifications par email",
        inAppNotifications: "Notifications dans l'app",

        // Messages
        messaging: "Messagerie",
        sendMessage: "Envoyer un message",
        messageSubject: "Sujet",
        messageContent: "Message",

        // Explore
        exploreRequests: "Explorer les demandes",
        createRequest: "Créer une demande",
        requestTitle: "Titre de la demande",
        requestDescription: "Description de la demande",
        budget: "Budget",

        // Profile
        profileSettings: "Paramètres du profil",
        personalInfo: "Informations personnelles",
        teamInfo: "Informations de l'équipe",
        preferences: "Préférences",
    },
    de: {
        // Auth
        welcome: "Willkommen bei Sports Reels!",
        signInWithGoogle: "Mit Google fortfahren",
        termsAccepted: "Ich akzeptiere die Bedingungen",
        termsDescription: "Durch Fortfahren stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.",

        // Navigation
        dashboard: "Dashboard",
        players: "Spieler",
        videos: "Videos",
        timeline: "Zeitleiste",
        explore: "Entdecken",
        messages: "Nachrichten",
        notifications: "Benachrichtigungen",
        contracts: "Verträge",
        profile: "Profil",
        signOut: "Abmelden",

        // Common
        loading: "Laden...",
        error: "Fehler",
        success: "Erfolg",
        cancel: "Abbrechen",
        save: "Speichern",
        edit: "Bearbeiten",
        delete: "Löschen",
        create: "Erstellen",
        search: "Suchen",
        filter: "Filter",
        view: "Anzeigen",
        download: "Herunterladen",

        // Dashboard
        teamDashboard: "Team Dashboard",
        agentDashboard: "Agent Dashboard",
        overview: "Übersicht",
        recentActivity: "Letzte Aktivität",

        // Players
        playerManagement: "Spielerverwaltung",
        addPlayer: "Spieler hinzufügen",
        playerName: "Spielername",
        position: "Position",
        nationality: "Nationalität",
        age: "Alter",
        height: "Größe",
        weight: "Gewicht",

        // Videos
        videoManagement: "Videoverwaltung",
        uploadVideo: "Video hochladen",
        videoTitle: "Video-Titel",
        videoDescription: "Video-Beschreibung",
        videoType: "Video-Typ",
        matchDate: "Spieldatum",

        // Contracts
        contractManagement: "Vertragsverwaltung",
        newContract: "Neuer Vertrag",
        contractDetails: "Vertragsdetails",
        contractCreation: "Vertragserstellung",
        transferFee: "Transfergebühr",
        currency: "Währung",
        transferType: "Transfertyp",
        serviceCharge: "Servicegebühr",

        // Notifications
        notificationCenter: "Benachrichtigungszentrum",
        markAllRead: "Alle als gelesen markieren",
        notificationPreferences: "Benachrichtigungseinstellungen",
        emailNotifications: "E-Mail-Benachrichtigungen",
        inAppNotifications: "In-App-Benachrichtigungen",

        // Messages
        messaging: "Nachrichten",
        sendMessage: "Nachricht senden",
        messageSubject: "Betreff",
        messageContent: "Nachricht",

        // Explore
        exploreRequests: "Anfragen erkunden",
        createRequest: "Anfrage erstellen",
        requestTitle: "Anfragetitel",
        requestDescription: "Anfragebeschreibung",
        budget: "Budget",

        // Profile
        profileSettings: "Profileinstellungen",
        personalInfo: "Persönliche Informationen",
        teamInfo: "Team-Informationen",
        preferences: "Einstellungen",
    },
    pt: {
        // Auth
        welcome: "Bem-vindo ao Sports Reels!",
        signInWithGoogle: "Continuar com Google",
        termsAccepted: "Aceito os termos e condições",
        termsDescription: "Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.",

        // Navigation
        dashboard: "Painel",
        players: "Jogadores",
        videos: "Vídeos",
        timeline: "Linha do Tempo",
        explore: "Explorar",
        messages: "Mensagens",
        notifications: "Notificações",
        contracts: "Contratos",
        profile: "Perfil",
        signOut: "Sair",

        // Common
        loading: "Carregando...",
        error: "Erro",
        success: "Sucesso",
        cancel: "Cancelar",
        save: "Salvar",
        edit: "Editar",
        delete: "Excluir",
        create: "Criar",
        search: "Pesquisar",
        filter: "Filtrar",
        view: "Ver",
        download: "Baixar",

        // Dashboard
        teamDashboard: "Painel da Equipe",
        agentDashboard: "Painel do Agente",
        overview: "Visão Geral",
        recentActivity: "Atividade Recente",

        // Players
        playerManagement: "Gestão de Jogadores",
        addPlayer: "Adicionar Jogador",
        playerName: "Nome do Jogador",
        position: "Posição",
        nationality: "Nacionalidade",
        age: "Idade",
        height: "Altura",
        weight: "Peso",

        // Videos
        videoManagement: "Gestão de Vídeos",
        uploadVideo: "Enviar Vídeo",
        videoTitle: "Título do Vídeo",
        videoDescription: "Descrição do Vídeo",
        videoType: "Tipo de Vídeo",
        matchDate: "Data do Jogo",

        // Contracts
        contractManagement: "Gestão de Contratos",
        newContract: "Novo Contrato",
        contractDetails: "Detalhes do Contrato",
        contractCreation: "Criação de Contrato",
        transferFee: "Taxa de Transferência",
        currency: "Moeda",
        transferType: "Tipo de Transferência",
        serviceCharge: "Taxa de Serviço",

        // Notifications
        notificationCenter: "Centro de Notificações",
        markAllRead: "Marcar Todos como Lidos",
        notificationPreferences: "Preferências de Notificação",
        emailNotifications: "Notificações por Email",
        inAppNotifications: "Notificações no App",

        // Messages
        messaging: "Mensagens",
        sendMessage: "Enviar Mensagem",
        messageSubject: "Assunto",
        messageContent: "Mensagem",

        // Explore
        exploreRequests: "Explorar Solicitações",
        createRequest: "Criar Solicitação",
        requestTitle: "Título da Solicitação",
        requestDescription: "Descrição da Solicitação",
        budget: "Orçamento",

        // Profile
        profileSettings: "Configurações do Perfil",
        personalInfo: "Informações Pessoais",
        teamInfo: "Informações da Equipe",
        preferences: "Preferências",
    }
};

interface LanguageContextType {
    currentLanguage: string;
    setLanguage: (languageCode: string) => void;
    t: (key: keyof Translation) => string;
    availableLanguages: Language[];
    loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvailableLanguages();
        // Load saved language preference
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && translations[savedLanguage]) {
            setCurrentLanguage(savedLanguage);
        }
    }, []);

    const fetchAvailableLanguages = async () => {
        try {
            setLoading(true);

            // Fetch languages from RestCountries API
            const response = await fetch('https://restcountries.com/v3.1/all');
            const countries = await response.json();

            // Filter and map to supported languages
            const supportedLanguageCodes = Object.keys(translations);
            const languageMap = new Map<string, Language>();

            countries.forEach((country: any) => {
                Object.entries(country.languages || {}).forEach(([code, name]) => {
                    if (supportedLanguageCodes.includes(code) && !languageMap.has(code)) {
                        languageMap.set(code, {
                            code,
                            name: name as string,
                            nativeName: name as string,
                            flag: country.flags?.svg || country.flags?.png || ''
                        });
                    }
                });
            });

            // Add fallback languages if not found in API
            supportedLanguageCodes.forEach(code => {
                if (!languageMap.has(code)) {
                    const fallbackNames: Record<string, string> = {
                        en: 'English',
                        es: 'Español',
                        fr: 'Français',
                        de: 'Deutsch',
                        pt: 'Português'
                    };
                    languageMap.set(code, {
                        code,
                        name: fallbackNames[code] || code,
                        nativeName: fallbackNames[code] || code,
                        flag: ''
                    });
                }
            });

            setAvailableLanguages(Array.from(languageMap.values()));
        } catch (error) {
            console.error('Error fetching languages:', error);
            // Fallback to basic language list
            setAvailableLanguages([
                { code: 'en', name: 'English', nativeName: 'English', flag: '' },
                { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '' },
                { code: 'fr', name: 'French', nativeName: 'Français', flag: '' },
                { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '' },
                { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const setLanguage = (languageCode: string) => {
        if (translations[languageCode]) {
            setCurrentLanguage(languageCode);
            localStorage.setItem('preferredLanguage', languageCode);
            // Update document language
            document.documentElement.lang = languageCode;
        }
    };

    const t = (key: keyof Translation): string => {
        const translation = translations[currentLanguage];
        return translation?.[key] || translations.en[key] || key;
    };

    const value: LanguageContextType = {
        currentLanguage,
        setLanguage,
        t,
        availableLanguages,
        loading
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}; 