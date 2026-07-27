import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAgro } from "../context/AgroContext";
import { Order } from "../types";
import { GpsPermissionsService, LocationPermissionState } from "../services/gpsPermissionsService";
import {
  Navigation,
  Truck,
  MapPin,
  Sprout,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Phone,
  Clock,
  ShieldCheck,
  Smartphone,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Layers,
  Info,
  X,
  Radio,
} from "lucide-react";

interface RealtimeGpsMapProps {
  order: Order;
  roleMode?: "BUYER" | "DRIVER" | "ADMIN" | "VIEW";
  height?: string;
  onOrderDelivered?: () => void;
}

// Default Coordinates in Mozambique if missing
// Maputo center default: -25.9655, 32.5832
// Matola default: -25.9600, 32.4600
// Marracuene default: -25.7333, 32.6833
const MOZ_DEFAULT_DRIVER = { lat: -25.8605, lng: 32.6102 };
const MOZ_DEFAULT_ORIGIN = { lat: -25.7333, lng: 32.6833 }; // Marracuene Machamba
const MOZ_DEFAULT_DEST = { lat: -25.9655, lng: 32.5832 }; // Maputo City

export const RealtimeGpsMap: React.FC<RealtimeGpsMapProps> = ({
  order,
  roleMode = "VIEW",
  height = "h-80",
  onOrderDelivered,
}) => {
  const { updateDriverLocation, currentUser, updateOrderStatus } = useAgro();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initial position calculation
  const originPos = {
    lat: MOZ_DEFAULT_ORIGIN.lat,
    lng: MOZ_DEFAULT_ORIGIN.lng,
  };

  const destPos = {
    lat: order.buyerLocation?.lat || MOZ_DEFAULT_DEST.lat,
    lng: order.buyerLocation?.lng || MOZ_DEFAULT_DEST.lng,
  };

  const initialDriverPos = order.driverCurrentLocation || {
    lat: MOZ_DEFAULT_DRIVER.lat,
    lng: MOZ_DEFAULT_DRIVER.lng,
  };

  const [currentDriverPos, setCurrentDriverPos] = useState<{ lat: number; lng: number }>(initialDriverPos);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(38); // Simulated speed in km/h
  const [distanceKm, setDistanceKm] = useState<number>(12.4);
  const [etaMins, setEtaMins] = useState<number>(18);
  const [permState, setPermState] = useState<LocationPermissionState>({
    fineLocationGranted: false,
    backgroundLocationGranted: false,
    statusText: "Não Verificado",
    isBackgroundSupported: true,
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);

  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const watchGpsRef = useRef<number | null>(null);

  // Check permissions on mount
  useEffect(() => {
    GpsPermissionsService.checkPermissions().then(setPermState);
  }, []);

  // Calculate distance between two lat/lng in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Distance in km
  };

  // Sync state whenever order props change
  useEffect(() => {
    if (order.driverCurrentLocation) {
      setCurrentDriverPos(order.driverCurrentLocation);
    }
  }, [order.driverCurrentLocation]);

  // Recalculate distance & ETA
  useEffect(() => {
    const dist = calculateDistance(currentDriverPos.lat, currentDriverPos.lng, destPos.lat, destPos.lng);
    setDistanceKm(dist);

    // Calculate ETA assuming average speed of 40 km/h
    const timeHours = dist / Math.max(speed, 10);
    const mins = Math.max(Math.round(timeHours * 60), 1);
    setEtaMins(mins);
  }, [currentDriverPos, destPos, speed]);

  // INITIALIZE LEAFLET MAP WITH OPENSTREETMAP TILES (100% FREE COST)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization error
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Center map midway between driver & destination
    const midLat = (currentDriverPos.lat + destPos.lat) / 2;
    const midLng = (currentDriverPos.lng + destPos.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [midLat, midLng],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap Free Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | AgroMoz GPS',
    }).addTo(map);

    // Custom SVG HTML Icons
    const driverHtmlIcon = L.divIcon({
      className: "custom-driver-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-400/40 rounded-full animate-ping"></div>
          <div class="w-10 h-10 bg-slate-900 border-2 border-amber-400 rounded-2xl flex items-center justify-center shadow-2xl text-amber-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>
          <span class="absolute -bottom-5 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded shadow uppercase whitespace-nowrap">
            ${order.driverName ? order.driverName.split(" ")[0] : "Motorista"}
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const destHtmlIcon = L.divIcon({
      className: "custom-dest-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-9 h-9 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center shadow-xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <span class="absolute -bottom-5 bg-slate-900 text-white font-bold text-[9px] px-1.5 py-0.2 rounded shadow whitespace-nowrap">
            Destino Comprador
          </span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const originHtmlIcon = L.divIcon({
      className: "custom-origin-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 bg-emerald-700 border-2 border-white rounded-full flex items-center justify-center shadow-lg text-amber-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 10 2 2 3-3"/><path d="M7 21s4-1 4-6a5 5 0 0 0-5-5c-3 0-4 1-4 6 0 5 4 5 5 5Z"/><path d="M13 21s4-1 4-6a5 5 0 0 0-5-5c-1.8 0-3 .5-3.8 1.5"/><path d="M12 21v-7"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Add Origin Marker
    originMarkerRef.current = L.marker([originPos.lat, originPos.lng], { icon: originHtmlIcon })
      .addTo(map)
      .bindPopup(`<b>Machamba Origem:</b><br/>${order.farmerName}`);

    // Add Destination Marker
    destMarkerRef.current = L.marker([destPos.lat, destPos.lng], { icon: destHtmlIcon })
      .addTo(map)
      .bindPopup(`<b>Destino Entrega:</b><br/>${order.buyerName}<br/>${order.buyerAddress}`);

    // Add Driver Marker
    driverMarkerRef.current = L.marker([currentDriverPos.lat, currentDriverPos.lng], { icon: driverHtmlIcon })
      .addTo(map)
      .bindPopup(
        `<b>Entregador AgroMoz:</b><br/>${order.driverName || "Transportador"}<br/>Status: Em Deslocamento`
      );

    // Draw Polyline connecting Origin -> Driver -> Destination
    const latLngs: L.LatLngExpression[] = [
      [originPos.lat, originPos.lng],
      [currentDriverPos.lat, currentDriverPos.lng],
      [destPos.lat, destPos.lng],
    ];

    routePolylineRef.current = L.polyline(latLngs, {
      color: "#059669",
      weight: 4,
      dashArray: "6, 8",
      opacity: 0.85,
    }).addTo(map);

    // Fit Bounds
    const bounds = L.latLngBounds([
      [originPos.lat, originPos.lng],
      [currentDriverPos.lat, currentDriverPos.lng],
      [destPos.lat, destPos.lng],
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // UPDATE LEAFLET MARKERS & ROUTE POLYLINE WHEN DRIVER POSITION CHANGES
  useEffect(() => {
    if (!driverMarkerRef.current || !mapInstanceRef.current) return;

    // Update marker position
    driverMarkerRef.current.setLatLng([currentDriverPos.lat, currentDriverPos.lng]);

    // Update polyline path
    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs([
        [originPos.lat, originPos.lng],
        [currentDriverPos.lat, currentDriverPos.lng],
        [destPos.lat, destPos.lng],
      ]);
    }
  }, [currentDriverPos]);

  // TOGGLE SIMULATED GPS MOVEMENT
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      setIsLiveGpsActive(false);

      simulationRef.current = setInterval(() => {
        setCurrentDriverPos((prev) => {
          // Calculate step vector towards destination
          const latDiff = destPos.lat - prev.lat;
          const lngDiff = destPos.lng - prev.lng;

          // If very close to destination (less than ~100m)
          if (Math.abs(latDiff) < 0.0005 && Math.abs(lngDiff) < 0.0005) {
            if (simulationRef.current) clearInterval(simulationRef.current);
            setIsSimulating(false);
            if (onOrderDelivered) onOrderDelivered();
            return { lat: destPos.lat, lng: destPos.lng };
          }

          // Move 3% closer per step
          const newLat = prev.lat + latDiff * 0.05;
          const newLng = prev.lng + lngDiff * 0.05;

          const updatedLoc = { lat: newLat, lng: newLng };
          updateDriverLocation(order.id, updatedLoc);
          return updatedLoc;
        });
      }, 2000);
    }
  };

  // TOGGLE REAL BROWSER GPS DEVICE TRACKING
  const toggleLiveDeviceGps = async () => {
    if (isLiveGpsActive) {
      if (watchGpsRef.current !== null) {
        navigator.geolocation.clearWatch(watchGpsRef.current);
        watchGpsRef.current = null;
      }
      setIsLiveGpsActive(false);
    } else {
      setGpsError(null);
      setIsSimulating(false);
      if (simulationRef.current) clearInterval(simulationRef.current);

      // Prompt and check permissions first
      const newPermState = await GpsPermissionsService.requestGpsPermissions(
        (coords) => {
          const initLoc = { lat: coords.latitude, lng: coords.longitude };
          setCurrentDriverPos(initLoc);
          updateDriverLocation(order.id, initLoc);
        },
        (errMsg) => {
          setGpsError(errMsg);
        }
      );

      setPermState(newPermState);

      if (!newPermState.fineLocationGranted) {
        setShowPermissionsModal(true);
        return;
      }

      setIsLiveGpsActive(true);

      // Start continuous watchPosition with ACCESS_FINE_LOCATION and background keepalive
      watchGpsRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          if (pos.coords.speed) {
            setSpeed(Math.round(pos.coords.speed * 3.6)); // Convert m/s to km/h
          }

          setCurrentDriverPos(newLoc);
          updateDriverLocation(order.id, newLoc);

          // Pan map to driver position smoothly
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([newLoc.lat, newLoc.lng], { animate: true });
          }
        },
        (err) => {
          console.warn("GPS Geolocation Error:", err);
          setGpsError("Sinal de GPS fraco ou permissão revogada.");
          setIsLiveGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
    }
  };

  // Reset position back to origin
  const handleResetPosition = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setIsSimulating(false);
    setIsLiveGpsActive(false);

    const resetLoc = { lat: MOZ_DEFAULT_DRIVER.lat, lng: MOZ_DEFAULT_DRIVER.lng };
    setCurrentDriverPos(resetLoc);
    updateDriverLocation(order.id, resetLoc);

    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [originPos.lat, originPos.lng],
        [resetLoc.lat, resetLoc.lng],
        [destPos.lat, destPos.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Center Map on Driver
  const handleCenterOnDriver = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentDriverPos.lat, currentDriverPos.lng], 14, { animate: true });
    }
  };

  // Center Map to fit full route
  const handleFitFullRoute = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [originPos.lat, originPos.lng],
        [currentDriverPos.lat, currentDriverPos.lng],
        [destPos.lat, destPos.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
      if (watchGpsRef.current !== null) navigator.geolocation.clearWatch(watchGpsRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md space-y-0">
      
      {/* STATUS HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-emerald-900/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-amber-300">
            OpenStreetMap GPS ao Vivo
          </span>
          <span className="text-[10px] bg-emerald-800/80 text-emerald-100 font-bold px-2 py-0.5 rounded-full">
            100% Sem Custos
          </span>
        </div>

        {/* METRICS BADGES */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 text-[11px]">Chegada em:</span>
            <strong className="text-white font-extrabold text-xs">{etaMins} min</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 text-[11px]">Distância:</span>
            <strong className="text-white font-extrabold text-xs">{distanceKm} km</strong>
          </div>
        </div>
      </div>

      {/* LEAFLET OPENSTREETMAP CONTAINER */}
      <div className={`relative ${height} w-full bg-slate-100 z-0`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* OVERLAY QUICK ACTION BUTTONS */}
        <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-2">
          <button
            onClick={handleCenterOnDriver}
            title="Centralizar no Entregador"
            className="p-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl shadow-xl border border-slate-200 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
          >
            <Truck className="w-4 h-4 text-emerald-700" />
          </button>
          <button
            onClick={handleFitFullRoute}
            title="Ver Rota Completa"
            className="p-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl shadow-xl border border-slate-200 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
          >
            <Maximize2 className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* DRIVER INFO BOX ON MAP */}
        <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-xl max-w-xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-black text-amber-400 flex items-center gap-1">
              <Truck className="w-3 h-3" /> {order.driverName || "Motorista"}
            </span>
            <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
              {isLiveGpsActive ? "GPS Real" : isSimulating ? "Em Rota" : "Online"}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-200 truncate">
            {order.productName} ({order.quantity} {order.unit})
          </p>
          <p className="text-[10px] text-slate-400">
            Destino: <strong className="text-white">{order.buyerAddress}</strong>
          </p>
        </div>
      </div>

      {/* DRIVER CONTROLS & GPS SIMULATION BAR (For DRIVER role or ADMIN) */}
      {(roleMode === "DRIVER" || roleMode === "ADMIN" || currentUser?.role === "DRIVER") && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {gpsError && (
            <div className="p-2.5 bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* PERMISSION BADGES AND CONFIGURATION BUTTON */}
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Permissões de GPS:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  permState.fineLocationGranted
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                ACCESS_FINE_LOCATION ({permState.fineLocationGranted ? "Ativo" : "Solicitar"})
              </span>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  permState.backgroundLocationGranted
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                <Radio className="w-3 h-3" />
                ACCESS_BACKGROUND_LOCATION ({permState.backgroundLocationGranted ? "Ativo em 2º Plano" : "Ativar"})
              </span>
            </div>

            <button
              onClick={() => setShowPermissionsModal(true)}
              className="text-[10px] font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border border-emerald-200"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              Configurações Android & MapLibre
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              Painel de Controlo do GPS do Transportador:
            </span>

            <div className="flex items-center gap-2">
              {/* REAL DEVICE GPS BUTTON */}
              <button
                onClick={toggleLiveDeviceGps}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs ${
                  isLiveGpsActive
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : "bg-emerald-800 hover:bg-emerald-900 text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                <span>{isLiveGpsActive ? "Parar GPS Real" : "Ativar GPS do Dispositivo"}</span>
              </button>

              {/* SIMULATION TOGGLE */}
              <button
                onClick={toggleSimulation}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs ${
                  isSimulating
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                    : "bg-slate-900 hover:bg-slate-800 text-amber-300"
                }`}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? "Pausar Simulador" : "Simular Deslocamento"}</span>
              </button>

              {/* RESET POSITION */}
              <button
                onClick={handleResetPosition}
                title="Repor posição inicial"
                className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-3 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Velocidade Atual:</span>
              <span className="font-black text-slate-900 text-sm">{speed} km/h</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Distância em Falta:</span>
              <span className="font-black text-emerald-800 text-sm">{distanceKm} km</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Tempo Estimado:</span>
              <span className="font-black text-amber-600 text-sm">~{etaMins} min</span>
            </div>
          </div>
        </div>
      )}

      {/* BUYER / VIEW MODE FOOTER */}
      {roleMode === "BUYER" && (
        <div className="p-4 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Sintonizado no GPS do Entregador</span>
              <span className="text-[11px] text-slate-500">
                A posição do seu frete atualiza em tempo real no mapa OpenStreetMap e MapLibre sem taxas adicionais.
              </span>
            </div>
          </div>

          {order.driverPhone && (
            <a
              href={`tel:${order.driverPhone}`}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>Contactar Motorista</span>
            </a>
          )}
        </div>
      )}

      {/* GPS PERMISSIONS & MAPLIBRE ANDROID MODAL */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-auto overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Permissões de GPS e Rastreamento em Segundo Plano
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Configuração Android SDK e MapLibre Maps para Entregas AgroMoz
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600" /> Status do Dispositivo Atual
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block">Localização Precisa</span>
                    <strong className={permState.fineLocationGranted ? "text-emerald-700" : "text-amber-700"}>
                      {permState.fineLocationGranted ? "Concedido (ACCESS_FINE_LOCATION)" : "Pendente"}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block">Em Segundo Plano</span>
                    <strong className={permState.backgroundLocationGranted ? "text-emerald-700" : "text-blue-700"}>
                      {permState.backgroundLocationGranted ? "Ativo (ACCESS_BACKGROUND_LOCATION)" : "Disponível"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  MapLibre Maps SDK no AndroidManifest.xml
                </h4>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Para que o motorista continue transmitindo as coordenadas GPS quando a tela apagar ou o aplicativo estiver em segundo plano durante o transporte de produtos agrícolas, o manifesto Android está configurado com:
                </p>
                <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto leading-normal">
{`<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />`}
                </pre>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={async () => {
                    const updated = await GpsPermissionsService.requestGpsPermissions(
                      (coords) => {
                        const newLoc = { lat: coords.latitude, lng: coords.longitude };
                        setCurrentDriverPos(newLoc);
                        updateDriverLocation(order.id, newLoc);
                      },
                      (err) => setGpsError(err)
                    );
                    setPermState(updated);
                  }}
                  className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span>Testar Permissões Agora</span>
                </button>

                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-2xl text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
