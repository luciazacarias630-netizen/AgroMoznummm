import React, { useState, useEffect, useRef } from "react";
import { useAgro } from "../context/AgroContext";
import { RealtimeGpsMap } from "./RealtimeGpsMap";
import { Order } from "../types";
import { resolveOrderRouteCoordinates, calculateDistanceKm } from "../utils/routeLocationResolver";
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
  Send,
  DollarSign,
  Tag,
  Check,
} from "lucide-react";

export const DriverDashboard: React.FC = () => {
  const {
    currentUser,
    orders,
    proposals,
    machambas,
    assignDriverToOrder,
    submitDeliveryProposal,
    updateOrderStatus,
    updateDriverLocation,
    confirmDeliveryByDriver,
    testFcmPushNotification,
  } = useAgro();

  // State for GPS Toggle Switch (Interruptor de Estado do GPS)
  const [isGpsEnabled, setIsGpsEnabled] = useState<boolean>(true);
  const [activeToastAlert, setActiveToastAlert] = useState<{
    id: string;
    title: string;
    message: string;
    type: "machamba" | "buyer";
    distMeters: number;
  } | null>(null);

  const playedAlertsRef = useRef<Set<string>>(new Set());

  // Web Audio API Sound Alert Synthesizer for Proximity
  const playProximityAlertSound = (type: "machamba" | "buyer") => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = type === "machamba" ? 880 : 1046.5; // A5 for machamba, C6 for buyer domicile
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log("Audio alert playback error:", e);
    }
  };

  // Proposal Modal State
  const [proposalModalOrder, setProposalModalOrder] = useState<Order | null>(null);
  const [proposedRate, setProposedRate] = useState<number>(200);
  const [proposedMsg, setProposedMsg] = useState<string>("Recolho hoje na machamba e entrego em 24h.");
  const [estimatedHours, setEstimatedHours] = useState<string>("Entrega estimada em 24h");
  const [proposalSuccessMsg, setProposalSuccessMsg] = useState<string | null>(null);

  // Route Preview Modal State for available/active deliveries
  const [routePreviewModalOrder, setRoutePreviewModalOrder] = useState<Order | null>(null);

  // Completion modal state
  const [completedOrderModal, setCompletedOrderModal] = useState<{
    productName: string;
    orderId: string;
  } | null>(null);

  // Filter available orders needing delivery or assigned to this driver
  const availableDeliveries = orders.filter((o) => !o.driverId && o.deliveryStatus === "Pedido recebido");
  const myDeliveries = orders.filter((o) => o.driverId === currentUser?.id);
  const activeDeliveries = myDeliveries.filter((o) => o.deliveryStatus !== "Entregue");
  const completedDeliveries = myDeliveries.filter((o) => o.driverId === currentUser?.id && o.deliveryStatus === "Entregue");

  // BROWSER GEOLOCATION WATCHER (navigator.geolocation)
  useEffect(() => {
    if (!isGpsEnabled || activeDeliveries.length === 0) return;
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newLoc = { lat, lng };

        activeDeliveries.forEach((ord) => {
          updateDriverLocation(ord.id, newLoc);

          const routeCoords = resolveOrderRouteCoordinates(ord, machambas);
          const distToMachambaKm = calculateDistanceKm(lat, lng, routeCoords.machamba.lat, routeCoords.machamba.lng);
          const distToBuyerKm = calculateDistanceKm(lat, lng, routeCoords.buyer.lat, routeCoords.buyer.lng);

          const distMachambaMeters = Math.round(distToMachambaKm * 1000);
          const distBuyerMeters = Math.round(distToBuyerKm * 1000);

          // 500 METERS RADIUS CHECKER - MACHAMBA (Coleta)
          if (
            distMachambaMeters <= 500 &&
            ord.deliveryStatus !== "Produto Coletado" &&
            ord.deliveryStatus !== "Em Rota para Comprador" &&
            ord.deliveryStatus !== "Entregue"
          ) {
            const alertKey = `${ord.id}-machamba-500m`;
            if (!playedAlertsRef.current.has(alertKey)) {
              playedAlertsRef.current.add(alertKey);
              playProximityAlertSound("machamba");
              setActiveToastAlert({
                id: ord.id,
                title: "🚨 PONTO DE COLETA ALCANÇADO (< 500m)",
                message: `Você está a ${distMachambaMeters}m da Machamba de ${ord.farmerName}! Chegou ao ponto de partida / recolha para carregar ${ord.productName}.`,
                type: "machamba",
                distMeters: distMachambaMeters,
              });
            }
          }

          // 500 METERS RADIUS CHECKER - BUYER DOMICILE (Entrega)
          if (
            distBuyerMeters <= 500 &&
            (ord.deliveryStatus === "Em Rota para Comprador" || ord.deliveryStatus === "Produto Coletado" || ord.deliveryStatus === "Em Trânsito") &&
            ord.deliveryStatus !== "Entregue"
          ) {
            const alertKey = `${ord.id}-buyer-500m`;
            if (!playedAlertsRef.current.has(alertKey)) {
              playedAlertsRef.current.add(alertKey);
              playProximityAlertSound("buyer");
              setActiveToastAlert({
                id: ord.id,
                title: "🚨 PONTO DE ENTREGA ALCANÇADO (< 500m)",
                message: `Você está a ${distBuyerMeters}m do Domicílio de ${ord.buyerName} (${ord.buyerAddress})! Chegou ao ponto de destino final.`,
                type: "buyer",
                distMeters: distBuyerMeters,
              });
            }
          }
        });
      },
      (err) => {
        console.warn("GPS Geolocation position watch error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isGpsEnabled, activeDeliveries.length, machambas]);

  const handleAcceptTransport = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    assignDriverToOrder(
      orderId,
      currentUser?.id || "driver-1",
      currentUser?.name || "Carlos Nhantumbo",
      currentUser?.phone || "875544332"
    );

    // Automatically set delivery status to Em Rota para Machamba and enable GPS
    updateOrderStatus(orderId, "Em Rota para Machamba");
    setIsGpsEnabled(true);

    if (targetOrder) {
      setProposalSuccessMsg(
        `✅ Encomenda #${orderId} aceite com sucesso! Rota otimizada calculada automaticamente: Motorista ➔ Machamba (${targetOrder.farmerName}) ➔ Domicílio (${targetOrder.buyerName}).`
      );
      setTimeout(() => setProposalSuccessMsg(null), 8000);
    }
  };

  const handleCompleteAndRedirect = (ord: Order) => {
    // 1. Mark order as confirmed by driver (Step 5 of double-confirmation)
    confirmDeliveryByDriver(ord.id);

    // 2. Deactivate GPS toggle switch
    setIsGpsEnabled(false);

    // 3. Open notification modal confirming driver delivery status
    setCompletedOrderModal({
      productName: ord.productName,
      orderId: ord.id,
    });

    // 4. Smooth scroll to top
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
      {/* FLOATING PROXIMITY TOAST ALERT BANNER (< 500m RADIUS) */}
      {activeToastAlert && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-3xl shadow-xl border-2 border-amber-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 text-amber-300 rounded-2xl shrink-0 shadow-md">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <strong className="block text-sm font-black text-slate-950 uppercase tracking-tight">
                {activeToastAlert.title}
              </strong>
              <p className="text-xs text-slate-950 font-bold mt-0.5">
                {activeToastAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => playProximityAlertSound(activeToastAlert.type)}
              className="px-3 py-1.5 bg-slate-950 text-amber-300 hover:bg-slate-900 font-black rounded-xl text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              🔊 Tocar Alerta
            </button>
            <button
              onClick={() => setActiveToastAlert(null)}
              className="px-3 py-1.5 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
            >
              Fechar ✕
            </button>
          </div>
        </div>
      )}

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

                  {/* GPS COORDINATES & UNIFIED ROUTE MAP BUTTON */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs bg-slate-950 text-white p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                      <div>
                        <span className="text-[10px] text-emerald-300 font-extrabold uppercase block">
                          Rota Completa com Pontos de Paragem:
                        </span>
                        <span className="text-[11px] font-bold text-slate-200">
                          Recolha na Machamba ➔ Entrega no Domicílio
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRoutePreviewModalOrder(ord)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                        title="Ver mapa com o cálculo de todos os pontos de paragem"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-300" />
                        <span>Calcular Rota no Mapa</span>
                      </button>

                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1 transition-all"
                        title="Abrir no Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      </a>
                    </div>
                  </div>

                  {/* PROPOSAL STATUS BADGE IF ALREADY PROPOSED */}
                  {(() => {
                    const myProposal = proposals.find(
                      (p) => p.transacaoId === ord.id && p.transportadorId === (currentUser?.id || "driver-1")
                    );
                    if (myProposal) {
                      return (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-amber-900 flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-amber-600" /> Sua Proposta Enviada: {myProposal.valorProposto} MT
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                myProposal.estado === "aceite"
                                  ? "bg-emerald-600 text-white"
                                  : myProposal.estado === "rejeitada"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-200 text-amber-900"
                              }`}
                            >
                              {myProposal.estado === "aceite"
                                ? "ACEITE 🎉"
                                : myProposal.estado === "rejeitada"
                                ? "NÃO SELECIONADO"
                                : "AGUARDANDO COMPRADOR"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 italic">"{myProposal.mensagem}"</p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* ACTION BUTTONS: PROPOSE VS ACCEPT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setProposalModalOrder(ord);
                        setProposedRate(180);
                        setProposalSuccessMsg(null);
                      }}
                      className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Tag className="w-4 h-4 text-slate-950" />
                      Propor Preço
                    </button>

                    <button
                      onClick={() => handleAcceptTransport(ord.id)}
                      className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      Aceitar (150 MT)
                    </button>
                  </div>
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

            {activeDeliveries.map((ord) => {
              const routeCoords = resolveOrderRouteCoordinates(ord, machambas);
              const driverPos = ord.driverCurrentLocation || routeCoords.driver;
              const distToMachamba = calculateDistanceKm(driverPos.lat, driverPos.lng, routeCoords.machamba.lat, routeCoords.machamba.lng);
              const distToBuyer = calculateDistanceKm(driverPos.lat, driverPos.lng, routeCoords.buyer.lat, routeCoords.buyer.lng);

              const isCloseMachamba =
                ord.deliveryStatus !== "Produto Coletado" &&
                ord.deliveryStatus !== "Em Rota para Comprador" &&
                ord.deliveryStatus !== "Em Trânsito" &&
                ord.deliveryStatus !== "Entregue" &&
                distToMachamba <= 3.5;

              const isCloseBuyer =
                (ord.deliveryStatus === "Em Rota para Comprador" ||
                  ord.deliveryStatus === "Produto Coletado" ||
                  ord.deliveryStatus === "Em Trânsito") &&
                distToBuyer <= 3.5;

              return (
                <div
                  key={ord.id}
                  className="p-5 bg-emerald-50/40 rounded-3xl border border-emerald-200 space-y-4 shadow-sm"
                >
                  {/* AUTOMATIC VISUAL & SOUND NOTIFICATION - MACHAMBA PROXIMITY */}
                  {isCloseMachamba && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-2xl border border-amber-600 shadow-md flex items-center justify-between gap-3 animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-950 text-amber-300 rounded-xl shrink-0">
                          <BellRing className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <strong className="block text-xs uppercase font-black text-slate-950">
                            🚨 NOTIFICAÇÃO SONORA E VISUAL: PRÓXIMO DA MACHAMBA ({distToMachamba} km)
                          </strong>
                          <p className="text-xs text-slate-900 font-bold">
                            A chegar ao ponto de recolha na Machamba de <strong>{ord.farmerName}</strong> para carregar {ord.productName}!
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => playProximityAlertSound("machamba")}
                          className="px-2.5 py-1.5 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-black rounded-xl text-[11px] transition-all cursor-pointer"
                          title="Tocar Sinal Sonoro"
                        >
                          🔊 Sinal Sonoro
                        </button>

                        <button
                          onClick={() => {
                            updateOrderStatus(ord.id, "Produto Coletado");
                            playProximityAlertSound("machamba");
                            setIsGpsEnabled(true);
                          }}
                          className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          Confirmar Coleta 🌾
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AUTOMATIC VISUAL & SOUND NOTIFICATION - BUYER DOMICILE PROXIMITY */}
                  {isCloseBuyer && (
                    <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white rounded-2xl border border-emerald-700 shadow-md flex items-center justify-between gap-3 animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-950 text-emerald-300 rounded-xl shrink-0">
                          <BellRing className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <strong className="block text-xs uppercase font-black text-amber-300">
                            🚨 NOTIFICAÇÃO SONORA E VISUAL: PRÓXIMO DO DOMICÍLIO ({distToBuyer} km)
                          </strong>
                          <p className="text-xs text-emerald-50 font-bold">
                            A chegar ao destino de entrega no Domicílio de <strong>{ord.buyerName}</strong> ({ord.buyerAddress}).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => playProximityAlertSound("buyer")}
                          className="px-2.5 py-1.5 bg-slate-950/30 hover:bg-slate-950/50 text-amber-300 font-black rounded-xl text-[11px] transition-all cursor-pointer"
                          title="Tocar Sinal Sonoro"
                        >
                          🔊 Sinal Sonoro
                        </button>

                        {ord.buyerPhone && (
                          <a
                            href={`tel:${ord.buyerPhone}`}
                            className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            Ligar Comprador 📞
                          </a>
                        )}
                      </div>
                    </div>
                  )}
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

                    <button
                      onClick={() => handleCompleteAndRedirect(ord)}
                      className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      Terminar Entrega & Desligar GPS
                    </button>
                  </div>
                </div>

                {/* ROTA OTIMIZADA AUTOMÁTICA & NAVEGAÇÃO GOOGLE MAPS MULTI-PARAGEM */}
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <span className="font-extrabold text-slate-100">
                        📍 Rota Otimizada de Transporte:
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-mono font-bold">
                      {Math.round((distToMachamba + distToBuyer) * 10) / 10} km Total (Machamba + Domicílio)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-800/90 rounded-xl border border-amber-500/30 flex items-center justify-between">
                      <span className="text-amber-300 font-bold">1. Coleta na Machamba ({ord.farmerName}):</span>
                      <strong className="text-white">{distToMachamba} km • ~{Math.max(Math.round((distToMachamba / 40) * 60), 1)} min</strong>
                    </div>
                    <div className="p-2 bg-slate-800/90 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-emerald-300 font-bold">2. Entrega Domicílio ({ord.buyerName}):</span>
                      <strong className="text-white">{distToBuyer} km • ~{Math.max(Math.round((distToBuyer / 40) * 60), 1)} min</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Calculado automaticamente desde o ponto GPS atual
                    </span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${driverPos.lat},${driverPos.lng}&destination=${routeCoords.buyer.lat},${routeCoords.buyer.lng}&waypoints=${routeCoords.machamba.lat},${routeCoords.machamba.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Google Maps Rota Otimizada ↗
                    </a>
                  </div>
                </div>

                {/* CONTROLO DE ESTADO DE ENTREGA (SISTEMA DE ETAPAS) */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-emerald-100 text-xs shadow-2xs">
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase mr-1">
                    Estado da Entrega:
                  </span>
                  <button
                    onClick={() => updateOrderStatus(ord.id, "Em Rota para Machamba")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      ord.deliveryStatus === "Em Rota para Machamba" || ord.deliveryStatus === "Entregador a caminho"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-300"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    1. Em Rota para Machamba 🚜
                  </button>

                  <button
                    onClick={() => updateOrderStatus(ord.id, "Produto Coletado")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      ord.deliveryStatus === "Produto Coletado"
                        ? "bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-300"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    2. Produto Coletado 🌾
                  </button>

                  <button
                    onClick={() => updateOrderStatus(ord.id, "Em Rota para Comprador")}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      ord.deliveryStatus === "Em Rota para Comprador" || ord.deliveryStatus === "Em Trânsito"
                        ? "bg-emerald-800 text-amber-300 font-black shadow-xs ring-2 ring-emerald-400"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    3. Em Rota para Comprador 🚚
                  </button>

                  <button
                    onClick={() => handleCompleteAndRedirect(ord)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      ord.deliveryStatus === "Entregue"
                        ? "bg-emerald-700 text-white font-black shadow-xs"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
                    }`}
                  >
                    4. Entregue ✅
                  </button>
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
            );
          })}
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

      {/* MODAL DE PROPOSTA DE FRETE PERSONALIZADO */}
      {proposalModalOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Submeter Proposta de Frete
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pedido #{proposalModalOrder.id} • {proposalModalOrder.productName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProposalModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {proposalSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-extrabold text-emerald-900 text-xs">{proposalSuccessMsg}</p>
                <button
                  onClick={() => setProposalModalOrder(null)}
                  className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Concluído
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitDeliveryProposal(
                    proposalModalOrder.id,
                    proposedRate,
                    proposedMsg,
                    estimatedHours
                  );
                  setProposalSuccessMsg(`Proposta de ${proposedRate} MT enviada com sucesso para o comprador!`);
                }}
                className="space-y-4"
              >
                {/* ROTA */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recolha:</span>
                    <strong className="text-slate-900">{proposalModalOrder.farmerName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Destino:</span>
                    <strong className="text-slate-900">{proposalModalOrder.buyerAddress || proposalModalOrder.buyerProvince}</strong>
                  </div>
                </div>

                {/* VALOR DA PROPOSTA */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Preço do Frete Proposto (Meticais):</span>
                    <span className="text-amber-600 font-extrabold">{proposedRate} MT</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      step="10"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* TEMPO ESTIMADO */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tempo Estimado de Entrega:</label>
                  <select
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Entrega em até 12 horas">Entrega em até 12 horas</option>
                    <option value="Entrega estimada em 24h">Entrega estimada em 24h</option>
                    <option value="Entrega em 48 horas">Entrega em 48 horas (Distância longa)</option>
                  </select>
                </div>

                {/* MENSAGEM OPCIONAL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nota para o Comprador:</label>
                  <textarea
                    rows={2}
                    value={proposedMsg}
                    onChange={(e) => setProposedMsg(e.target.value)}
                    placeholder="Ex: Tenho carrinha refrigerada e posso sair hoje à tarde."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProposalModalOrder(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Proposta
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CÁLCULO E VISUALIZAÇÃO DE ROTA COMPLETA NO MAPA */}
      {routePreviewModalOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-4xl w-full rounded-3xl p-6 shadow-2xl border border-emerald-200 space-y-4 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-800 text-amber-300 rounded-2xl shadow-sm">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Cálculo de Rota Unificada com Pontos de Paragem
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recolha na Machamba de <strong>{routePreviewModalOrder.farmerName}</strong> ➔ Entrega no Domicílio de <strong>{routePreviewModalOrder.buyerName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRoutePreviewModalOrder(null)}
                className="text-slate-500 hover:text-slate-800 font-extrabold text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* MAPA DE GPS DE ROTA COMPLETA */}
            <RealtimeGpsMap
              order={routePreviewModalOrder}
              roleMode="DRIVER"
              height="h-96"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRoutePreviewModalOrder(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-2xl cursor-pointer transition-all"
              >
                Voltar ao Painel
              </button>

              <button
                onClick={() => {
                  handleAcceptTransport(routePreviewModalOrder.id);
                  setRoutePreviewModalOrder(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Aceitar Este Frete com Rota Calculada (+150 MT)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
