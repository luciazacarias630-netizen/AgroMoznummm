import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { AgroMozLogo } from "./AgroMozLogo";
import { FcmNotificationModal } from "./FcmNotificationModal";
import {
  Sprout,
  Wallet,
  Bell,
  LogOut,
  ShieldCheck,
  Truck,
  ShoppingBag,
  Store,
  ChevronDown,
  MapPin,
  X,
  MessageSquare,
  Package,
  CheckCheck,
  BellRing,
  ExternalLink,
  HelpCircle,
  Camera,
  User,
} from "lucide-react";

interface HeaderProps {
  onOpenWallet: () => void;
  onOpenChat?: () => void;
  onOpenTour?: () => void;
  onOpenProfile?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWallet,
  onOpenChat,
  onOpenTour,
  onOpenProfile,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    logoutUser,
    toggleOnlineStatus,
    appNotifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    activePushToast,
    dismissPushToast,
    notificationPermission,
    requestNotificationPermission,
  } = useAgro();
  const { t } = useLanguage();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFcmModal, setShowFcmModal] = useState(false);

  if (!currentUser) return null;

  // Filter notifications relevant to current user or ALL
  const myNotifications = appNotifications.filter(
    (n) => n.userId === "ALL" || n.userId === currentUser.id
  );

  return (
    <>
      {/* NOTIFICATION PERMISSION TOP BANNER BAR */}
      {notificationPermission === "default" && (
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 max-w-2xl">
            <BellRing className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>
              <strong>Ativar Alertas em Tempo Real:</strong> Permita as notificações do navegador para ser alertado instantaneamente quando houver vendas, atualizações de encomendas e novas mensagens.
            </span>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-lg text-xs shrink-0 shadow-xs transition-all active:scale-95"
          >
            Permitir Notificações
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveTab && setActiveTab("MARKET")}
            >
              <AgroMozLogo size="md" showText={true} />
              <span className="hidden sm:inline-block text-[11px] px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-bold border border-emerald-200">
                🇲🇿 Moçambique
              </span>
            </div>

            {/* Center Navigation Shortcuts based on User Role */}
            {setActiveTab && (
              <nav className="hidden md:flex items-center gap-1 bg-emerald-50/60 p-1 rounded-xl border border-emerald-100">
                {currentUser.role !== "DRIVER" && (
                  <button
                    onClick={() => setActiveTab("MARKET")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "MARKET"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-100/60"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" /> {t("nav.market")}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("MAP")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "MAP"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-emerald-900 hover:bg-emerald-100/60"
                  }`}
                >
                  <Sprout className="w-4 h-4" /> {t("nav.map")}
                </button>

                {(currentUser.role === "FARMER" || currentUser.role === "ADMIN") && (
                  <button
                    onClick={() => setActiveTab("FARMER")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "FARMER"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-100/60"
                    }`}
                  >
                    <Store className="w-4 h-4 text-amber-300" /> {t("nav.farmer")}
                  </button>
                )}

                {(currentUser.role === "DRIVER" || currentUser.role === "ADMIN") && (
                  <button
                    onClick={() => setActiveTab("DRIVER")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "DRIVER"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-100/60"
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-300" /> {t("nav.driver")}
                  </button>
                )}

                {currentUser.role === "ADMIN" && (
                  <button
                    onClick={() => setActiveTab("ADMIN")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "ADMIN"
                        ? "bg-emerald-800 text-amber-300 shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-100/60"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> {t("nav.admin")}
                  </button>
                )}
              </nav>
            )}

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Real-time Online Indicator Button */}
              <button
                onClick={toggleOnlineStatus}
                title="Mudar estado Online / Offline"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  currentUser.online
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentUser.online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span className="hidden sm:inline">
                  {currentUser.online ? `🟢 ${t("header.online")}` : `⚪ ${t("header.offline")}`}
                </span>
              </button>

              {/* Guided Tour Button */}
              {onOpenTour && (
                <button
                  onClick={onOpenTour}
                  title="Abrir Guia de Utilização"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">{t("nav.guide")}</span>
                </button>
              )}

              {/* AgroMoz Wallet Button - Exclusivo para Agricultores, Transportadores e Admins */}
              {currentUser?.role !== "BUYER" && (
                <button
                  onClick={onOpenWallet}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 rounded-xl text-xs font-semibold transition-all"
                >
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">{t("nav.wallet")}</span>
                </button>
              )}

              {/* CHAT DIRECT BUTTON */}
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all relative"
                  title="Abrir Mensagens e Conversas"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-700" />
                </button>
              )}

              {/* NOTIFICATIONS BELL BUTTON & DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all relative"
                  title="Alertas e Notificações em Tempo Real"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-full border-2 border-white min-w-[18px] text-center shadow-xs animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-emerald-100 p-4 z-50">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                          Alertas & Notificações
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Lidas
                          </button>
                        )}
                        {myNotifications.length > 0 && (
                          <button
                            onClick={clearNotifications}
                            className="text-[11px] text-slate-400 hover:text-rose-600 font-medium"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PERMISSION PROMPT CARD IN DROPDOWN */}
                    {notificationPermission !== "granted" && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                            <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
                            <span>Ativar Notificações Push</span>
                          </div>
                          <p className="text-[10px] text-slate-600">
                            Receba alertas sonoros e no ambiente de trabalho sobre novos pedidos e mensagens.
                          </p>
                        </div>
                        <button
                          onClick={requestNotificationPermission}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shrink-0 shadow-xs transition-all active:scale-95"
                        >
                          Permitir
                        </button>
                      </div>
                    )}

                    {notificationPermission === "granted" && (
                      <div className="mb-2 px-2 py-1 bg-emerald-100/60 rounded-xl flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        <span>Notificações Push ativas no navegador</span>
                      </div>
                    )}

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {myNotifications.length === 0 ? (
                        <div className="py-6 text-center space-y-1">
                          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-500">
                            Sem notificações de momento.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Receberá alertas aqui quando houver vendas, mensagens ou entregas.
                          </p>
                        </div>
                      ) : (
                        myNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-3 rounded-2xl text-xs transition-all cursor-pointer border ${
                              !n.read
                                ? "bg-emerald-50/80 border-emerald-200 text-slate-900 font-medium shadow-2xs"
                                : "bg-slate-50/60 border-slate-100 text-slate-600 opacity-90"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                                  n.type === "ORDER"
                                    ? "bg-amber-100 text-amber-900"
                                    : n.type === "MESSAGE"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-slate-200 text-slate-800"
                                }`}
                              >
                                {n.type === "ORDER" ? (
                                  <Package className="w-4 h-4" />
                                ) : n.type === "MESSAGE" ? (
                                  <MessageSquare className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-slate-900 truncate">
                                    {n.title}
                                  </h5>
                                  {!n.read && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                                  )}
                                </div>
                                <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* CENTRAL FCM PUSH BUTTON */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowNotifs(false);
                          setShowFcmModal(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-emerald-900 to-amber-900 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm hover:from-emerald-800 hover:to-amber-800 transition-all"
                      >
                        <BellRing className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>Central FCM Push & Testes de Alerta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Avatar & Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-emerald-50 transition-all border border-slate-200 hover:border-emerald-300"
                >
                  <img
                    src={
                      currentUser.photoUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                    }
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-emerald-600"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {currentUser.role === "FARMER"
                        ? "🌾 Agricultor"
                        : currentUser.role === "BUYER"
                        ? "🛒 Comprador"
                        : currentUser.role === "DRIVER"
                        ? "🚚 Entregador"
                        : "⚙️ Admin"}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {/* Profile Menu Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Sessão Ativa
                      </span>
                      <button
                        onClick={() => setShowProfileMenu(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 cursor-pointer" onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenProfile) onOpenProfile();
                      }}>
                        <img
                          src={
                            currentUser.photoUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                          }
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 hover:brightness-90 transition-all"
                        />
                        <span className="absolute bottom-0 right-0 p-1 bg-amber-500 text-slate-950 rounded-full border border-white shadow-xs">
                          <Camera className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">
                          {currentUser.name}
                        </h4>
                        <p className="text-xs text-emerald-700 font-bold">{currentUser.phone}</p>
                        {currentUser.province && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            {currentUser.district ? `${currentUser.district}, ` : ""}
                            {currentUser.province}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-slate-100">
                      {/* Language Selection in Profile Menu */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          {t("lang.selectLanguage")}
                        </span>
                        <LanguageToggle variant="compact" />
                      </div>

                      {onOpenProfile && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onOpenProfile();
                          }}
                          className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-200 transition-all"
                        >
                          <User className="w-4 h-4 text-emerald-700" />
                          <span>{t("nav.editProfile")}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logoutUser();
                        }}
                        className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Terminar Sessão</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DIRECT PROMINENT "TERMINAR SESSÃO" BUTTON ON HEADER */}
              <button
                onClick={logoutUser}
                title="Terminar Sessão / Sair da Conta"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Terminar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FCM NOTIFICATION PUSH CENTRAL MODAL */}
      <FcmNotificationModal
        isOpen={showFcmModal}
        onClose={() => setShowFcmModal(false)}
        onOpenChat={onOpenChat}
      />
    </>
  );
};

