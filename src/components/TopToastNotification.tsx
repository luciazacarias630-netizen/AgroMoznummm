import React, { useEffect, useState } from "react";
import { useAgro } from "../context/AgroContext";
import {
  Truck,
  CheckCircle2,
  Package,
  Wallet,
  MessageSquare,
  BellRing,
  X,
  MapPin,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { fcmService } from "../services/fcmService";

interface TopToastNotificationProps {
  onOpenTrackingModal?: (orderId: string) => void;
  onOpenWallet?: () => void;
  onOpenChat?: () => void;
}

export const TopToastNotification: React.FC<TopToastNotificationProps> = ({
  onOpenTrackingModal,
  onOpenWallet,
  onOpenChat,
}) => {
  const { activePushToast, dismissPushToast, currentUser } = useAgro();
  const [progress, setProgress] = useState(100);

  // Play sound & handle 6s countdown progress bar when activePushToast changes
  useEffect(() => {
    if (!activePushToast) {
      setProgress(100);
      return;
    }

    // Play chime sound
    fcmService.playNotificationChime();

    setProgress(100);
    const startTime = Date.now();
    const duration = 6000; // 6 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activePushToast?.id]);

  if (!activePushToast) return null;

  // Determine toast style & badge based on title / category / message
  const isEmTransito =
    activePushToast.title.includes("Trânsito") ||
    activePushToast.message.includes("Em Trânsito") ||
    activePushToast.message.includes("a caminho");

  const isPedidoAceite =
    activePushToast.title.includes("Aceite") ||
    activePushToast.message.includes("aceitou") ||
    activePushToast.title.includes("Atribuído");

  const isEntregue =
    activePushToast.title.includes("Entregue") ||
    activePushToast.title.includes("Concluída") ||
    activePushToast.message.includes("entregue");

  const isPagamento =
    activePushToast.category === "PAGAMENTO" ||
    activePushToast.title.includes("M-Pesa") ||
    activePushToast.title.includes("e-Mola") ||
    activePushToast.title.includes("Custódia");

  const isMensagem =
    activePushToast.type === "MESSAGE" ||
    activePushToast.category === "CHAT";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg pointer-events-auto animate-bounce-short">
      <div
        className={`relative overflow-hidden rounded-3xl shadow-2xl border-2 backdrop-blur-md transition-all ${
          isEmTransito
            ? "bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 text-white border-amber-400 ring-4 ring-amber-500/20"
            : isEntregue
            ? "bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-white border-emerald-400 ring-4 ring-emerald-500/20"
            : isPagamento
            ? "bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-white border-amber-300 ring-4 ring-amber-400/20"
            : isPedidoAceite
            ? "bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-blue-400 ring-4 ring-blue-500/20"
            : "bg-slate-900 text-white border-emerald-500 ring-4 ring-emerald-500/20"
        }`}
      >
        <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
          {/* ICON & BADGE */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-3 rounded-2xl shrink-0 mt-0.5 border shadow-inner ${
                isEmTransito
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  : isEntregue
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : isPagamento
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                  : isPedidoAceite
                  ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
              }`}
            >
              {isEmTransito ? (
                <Truck className="w-6 h-6 text-amber-300 animate-bounce" />
              ) : isEntregue ? (
                <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
              ) : isPagamento ? (
                <Wallet className="w-6 h-6 text-amber-300 animate-pulse" />
              ) : isMensagem ? (
                <MessageSquare className="w-6 h-6 text-emerald-300" />
              ) : isPedidoAceite ? (
                <CheckCircle2 className="w-6 h-6 text-blue-300" />
              ) : (
                <BellRing className="w-6 h-6 text-amber-300 animate-pulse" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isEmTransito
                      ? "bg-amber-400 text-slate-950 border-amber-300"
                      : isEntregue
                      ? "bg-emerald-400 text-slate-950 border-emerald-300"
                      : isPagamento
                      ? "bg-amber-300 text-slate-950 border-amber-200"
                      : isPedidoAceite
                      ? "bg-blue-400 text-slate-950 border-blue-300"
                      : "bg-emerald-400 text-slate-950 border-emerald-300"
                  }`}
                >
                  {isEmTransito
                    ? "🚚 EM TRÂNSITO (GPS)"
                    : isEntregue
                    ? "✅ ENTREGA CONCLUÍDA"
                    : isPedidoAceite
                    ? "👍 PEDIDO ACEITO"
                    : isPagamento
                    ? "💸 M-PESA / E-MOLA"
                    : "🔔 AGROMOZ NOTIFICAÇÃO"}
                </span>

                {activePushToast.relatedId && (
                  <span className="text-[10px] text-slate-300 font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                    #{activePushToast.relatedId}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-extrabold text-white leading-tight">
                {activePushToast.title}
              </h4>

              <p className="text-xs text-slate-200 leading-snug font-medium">
                {activePushToast.message}
              </p>

              {/* DIRECT ACTION BUTTONS BASED ON NOTIFICATION */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {activePushToast.relatedId && onOpenTrackingModal && (
                  <button
                    onClick={() => {
                      dismissPushToast();
                      if (activePushToast.relatedId) {
                        onOpenTrackingModal(activePushToast.relatedId);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-950" />
                    <span>Rastrear GPS em Tempo Real</span>
                  </button>
                )}

                {isPagamento && currentUser?.role !== "BUYER" && onOpenWallet && (
                  <button
                    onClick={() => {
                      dismissPushToast();
                      onOpenWallet();
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-slate-950" />
                    <span>Ver Carteira M-Pesa</span>
                  </button>
                )}

                {isMensagem && onOpenChat && (
                  <button
                    onClick={() => {
                      dismissPushToast();
                      onOpenChat();
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                    <span>Responder no Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={dismissPushToast}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all shrink-0 cursor-pointer"
            title="Fechar notificação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AUTOMATIC PROGRESS BAR COUNTDOWN */}
        <div className="w-full bg-white/10 h-1.5">
          <div
            className={`h-full transition-all duration-75 ${
              isEmTransito
                ? "bg-amber-400"
                : isEntregue
                ? "bg-emerald-400"
                : isPagamento
                ? "bg-amber-300"
                : "bg-emerald-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
