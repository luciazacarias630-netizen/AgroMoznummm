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
  const { orders, releaseEscrowPayment, currentUser, reviews, addProductReview } = useAgro();
  const order = orders.find((o) => o.id === orderId);

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white max-w-xl w-full rounded-3xl p-6 shadow-2xl border border-emerald-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-amber-300 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Rastreamento em Tempo Real
              </h3>
              <span className="font-mono text-xs text-slate-400 font-bold">
                ID: {order.id}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER STATUS BAR */}
        <div className="py-6">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-10" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 -z-10 transition-all duration-500"
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
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isDone
                        ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/30"
                        : "bg-slate-100 text-slate-400 border border-slate-300"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-amber-300" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-2 max-w-[70px] text-center font-bold leading-tight ${
                      isCurrent ? "text-emerald-950 font-extrabold" : "text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* OPENSTREETMAP REAL-TIME GPS TRACKING MAP */}
        <div className="mb-4">
          <RealtimeGpsMap order={order} roleMode="BUYER" height="h-72" />
        </div>

        {/* Escrow Payment Info & Delivery Confirmation */}
        <div className="mt-4 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <span className="font-bold text-slate-900 block">Pagamento em Custódia AgroMoz</span>
                <span className="text-[10px] text-slate-500">
                  Subtotal: {order.subtotal || order.totalAmount} MT | Taxa AgroMoz (5%): -{order.platformFee || Math.round((order.subtotal || order.totalAmount) * 0.05)} MT
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-extrabold text-[10px] ${
                order.escrowStatus === "Liberado"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.escrowStatus === "Reembolsado"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}
            >
              {order.escrowStatus === "Liberado"
                ? "✅ Pago & Liberado"
                : order.escrowStatus === "Reembolsado"
                ? "❌ Reembolsado"
                : "⏳ Retido em Custódia"}
            </span>
          </div>

          {order.escrowStatus === "Pendente" && (currentUser?.role === "BUYER" || currentUser?.role === "ADMIN" || currentUser?.id === order.buyerId) && (
            <button
              onClick={() => releaseEscrowPayment(order.id, "Confirmado pelo Comprador")}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              Confirmar Recepção do Produto & Libertar {order.farmerNetAmount || Math.round((order.subtotal || order.totalAmount) * 0.95)} MT ao Agricultor
            </button>
          )}
        </div>

        {/* PRODUCT REVIEW & RATING SECTION AFTER DELIVERY CONFIRMATION */}
        {(order.escrowStatus === "Liberado" || order.deliveryStatus === "Entregue") && (
          <div className="mt-4 p-4 bg-amber-50/90 rounded-2xl border border-amber-200/90 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                Avaliação do Produto pelo Comprador
              </span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold">
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
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= current.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                        <span className="font-extrabold text-xs text-amber-900 ml-1">
                          {current.rating}.0 / 5
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-emerald-600" /> Avaliado
                      </span>
                    </div>
                    <p className="text-slate-700 italic text-[11px] font-medium">"{current.comment}"</p>
                    <p className="text-[10px] text-slate-400">
                      Publicado no Mercado da AgroMoz por <strong className="text-slate-700">{current.buyerName}</strong>
                    </p>
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
                  <p className="text-[11px] text-amber-900">
                    Sua encomenda foi entregue! Classifique a qualidade de <strong>{order.productName}</strong> para ajudar outros consumidores:
                  </p>

                  {/* STAR RATING SELECTOR */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 text-[11px]">Classificação:</span>
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
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                active ? "fill-amber-400 text-amber-500" : "text-slate-300 fill-slate-100"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-bold text-amber-900">
                      {selectedStars === 5
                        ? "Excelente ⭐⭐⭐⭐⭐"
                        : selectedStars === 4
                        ? "Muito Bom ⭐⭐⭐⭐"
                        : selectedStars === 3
                        ? "Bom ⭐⭐⭐"
                        : selectedStars === 2
                        ? "Razoável ⭐⭐"
                        : "Péssimo ⭐"}
                    </span>
                  </div>

                  {/* COMMENT INPUT */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escreva a sua opinião sobre a frescura, tamanho ou atendimento..."
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publicar Avaliação no Mercado</span>
                  </button>
                </form>
              );
            })()}
          </div>
        )}

        {/* Driver Details */}
        {order.driverName && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{order.driverName}</h4>
                <p className="text-[11px] text-slate-500">Entregador Autorizado AgroMoz</p>
              </div>
            </div>

            <a
              href={`tel:${order.driverPhone}`}
              className="px-3 py-2 bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" /> Ligar
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
