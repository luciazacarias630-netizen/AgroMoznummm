import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAgro } from "../context/AgroContext";
import { Order } from "../types";
import { GpsPermissionsService, LocationPermissionState } from "../services/gpsPermissionsService";
import { resolveOrderRouteCoordinates, calculateDistanceKm } from "../utils/routeLocationResolver";
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
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Info,
  X,
  Radio,
  ArrowRight,
  PackageCheck,
  Home,
  Check,
  BellRing,
} from "lucide-react";

interface RealtimeGpsMapProps {
  order: Order;
  roleMode?: "BUYER" | "DRIVER" | "ADMIN" | "VIEW";
  height?: string;
  onOrderDelivered?: () => void;
}

export const RealtimeGpsMap: React.FC<RealtimeGpsMapProps> = ({
  order,
  roleMode = "VIEW",
  height = "h-80",
  onOrderDelivered,
}) => {
  const { updateDriverLocation, updateOrderStatus, currentUser, machambas } = useAgro();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Markers
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const machambaMarkerRef = useRef<L.Marker | null>(null);
  const buyerMarkerRef = useRef<L.Marker | null>(null);

  // Route Polylines
  const leg1PolylineRef = useRef<L.Polyline | null>(null);
  const leg2PolylineRef = useRef<L.Polyline | null>(null);

  // Resolve exact coordinates for the 3 stops (Entregador -> Machamba -> Domicílio)
  const routeCoords = resolveOrderRouteCoordinates(order, machambas);

  // Current Driver location state
  const [currentDriverPos, setCurrentDriverPos] = useState<{ lat: number; lng: number }>(
    routeCoords.driver
  );

  // Waypoint Stage State: 1 = En route to Machamba (Pickup), 2 = En route to Buyer Domicile (Delivery)
  const [currentLeg, setCurrentLeg] = useState<1 | 2>(
    order.deliveryStatus === "Em Trânsito" ? 2 : 1
  );

  // Simulation & Live GPS tracking states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pickupConfirmed, setPickupConfirmed] = useState<boolean>(
    order.deliveryStatus === "Em Trânsito" || order.deliveryStatus === "Entregue"
  );
  const [speed, setSpeed] = useState<number>(42); // km/h
  const [permState, setPermState] = useState<LocationPermissionState>({
    fineLocationGranted: false,
    backgroundLocationGranted: false,
    statusText: "Não Verificado",
    isBackgroundSupported: true,
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [routeNotification, setRouteNotification] = useState<string | null>(null);

  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const watchGpsRef = useRef<number | null>(null);

  // Calculate distances
  const distDriverToMachamba = calculateDistanceKm(
    currentDriverPos.lat,
    currentDriverPos.lng,
    routeCoords.machamba.lat,
    routeCoords.machamba.lng
  );

  const distMachambaToBuyer = calculateDistanceKm(
    routeCoords.machamba.lat,
    routeCoords.machamba.lng,
    routeCoords.buyer.lat,
    routeCoords.buyer.lng
  );

  const distDriverToBuyer = calculateDistanceKm(
    currentDriverPos.lat,
    currentDriverPos.lng,
    routeCoords.buyer.lat,
    routeCoords.buyer.lng
  );

  // Total unified route distance
  const totalRouteDistance =
    currentLeg === 1
      ? Math.round((distDriverToMachamba + distMachambaToBuyer) * 10) / 10
      : distDriverToBuyer;

  // Active target distance depending on current leg
  const activeTargetDist = currentLeg === 1 ? distDriverToMachamba : distDriverToBuyer;
  const etaMins = Math.max(Math.round((activeTargetDist / Math.max(speed, 10)) * 60), 1);
  const totalEtaMins = Math.max(Math.round((totalRouteDistance / Math.max(speed, 10)) * 60), 1);

  // Proximity flags for automatic visual alerts (Chegada próxima à Machamba ou Comprador)
  const isCloseToMachamba = currentLeg === 1 && distDriverToMachamba <= 3.5;
  const isCloseToBuyer = currentLeg === 2 && distDriverToBuyer <= 3.5;

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  };

  // Check GPS Permissions on mount
  useEffect(() => {
    GpsPermissionsService.checkPermissions().then(setPermState);
  }, []);

  // Sync state whenever order location updates or if delivered
  useEffect(() => {
    if (order.driverCurrentLocation) {
      setCurrentDriverPos(order.driverCurrentLocation);
    }
    if (order.deliveryStatus === "Entregue") {
      if (watchGpsRef.current !== null) {
        navigator.geolocation.clearWatch(watchGpsRef.current);
        watchGpsRef.current = null;
      }
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
      setIsLiveGpsActive(false);
      setIsSimulating(false);
      setPickupConfirmed(true);
    }
  }, [order.driverCurrentLocation, order.deliveryStatus]);

  // INITIALIZE LEAFLET MULTI-STOP UNIFIED GPS MAP
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Midpoint calculation for initial view bounding box
    const centerLat = (currentDriverPos.lat + routeCoords.machamba.lat + routeCoords.buyer.lat) / 3;
    const centerLng = (currentDriverPos.lng + routeCoords.machamba.lng + routeCoords.buyer.lng) / 3;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap Free Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | AgroMoz GPS Rota Unificada',
    }).addTo(map);

    // Custom Map Markers
    // 1. DRIVER MARKER (MOTORISTA / ENTREGADOR)
    const driverHtmlIcon = L.divIcon({
      className: "custom-driver-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-amber-400/40 rounded-full animate-ping"></div>
          <div class="w-10 h-10 bg-slate-950 border-2 border-amber-400 rounded-2xl flex items-center justify-center shadow-2xl text-amber-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>
          <span class="absolute -bottom-5 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded shadow uppercase whitespace-nowrap border border-amber-500">
            🚚 ${order.driverName ? order.driverName.split(" ")[0] : "Entregador"}
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // 2. MACHAMBA MARKER (PONTO 1: RECOLHA NA MACHAMBA DO AGRICULTOR)
    const machambaHtmlIcon = L.divIcon({
      className: "custom-machamba-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 bg-emerald-700 border-2 border-amber-300 rounded-2xl flex items-center justify-center shadow-2xl text-amber-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 10 2 2 3-3"/><path d="M7 21s4-1 4-6a5 5 0 0 0-5-5c-3 0-4 1-4 6 0 5 4 5 5 5Z"/><path d="M13 21s4-1 4-6a5 5 0 0 0-5-5c-1.8 0-3 .5-3.8 1.5"/><path d="M12 21v-7"/></svg>
          </div>
          <span class="absolute -bottom-6 bg-emerald-900 text-amber-300 font-extrabold text-[9px] px-2 py-0.5 rounded shadow-lg border border-emerald-600 whitespace-nowrap">
            🌾 1. Machamba: ${order.farmerName.split(" ")[0]}
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // 3. BUYER MARKER (PONTO 2: ENTREGA AO DOMICÍLIO DO COMPRADOR)
    const buyerHtmlIcon = L.divIcon({
      className: "custom-buyer-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 bg-rose-600 border-2 border-white rounded-2xl flex items-center justify-center shadow-2xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span class="absolute -bottom-6 bg-slate-900 text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap">
            🏠 2. Domicílio: ${order.buyerName.split(" ")[0]}
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Add Markers to Map
    // Driver
    driverMarkerRef.current = L.marker([currentDriverPos.lat, currentDriverPos.lng], {
      icon: driverHtmlIcon,
    })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #047857;">🚚 Entregador AgroMoz</strong><br/>
          <b>Motorista:</b> ${order.driverName || "Transportador"}<br/>
          <b>Telefone:</b> ${order.driverPhone || "Não disponível"}<br/>
          <span style="color: #b45309; font-weight: bold;">Rastreamento GPS Ativo</span>
        </div>
      `);

    // Machamba (Farmer)
    machambaMarkerRef.current = L.marker([routeCoords.machamba.lat, routeCoords.machamba.lng], {
      icon: machambaHtmlIcon,
    })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #047857;">🌾 PONTO 1: Recolha na Machamba</strong><br/>
          <b>Agricultor:</b> ${order.farmerName}<br/>
          <b>Tel:</b> ${order.farmerPhone}<br/>
          <b>Produto:</b> ${order.productName} (${order.quantity} ${order.unit})
        </div>
      `);

    // Buyer (Delivery)
    buyerMarkerRef.current = L.marker([routeCoords.buyer.lat, routeCoords.buyer.lng], {
      icon: buyerHtmlIcon,
    })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #be123c;">🏠 PONTO 2: Domicílio do Comprador</strong><br/>
          <b>Cliente:</b> ${order.buyerName}<br/>
          <b>Endereço:</b> ${order.buyerAddress}<br/>
          <b>Tel:</b> ${order.buyerPhone}
        </div>
      `);

    // DRAW UNIFIED ROUTE POLYLINES (ROTA UNIFICADA DE TODOS OS PONTOS)
    // Leg 1: Driver -> Machamba do Agricultor (Recolha)
    const leg1Coords: L.LatLngExpression[] = [
      [currentDriverPos.lat, currentDriverPos.lng],
      [routeCoords.machamba.lat, routeCoords.machamba.lng],
    ];

    leg1PolylineRef.current = L.polyline(leg1Coords, {
      color: "#d97706", // Amber
      weight: 5,
      dashArray: "8, 10",
      opacity: 0.9,
    }).addTo(map);

    // Leg 2: Machamba do Agricultor -> Domicílio do Comprador (Entrega)
    const leg2Coords: L.LatLngExpression[] = [
      [routeCoords.machamba.lat, routeCoords.machamba.lng],
      [routeCoords.buyer.lat, routeCoords.buyer.lng],
    ];

    leg2PolylineRef.current = L.polyline(leg2Coords, {
      color: "#059669", // Emerald
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    // Fit Bounds around all 3 waypoints
    const bounds = L.latLngBounds([
      [currentDriverPos.lat, currentDriverPos.lng],
      [routeCoords.machamba.lat, routeCoords.machamba.lng],
      [routeCoords.buyer.lat, routeCoords.buyer.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // UPDATE MARKER POSITIONS & POLYLINES UPON DRIVER POSITION / STAGE CHANGES
  useEffect(() => {
    if (!driverMarkerRef.current || !mapInstanceRef.current) return;

    // Update driver marker position
    driverMarkerRef.current.setLatLng([currentDriverPos.lat, currentDriverPos.lng]);

    // Update Leg 1 polyline (Driver -> Machamba)
    if (leg1PolylineRef.current) {
      leg1PolylineRef.current.setLatLngs([
        [currentDriverPos.lat, currentDriverPos.lng],
        [routeCoords.machamba.lat, routeCoords.machamba.lng],
      ]);
    }

    // Update Leg 2 polyline (Machamba -> Buyer)
    if (leg2PolylineRef.current) {
      leg2PolylineRef.current.setLatLngs([
        [routeCoords.machamba.lat, routeCoords.machamba.lng],
        [routeCoords.buyer.lat, routeCoords.buyer.lng],
      ]);
    }
  }, [currentDriverPos]);

  // Refs for tracking position and leg in intervals without setState side-effects
  const currentDriverPosRef = useRef(currentDriverPos);
  useEffect(() => {
    currentDriverPosRef.current = currentDriverPos;
  }, [currentDriverPos]);

  const currentLegRef = useRef(currentLeg);
  useEffect(() => {
    currentLegRef.current = currentLeg;
  }, [currentLeg]);

  // TOGGLE SIMULATED MOVEMENT ALONG UNIFIED MULTI-STOP ROUTE
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      setIsLiveGpsActive(false);

      simulationRef.current = setInterval(() => {
        const prev = currentDriverPosRef.current;
        const leg = currentLegRef.current;
        const target = leg === 1 ? routeCoords.machamba : routeCoords.buyer;

        const latDiff = target.lat - prev.lat;
        const lngDiff = target.lng - prev.lng;

        // Check if arrived at target (distance less than ~100m)
        if (Math.abs(latDiff) < 0.0006 && Math.abs(lngDiff) < 0.0006) {
          if (leg === 1) {
            // Arrived at Machamba (Ponto 1) -> Pickup cargo!
            setCurrentLeg(2);
            setPickupConfirmed(true);
            updateOrderStatus(order.id, "Produto Coletado");
            setTimeout(() => {
              updateOrderStatus(order.id, "Em Rota para Comprador");
            }, 1200);
            setRouteNotification(
              `🌾 GEOLOCALIZAÇÃO ALCANÇADA: Carga recolhida com sucesso na machamba de ${order.farmerName}! A iniciar percurso para o domicílio do comprador.`
            );
            setTimeout(() => setRouteNotification(null), 7000);
            const machambaLoc = { lat: routeCoords.machamba.lat, lng: routeCoords.machamba.lng };
            setCurrentDriverPos(machambaLoc);
            updateDriverLocation(order.id, machambaLoc);
          } else {
            // Arrived at Buyer Domicile (Ponto 2) -> Delivery complete!
            if (simulationRef.current) clearInterval(simulationRef.current);
            setIsSimulating(false);
            updateOrderStatus(order.id, "Entregue");
            setRouteNotification(`🏁 GEOLOCALIZAÇÃO ALCANÇADA: Entrega no domicílio de ${order.buyerName} concluída e pagamento em custódia libertado!`);
            const buyerLoc = { lat: routeCoords.buyer.lat, lng: routeCoords.buyer.lng };
            setCurrentDriverPos(buyerLoc);
            updateDriverLocation(order.id, buyerLoc);
            if (onOrderDelivered) onOrderDelivered();
          }
          return;
        }

        // Move 6% closer per step
        const newLat = prev.lat + latDiff * 0.06;
        const newLng = prev.lng + lngDiff * 0.06;

        const updatedLoc = { lat: newLat, lng: newLng };
        setCurrentDriverPos(updatedLoc);
        updateDriverLocation(order.id, updatedLoc);
      }, 1800);
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

      const newPermState = await GpsPermissionsService.requestGpsPermissions(
        (coords) => {
          const initLoc = { lat: coords.latitude, lng: coords.longitude };
          setCurrentDriverPos(initLoc);
          updateDriverLocation(order.id, initLoc);
        },
        (errMsg) => setGpsError(errMsg)
      );

      setPermState(newPermState);

      if (!newPermState.fineLocationGranted) {
        setShowPermissionsModal(true);
        return;
      }

      setIsLiveGpsActive(true);

      watchGpsRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (pos.coords.speed) setSpeed(Math.round(pos.coords.speed * 3.6));

          setCurrentDriverPos(newLoc);
          updateDriverLocation(order.id, newLoc);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([newLoc.lat, newLoc.lng], { animate: true });
          }
        },
        (err) => {
          console.warn("GPS Geolocation Error:", err);
          setGpsError("Sinal de GPS fraco ou permissão revogada.");
          setIsLiveGpsActive(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    }
  };

  // Manual Waypoint Step Confirmation by Driver
  const handleConfirmPickupOnFarm = () => {
    setCurrentLeg(2);
    setPickupConfirmed(true);
    setRouteNotification(
      `🌾 Carga de ${order.productName} confirmada como recolhida na Machamba! Rota atualizada para a casa do comprador.`
    );
    setTimeout(() => setRouteNotification(null), 5000);

    // Pan map to Machamba -> Buyer path
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [routeCoords.machamba.lat, routeCoords.machamba.lng],
        [routeCoords.buyer.lat, routeCoords.buyer.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Reset Position to start
  const handleResetPosition = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setIsSimulating(false);
    setIsLiveGpsActive(false);
    setCurrentLeg(1);
    setPickupConfirmed(false);

    const resetLoc = routeCoords.driver;
    setCurrentDriverPos(resetLoc);
    updateDriverLocation(order.id, resetLoc);

    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [resetLoc.lat, resetLoc.lng],
        [routeCoords.machamba.lat, routeCoords.machamba.lng],
        [routeCoords.buyer.lat, routeCoords.buyer.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Center Map on Driver
  const handleCenterOnDriver = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentDriverPos.lat, currentDriverPos.lng], 14, {
        animate: true,
      });
    }
  };

  // Fit Entire Route with all 3 Waypoints
  const handleFitFullRoute = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [currentDriverPos.lat, currentDriverPos.lng],
        [routeCoords.machamba.lat, routeCoords.machamba.lng],
        [routeCoords.buyer.lat, routeCoords.buyer.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
      if (watchGpsRef.current !== null) navigator.geolocation.clearWatch(watchGpsRef.current);
    };
  }, []);

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 flex flex-col p-0 m-0 overflow-hidden text-slate-100 animate-fade-in"
          : "bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md space-y-0"
      }
    >
      {/* MULTI-STOP UNIFIED GPS ROUTE HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-emerald-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <span className="font-extrabold text-amber-300 block text-xs">
              GPS Rota Unificada (Entregador ➔ Machamba ➔ Comprador)
            </span>
            <span className="text-[10px] text-slate-300">
              Cálculo completo de todos os pontos de recolha e entrega
            </span>
          </div>
        </div>

        {/* DISTANCE & ETA METRICS */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 text-[11px]">Tempo Restante:</span>
            <strong className="text-white font-extrabold text-xs">{etaMins} min</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 text-[11px]">Distância Total Rota:</span>
            <strong className="text-amber-300 font-black text-xs">{totalRouteDistance} km</strong>
          </div>

          <button
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              isFullscreen
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-400 hover:bg-amber-300 text-slate-950"
            }`}
            title={isFullscreen ? "Sair do modo ecrã inteiro" : "Expandir GPS para ecrã inteiro"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Sair Ecrã Inteiro</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Ecrã Inteiro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AUTOMATIC VISUAL PROXIMITY NOTIFICATION BANNERS (ALERTAS AUTOMÁTICOS AO CHEGAR PRÓXIMO DA MACHAMBA OU DOMICÍLIO) */}
      {isCloseToMachamba && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-xl border-b-2 border-amber-600 animate-pulse z-40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-950 text-amber-300 rounded-2xl shadow-md shrink-0">
              <BellRing className="w-5 h-5 animate-bounce text-amber-300" />
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wider text-slate-950 block">
                🚨 ALERTA AUTOMÁTICO DE PROXIMIDADE DA MACHAMBA ({distDriverToMachamba} km)
              </span>
              <span className="text-xs text-slate-900 font-bold">
                O entregador está a apenas <strong>{distDriverToMachamba} km</strong> da Machamba do agricultor <strong>{order.farmerName}</strong>! Pronto para recolher {order.productName}.
              </span>
            </div>
          </div>

          {(roleMode === "DRIVER" || currentUser?.role === "DRIVER") && (
            <button
              onClick={handleConfirmPickupOnFarm}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Confirmar Carga Recolhida ✅</span>
            </button>
          )}
        </div>
      )}

      {isCloseToBuyer && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-xl border-b-2 border-emerald-700 animate-pulse z-40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-950 text-emerald-300 rounded-2xl shadow-md shrink-0">
              <BellRing className="w-5 h-5 animate-bounce text-emerald-300" />
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wider text-amber-300 block">
                🚨 ALERTA AUTOMÁTICO DE PROXIMIDADE DO DOMICÍLIO ({distDriverToBuyer} km)
              </span>
              <span className="text-xs text-emerald-50 font-bold">
                O entregador está a apenas <strong>{distDriverToBuyer} km</strong> da residência do comprador <strong>{order.buyerName}</strong> ({order.buyerAddress})!
              </span>
            </div>
          </div>

          {order.buyerPhone && (
            <a
              href={`tel:${order.buyerPhone}`}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Phone className="w-4 h-4" />
              <span>Ligar ao Comprador 📞</span>
            </a>
          )}
        </div>
      )}

      {/* VISUAL WAYPOINTS ITINERARY STEPPER BAR */}
      <div className="bg-slate-900 text-white p-3 px-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap flex-1 min-w-[280px]">
          {/* STOP 1: MACHAMBA DO AGRICULTOR */}
          <div
            className={`flex items-center gap-2 p-2 px-3 rounded-2xl border transition-all ${
              currentLeg === 1
                ? "bg-amber-950/80 border-amber-500 text-amber-300 shadow-md animate-pulse"
                : "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                pickupConfirmed ? "bg-emerald-500 text-slate-950" : "bg-amber-500 text-slate-950"
              }`}
            >
              {pickupConfirmed ? "✓" : "1"}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                Ponto 1: Machamba ({order.farmerName})
              </span>
              <span className="font-extrabold text-xs text-white block">
                {distDriverToMachamba} km • <strong className="text-amber-400">ETA: ~{Math.max(Math.round((distDriverToMachamba / Math.max(speed, 10)) * 60), 1)} min</strong>
              </span>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

          {/* STOP 2: DOMICÍLIO DO COMPRADOR */}
          <div
            className={`flex items-center gap-2 p-2 px-3 rounded-2xl border transition-all ${
              currentLeg === 2
                ? "bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-md"
                : "bg-slate-800/80 border-slate-700 text-slate-400"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                currentLeg === 2 ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-300"
              }`}
            >
              2
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                Ponto 2: Domicílio ({order.buyerName})
              </span>
              <span className="font-extrabold text-xs text-white block">
                {distMachambaToBuyer} km • <strong className="text-emerald-400">ETA: ~{Math.max(Math.round((distMachambaToBuyer / Math.max(speed, 10)) * 60), 1)} min</strong>
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-2 px-3 rounded-2xl border border-slate-700 text-[11px] font-extrabold text-amber-300 shrink-0">
            ⏱️ ETA Rota Total: ~{totalEtaMins} min ({totalRouteDistance} km)
          </div>
        </div>

        {/* DRIVER ACTION TO CONFIRM PICKUP ON FARM */}
        {(roleMode === "DRIVER" || currentUser?.role === "DRIVER") && currentLeg === 1 && (
          <button
            onClick={handleConfirmPickupOnFarm}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            title="Clique quando recolher a carga na machamba do agricultor"
          >
            <PackageCheck className="w-4 h-4 text-amber-300" />
            <span>Confirmar Carga Recolhida na Machamba ✅</span>
          </button>
        )}
      </div>

      {/* ROUTE NOTIFICATION TOAST OVERLAY */}
      {routeNotification && (
        <div className="bg-amber-400 text-slate-950 font-black text-xs p-3 px-4 flex items-center justify-between gap-2 shadow-xl border-b border-amber-500 animate-in fade-in slide-in-from-top duration-300 z-30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
            <span>{routeNotification}</span>
          </div>
          <button onClick={() => setRouteNotification(null)} className="p-1 text-slate-900 hover:bg-amber-500 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LEAFLET MAP CONTAINER */}
      <div className={`relative ${isFullscreen ? "flex-1 h-full min-h-[500px]" : height} w-full bg-slate-100 z-0`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* MAP OVERLAY ACTION BUTTONS */}
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
            title="Ver Rota Completa com Todos os Pontos"
            className="p-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl shadow-xl border border-slate-200 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
          >
            <Maximize2 className="w-4 h-4 text-amber-600" />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair do Ecrã Inteiro" : "Modo Ecrã Inteiro"}
            className="p-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-2xl shadow-xl border border-amber-300 font-extrabold text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-950" /> : <Maximize2 className="w-4 h-4 text-slate-950" />}
          </button>
        </div>

        {/* ACTIVE STAGE CARD ON MAP */}
        <div className="absolute top-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-xl max-w-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-black text-amber-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              {currentLeg === 1 ? "1. A Caminho da Machamba" : "2. A Caminho do Comprador"}
            </span>
            <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
              {isLiveGpsActive ? "GPS Real" : isSimulating ? "Em Rota" : "GPS Ligado"}
            </span>
          </div>

          <div className="text-xs space-y-0.5">
            <p className="font-extrabold text-white truncate">
              {order.productName} ({order.quantity} {order.unit})
            </p>
            <p className="text-[11px] text-slate-300">
              {currentLeg === 1 ? (
                <>
                  Recolha: <strong className="text-amber-300">{order.farmerName}</strong>
                </>
              ) : (
                <>
                  Entrega: <strong className="text-emerald-300">{order.buyerAddress}</strong>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* DRIVER CONTROLS & GPS SIMULATION PANEL */}
      {(roleMode === "DRIVER" || roleMode === "ADMIN" || currentUser?.role === "DRIVER") && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {gpsError && (
            <div className="p-2.5 bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* PERMISSIONS BADGES & ANDROID CONFIGURATION MODAL */}
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

          {order.deliveryStatus === "Entregue" ? (
            <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block">
                    Entrega Concluída no Domicílio — GPS de Rota Desligado
                  </span>
                  <span className="text-[11px] text-slate-500">
                    O rastreamento GPS de todos os pontos foi encerrado. O transportador está disponível para aceitar novo frete.
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-emerald-800 text-amber-300 font-extrabold rounded-xl text-[11px] shrink-0 border border-emerald-700">
                🟢 Em Espera de Nova Carga
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-700" />
                  Painel de Controlo do GPS de Rota Unificada:
                </span>

                <div className="flex items-center gap-2 flex-wrap">
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
                    <span>{isSimulating ? "Pausar Simulador" : "Simular Rota Unificada"}</span>
                  </button>

                  {/* RESET POSITION */}
                  <button
                    onClick={handleResetPosition}
                    title="Repor posição inicial do entregador"
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ROUTE DISTANCES METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs bg-white p-3 rounded-2xl border border-slate-200">
                <div className="p-1">
                  <span className="text-[10px] text-slate-400 block font-bold">1. Entregador ➔ Machamba:</span>
                  <span className="font-black text-amber-600 text-sm">{distDriverToMachamba} km</span>
                </div>
                <div className="p-1 border-t sm:border-t-0 sm:border-l border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">2. Machamba ➔ Domicílio:</span>
                  <span className="font-black text-emerald-700 text-sm">{distMachambaToBuyer} km</span>
                </div>
                <div className="p-1 border-t sm:border-t-0 sm:border-l border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Total Rota Unificada:</span>
                  <span className="font-black text-slate-900 text-sm">{totalRouteDistance} km (~{totalEtaMins} min)</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* BUYER / VIEW MODE FOOTER */}
      {roleMode === "BUYER" && (
        <div className="p-4 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">GPS com Rota Unificada em Tempo Real</span>
              <span className="text-[11px] text-slate-500">
                O seu transportador recolhe o produto na machamba do agricultor e entrega diretamente no seu domicílio.
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
                    Permissões de GPS e Rastreamento de Rota Completa
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
                  Para que o motorista continue transmitindo as coordenadas GPS quando a tela apagar ou o aplicativo estiver em segundo plano durante a rota da machamba ao domicílio, o manifesto Android está configurado com:
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
