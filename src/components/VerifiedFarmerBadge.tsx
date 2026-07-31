import React from "react";
import { CheckCircle2, ShieldCheck, BadgeCheck, XCircle, AlertCircle } from "lucide-react";

interface VerifiedFarmerBadgeProps {
  isVerified?: boolean;
  status?: "Nao_Enviado" | "Pendente" | "Aprovado" | "Recusado";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showIfNotVerified?: boolean;
  className?: string;
  customText?: string;
}

export const VerifiedFarmerBadge: React.FC<VerifiedFarmerBadgeProps> = ({
  isVerified = false,
  status,
  size = "md",
  showText = true,
  showIfNotVerified = false,
  className = "",
  customText,
}) => {
  const isApproved = isVerified || status === "Aprovado";
  const isRejected = status === "Recusado";

  // If not approved and not explicitly asked to show non-verified, return null unless showIfNotVerified or isRejected is true
  if (!isApproved && !showIfNotVerified && !isRejected) {
    return null;
  }

  // RED BADGE (Non-Verified or Rejected)
  if (!isApproved) {
    if (size === "sm") {
      return (
        <span
          className={`inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs ${className}`}
          title={isRejected ? "Conta Recusada (B.I ou Menor de 18 Anos)" : "Não Verificado"}
        >
          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          {showText && <span>{customText || (isRejected ? "Recusado (-18)" : "Não Verificado")}</span>}
        </span>
      );
    }

    if (size === "lg") {
      return (
        <div
          className={`inline-flex items-center gap-2 bg-gradient-to-r from-red-800 to-red-700 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-md border border-red-500 ${className}`}
        >
          <div className="w-5 h-5 bg-white text-red-700 rounded-full flex items-center justify-center shrink-0 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-red-700" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[11px] font-black text-red-200 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-200" />
              {customText || (isRejected ? "Conta Recusada" : "Não Verificado")}
            </span>
            <span className="text-[9.5px] font-bold text-red-100">
              {isRejected ? "Requisitos de Idade (18+) Não Cumpridos" : "B.I Não Validado"}
            </span>
          </div>
        </div>
      );
    }

    // Default Medium size RED badge
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-red-50 text-red-900 border border-red-200 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-2xs ${className}`}
        title={isRejected ? "Verificação Recusada (Idade < 18)" : "Não Verificado"}
      >
        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
        {showText && <span>{customText || (isRejected ? "Não Aprovado (Menor de 18)" : "Não Verificado")}</span>}
      </span>
    );
  }

  // GREEN BADGE (Verified / Approved)
  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs ${className}`}
        title="Agricultor Verificado (B.I & Idade 18+ Confirmados)"
      >
        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
        {showText && <span>{customText || "Verificado"}</span>}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-md border border-emerald-500 ${className}`}
      >
        <div className="w-5 h-5 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shrink-0 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            {customText || "Agricultor Verificado"}
          </span>
          <span className="text-[9.5px] font-bold text-emerald-100">
            B.I & Idade (18+ Anos) Confirmados
          </span>
        </div>
      </div>
    );
  }

  // Default Medium size GREEN badge
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-2xs ${className}`}
      title="Identidade Validada (B.I Frente e Verso • Maior de 18 Anos)"
    >
      <BadgeCheck className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
      {showText && <span>{customText || "Agricultor Verificado"}</span>}
    </span>
  );
};

