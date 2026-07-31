import React, { useState } from "react";
import { useAgro } from "./context/AgroContext";
import { useLanguage } from "./context/LanguageContext";
import { LanguageToggle } from "./components/LanguageToggle";
import { Header } from "./components/Header";
import { AuthScreen } from "./components/AuthScreen";
import { BuyerMarketplace } from "./components/BuyerMarketplace";
import { FarmerDashboard } from "./components/FarmerDashboard";
import { DriverDashboard } from "./components/DriverDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { MozambiqueMap } from "./components/MozambiqueMap";
import { ChatModal } from "./components/ChatModal";
import { WalletModal } from "./components/WalletModal";
import { OrderTrackingModal } from "./components/OrderTrackingModal";
import { UserGuidedTour } from "./components/UserGuidedTour";
import { ProfileModal } from "./components/ProfileModal";
import { TopToastNotification } from "./components/TopToastNotification";
import { DevicePermissionPrompt } from "./components/DevicePermissionPrompt";
import {
  ShoppingBag,
  Sprout,
  Truck,
  ShieldCheck,
  Compass,
  MessageCircle,
  Headphones,
  ExternalLink,
} from "lucide-react";

export function App() {
  const { currentUser, unreadCount } = useAgro();
  const { t } = useLanguage();

  // Initialize activeTab according to user role
  const [activeTab, setActiveTab] = useState<
    "MARKET" | "FARMER" | "DRIVER" | "MAP" | "ADMIN"
  >(() => {
    if (currentUser?.role === "FARMER") return "FARMER";
    if (currentUser?.role === "DRIVER") return "DRIVER";
    return "MARKET";
  });

  // Modals state
  const [chatPartner, setChatPartner] = useState<{ id: string; name: string } | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Automatically adjust activeTab if currentUser role changes
  React.useEffect(() => {
    if (currentUser?.role === "FARMER" && activeTab !== "FARMER" && activeTab !== "MARKET" && activeTab !== "MAP") {
      setActiveTab("FARMER");
    } else if (currentUser?.role === "DRIVER" && activeTab !== "DRIVER" && activeTab !== "MAP") {
      setActiveTab("DRIVER");
    } else if (currentUser?.role === "BUYER" && (activeTab === "FARMER" || activeTab === "DRIVER" || activeTab === "ADMIN")) {
      setActiveTab("MARKET");
    }
  }, [currentUser?.role, activeTab]);

  // If user is not logged in, show Auth Portal
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Floating Realtime Push Toast Notification Banner */}
      <TopToastNotification
        onOpenTrackingModal={(orderId) => setTrackingOrderId(orderId)}
        onOpenWallet={() => setShowWallet(true)}
        onOpenChat={() => setChatPartner({ id: "farmer-1", name: "Mateus Cossa" })}
      />

      {/* Device Notification Permission Banner Prompt */}
      <DevicePermissionPrompt />

      {/* Top Main Navigation Header */}
      <Header
        onOpenWallet={() => setShowWallet(true)}
        onOpenChat={() => {
          setChatPartner({ id: "farmer-1", name: "Mateus Cossa" });
        }}
        onOpenTour={() => setShowTour(true)}
        onOpenProfile={() => setShowProfile(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Primary Sub-Navigation Bar - Role Specific */}
      <nav className="bg-white border-b border-emerald-100 shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 overflow-x-auto gap-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* AGRICULTOR DEDICATED TAB */}
              {currentUser.role === "FARMER" && (
                <button
                  onClick={() => setActiveTab("FARMER")}
                  className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "FARMER"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Sprout className="w-4 h-4 text-amber-300" />
                  Painel do Agricultor (Produtos & Machamba)
                </button>
              )}

              {/* CONSUMIDOR / BUYER MARKETPLACE TAB (NOT FOR DRIVERS) */}
              {currentUser.role !== "DRIVER" && (
                <button
                  onClick={() => setActiveTab("MARKET")}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "MARKET"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  {currentUser.role === "FARMER" ? "Ver Mercado de Preços" : "Mercado Agrícola (Comprar)"}
                </button>
              )}

              {/* TRANSPORTADOR DEDICATED TAB */}
              {(currentUser.role === "DRIVER" || currentUser.role === "ADMIN") && (
                <button
                  onClick={() => setActiveTab("DRIVER")}
                  className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "DRIVER"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Truck className="w-4 h-4 text-amber-300" />
                  Portal do Transportador
                </button>
              )}

              {/* MAPA DAS MACHAMBAS (ACCESSIBLE TO ALL ROLES) */}
              <button
                onClick={() => setActiveTab("MAP")}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "MAP"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Compass className="w-4 h-4 text-amber-300" />
                Mapa das Machambas
              </button>

              {/* ADMIN PANEL TAB */}
              {currentUser.role === "ADMIN" && (
                <button
                  onClick={() => setActiveTab("ADMIN")}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "ADMIN"
                      ? "bg-slate-900 text-amber-300 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Painel Admin
                </button>
              )}
            </div>

            {/* Quick Chat Shortcut */}
            <button
              onClick={() => setChatPartner({ id: "farmer-1", name: "Mateus Cossa" })}
              className="relative p-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition-all shrink-0"
              title="Abrir Chat Directo"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "MARKET" && currentUser.role !== "DRIVER" && (
          <BuyerMarketplace
            onOpenChatWith={(id, name) => setChatPartner({ id, name })}
            onOpenOrderTracking={(ordId) => setTrackingOrderId(ordId)}
          />
        )}

        {activeTab === "FARMER" && currentUser.role !== "DRIVER" && currentUser.role !== "BUYER" && <FarmerDashboard />}

        {activeTab === "DRIVER" && <DriverDashboard />}

        {activeTab === "MAP" && (
          <MozambiqueMap
            onOpenChatWith={(id, name) => setChatPartner({ id, name })}
          />
        )}

        {activeTab === "ADMIN" && <AdminDashboard />}
      </main>

      {/* Modals overlay */}
      {chatPartner && (
        <ChatModal
          partnerId={chatPartner.id}
          partnerName={chatPartner.name}
          onClose={() => setChatPartner(null)}
        />
      )}

      {showWallet && currentUser?.role !== "BUYER" && (
        <WalletModal onClose={() => setShowWallet(false)} />
      )}

      {trackingOrderId && (
        <OrderTrackingModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}

      {/* Profile & Photo Editing Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Interactive Guided Tour */}
      <UserGuidedTour
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenManual={showTour}
        onCloseManual={() => setShowTour(false)}
      />

      {/* Floating Bottom Language Selector */}
      <div className="fixed bottom-5 left-5 z-40">
        <LanguageToggle dropDirection="up" />
      </div>

      {/* Floating WhatsApp Customer Support Button */}
      <a
        href="https://wa.link/gm5urh"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-emerald-500/30 group"
        title={t("support.whatsapp")}
      >
        <div className="relative">
          <Headphones className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-emerald-800 animate-ping" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider leading-none">
            {t("support.title")}
          </span>
          <span className="text-xs font-black text-white leading-tight flex items-center gap-1">
            {t("support.whatsapp")}{" "}
            <ExternalLink className="w-3 h-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </a>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200 py-8 border-t border-emerald-900 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-white font-serif text-sm">
              Agro<span className="text-amber-400 font-sans">Moz</span>
            </span>
            <span className="text-emerald-400 text-[11px]">
              — Plataforma Agrícola Digital de Moçambique
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle variant="compact" />
            <a
              href="https://wa.link/gm5urh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/80 rounded-xl text-amber-300 font-extrabold text-xs transition-all shadow-xs"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>{t("support.customerSupport")}</span>
              <ExternalLink className="w-3 h-3 text-emerald-300" />
            </a>
          </div>

          <p className="text-[11px] text-emerald-300 text-center md:text-right">
            {t("footer.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
