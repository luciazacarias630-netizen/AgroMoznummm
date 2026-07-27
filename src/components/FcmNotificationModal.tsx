import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import {
  Bell,
  BellRing,
  X,
  CheckCheck,
  Trash2,
  Send,
  Package,
  MessageSquare,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Volume2,
  Sparkles,
  Smartphone,
  Truck,
  ShoppingBag,
  Sprout,
  Info,
} from "lucide-react";
import { AppNotification } from "../types";

interface FcmNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: () => void;
}

export const FcmNotificationModal: React.FC<FcmNotificationModalProps> = ({
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const {
    currentUser,
    appNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    notificationPermission,
    fcmToken,
    isFcmSupported,
    requestNotificationPermission,
    testFcmPushNotification,
  } = useAgro();

  const [activeTab, setActiveTab] = useState<"ALL" | "ORDER" | "MESSAGE" | "PAGAMENTO">("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "FARMER" | "BUYER" | "DRIVER">("ALL");
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Filter notifications
  const filteredNotifs = appNotifications.filter((n) => {
    // User check
    const isForMe = n.userId === "ALL" || n.userId === currentUser.id;
    if (!isForMe) return false;

    // Category filter
    if (activeTab === "ORDER" && n.type !== "ORDER") return false;
    if (activeTab === "MESSAGE" && n.type !== "MESSAGE") return false;
    if (activeTab === "PAGAMENTO" && n.category !== "PAGAMENTO") return false;

    // Role filter
    if (roleFilter !== "ALL" && n.targetRole && n.targetRole !== "ALL" && n.targetRole !== roleFilter) {
      return false;
    }

    return true;
  });

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-300/30">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Notificações Push FCM & Central de Alertas
                </h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Firebase Messaging
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Alertas em tempo real para Agricultores, Compradores e Transportadores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FCM STATUS & PERMISSION CARD */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl flex items-center justify-center ${
                  notificationPermission === "granted"
                    ? "bg-emerald-100 text-emerald-800"
                    : notificationPermission === "denied"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Estado do Serviço Push FCM:</span>
                  {notificationPermission === "granted" ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo & Conectado
                    </span>
                  ) : notificationPermission === "denied" ? (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Bloqueado no Navegador
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                      Pendente de Permissão
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  {notificationPermission === "granted"
                    ? "O seu dispositivo está registado para receber notificações nativas mesmo em segundo plano."
                    : "Ative a permissão do browser para ser alertado instantaneamente de encomendas e pagamentos M-Pesa."}
                </p>
              </div>
            </div>

            {notificationPermission !== "granted" && (
              <button
                onClick={requestNotificationPermission}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span>Ativar Notificações Push</span>
              </button>
            )}
          </div>

          {/* TOKEN DISPLAY & SIMULATOR BAR */}
          {fcmToken && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-emerald-950 text-emerald-100 p-2.5 rounded-xl font-mono border border-emerald-800">
              <div className="flex items-center gap-2 truncate max-w-md">
                <span className="text-amber-400 font-bold font-sans">FCM Token:</span>
                <span className="truncate text-slate-300 text-[10px]">{fcmToken}</span>
              </div>

              <button
                onClick={handleCopyToken}
                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-amber-300 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 shrink-0 transition-all"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copiar Token
                  </>
                )}
              </button>
            </div>
          )}

          {/* FCM SIMULATOR BUTTONS */}
          <div className="pt-1">
            <span className="text-[11px] font-extrabold text-slate-700 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Simular Notificação Push em Tempo Real (FCM Test Suite):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => testFcmPushNotification("AGRICULTOR")}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>Push Agricultor</span>
              </button>

              <button
                onClick={() => testFcmPushNotification("COMPRADOR")}
                className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>Push Comprador</span>
              </button>

              <button
                onClick={() => testFcmPushNotification("TRANSPORTADOR")}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Push Transportador</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS & FILTERS */}
        <div className="p-4 border-b border-slate-100 space-y-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "ALL" ? "bg-white text-slate-900 shadow-2xs font-black" : "hover:text-slate-900"
                }`}
              >
                Todas ({appNotifications.length})
              </button>
              <button
                onClick={() => setActiveTab("ORDER")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "ORDER" ? "bg-white text-emerald-800 shadow-2xs font-black" : "hover:text-slate-900"
                }`}
              >
                📦 Pedidos
              </button>
              <button
                onClick={() => setActiveTab("PAGAMENTO")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "PAGAMENTO" ? "bg-white text-amber-800 shadow-2xs font-black" : "hover:text-slate-900"
                }`}
              >
                💰 Pagamentos Escrow
              </button>
              <button
                onClick={() => setActiveTab("MESSAGE")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "MESSAGE" ? "bg-white text-indigo-800 shadow-2xs font-black" : "hover:text-slate-900"
                }`}
              >
                💬 Chat
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-extrabold flex items-center gap-1 px-2.5 py-1.5 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Ler Todas
              </button>
              <button
                onClick={clearNotifications}
                className="text-xs text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 px-2.5 py-1.5 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>
          </div>

          {/* Target Role Filters */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400">Filtrar por perfil:</span>
            <button
              onClick={() => setRoleFilter("ALL")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                roleFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setRoleFilter("FARMER")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                roleFilter === "FARMER" ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              🌾 Agricultores
            </button>
            <button
              onClick={() => setRoleFilter("BUYER")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                roleFilter === "BUYER" ? "bg-amber-800 text-white" : "bg-amber-50 text-amber-900 hover:bg-amber-100"
              }`}
            >
              🛒 Compradores
            </button>
            <button
              onClick={() => setRoleFilter("DRIVER")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                roleFilter === "DRIVER" ? "bg-indigo-800 text-white" : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
              }`}
            >
              🚚 Transportadores
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Sem Notificações Push</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Utilize os botões do simulador acima para disparar alertas FCM em tempo real para Agricultores, Compradores e Transportadores.
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  !n.read
                    ? "bg-amber-50/60 border-amber-200/90 shadow-2xs"
                    : "bg-white border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                {!n.read && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      n.category === "PAGAMENTO"
                        ? "bg-amber-100 text-amber-900"
                        : n.type === "ORDER"
                        ? "bg-emerald-100 text-emerald-800"
                        : n.type === "MESSAGE"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {n.category === "PAGAMENTO" ? (
                      <Wallet className="w-4 h-4" />
                    ) : n.type === "ORDER" ? (
                      <Package className="w-4 h-4" />
                    ) : n.type === "MESSAGE" ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">{n.title}</h4>
                      {n.targetRole && n.targetRole !== "ALL" && (
                        <span className="text-[9px] bg-slate-900 text-amber-300 font-extrabold px-1.5 py-0.2 rounded uppercase">
                          Target: {n.targetRole}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium ml-auto">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{n.message}</p>

                    {n.type === "MESSAGE" && onOpenChat && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onOpenChat();
                        }}
                        className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                      >
                        Abrir Mensagens <Send className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encriptação de Ponta-a-Ponta Firebase FCM</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
