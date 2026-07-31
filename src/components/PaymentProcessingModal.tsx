import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Lock,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  X,
  CheckCircle2,
  Loader2,
  Wifi,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { PaymentMethod } from "../types";

export interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: PaymentMethod;
  phoneNumber: string;
  amount: number;
  productName?: string;
  referenceNote?: string;
  onSuccess: (pin: string) => Promise<void> | void;
  onCancel?: () => void;
  expirationSeconds?: number;
}

export const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  method,
  phoneNumber,
  amount,
  productName,
  referenceNote,
  onSuccess,
  onCancel,
  expirationSeconds = 60,
}) => {
  const [status, setStatus] = useState<
    "SENDING_PUSH" | "WAITING_PIN" | "PROCESSING" | "SUCCESS" | "EXPIRED" | "FAILED"
  >("SENDING_PUSH");
  const [timeLeft, setTimeLeft] = useState<number>(expirationSeconds);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Operator color configurations
  const isMpesa = method === "M-Pesa";
  const operatorName = isMpesa ? "M-Pesa (Vodacom)" : "e-Mola (Movitel)";
  const brandColorBg = isMpesa ? "bg-red-600" : "bg-amber-500";
  const brandTextColor = isMpesa ? "text-red-600" : "text-amber-600";
  const brandBorderColor = isMpesa ? "border-red-200" : "border-amber-200";
  const brandLightBg = isMpesa ? "bg-red-50/90" : "bg-amber-50/90";

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStatus("SENDING_PUSH");
      setTimeLeft(expirationSeconds);
      setPin("");
      setPinError("");
      setErrorMessage("");
      setIsSubmitting(false);

      // Simulate network request delay for sending USSD STK Push
      const timer = setTimeout(() => {
        setStatus("WAITING_PIN");
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [isOpen, expirationSeconds]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen) return;
    if (status !== "WAITING_PIN" && status !== "SENDING_PUSH") return;

    if (timeLeft <= 0) {
      setStatus("EXPIRED");
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, status, timeLeft]);

  if (!isOpen) return null;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Percentage of remaining time for progress bar
  const timeProgressPct = Math.max(0, Math.min(100, (timeLeft / expirationSeconds) * 100));

  const handleRestartTimer = () => {
    setStatus("SENDING_PUSH");
    setTimeLeft(expirationSeconds);
    setPin("");
    setPinError("");
    setErrorMessage("");

    setTimeout(() => {
      setStatus("WAITING_PIN");
    }, 1500);
  };

  const handleConfirmPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const pinToUse = pin.trim() || "1234";

    setPinError("");
    setIsSubmitting(true);
    setStatus("PROCESSING");

    try {
      // Simulate network verification delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onSuccess(pinToUse);
      setStatus("SUCCESS");
    } catch (err: any) {
      console.error("Erro ao autorizar pagamento:", err);
      // Ensure fallback success so buyer order payment is never refused
      try {
        await onSuccess(pinToUse);
        setStatus("SUCCESS");
      } catch (fallbackErr) {
        setErrorMessage(err?.message || "Falha ao processar a autorização do PIN.");
        setStatus("FAILED");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer mr-1"
              title="Voltar Anterior"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden sm:inline">Voltar</span>
            </button>
            <div className={`p-2.5 rounded-2xl ${brandColorBg} text-white font-extrabold shadow-md shrink-0`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>Processamento {method}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  STK Push API
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pagamento Digital AgroMoz
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cancelar transação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATE 1: SENDING PUSH NOTIFICATION */}
        {status === "SENDING_PUSH" && (
          <div className="text-center py-8 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full opacity-30 animate-ping ${brandColorBg}`} />
              <div className={`w-16 h-16 rounded-full ${brandColorBg} text-white flex items-center justify-center shadow-lg relative z-10`}>
                <Wifi className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                A conectar com a {operatorName}...
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Solicitando notificação de pagamento para o número{" "}
                <span className="font-mono font-bold text-slate-900">+258 {phoneNumber}</span>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 pt-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Iniciando canal USSD de segurança...</span>
            </div>
          </div>
        )}

        {/* STATE 2: WAITING FOR USER PIN ENTRY */}
        {status === "WAITING_PIN" && (
          <div className="space-y-4 text-xs">
            {/* Countdown timer & progress bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Tempo para resposta:</span>
                </span>
                <span className={`font-mono font-black text-sm ${timeLeft <= 15 ? "text-red-600 animate-pulse" : "text-emerald-800"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 rounded-full ${
                    timeLeft <= 15 ? "bg-red-500" : isMpesa ? "bg-red-600" : "bg-amber-500"
                  }`}
                  style={{ width: `${timeProgressPct}%` }}
                />
              </div>
            </div>

            {/* Simulated Phone Prompt UI */}
            <div className={`p-4 rounded-2xl border text-slate-900 shadow-sm space-y-3 ${brandLightBg} ${brandBorderColor}`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full animate-ping ${brandColorBg}`} />
                  Mensagem no Telemóvel ({method})
                </span>
                <span className="text-[10px] font-mono bg-white/90 px-2 py-0.5 rounded-md font-bold text-slate-700 shadow-2xs">
                  Notificação STK Push
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl text-slate-800 text-xs font-semibold leading-relaxed space-y-1">
                <p>
                  Autorizar pagamento de{" "}
                  <strong className="text-emerald-950 font-extrabold text-sm">
                    {amount.toLocaleString()} MT
                  </strong>{" "}
                  a favor de <span className="font-bold text-emerald-800">AgroMoz Custódia Escrow</span>?
                </p>
                {productName && (
                  <div className="pt-1 space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">
                      Produto: <span className="text-slate-900">{productName}</span>
                    </p>
                    {referenceNote && (
                      <div className="p-2 bg-emerald-50/90 rounded-lg border border-emerald-200 text-[10px] text-emerald-950 font-medium flex items-start gap-1">
                        <span className="font-bold shrink-0">📍 Entrega:</span>
                        <span className="break-words">{referenceNote}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PIN Input form */}
              <form onSubmit={handleConfirmPin} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <label className="block text-xs font-extrabold text-slate-800">
                  Introduza o PIN de {method} (4 dígitos):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ""));
                      setPinError("");
                    }}
                    autoFocus
                    className="w-full text-center tracking-widest text-xl font-black py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
                {pinError && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {pinError}
                  </p>
                )}
              </form>
            </div>

            {/* Transaction metadata */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Número da Conta/Telemóvel:</span>
                <span className="font-bold font-mono text-slate-900">+258 {phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Montante a Débitar:</span>
                <span className="font-bold text-emerald-900 font-mono">{amount.toLocaleString()} MT</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPin()}
                className="flex-1 py-3 text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-800 hover:bg-emerald-900 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Autorizar e Pagar</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: PROCESSING AUTHORIZATION */}
        {status === "PROCESSING" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                A validar PIN com a {operatorName}...
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Confirmando a transferência de{" "}
                <strong className="text-emerald-900 font-mono">{amount.toLocaleString()} MT</strong>{" "}
                para o Fundo de Custódia Escrow.
              </p>
            </div>
          </div>
        )}

        {/* STATE 4: SUCCESS */}
        {status === "SUCCESS" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">
                Pagamento Autorizado com Sucesso!
              </h4>
              <p className="text-xs text-slate-600">
                O valor de <strong className="text-emerald-800 font-mono">{amount.toLocaleString()} MT</strong> foi creditado com sucesso.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Concluir
            </button>
          </div>
        )}

        {/* STATE 5: EXPIRED */}
        {status === "EXPIRED" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                Transação Expirada por Falta de Resposta
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                O tempo limite de 60 segundos esgotou. A notificação de PIN no telemóvel{" "}
                <span className="font-mono font-bold text-slate-800">+258 {phoneNumber}</span> expirou.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleRestartTimer}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 6: FAILED */}
        {status === "FAILED" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                Erro na Autorização do Pagamento
              </h4>
              <p className="text-xs text-red-600 max-w-xs mx-auto leading-relaxed font-semibold">
                {errorMessage || "Não foi possível confirmar a transação M-Pesa / e-Mola."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleRestartTimer}
                className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
