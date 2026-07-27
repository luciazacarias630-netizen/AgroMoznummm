import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { RealtimeGpsMap } from "./RealtimeGpsMap";
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
} from "lucide-react";

export const DriverDashboard: React.FC = () => {
  const { currentUser, orders, assignDriverToOrder, updateOrderStatus } = useAgro();

  // Filter available orders needing delivery or assigned to this driver
  const availableDeliveries = orders.filter((o) => !o.driverId && o.deliveryStatus === "Pedido recebido");
  const myDeliveries = orders.filter((o) => o.driverId === currentUser?.id);

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
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-md">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Portal Exclusivo do Transportador</h1>
            <p className="text-xs text-slate-500">
              Visualize encomendas disponíveis com localização exata no GPS e rota de recolha/entrega.
            </p>
          </div>
        </div>

        {currentUser?.vehicleType && (
          <div className="bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 text-xs">
            <span className="text-slate-500">Veículo:</span>{" "}
            <strong className="text-emerald-900 font-bold">{currentUser.vehicleType}</strong> ({currentUser.licensePlate || "Matrícula Ativa"})
          </div>
        )}
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
                    onClick={() =>
                      assignDriverToOrder(
                        ord.id,
                        currentUser?.id || "driver-1",
                        currentUser?.name || "Carlos Nhantumbo",
                        currentUser?.phone || "875544332"
                      )
                    }
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
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
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-700" />
          Minhas Entregas em Curso / Concluídas ({myDeliveries.length})
        </h2>

        {myDeliveries.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-2xl">
            Ainda não aceitou nenhuma entrega. Selecione uma encomenda na lista acima para iniciar a rota.
          </p>
        ) : (
          <div className="space-y-6">
            {myDeliveries.map((ord) => (
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
                          ord.deliveryStatus === "Entregue"
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-amber-300 text-amber-950 animate-pulse"
                        }`}
                      >
                        {ord.deliveryStatus}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      <strong>Comprador:</strong> {ord.buyerName} ({ord.buyerPhone})
                    </p>
                    <p className="text-slate-600">
                      <strong>Destino de Entrega:</strong> {ord.buyerAddress}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${ord.buyerPhone}`}
                      className="py-2.5 px-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700" /> Ligar
                    </a>

                    {ord.deliveryStatus !== "Entregue" && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, "Entregue")}
                        className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        Marcar como Entregue
                      </button>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE OPENSTREETMAP GPS MAP FOR DRIVER */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    GPS do Entregador & Destino Marcado no Mapa (OpenStreetMap Free):
                  </span>
                  <RealtimeGpsMap
                    order={ord}
                    roleMode="DRIVER"
                    height="h-72"
                    onOrderDelivered={() => updateOrderStatus(ord.id, "Entregue")}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
