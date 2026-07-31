import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAgro } from "../context/AgroContext";
import { Order } from "../types";
import { GpsPermissionsService, LocationPermissionState } from "../services/gpsPermissionsService";
import {
  MapPin,
  Truck,
  Navigation,
  Compass,
  Phone,
  Clock,
  ShieldCheck,
  Smartphone,
  Maximize2,
  Minimize2,
  Layers,
  Info,
  Radio,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Sprout,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

interface MapScreenProps {
  selectedOrderId?: string;
  onOpenChatWith?: (partnerId: string, partnerName: string) => void;
}

// Default Mozambique coordinates center (e.g., Maputo / Marracuene / Matola Corridor)
const MOZ_MAP_CENTER = { lat: -25.8605, lng: 32.6102, zoom: 11 };

export const MapScreen: React.FC<MapScreenProps> = ({
  selectedOrderId,
  onOpenChatWith,
}) => {
  const { orders, currentUser, updateDriverLocation, updateOrderStatus } = useAgro();

  // Selected Order for tracking
  const activeOrders = orders.filter((o) => o.deliveryStatus !== "Cancelado");
  const [currentOrder, setCurrentOrder] = useState<Order>(() => {
    if (selectedOrderId) {
      const found = activeOrders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return activeOrders[0] || {
      id: "ord-default",
      productId: "p1",
      productName: "Tomate Vermelho de Marracuene",
      quantity: 50,
      unit: "kg",
      totalAmount: 2500,
      subtotal: 2375,
      farmerFee: 125,
      farmerNetAmount: 2250,
      buyerId: "buyer-1",
      buyerName: "Delfina Machava",
      buyerPhone: "841234567",
      buyerDistrict: "Maputo Cidade",
      buyerAddress: "Av. Eduardo Mondlane, No 1420",
      farmerId: "farmer-1",
      farmerName: "Mateus Cossa",
      farmerPhone: "829876543",
      farmProvince: "Maputo",
      farmDistrict: "Marracuene",
      driverId: "driver-1",
      driverName: "Armando Sitae",
      driverPhone: "845551234",
      deliveryStatus: "Em Trânsito",
      paymentStatus: "Pago",
      paymentMethod: "M-Pesa",
      paymentTxId: "tx-mpesa-99",
      escrowStatus: "Pendente",
      createdAt: new Date().toISOString(),
      originCoords: { lat: -25.7333, lng: 32.6833 },
      driverCoords: { lat: -25.8605, lng: 32.6102 },
      destinationCoords: { lat: -25.9655, lng: 32.5832 },
    };
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Real-time tracking states
  const [driverPos, setDriverPos] = useState(
    currentOrder.driverCoords || { lat: -25.8605, lng: 32.6102 }
  );
  const [destPos] = useState(
    currentOrder.destinationCoords || { lat: -25.9655, lng: 32.5832 }
  );
  const [originPos] = useState(
    currentOrder.originCoords || { lat: -25.7333, lng: 32.6833 }
  );

  const [mapTileStyle, setMapTileStyle] = useState<"MAPLIBRE" | "OSM" | "SATELLITE">("MAPLIBRE");
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(42);
  const [distanceKm, setDistanceKm] = useState<number>(11.8);
  const [etaMins, setEtaMins] = useState<number>(16);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>({
    fineLocationGranted: false,
    backgroundLocationGranted: false,
    statusText: "Não Verificado",
    isBackgroundSupported: true,
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  };

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gpsWatchRef = useRef<number | null>(null);

  // Check initial permissions
  useEffect(() => {
    GpsPermissionsService.checkPermissions().then(setPermissionState);
  }, []);

  // Update when order selection changes
  useEffect(() => {
    if (currentOrder.driverCoords) setDriverPos(currentOrder.driverCoords);
  }, [currentOrder]);

  // Map Initialization with MapLibre Vector Tile or OpenStreetMap Tile Layer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // MapLibre / Leaflet Map Initialization centered on Mozambique
      const map = L.map(mapContainerRef.current, {
        center: [MOZ_MAP_CENTER.lat, MOZ_MAP_CENTER.lng],
        zoom: MOZ_MAP_CENTER.zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // MapLibre Vector / CartoDB / OSM Tile URL
      let tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      let attribution = '&copy; MapLibre & OpenStreetMap contributors';

      if (mapTileStyle === "OSM") {
        tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      } else if (mapTileStyle === "SATELLITE") {
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = 'Tiles &copy; Esri &mdash; MapLibre SDK';
      }

      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

      // Custom Icons for MapLibre Markers
      const driverIcon = L.divIcon({
        className: "custom-driver-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 bg-amber-400/40 rounded-full animate-ping"></div>
            <div class="w-9 h-9 bg-slate-900 border-2 border-amber-400 text-amber-300 rounded-full flex items-center justify-center shadow-2xl font-black text-xs">
              🚚
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `
          <div class="flex items-center justify-center">
            <div class="w-9 h-9 bg-rose-600 border-2 border-white text-white rounded-full flex items-center justify-center shadow-2xl font-black text-xs">
              📍
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const originIcon = L.divIcon({
        className: "custom-origin-pin",
        html: `
          <div class="flex items-center justify-center">
            <div class="w-8 h-8 bg-emerald-700 border-2 border-white text-white rounded-full flex items-center justify-center shadow-lg font-black text-xs">
              🌱
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Add Dynamic Markers
      const originM = L.marker([originPos.lat, originPos.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Machamba de Origem</b><br/>${currentOrder.farmerName} (${currentOrder.farmDistrict})`);

      const driverM = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<b>Transportador Em Trânsito</b><br/>${currentOrder.driverName || "Motorista AgroMoz"}`);

      const destM = L.marker([destPos.lat, destPos.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destino da Encomenda</b><br/>${currentOrder.buyerName}<br/>${currentOrder.buyerAddress}`);

      // Add Route Polyline
      const polyline = L.polyline(
        [
          [originPos.lat, originPos.lng],
          [driverPos.lat, driverPos.lng],
          [destPos.lat, destPos.lng],
        ],
        { color: "#d97706", weight: 4, dashArray: "8, 8", opacity: 0.85 }
      ).addTo(map);

      mapInstanceRef.current = map;
      originMarkerRef.current = originM;
      driverMarkerRef.current = driverM;
      destMarkerRef.current = destM;
      routePolylineRef.current = polyline;

      // Fit map to contain markers
      const bounds = L.latLngBounds([
        [originPos.lat, originPos.lng],
        [driverPos.lat, driverPos.lng],
        [destPos.lat, destPos.lng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Driver Marker & Route line when driverPos updates
  useEffect(() => {
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
    }

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs([
        [originPos.lat, originPos.lng],
        [driverPos.lat, driverPos.lng],
        [destPos.lat, destPos.lng],
      ]);
    }

    // Calculate Distance & ETA
    const R = 6371;
    const dLat = ((destPos.lat - driverPos.lat) * Math.PI) / 180;
    const dLon = ((destPos.lng - driverPos.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((driverPos.lat * Math.PI) / 180) *
        Math.cos((destPos.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistanceKm(Number(dist.toFixed(1)));
    const estTime = Math.max(2, Math.round((dist / (speed || 35)) * 60));
    setEtaMins(estTime);
  }, [driverPos, destPos, originPos, speed]);

  // Stop GPS watch & simulation when delivery is completed
  useEffect(() => {
    if (currentOrder.deliveryStatus === "Entregue") {
      setIsLiveGpsActive(false);
      setIsSimulating(false);
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    }
  }, [currentOrder.deliveryStatus]);

  // Simulation step
  useEffect(() => {
    if (!isSimulating || isLiveGpsActive) return;

    simulationTimerRef.current = setInterval(() => {
      setDriverPos((prev) => {
        const step = 0.0008;
        const latDiff = destPos.lat - prev.lat;
        const lngDiff = destPos.lng - prev.lng;

        if (Math.abs(latDiff) < 0.001 && Math.abs(lngDiff) < 0.001) {
          setIsSimulating(false);
          updateOrderStatus(currentOrder.id, "Entregue");
          return destPos;
        }

        const nextLat = prev.lat + Math.sign(latDiff) * Math.min(Math.abs(latDiff), step);
        const nextLng = prev.lng + Math.sign(lngDiff) * Math.min(Math.abs(lngDiff), step);
        const newPos = { lat: nextLat, lng: nextLng };

        updateDriverLocation(currentOrder.id, newPos);
        return newPos;
      });
    }, 2500);

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [isSimulating, isLiveGpsActive, destPos, currentOrder.id]);

  // Center on Driver or Destination
  const handleCenterOnDriver = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([driverPos.lat, driverPos.lng], 14, { animate: true });
    }
  };

  const handleCenterOnDest = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([destPos.lat, destPos.lng], 14, { animate: true });
    }
  };

  const handleFitRouteBounds = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [originPos.lat, originPos.lng],
        [driverPos.lat, driverPos.lng],
        [destPos.lat, destPos.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Toggle Live GPS Device Tracking
  const handleToggleDeviceGps = async () => {
    if (isLiveGpsActive) {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
      setIsLiveGpsActive(false);
    } else {
      setGpsError(null);
      setIsSimulating(false);

      const pState = await GpsPermissionsService.requestGpsPermissions(
        (coords) => {
          const loc = { lat: coords.latitude, lng: coords.longitude };
          setDriverPos(loc);
          updateDriverLocation(currentOrder.id, loc);
        },
        (err) => setGpsError(err)
      );

      setPermissionState(pState);

      if (pState.fineLocationGranted) {
        setIsLiveGpsActive(true);
        gpsWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setDriverPos(loc);
            updateDriverLocation(currentOrder.id, loc);
            if (pos.coords.speed) setSpeed(Math.round(pos.coords.speed * 3.6));
          },
          (err) => {
            setGpsError("Sinal de GPS fraco ou permissão revogada.");
            setIsLiveGpsActive(false);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* MAP SCREEN HEADER & ORDER SELECTOR */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-md font-black">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <span>MapScreen: Monitorização GPS MapLibre</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                Ao Vivo
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Rastreamento contínuo em tempo real entre a Machamba, o Entregador e o Destino do Comprador.
            </p>
          </div>
        </div>

        {/* ORDER SELECTOR & FULLSCREEN BUTTON */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">Encomenda:</span>
              <select
                value={currentOrder.id}
                onChange={(e) => {
                  const sel = activeOrders.find((o) => o.id === e.target.value);
                  if (sel) setCurrentOrder(sel);
                }}
                className="bg-slate-800 text-amber-300 font-extrabold text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none w-full md:w-64"
              >
                {activeOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} - {o.productName} ({o.quantity} {o.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className={`px-3.5 py-2 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              isFullscreen
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-400 hover:bg-amber-300 text-slate-950"
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? "Sair de Ecrã Inteiro" : "Ecrã Inteiro GPS"}</span>
          </button>
        </div>
      </div>

      {/* MAP CANVAS & CONTROLS CONTAINER */}
      <div
        className={
          isFullscreen
            ? "fixed inset-0 z-[99999] w-screen h-screen bg-slate-900 flex flex-col p-0 m-0 overflow-hidden text-slate-100 animate-fade-in"
            : "relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 shadow-xl"
        }
      >
        
        {/* LEAFLET/MAPLIBRE MAP MOUNT */}
        <div ref={mapContainerRef} className={`w-full ${isFullscreen ? "flex-1 h-full min-h-[500px]" : "h-[480px]"} z-0`} />

        {/* MAP FLOATING CONTROLS (TOP RIGHT) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleCenterOnDriver}
            className="p-2.5 bg-white/95 backdrop-blur-md text-slate-900 hover:bg-amber-400 font-bold rounded-2xl shadow-lg border border-slate-200 transition-all flex items-center gap-1.5 text-xs"
            title="Centrar no Entregador"
          >
            <Truck className="w-4 h-4 text-emerald-800" />
            <span className="hidden sm:inline">Entregador</span>
          </button>

          <button
            onClick={handleCenterOnDest}
            className="p-2.5 bg-white/95 backdrop-blur-md text-slate-900 hover:bg-rose-50 font-bold rounded-2xl shadow-lg border border-slate-200 transition-all flex items-center gap-1.5 text-xs"
            title="Centrar no Destino"
          >
            <MapPin className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Destino</span>
          </button>

          <button
            onClick={handleFitRouteBounds}
            className="p-2.5 bg-white/95 backdrop-blur-md text-slate-900 hover:bg-slate-100 font-bold rounded-2xl shadow-lg border border-slate-200 transition-all flex items-center gap-1.5 text-xs"
            title="Ver Rota Completa"
          >
            <Maximize2 className="w-4 h-4 text-slate-700" />
            <span className="hidden sm:inline">Ajustar Rota</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl shadow-lg border border-amber-300 transition-all flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer"
            title={isFullscreen ? "Sair do Ecrã Inteiro" : "Ecrã Inteiro GPS"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Sair Fullscreen" : "Ecrã Inteiro"}</span>
          </button>
        </div>

        {/* FLOATING TELEMETRY HUD OVERLAY (TOP LEFT) */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl max-w-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 animate-spin" /> Telemetria em Directo
            </span>
            <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[9px]">
              {currentOrder.deliveryStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Distância</span>
              <strong className="text-amber-300 font-black">{distanceKm} km</strong>
            </div>

            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Tempo Est.</span>
              <strong className="text-emerald-400 font-black">{etaMins} min</strong>
            </div>

            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Velocidade</span>
              <strong className="text-white font-black">{speed} km/h</strong>
            </div>
          </div>
        </div>

        {/* BOTTOM MAP TOOLBAR */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold">Estilo MapLibre:</span>
            {(["MAPLIBRE", "OSM", "SATELLITE"] as const).map((style) => (
              <button
                key={style}
                onClick={() => setMapTileStyle(style)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  mapTileStyle === style
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                isSimulating
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? "Pausar Simulação" : "Simular Trânsito"}</span>
            </button>

            <button
              onClick={handleToggleDeviceGps}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                isLiveGpsActive
                  ? "bg-emerald-500 text-slate-950 animate-pulse"
                  : "bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span>{isLiveGpsActive ? "GPS Real Ativo" : "Ativar GPS do Dispositivo"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR ALERT IF GPS FAILS */}
      {gpsError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* DELIVERY PARTICIPANTS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* ORIGIN / AGRICULTOR */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-800 flex items-center gap-1">
              <Sprout className="w-4 h-4 text-emerald-600" /> Origem (Machamba)
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {currentOrder.farmProvince}
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{currentOrder.farmerName}</div>
          <div className="text-slate-500">{currentOrder.farmDistrict}, Moçambique</div>
        </div>

        {/* ENTREGADOR / DRIVER */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-950 flex items-center gap-1">
              <Truck className="w-4 h-4 text-amber-700" /> Entregador Atribuído
            </span>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
              GPS Ativo
            </span>
          </div>
          <div className="font-black text-slate-900 text-sm">{currentOrder.driverName || "Transportador AgroMoz"}</div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-600 font-mono">{currentOrder.driverPhone || "+258 84 123 4567"}</span>
            {onOpenChatWith && (
              <button
                onClick={() => onOpenChatWith(currentOrder.driverId || "driver-1", currentOrder.driverName || "Motorista")}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg hover:bg-amber-300"
              >
                Contactar
              </button>
            )}
          </div>
        </div>

        {/* DESTINO / COMPRADOR */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-800 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-rose-600" /> Destino da Entrega
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              {currentOrder.buyerDistrict}
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{currentOrder.buyerName}</div>
          <div className="text-slate-500 truncate">{currentOrder.buyerAddress || "Endereço Principal"}</div>
        </div>
      </div>
    </div>
  );
};
