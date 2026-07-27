import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

// Comprehensive translations dictionary for Mozambican Agricultural Platform
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Navigation & Tabs
    "nav.market": "Mercado",
    "nav.farmer": "Painel Agricultor",
    "nav.driver": "Entregas & Frete",
    "nav.map": "Mapa de Machambas",
    "nav.admin": "Administração",
    "nav.wallet": "Carteira",
    "nav.guide": "Guia",
    "nav.support": "Suporte WhatsApp",
    "nav.logout": "Sair",
    "nav.profile": "Meu Perfil",
    "nav.editProfile": "Editar Perfil & Foto",

    // Header & User States
    "header.online": "Online",
    "header.offline": "Offline",
    "header.notifs": "Notificações",
    "header.noNotifs": "Sem notificações no momento",
    "header.markAllRead": "Marcar todas como lidas",
    "header.clear": "Limpar",

    // Market Page
    "market.title": "Mercado Agrícola de Moçambique",
    "market.subtitle": "Produtos frescos direto dos produtores das 10 províncias moçambicanas",
    "market.searchPlaceholder": "Pesquisar milho, feijão, tomate, castanha...",
    "market.allProvinces": "Todas as Províncias",
    "market.allCategories": "Todas as Categorias",
    "market.buyNow": "Comprar Agora",
    "market.contactFarmer": "Falar com Agricultor",
    "market.pricePerKg": "MT / kg",
    "market.available": "Disponível",
    "market.outOfStock": "Esgotado",

    // Roles
    "role.farmer": "Agricultor",
    "role.buyer": "Comprador",
    "role.driver": "Transportador",
    "role.admin": "Administrador",

    // Support & Footer
    "support.title": "Precisa de Ajuda?",
    "support.whatsapp": "Suporte WhatsApp",
    "support.customerSupport": "Suporte ao Cliente (WhatsApp)",
    "footer.copyright": "© 2026 AgroMoz. Conectando agricultura familiar em Maputo, Gaza, Sofala, Nampula e todo Moçambique.",

    // Language Toggle
    "lang.portuguese": "Português",
    "lang.english": "English",
    "lang.selectLanguage": "Idioma / Language",
  },
  en: {
    // Navigation & Tabs
    "nav.market": "Marketplace",
    "nav.farmer": "Farmer Dashboard",
    "nav.driver": "Deliveries & Freight",
    "nav.map": "Farm Map",
    "nav.admin": "Administration",
    "nav.wallet": "Wallet",
    "nav.guide": "Guided Tour",
    "nav.support": "WhatsApp Support",
    "nav.logout": "Log Out",
    "nav.profile": "My Profile",
    "nav.editProfile": "Edit Profile & Photo",

    // Header & User States
    "header.online": "Online",
    "header.offline": "Offline",
    "header.notifs": "Notifications",
    "header.noNotifs": "No notifications right now",
    "header.markAllRead": "Mark all as read",
    "header.clear": "Clear",

    // Market Page
    "market.title": "Mozambique Agricultural Marketplace",
    "market.subtitle": "Fresh produce direct from farmers across all 10 Mozambican provinces",
    "market.searchPlaceholder": "Search maize, beans, tomatoes, cashews...",
    "market.allProvinces": "All Provinces",
    "market.allCategories": "All Categories",
    "market.buyNow": "Buy Now",
    "market.contactFarmer": "Contact Farmer",
    "market.pricePerKg": "MZN / kg",
    "market.available": "Available",
    "market.outOfStock": "Out of Stock",

    // Roles
    "role.farmer": "Farmer",
    "role.buyer": "Buyer",
    "role.driver": "Transporter",
    "role.admin": "Administrator",

    // Support & Footer
    "support.title": "Need Help?",
    "support.whatsapp": "WhatsApp Support",
    "support.customerSupport": "Customer Support (WhatsApp)",
    "footer.copyright": "© 2026 AgroMoz. Connecting smallholder farming in Maputo, Gaza, Sofala, Nampula and all Mozambique.",

    // Language Toggle
    "lang.portuguese": "Português",
    "lang.english": "English",
    "lang.selectLanguage": "Language / Idioma",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("agromoz_lang");
    return saved === "en" ? "en" : "pt";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("agromoz_lang", lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "pt" ? "en" : "pt");
  };

  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to Portuguese, then to key
    return translations.pt[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
