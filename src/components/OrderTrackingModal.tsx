import React, { useEffect, useState } from "react";
import { useAgro } from "../context/AgroContext";
import { DeliveryStatus } from "../types";
import { RealtimeGpsMap } from "./RealtimeGpsMap";
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  ShieldCheck,
  Zap,
  Star,
  MessageSquare,
  Send,
  Sparkles,
  ThumbsUp,
} from "lucide-react";

interface OrderTrackingModalProps {
  orderId: string;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ orderId, onClose }) => {
  const {
    orders,
    proposals,
    acceptDeliveryProposal,
    confirmReceiptByBuyer,
    releaseEscrowPayment,
    currentUser,
    reviews,
    addProductReview,
  } = useAgro();
  const order = orders.find((o) => o.id === orderId);

  // Proposals for this order
  const orderProposals = proposals.filter((p) => p.transacaoId === orderId);

  // Simulated GPS movement of driver on map
  const [driverPos, setDriverPos] = useState({ lat: -25.80, lng: 32.60 });

  // Product Review form state
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDriverPos((prev) => ({
        lat: prev.lat - 0.002,
        lng: prev.lng - 0.001,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!order) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center">
          <p className="text-xs text-slate-600">Encomenda não encontrada.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const steps: DeliveryStatus[] = [
    "Pedido recebido",
    "Preparando encomenda",
    "Entregador a caminho",
    "Entregue",
  ];

  const currentStepIdx = steps.indexOf(order.deliveryStatus);

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 flex flex-col p-0 m-0 overflow-hidden text-slate-100 animate-fade-in">
      {/* FULLSCREEN HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 px-5 flex items-center justify-between border-b border-emerald-900/60 shadow-lg shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-emerald-700 text-amber-300 shadow-md">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                Rastreamento GPS em Ecrã Inteiro
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-extrabold uppercase">
                Ao Vivo (100% Ecrã)
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400 font-bold block">
              Encomenda #{order.id} &bull; {order.productName}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Fechar GPS</span>
        </button>
      </div>

      {/* FULLSCREEN MAIN MAP CONTENT AREA */}
      <div className="relative flex-1 w-full h-full bg-slate-900 overflow-hidden flex flex-col md:flex-row">
        
        {/* GPS MAP - TAKES FULL SCREEN AREA */}
        <div className="flex-1 w-full h-full relative z-0">
          <RealtimeGpsMap order={order} roleMode="BUYER" height="h-full min-h-[60vh] md:min-h-full" />
        </div>

        {/* OVERLAY FLOATING / SIDE PANEL FOR ORDER DETAILS & STEPPER */}
        <div className="w-full md:w-96 bg-slate-900/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-800 p-4 md:p-5 overflow-y-auto max-h-[45vh] md:max-h-full shrink-0 z-10 text-slate-100 space-y-4 shadow-2xl">
          
          {/* STEPPER STATUS BAR */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">
              Estado da Entrega
            </span>

            <div className="flex items-center justify-between relative px-1 py-1">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -translate-y-1/2 -z-10" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 -z-10 transition-all duration-500"
                style={{
                  width: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
                }}
              />

              {steps.map((step, idx) => {
                const isDone = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                        isDone
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black"
                          : "bg-slate-700 text-slate-400 border border-slate-600"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] mt-1.5 max-w-[60px] text-center font-bold leading-tight ${
                        isCurrent ? "text-amber-300 font-extrabold" : "text-slate-400"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PROPOSTAS DE FRETE RECEBIDAS DOS TRANSPORTADORES */}
          {orderProposals.length > 0 && (
            <div className="bg-amber-950/60 p-3.5 rounded-2xl border border-amber-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-400" />
                  Propostas de Transporte ({orderProposals.length})
                </span>
                <span className="text-[10px] text-amber-200 bg-amber-900/60 px-2 py-0.5 rounded-full font-bold">
                  Escolha do Comprador
                </span>
              </div>

              <div className="space-y-2">
                {orderProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3 bg-slate-800/90 rounded-xl border border-amber-700/50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-extrabold text-white text-xs">{prop.driverName || "Motorista AgroMoz"}</h5>
                        <p className="text-[10px] text-slate-400">{prop.vehicleType} &bull; Tel: {prop.driverPhone}</p>
                        <p className="text-[10px] text-amber-300 mt-0.5">{prop.tempoEstimado}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-amber-400 text-sm block">{prop.valorProposto} MT</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            prop.estado === "aceite"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : prop.estado === "rejeitada"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {prop.estado === "aceite"
                            ? "ACEITE ✅"
                            : prop.estado === "rejeitada"
                            ? "REJEITADA"
                            : "PENDENTE"}
                        </span>
                      </div>
                    </div>

                    {prop.mensagem && (
                      <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                        "{prop.mensagem}"
                      </p>
                    )}

                    {prop.estado === "pendente" && (
                      <button
                        onClick={() => acceptDeliveryProposal(order.id, prop.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                        Aceitar esta Proposta ({prop.valorProposto} MT)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Driver Details */}
          {order.driverName && (
            <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-900/80 text-emerald-300 flex items-center justify-center font-bold border border-emerald-700/50">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{order.driverName}</h4>
                  <p className="text-[10px] text-slate-400">Entregador Autorizado AgroMoz</p>
                </div>
              </div>

              <a
                href={`tel:${order.driverPhone}`}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs text-xs"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" /> Ligar
              </a>
            </div>
          )}

          {/* Escrow Payment Info & Double Confirmation Workflow */}
          <div className="p-3.5 bg-emerald-950/60 rounded-2xl border border-emerald-800/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Custódia AgroMoz (Dupla Confirmação)</span>
                  <span className="text-[10px] text-slate-300">
                    Produto: {order.subtotal || order.valorProduto} MT • Frete: {order.deliveryFee || order.valorTransporte || 0} MT
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                  order.escrowStatus === "Liberado" || order.estado === "concluido"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : order.escrowStatus === "Reembolsado"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {order.escrowStatus === "Liberado" || order.estado === "concluido"
                  ? "✅ Pagamentos Liberados"
                  : order.escrowStatus === "Reembolsado"
                  ? "❌ Reembolsado"
                  : "⏳ Retido na Conta Custódia"}
              </span>
            </div>

            {/* STATUS DAS 2 CONFIRMAÇÕES */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px]">
              <div className="space-y-0.5">
                <span className="text-slate-400 block text-[10px]">1. Transportador:</span>
                <span
                  className={`font-extrabold block ${
                    order.transportadorConfirmouEm
                      ? "text-emerald-400"
                      : "text-amber-400 italic"
                  }`}
                >
                  {order.transportadorConfirmouEm
                    ? "✓ Entregou o produto"
                    : "⏳ Em transporte..."}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 block text-[10px]">2. Comprador:</span>
                <span
                  className={`font-extrabold block ${
                    order.compradorConfirmouEm || order.escrowStatus === "Liberado"
                      ? "text-emerald-400"
                      : "text-amber-400 italic"
                  }`}
                >
                  {order.compradorConfirmouEm || order.escrowStatus === "Liberado"
                    ? "✓ Confirmou recebimento"
                    : "⏳ Aguardando confirmação"}
                </span>
              </div>
            </div>

            {/* AVISO QUANDO O TRANSPORTADOR JÁ CONFIRMOU A ENTREGA */}
            {order.estado === "entrega_confirmada_transportador" && order.escrowStatus === "Pendente" && (
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-300">
                  <Truck className="w-4 h-4 text-amber-400" />
                  O Transportador confirmou que entregou a encomenda!
                </p>
                <p className="text-[11px] text-amber-200/90">
                  Por favor, confirme se recebeu o produto em boas condições para autorizar a libertação imediata dos pagamentos ao vendedor e ao transportador.
                </p>
              </div>
            )}

            {/* BOTÃO DE CONFIRMAÇÃO DO COMPRADOR */}
            {order.escrowStatus === "Pendente" && (currentUser?.role === "BUYER" || currentUser?.role === "ADMIN" || currentUser?.id === order.buyerId) && (
              <button
                onClick={() => confirmReceiptByBuyer(order.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-xs cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                Confirmar Recebimento do Produto & Libertar Pagamentos (Dupla Confirmação)
              </button>
            )}
          </div>

          {/* PRODUCT REVIEW & RATING SECTION AFTER DELIVERY CONFIRMATION */}
          {(order.escrowStatus === "Liberado" || order.deliveryStatus === "Entregue") && (
            <div className="p-3.5 bg-amber-950/40 rounded-2xl border border-amber-800/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Avaliar Produto
                </span>
                <span className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full font-bold">
                  Mercado Público
                </span>
              </div>

              {(() => {
                const existing = reviews.find((r) => r.orderId === order.id);
                if (existing || reviewSuccess) {
                  const current = existing || {
                    rating: selectedStars,
                    comment: reviewComment || "Produto de excelente qualidade!",
                    buyerName: currentUser?.name || "Comprador Verificado",
                    createdAt: new Date().toISOString(),
                  };
                  return (
                    <div className="p-3 bg-slate-800/90 rounded-xl border border-amber-700/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= current.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                              }`}
                            />
                          ))}
                          <span className="font-extrabold text-xs text-amber-300 ml-1">
                            {current.rating}.0 / 5
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-300 font-bold bg-emerald-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-emerald-400" /> Avaliado
                        </span>
                      </div>
                      <p className="text-slate-300 italic text-[11px]">"{current.comment}"</p>
                    </div>
                  );
                }

                return (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!order) return;
                      addProductReview({
                        productId: order.productId,
                        orderId: order.id,
                        rating: selectedStars,
                        comment: reviewComment || "Produto de excelente qualidade!",
                      });
                      setReviewSuccess(true);
                    }}
                    className="space-y-3 pt-1"
                  >
                    <p className="text-[11px] text-amber-200">
                      Sua encomenda foi entregue! Classifique <strong>{order.productName}</strong>:
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = hoverStars ? star <= hoverStars : star <= selectedStars;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverStars(star)}
                              onMouseLeave={() => setHoverStars(0)}
                              onClick={() => setSelectedStars(star)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-4 h-4 transition-colors ${
                                  active ? "fill-amber-400 text-amber-400" : "text-slate-600 fill-slate-800"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escreva a sua opinião sobre o produto..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs text-white placeholder-slate-400"
                    />

                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Avaliação</span>
                    </button>
                  </form>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
