import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import {
  BellRing,
  Smartphone,
  CheckCircle2,
  X,
  AlertCircle,
  ShieldCheck,
  Volume2,
  Sparkles,
} from "lucide-react";
import { fcmService } from "../services/fcmService";

export const DevicePermissionPrompt: React.FC = () => {
  const {
    notificationPermission,
    requestNotificationPermission,
    pushNotification,
  } = useAgro();

  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // If already granted, denied, or dismissed in this session, don't show the initial prompt card
  if (notificationPermission !== "default" || dismissed) {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        // Trigger native device notification
        fcmService.triggerFcmPush({
          title: "🟢 AgroMoz — Notificações Ativadas!",
          body: "As notificações do seu dispositivo foram configuradas com sucesso. Receberá alertas em tempo real sobre encomendas, GPS e pagamentos.",
          category: "SISTEMA",
        });

        // Trigger in-app toast
        pushNotification({
          title: "🔔 Permissão do Dispositivo Concedida!",
          message: "Todas as notificações da AgroMoz (mudanças de estado de pedidos, entregas e M-Pesa) serão entregues neste dispositivo.",
          type: "SYSTEM",
          category: "SISTEMA",
        });
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-4 border-b border-emerald-700/80 shadow-md relative z-30 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* ICON & TEXT */}
        <div className="flex items-start gap-3">
          <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shrink-0 shadow-md border border-amber-300">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                Permissão do Dispositivo
              </span>
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> AgroMoz Push System
              </span>
            </div>

            <h3 className="text-sm font-extrabold text-white">
              Permitir Notificações do Dispositivo instalado para a AgroMoz
            </h3>

            <p className="text-xs text-slate-200 max-w-3xl leading-relaxed">
              Receba alertas instantâneos no ecrã do seu telemóvel ou computador quando os seus pedidos mudarem de estado (ex: <strong>'Pedido Aceite'</strong>, <strong>'Em Trânsito'</strong>, <strong>'Entregue'</strong>) e quando receber pagamentos M-Pesa / e-Mola.
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={() => setDismissed(true)}
            className="px-3.5 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Agora Não
          </button>

          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <BellRing className="w-4 h-4 text-slate-950" />
            <span>{isRequesting ? "A Solicitar Permissão..." : "Ativar Notificações do Dispositivo"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
