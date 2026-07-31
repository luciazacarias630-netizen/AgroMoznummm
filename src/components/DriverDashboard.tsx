import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { RealtimeGpsMap } from "./RealtimeGpsMap";
import { Order } from "../types";
import {
  Truck,
  MapPin,
  CheckCircle2,
  Phone,
  Clock,
  Package,
  ShieldCheck,
  AlertCircle,
  Navigation,
  Sprout,
  Wallet,
  BellRing,
  Radio,
  ArrowRight,
  Power,
  RotateCcw,
} from "lucide-react";

export const DriverDashboard: React.FC = () => {
  const { currentUser, orders, assignDriverToOrder, updateOrderStatus, testFcmPushNotification } = useAgro();

  // State for GPS Toggle Switch (Interruptor de Estado do GPS)
  const [isGpsEnabled, setIsGpsEnabled] = useState<boolean>(true);

  // Completion modal state
  const [completedOrderModal, setCompletedOrderModal] = useState<{
    productName: string;
    orderId: string;
  } | null>(null);

  // Filter available orders needing delivery or assigned to this driver
  const availableDeliveries = orders.filter((o) => !o.driverId && o.deliveryStatus === "Pedido recebido");
  const myDeliveries = orders.filter((o) => o.driverId === currentUser?.id);
  const activeDeliveries = myDeliveries.filter((o) => o.deliveryStatus !== "Entregue");
  const completedDeliveries = myDeliveries.filter((o) => o.deliveryStatus === "Entregue");

  const handleAcceptTransport = (orderId: string) => {
    assignDriverToOrder(
      orderId,
      currentUser?.id || "driver-1",
      currentUser?.name || "Carlos Nhantumbo",
      currentUser?.phone || "875544332"
    );
    // Enable GPS when accepting a new transport
    setIsGpsEnabled(true);
  };

  const handleCompleteAndRedirect = (ord: Order) => {
    // 1. Mark order as "Entregue" (this releases driver fee +150 MT to wallet)
    updateOrderStatus(ord.id, "Entregue");

    // 2. Deactivate GPS toggle switch (encerrar o seguimento da rota após a entrega finalizada)
    setIsGpsEnabled(false);

    // 3. Open notification modal confirming GPS deactivation and wallet credit
    setCompletedOrderModal({
      productName: ord.productName,
      orderId: ord.id,
    });

    // 4. Smooth scroll to top of main dashboard panel so driver can accept next order
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (
    currentUser?.role !== "DRIVER" &&
    currentUser?.role !== "ADMIN" &&
    currentUser?.role !== "FARMER"
  ) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 max-w-lg mx-auto my-12">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 text-base">Acesso Restrito ao Módulo do Transportador</h3>
        <p className="text-xs text-slate-500 mt-1">
          Esta área é reservada exclusivamente para motoristas e transportadores registados na AgroMoz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-md shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Portal Exclusivo do Transportador</h1>
            <p className="text-xs text-slate-500">
              Visualize encomendas disponíveis com localização exata no GPS e rota de recolha/entrega.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* INTERRUPTOR DE ESTADO (TOGGLE) DO GPS */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 px-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Radio
                className={`w-4 h-4 ${
                  isGpsEnabled && activeDeliveries.length > 0
                    ? "text-emerald-600 animate-pulse"
                    : "text-slate-400"
                }`}
              />
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">
                  Sinal GPS:
                </span>
                <span
                  className={`text-xs font-black ${
                    isGpsEnabled ? "text-emerald-800" : "text-slate-600"
                  }`}
                >
                  {isGpsEnabled ? "🟢 LIGADO" : "🔴 DESATIVADO"}
                </span>
              </div>
            </div>

            {/* TOGGLE SWITCH BUTTON */}
            <button
              type="button"
              onClick={() => setIsGpsEnabled((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isGpsEnabled ? "bg-emerald-600" : "bg-slate-300"
              }`}
              role="switch"
              aria-checked={isGpsEnabled}
              title={
                isGpsEnabled
                  ? "Clique para Desativar o GPS e Encerrar o Seguimento da Rota"
                  : "Clique para Ativar o GPS de Rastreamento"
              }
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isGpsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {activeDeliveries.length > 0 ? (
            <div
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 border ${
                isGpsEnabled
                  ? "bg-amber-100 border-amber-300 text-amber-950 animate-pulse"
                  : "bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              <Radio className="w-4 h-4 text-amber-600" />
              <span>
                🚚 Em Rota ({activeDeliveries.length}) — GPS {isGpsEnabled ? "Ativo" : "Desativado"}
              </span>
            </div>
          ) : (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>🟢 Status: Livre / Disponível (GPS Desligado)</span>
            </div>
          )}

          {currentUser?.vehicleType && (
            <div className="bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 text-xs">
              <span className="text-slate-500">Veículo:</span>{" "}
              <strong className="text-emerald-900 font-bold">{currentUser.vehicleType}</strong> (
              {currentUser.licensePlate || "Matrícula Ativa"})
            </div>
          )}

          <button
            onClick={() => testFcmPushNotification("TRANSPORTADOR")}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all border border-emerald-700/80 active:scale-95"
            title="Testar Notificação Toast de Pagamento e-Mola / M-Pesa"
          >
            <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Testar Toast e-Mola/M-Pesa</span>
          </button>
        </div>
      </div>

      {/* ENCOMENDAS DISPONÍVEIS COM GPS & LOCALIZAÇÃO EXATA */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-emerald-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Encomendas Disponíveis para Transporte ({availableDeliveries.length})
          </h2>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-extrabold text-xs">
            Frete Fixo: 150 MT / viagem
          </span>
        </div>

        {availableDeliveries.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold">Nenhuma encomenda pendente para transporte neste momento.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Novas solicitações de recolha em machambas aparecerão aqui assim que forem pagas pelos compradores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableDeliveries.map((ord) => {
              // Simulated GPS Coordinates for demonstration
              const gpsLat = -25.8605;
              const gpsLng = 32.6102;
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${gpsLat},${gpsLng}`;

              return (
                <div
                  key={ord.id}
                  className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 relative hover:border-emerald-300 transition-all shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                        ID: {ord.id}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                        {ord.productName}
                      </h4>
                      <span className="text-xs text-emerald-800 font-bold">
                        Carga: {ord.quantity} {ord.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-800 text-amber-300 font-extrabold rounded-xl text-xs block">
                        +150 MT
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Ganho Líquido</span>
                    </div>
                  </div>

                  {/* ROUTE & GPS LOCATION CARD */}
                  <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
                    {/* ORIGIN (FARMER / MACHAMBA) */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                        <Sprout className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide block">
                          Ponto de Recolha (Machamba):
                        </span>
                        <p className="font-bold text-slate-900">{ord.farmerName}</p>
                        <p className="text-slate-500 text-[11px]">{ord.farmerPhone}</p>
                      </div>
                    </div>

                    <div className="border-l-2 border-dashed border-slate-300 ml-4 h-3 my-0.5" />

                    {/* DESTINATION (BUYER) */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-red-100 text-red-700 rounded-lg shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-extrabold text-red-800 uppercase tracking-wide block">
                          Destino Final de Entrega:
                        </span>
                        <p className="font-bold text-slate-900">{ord.buyerName}</p>
                        <p className="text-slate-600 text-[11px]">{ord.buyerAddress}</p>
                        <p className="text-slate-500 text-[11px]">Tel: {ord.buyerPhone}</p>
                      </div>
                    </div>
                  </div>

                  {/* GPS COORDINATES & GOOGLE MAPS LINK */}
                  <div className="flex items-center justify-between text-xs bg-emerald-950 text-white p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-amber-400 animate-pulse" />
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold block">Coordenadas GPS:</span>
                        <span className="font-mono text-[11px] font-bold text-white">
                          -25.8605, 32.6102
                        </span>
                      </div>
                    </div>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-[11px] flex items-center gap-1 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Abrir GPS
                    </a>
                  </div>

                  {/* ACCEPT BUTTON */}
                  <button
                    onClick={() => handleAcceptTransport(ord.id)}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    Aceitar Transporte desta Encomenda
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DRIVER ACTIVE DELIVERIES */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-emerald-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-700" />
            Entregas em Curso com Rastreamento GPS ({activeDeliveries.length})
          </h2>

          {/* INDICADOR / TOGGLE DIRECTO */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGpsEnabled((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full font-extrabold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                isGpsEnabled
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200"
                  : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300"
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${isGpsEnabled ? "text-emerald-700" : "text-slate-500"}`} />
              <span>GPS {isGpsEnabled ? "Ativo (LIGADO)" : "Desativado (DESLIGADO)"}</span>
            </button>
          </div>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <Radio className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Nenhum frete em transporte no momento.</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              O seu GPS de rota está desligado. Selecione uma das encomendas disponíveis na lista acima para iniciar a rota e ligar o GPS de rastreamento.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AVISO QUANDO O INTERRUPTOR DO GPS ESTÁ DESATIVADO PELO TRANSPORTADOR */}
            {!isGpsEnabled && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <strong className="block font-bold">Interruptor de GPS Desativado</strong>
                    <p className="text-[11px] text-amber-800">
                      O seguimento da rota em tempo real foi pausado/desativado por opção do transportador.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGpsEnabled(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-[11px] shrink-0 transition-all cursor-pointer"
                >
                  Reativar GPS
                </button>
              </div>
            )}

            {activeDeliveries.map((ord) => (
              <div
                key={ord.id}
                className="p-5 bg-emerald-50/40 rounded-3xl border border-emerald-200 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{ord.productName}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                          isGpsEnabled
                            ? "bg-amber-300 text-amber-950 animate-pulse"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ord.deliveryStatus} (GPS {isGpsEnabled ? "Ligado" : "Desativado"})
                      </span>
                    </div>
                    <p className="text-slate-700">
                      <strong>Comprador:</strong> {ord.buyerName} ({ord.buyerPhone})
                    </p>
                    <p className="text-slate-600">
                      <strong>Destino de Entrega:</strong> {ord.buyerAddress}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`tel:${ord.buyerPhone}`}
                      className="py-2.5 px-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700" /> Ligar
                    </a>

                    {ord.deliveryStatus !== "Em Trânsito" && (
                      <button
                        onClick={() => {
                          updateOrderStatus(ord.id, "Em Trânsito");
                          setIsGpsEnabled(true);
                        }}
                        className="py-2.5 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        title="Iniciar transporte e notificar comprador sobre 'Em Trânsito'"
                      >
                        <Truck className="w-4 h-4 text-slate-950 animate-bounce" />
                        Iniciar Rota (Em Trânsito)
                      </button>
                    )}

                    <button
                      onClick={() => handleCompleteAndRedirect(ord)}
                      className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      Terminar Entrega & Desligar GPS
                    </button>
                  </div>
                </div>

                {/* MAPA DE GPS SE ESTIVER ATIVO, OU CONTAINER DE AVISO SE DESATIVADO */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-700" />
                      GPS do Entregador & Destino Marcado no Mapa:
                    </span>

                    {/* BOTÃO INTERRUPTOR RÁPIDO DO GPS */}
                    <button
                      onClick={() => setIsGpsEnabled((prev) => !prev)}
                      className="text-[11px] font-extrabold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" />
                      {isGpsEnabled ? "Desativar Rastreamento" : "Ativar Rastreamento"}
                    </button>
                  </div>

                  {isGpsEnabled ? (
                    <RealtimeGpsMap
                      order={ord}
                      roleMode="DRIVER"
                      height="h-72"
                      onOrderDelivered={() => handleCompleteAndRedirect(ord)}
                    />
                  ) : (
                    <div className="p-8 bg-slate-100 rounded-2xl border border-slate-200 text-center space-y-3">
                      <Radio className="w-10 h-10 text-slate-400 mx-auto" />
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          Seguimento da Rota Encerrado (GPS Desativado)
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                          O interruptor do GPS foi desligado pelo transportador. O envio de coordenadas de localização em tempo real para o comprador está suspenso.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsGpsEnabled(true)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Power className="w-4 h-4" />
                        Ligar Interruptor de GPS
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED DELIVERIES HISTORY (GPS DEACTIVATED) */}
      {completedDeliveries.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Histórico de Entregas Concluídas (GPS Desligado) ({completedDeliveries.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedDeliveries.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-extrabold text-slate-900">{ord.productName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">#{ord.id}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold rounded-full text-[10px]">
                    ✅ Entregue & Pago (+150 MT)
                  </span>
                </div>

                <div className="space-y-0.5 text-slate-600">
                  <p><strong>Comprador:</strong> {ord.buyerName}</p>
                  <p><strong>Destino:</strong> {ord.buyerAddress}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60">
                  <span className="flex items-center gap-1 text-slate-600 font-bold">
                    <Radio className="w-3 h-3 text-emerald-600 opacity-40" /> GPS Desativado (Seguimento Encerrado)
                  </span>
                  <span className="font-bold text-emerald-800">Status: Livre para Próxima Carga</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DELIVERY COMPLETION & GPS DEACTIVATION REDIRECT MODAL */}
      {completedOrderModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Entrega Concluída — GPS Desligado
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg">
                À Espera de Nova Encomenda
              </h3>
              <p className="text-xs text-slate-600">
                A entrega de <strong>{completedOrderModal.productName}</strong> (Pedido #{completedOrderModal.orderId}) foi finalizada! O interruptor de GPS foi desativado e o seguimento da rota foi encerrado com sucesso.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-left text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Radio className="w-4 h-4 text-emerald-600 opacity-40" />
                <span>Rastreamento GPS: <strong>Desativado (Seguimento Encerrado)</strong></span>
              </div>
              <p className="text-[11px] text-slate-600">
                O rastreamento por GPS foi desligado para economizar bateria e dados do telemóvel. O seu veículo está pronto e livre para aceitar a próxima encomenda.
              </p>
              <div className="flex items-center justify-between font-extrabold text-emerald-950 pt-2 border-t border-emerald-200/80">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  Frete Creditado na Carteira:
                </span>
                <span className="text-emerald-700 text-sm font-black">+150.00 MT</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCompletedOrderModal(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Aceitar Próxima Encomenda Disponível</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
