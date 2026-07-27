import React, { useState, useRef, useEffect } from "react";
import { useLanguage, Language } from "../context/LanguageContext";
import { Globe, ChevronDown, Check } from "lucide-react";

interface LanguageToggleProps {
  variant?: "compact" | "pill" | "full";
  className?: string;
  dropDirection?: "up" | "down";
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = "pill",
  className = "",
  dropDirection = "down",
}) => {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string; nativeName: string }[] = [
    { code: "pt", label: "Português", flag: "🇲🇿", nativeName: "Português (MZ)" },
    { code: "en", label: "English", flag: "🇬🇧", nativeName: "English (UK/SADC)" },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  // Quick switch pill mode
  if (variant === "compact") {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-full text-xs font-bold text-emerald-100 transition-all active:scale-95 ${className}`}
        title="Alternar Idioma / Switch Language (PT / EN)"
      >
        <span className="text-sm leading-none">{currentLangObj.flag}</span>
        <span className="uppercase font-extrabold tracking-wider">{language}</span>
      </button>
    );
  }

  // Interactive Pill Dropdown (Default for Header)
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-950 rounded-xl text-xs font-bold transition-all shadow-2xs group"
        title={t("lang.selectLanguage")}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-700 group-hover:rotate-12 transition-transform" />
        <span className="text-sm leading-none">{currentLangObj.flag}</span>
        <span className="font-extrabold uppercase tracking-wide text-emerald-900">
          {language}
        </span>
        <ChevronDown className={`w-3 h-3 text-emerald-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Language Selector Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            dropDirection === "up" ? "bottom-full mb-2 left-0" : "right-0 mt-2"
          } w-48 bg-white rounded-2xl shadow-xl border border-emerald-100 p-1.5 z-50 animate-fade-in`}
        >
          <div className="px-2 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-emerald-600" />
            <span>{t("lang.selectLanguage")}</span>
          </div>

          <div className="space-y-0.5 mt-1">
            {languages.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  language === item.code
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{item.flag}</span>
                  <div className="flex flex-col text-left">
                    <span>{item.label}</span>
                    <span className={`text-[9px] ${language === item.code ? "text-emerald-200" : "text-slate-400"}`}>
                      {item.nativeName}
                    </span>
                  </div>
                </div>
                {language === item.code && (
                  <Check className="w-4 h-4 text-amber-300" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
