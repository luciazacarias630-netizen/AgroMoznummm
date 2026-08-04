import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "pt" | "cga" | "vmw" | "seh" | "en";

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
    "lang.changana": "Changana (Xichangana)",
    "lang.macua": "Macua (Emakhuwa)",
    "lang.sena": "Sena (Cisena)",
    "lang.english": "English",
    "lang.selectLanguage": "Idioma / Languja",
  },
  cga: {
    // Navigation & Tabs (Changana / Xichangana - Sul: Maputo, Gaza, Inhambane)
    "nav.market": "Musika",
    "nav.farmer": "Murimi",
    "nav.driver": "Kuthwala & Mihandzu",
    "nav.map": "Mape ya Machamba",
    "nav.admin": "Vurangariri",
    "nav.wallet": "Xipaci",
    "nav.guide": "Xitshungunu",
    "nav.support": "Muxaka WhatsApp",
    "nav.logout": "Huma",
    "nav.profile": "Wene Wanga",
    "nav.editProfile": "Lulamisa Xifaniso",

    // Header & User States
    "header.online": "Wa Tirha",
    "header.offline": "A nga Tirhi",
    "header.notifs": "Mahiwelela",
    "header.noNotifs": "Kuhava mahiwelela sweswi",
    "header.markAllRead": "Hlaya hinkwaswo",
    "header.clear": "Sula",

    // Market Page
    "market.title": "Musika wa Timphahla ta Murimi Moçambique",
    "market.subtitle": "Swa kudya swo basa swo huma na machamba ya 10 sviphendla ta Moçambique",
    "market.searchPlaceholder": "Lava mavele, timawa, matimati, mikusu...",
    "market.allProvinces": "Tiko Hinkwaro",
    "market.allCategories": "Muxaka Hinkwayo",
    "market.buyNow": "Xava Sweswi",
    "market.contactFarmer": "Vulavula na Murimi",
    "market.pricePerKg": "MT / kg",
    "market.available": "Swa Kumeka",
    "market.outOfStock": "Swa Hela",

    // Roles
    "role.farmer": "Murimi",
    "role.buyer": "Muxavi",
    "role.driver": "Muthwali",
    "role.admin": "Murangariri",

    // Support & Footer
    "support.title": "Lava Mpfuno?",
    "support.whatsapp": "WhatsApp wa Mpfuno",
    "support.customerSupport": "Mpfuno wa Vanhu (WhatsApp)",
    "footer.copyright": "© 2026 AgroMoz. Tlhanganisa varimi ta Maputo, Gaza, Sofala, Nampula na tiko hinkwaro ta Moçambique.",

    // Language Toggle
    "lang.portuguese": "Português",
    "lang.changana": "Changana (Xichangana)",
    "lang.macua": "Macua (Emakhuwa)",
    "lang.sena": "Sena (Cisena)",
    "lang.english": "English",
    "lang.selectLanguage": "Xivulavulelo / Idioma",
  },
  vmw: {
    // Navigation & Tabs (Macua / Emakhuwa - Norte: Nampula, Cabo Delgado, Niassa, Zambézia)
    "nav.market": "Omerikato",
    "nav.farmer": "Namuteko a Olima",
    "nav.driver": "Mithukulu & Mukwaha",
    "nav.map": "Ekaarta ya Mathalani",
    "nav.admin": "Olamula",
    "nav.wallet": "Epaso / Musurukhu",
    "nav.guide": "Malakiheryo",
    "nav.support": "Nikhuuru WhatsApp",
    "nav.logout": "Okhuma",
    "nav.profile": "Miya",
    "nav.editProfile": "Oturuka Epicha",

    // Header & User States
    "header.online": "Okhala",
    "header.offline": "Owoorana",
    "header.notifs": "Emasikha",
    "header.noNotifs": "Kahiivo emasikha nna",
    "header.markAllRead": "Olosha Soothe",
    "header.clear": "Oluha",

    // Market Page
    "market.title": "Omerikato a Olima wa Moçambique",
    "market.subtitle": "Yoolia sooreera sookhuma wa amulimi a iprovinsiya sa Moçambique",
    "market.searchPlaceholder": "Ovasa nchama, ekhawa, tamate, ikaju...",
    "market.allProvinces": "Iprovinsiya Soothe",
    "market.allCategories": "Mureerelo Yoothe",
    "market.buyNow": "Othuma Nna",
    "market.contactFarmer": "Olavula ni Mulimi",
    "market.pricePerKg": "MT / kg",
    "market.available": "Esepeya",
    "market.outOfStock": "Omala",

    // Roles
    "role.farmer": "Mulimi",
    "role.buyer": "Muthumi",
    "role.driver": "Mukwaha",
    "role.admin": "Namulamula",

    // Support & Footer
    "support.title": "Munachuna Nikhuuru?",
    "support.whatsapp": "WhatsApp wa Nikhuuru",
    "support.customerSupport": "Nikhuuru a Athu (WhatsApp)",
    "footer.copyright": "© 2026 AgroMoz. Otuka amulimi a Nampula, Cabo Delgado, Niassa, Zambézia ni Moçambique woothe.",

    // Language Toggle
    "lang.portuguese": "Português",
    "lang.changana": "Changana (Xichangana)",
    "lang.macua": "Macua (Emakhuwa)",
    "lang.sena": "Sena (Cisena)",
    "lang.english": "English",
    "lang.selectLanguage": "Nthanthi / Idioma",
  },
  seh: {
    // Navigation & Tabs (Sena / Cisena - Centro: Sofala, Manica, Tete, Zambézia)
    "nav.market": "Musika",
    "nav.farmer": "Peno ya Nsereko",
    "nav.driver": "Kutwala & Nyatwaza",
    "nav.map": "Mapa ya Machamba",
    "nav.admin": "Utongi",
    "nav.wallet": "Nhonga / Xipaci",
    "nav.guide": "Metsani",
    "nav.support": "Cipangizo WhatsApp",
    "nav.logout": "Buluka",
    "nav.profile": "Mune Wanga",
    "nav.editProfile": "Sasanya Foto",

    // Header & User States
    "header.online": "Alipo",
    "header.offline": "Palibe",
    "header.notifs": "Macenjezo",
    "header.noNotifs": "Palibe macenjezo cincino",
    "header.markAllRead": "Leri Pyensene",
    "header.clear": "Pula",

    // Market Page
    "market.title": "Musika wa Mbeu mu Moçambique",
    "market.subtitle": "Chidya chakucena cinabuluka ku machamba m’makhundu 10 ya Moçambique",
    "market.searchPlaceholder": "Saka zakudya: piripiri, nyemba, mamatimati, caju...",
    "market.allProvinces": "Makhundu Yensene",
    "market.allCategories": "Ntundu Yensene",
    "market.buyNow": "Gulani Cincino",
    "market.contactFarmer": "Longani na Nsereko",
    "market.pricePerKg": "MT / kg",
    "market.available": "Iripo",
    "market.outOfStock": "Yadamalala",

    // Roles
    "role.farmer": "Nsereko / Mulimi",
    "role.buyer": "Nyagula",
    "role.driver": "Nyatwaza",
    "role.admin": "Nyatonga",

    // Support & Footer
    "support.title": "Unasaka Cipangizo?",
    "support.whatsapp": "WhatsApp wa Cipangizo",
    "support.customerSupport": "Cipangizo wa Wanthu (WhatsApp)",
    "footer.copyright": "© 2026 AgroMoz. Kubvunganisa alimi mu Sofala, Manica, Tete, Zambézia na Moçambique yensene.",

    // Language Toggle
    "lang.portuguese": "Português",
    "lang.changana": "Changana (Xichangana)",
    "lang.macua": "Macua (Emakhuwa)",
    "lang.sena": "Sena (Cisena)",
    "lang.english": "English",
    "lang.selectLanguage": "Cilongero / Idioma",
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
    "lang.changana": "Changana (Xichangana)",
    "lang.macua": "Macua (Emakhuwa)",
    "lang.sena": "Sena (Cisena)",
    "lang.english": "English",
    "lang.selectLanguage": "Language / Idioma",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("agromoz_lang") as Language;
    if (saved && ["pt", "cga", "vmw", "seh", "en"].includes(saved)) {
      return saved;
    }
    return "pt";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("agromoz_lang", lang);
  };

  const toggleLanguage = () => {
    const order: Language[] = ["pt", "cga", "vmw", "seh", "en"];
    const nextIdx = (order.indexOf(language) + 1) % order.length;
    setLanguage(order[nextIdx]);
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
