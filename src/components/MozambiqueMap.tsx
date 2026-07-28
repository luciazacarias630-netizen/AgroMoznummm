import React, { useState, useMemo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueLocations";
import { Machamba, Product } from "../types";
import { RealtimeGpsMap } from "./RealtimeGpsMap";
import { MapScreen } from "./MapScreen";
import {
  MapPin,
  Sprout,
  Phone,
  MessageCircle,
  Search,
  Filter,
  X,
  Compass,
  ShoppingBag,
  Tag,
  RefreshCw,
  Layers,
  Truck,
  Navigation,
  CheckCircle2,
  Maximize2,
} from "lucide-react";

interface MozambiqueMapProps {
  onOpenChatWith: (farmerId: string, farmerName: string) => void;
}

interface SearchableLocation {
  name: string;
  type: "PROVINCE" | "DISTRICT";
  provinceName?: string;
  lat: number;
  lng: number;
}

export const MozambiqueMap: React.FC<MozambiqueMapProps> = ({ onOpenChatWith }) => {
  const { machambas, products, orders, currentUser } = useAgro();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("TODAS");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("TODOS");
  const [filterType, setFilterType] = useState<"ALL" | "FARMERS" | "PRODUCTS">("ALL");
  const [selectedMachamba, setSelectedMachamba] = useState<Machamba | null>(null);
  const [activeTab, setActiveTab] = useState<"MAP" | "PRODUCTS" | "GPS_TRACKING">("MAP");

  // District & Province Search Field & Auto-Centering State
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState<boolean>(false);
  const [centeredLocation, setCenteredLocation] = useState<SearchableLocation | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);
  const machambaMarkersRef = useRef<L.Marker[]>([]);

  // Build searchable array of all districts and provinces in Mozambique
  const searchableLocations = useMemo(() => {
    const list: SearchableLocation[] = [];
    MOZAMBIQUE_PROVINCES.forEach((p) => {
      list.push({
        name: p.name,
        type: "PROVINCE",
        lat: p.lat,
        lng: p.lng,
      });
      p.districts.forEach((d) => {
        list.push({
          name: d.name,
          type: "DISTRICT",
          provinceName: p.name,
          lat: d.lat,
          lng: d.lng,
        });
      });
    });
    return list;
  }, []);

  // Filter matching districts/provinces for the search query
  const matchingLocations = useMemo(() => {
    if (!locationQuery.trim()) return [];
    const q = locationQuery.toLowerCase().trim();
    return searchableLocations
      .filter((loc) => {
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesProv = loc.provinceName ? loc.provinceName.toLowerCase().includes(q) : false;
        return matchesName || matchesProv;
      })
      .slice(0, 8);
  }, [locationQuery, searchableLocations]);

  // Center map on selected district or province
  const handleCenterOnLocation = (loc: SearchableLocation) => {
    setCenteredLocation(loc);
    setLocationQuery(loc.name);
    setIsLocationMenuOpen(false);

    if (loc.type === "PROVINCE") {
      setSelectedProvince(loc.name);
      setSelectedDistrict("TODOS");
    } else if (loc.type === "DISTRICT" && loc.provinceName) {
      setSelectedProvince(loc.provinceName);
      setSelectedDistrict(loc.name);
    }

    if (mapInstanceRef.current) {
      const zoomLevel = loc.type === "DISTRICT" ? 11 : 8;
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], zoomLevel, {
        animate: true,
        duration: 1.5,
      });
    }
  };

  // Get available districts based on selected province
  const availableDistricts = useMemo(() => {
    if (selectedProvince === "TODAS") {
      const allDistricts: string[] = [];
      MOZAMBIQUE_PROVINCES.forEach((p) => {
        p.districts.forEach((d) => {
          if (!allDistricts.includes(d.name)) {
            allDistricts.push(d.name);
          }
        });
      });
      return allDistricts.sort();
    }
    const provObj = MOZAMBIQUE_PROVINCES.find((p) => p.name === selectedProvince);
    return provObj ? provObj.districts.map((d) => d.name).sort() : [];
  }, [selectedProvince]);

  // Filter Machambas / Farmers
  const filteredMachambas = useMemo(() => {
    return machambas.filter((m) => {
      // Province Filter
      if (selectedProvince !== "TODAS" && m.province !== selectedProvince) {
        return false;
      }
      // District Filter
      if (selectedDistrict !== "TODOS" && m.district !== selectedDistrict) {
        return false;
      }
      // Search Query Filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesFarmer = m.farmerName.toLowerCase().includes(query);
        const matchesProvince = m.province.toLowerCase().includes(query);
        const matchesDistrict = m.district.toLowerCase().includes(query);
        const matchesLocalidade = m.localidade.toLowerCase().includes(query);
        const matchesCrops = m.productionTypes.some((crop) => crop.toLowerCase().includes(query));

        // Also check if any product by this farmer matches
        const farmerProducts = products.filter((p) => p.farmerId === m.farmerId);
        const matchesFarmerProducts = farmerProducts.some((p) =>
          p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
        );

        return (
          matchesName ||
          matchesFarmer ||
          matchesProvince ||
          matchesDistrict ||
          matchesLocalidade ||
          matchesCrops ||
          matchesFarmerProducts
        );
      }
      return true;
    });
  }, [machambas, products, selectedProvince, selectedDistrict, searchQuery]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Province Filter
      if (selectedProvince !== "TODAS" && p.province !== selectedProvince) {
        return false;
      }
      // District Filter
      if (selectedDistrict !== "TODOS" && p.district !== selectedDistrict) {
        return false;
      }
      // Search Query Filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesFarmer = p.farmerName.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesProvince = p.province.toLowerCase().includes(query);
        const matchesDistrict = p.district.toLowerCase().includes(query);

        return (
          matchesName ||
          matchesFarmer ||
          matchesCategory ||
          matchesDesc ||
          matchesProvince ||
          matchesDistrict
        );
      }
      return true;
    });
  }, [products, selectedProvince, selectedDistrict, searchQuery]);

  // Sync selected machamba if filtering changes
  React.useEffect(() => {
    if (filteredMachambas.length > 0) {
      if (!selectedMachamba || !filteredMachambas.some((m) => m.id === selectedMachamba.id)) {
        setSelectedMachamba(filteredMachambas[0]);
      }
    } else {
      setSelectedMachamba(null);
    }
  }, [filteredMachambas]);

  // Effect to manage Leaflet interactive map instance and markers
  useEffect(() => {
    if (activeTab !== "MAP" || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-18.6656, 35.5295],
        zoom: 6,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; MapLibre & OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Clear old machamba markers
    machambaMarkersRef.current.forEach((m) => m.remove());
    machambaMarkersRef.current = [];

    // Add Machamba Markers
    filteredMachambas.forEach((m) => {
      const isSelected = selectedMachamba?.id === m.id;
      const icon = L.divIcon({
        className: "custom-machamba-pin",
        html: `
          <div class="flex items-center justify-center">
            <div class="w-8 h-8 ${
              isSelected
                ? "bg-amber-400 border-2 border-slate-900 text-slate-950 scale-125 z-50 shadow-2xl"
                : "bg-emerald-700 border-2 border-white text-white shadow-md"
            } rounded-full flex items-center justify-center font-black text-xs transition-all">
              🌱
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([m.lat, m.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 180px;">
            <strong style="color: #065f46; font-size: 13px;">${m.name}</strong><br/>
            <span style="font-size: 11px; color: #475569;">👨‍🌾 ${m.farmerName}</span><br/>
            <span style="font-size: 10px; color: #166534;">📍 ${m.district}, ${m.province}</span>
          </div>
        `);

      marker.on("click", () => {
        setSelectedMachamba(m);
      });

      machambaMarkersRef.current.push(marker);
    });

    // Handle Centered Location Highlight Marker
    if (centeredLocation && mapInstanceRef.current) {
      if (locationMarkerRef.current) {
        locationMarkerRef.current.remove();
      }

      const locIcon = L.divIcon({
        className: "custom-loc-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-amber-400/50 rounded-full animate-ping"></div>
            <div class="w-10 h-10 bg-slate-900 border-2 border-amber-400 text-amber-300 rounded-full flex items-center justify-center shadow-2xl font-black text-sm">
              📍
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const locMarker = L.marker([centeredLocation.lat, centeredLocation.lng], { icon: locIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #d97706; font-size: 13px;">📍 ${centeredLocation.name}</strong><br/>
            <span style="font-size: 11px; color: #334155;">${
              centeredLocation.type === "DISTRICT"
                ? `Distrito de ${centeredLocation.name} (${centeredLocation.provinceName})`
                : `Província de ${centeredLocation.name}`
            }</span>
          </div>
        `);

      locMarker.openPopup();
      locationMarkerRef.current = locMarker;
    }
  }, [activeTab, filteredMachambas, selectedMachamba, centeredLocation]);

  // Auto-center map when district or province changes from dropdown
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedDistrict !== "TODOS") {
      const distMatch = searchableLocations.find(
        (l) => l.type === "DISTRICT" && l.name === selectedDistrict
      );
      if (distMatch) {
        mapInstanceRef.current.flyTo([distMatch.lat, distMatch.lng], 11, {
          animate: true,
          duration: 1.2,
        });
        setCenteredLocation(distMatch);
      }
    } else if (selectedProvince !== "TODAS") {
      const provMatch = searchableLocations.find(
        (l) => l.type === "PROVINCE" && l.name === selectedProvince
      );
      if (provMatch) {
        mapInstanceRef.current.flyTo([provMatch.lat, provMatch.lng], 8, {
          animate: true,
          duration: 1.2,
        });
        setCenteredLocation(provMatch);
      }
    }
  }, [selectedProvince, selectedDistrict, searchableLocations]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedProvince !== "TODAS" ||
    selectedDistrict !== "TODOS" ||
    filterType !== "ALL" ||
    locationQuery.trim() !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setSelectedProvince("TODAS");
    setSelectedDistrict("TODOS");
    setFilterType("ALL");
    setCenteredLocation(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-18.6656, 35.5295], 6, { animate: true, duration: 1.2 });
    }
  };

  const currentProvinceObj = MOZAMBIQUE_PROVINCES.find((p) => p.name === selectedProvince);

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER TITLE */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-700" />
            Mapa Agrícola Nacional de Moçambique
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pesquise e localize machambas, agricultores e produtos disponíveis por província e distrito.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-700" />
            {filteredMachambas.length} Machambas
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
            {filteredProducts.length} Produtos
          </span>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS COMPLETA (PROVÍNCIA, DISTRITO, AGRICULTOR, PRODUTO) */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-5 sm:p-6 rounded-3xl shadow-xl text-white border border-emerald-700/60 space-y-4">
        {/* ROW 1: SEARCH INPUT FIELD FOR PRODUCTS & FARMERS */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-emerald-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar agricultor, produto, machamba, cultura ou localidade (ex: Marracuene, Mateus, Tomate)..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-950/80 border-2 border-emerald-500/40 focus:border-amber-400 text-white rounded-2xl text-xs sm:text-sm placeholder-slate-400 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* DEDICATED DISTRICT / PROVINCE LOCATION SEARCH & AUTO-CENTERING */}
        <div className="relative bg-slate-950/60 p-3.5 rounded-2xl border border-amber-400/30">
          <label className="block text-[11px] font-bold text-amber-300 mb-1.5 flex items-center justify-between flex-wrap gap-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Pesquisar Distrito ou Província em Moçambique (Auto-Centralizar Mapa):
            </span>
            {centeredLocation && (
              <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Mapa Centralizado em: {centeredLocation.name}
              </span>
            )}
          </label>

          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-amber-400" />
              </div>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setIsLocationMenuOpen(true);
                }}
                onFocus={() => setIsLocationMenuOpen(true)}
                placeholder="Digite o nome do Distrito ou Província (ex: Marracuene, Xai-Xai, Gurúè, Gaza, Sofala, Angoche)..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border-2 border-amber-400/50 focus:border-amber-400 text-white rounded-xl text-xs font-bold placeholder-slate-400 outline-none transition-all"
              />
              {locationQuery && (
                <button
                  onClick={() => {
                    setLocationQuery("");
                    setIsLocationMenuOpen(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* SUBMIT AUTO-CENTER BUTTON */}
            <button
              onClick={() => {
                if (matchingLocations.length > 0) {
                  handleCenterOnLocation(matchingLocations[0]);
                }
              }}
              className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-slate-950" />
              <span>Centralizar</span>
            </button>
          </div>

          {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
          {isLocationMenuOpen && matchingLocations.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border-2 border-amber-400/60 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/80">
              {matchingLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCenterOnLocation(loc)}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-900/50 transition-all flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-950 transition-all">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div>
                      <strong className="text-white block font-extrabold text-xs">{loc.name}</strong>
                      <span className="text-[10px] text-slate-400">
                        {loc.type === "DISTRICT" ? `Distrito (${loc.provinceName})` : "Província"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-amber-300 font-extrabold px-2 py-1 rounded-md border border-slate-700">
                    📍 {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ROW 2: SELECTORS FOR PROVINCE, DISTRICT & CATEGORY FILTER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* PROVINCE SELECTOR */}
          <div>
            <label className="block text-[11px] font-bold text-emerald-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> Província:
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                const prov = e.target.value;
                setSelectedProvince(prov);
                setSelectedDistrict("TODOS");
              }}
              className="w-full py-2.5 px-3 bg-slate-900/90 border border-emerald-600/50 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="TODAS">🇲🇿 Todas as Províncias</option>
              {MOZAMBIQUE_PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  📍 {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* DISTRICT SELECTOR */}
          <div>
            <label className="block text-[11px] font-bold text-emerald-300 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" /> Distrito:
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-900/90 border border-emerald-600/50 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="TODOS">📍 Todos os Distritos</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* TYPE FILTER (ALL / FARMERS / PRODUCTS) */}
          <div>
            <label className="block text-[11px] font-bold text-emerald-300 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" /> Exibir:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1 rounded-xl border border-emerald-700/50 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setFilterType("ALL");
                  setActiveTab("MAP");
                }}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  filterType === "ALL"
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Tudo
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType("FARMERS");
                  setActiveTab("MAP");
                }}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  filterType === "FARMERS"
                    ? "bg-emerald-500 text-slate-950 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Machambas
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType("PRODUCTS");
                  setActiveTab("PRODUCTS");
                }}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  filterType === "PRODUCTS"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Produtos
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTERS & RESET BAR */}
        {hasActiveFilters && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-700/50 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-emerald-300 font-semibold">Filtros Ativos:</span>
              {selectedProvince !== "TODAS" && (
                <span className="px-2 py-0.5 bg-emerald-700/80 text-emerald-100 rounded-md font-bold text-[10px] flex items-center gap-1">
                  Província: {selectedProvince}
                </span>
              )}
              {selectedDistrict !== "TODOS" && (
                <span className="px-2 py-0.5 bg-amber-700/80 text-amber-100 rounded-md font-bold text-[10px] flex items-center gap-1">
                  Distrito: {selectedDistrict}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded-md font-bold text-[10px] flex items-center gap-1">
                  Termo: "{searchQuery}"
                </span>
              )}
            </div>

            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* VIEW SWITCH TABS (MAPA DE MACHAMBAS vs LISTA DE PRODUTOS vs RASTREIO GPS) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("MAP")}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            activeTab === "MAP"
              ? "bg-emerald-800 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sprout className="w-4 h-4 text-amber-400" />
          <span>Mapa de Machambas e Agricultores ({filteredMachambas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PRODUCTS")}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            activeTab === "PRODUCTS"
              ? "bg-amber-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-200" />
          <span>Produtos da Região Filtrada ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("GPS_TRACKING")}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            activeTab === "GPS_TRACKING"
              ? "bg-gradient-to-r from-slate-900 to-emerald-950 text-white shadow-md border border-emerald-500/40"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Truck className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>🚚 Rastreio GPS de Entregas</span>
        </button>
      </div>

      {activeTab === "MAP" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INTERACTIVE MAP CANVAS & MACHAMBA LIST */}
          <div className="lg:col-span-2 bg-emerald-950/95 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative min-h-[460px] flex flex-col justify-between overflow-hidden border border-emerald-800">
            {/* Top Status Bar on Map */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-emerald-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-200">
                  Província: {selectedProvince === "TODAS" ? "Moçambique Todo 🇲🇿" : selectedProvince}
                </span>
                {selectedDistrict !== "TODOS" && (
                  <span className="text-amber-300 font-extrabold">({selectedDistrict})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {centeredLocation && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-black">
                    📍 {centeredLocation.name}
                  </span>
                )}
                <span className="text-[11px] text-amber-300 font-bold">
                  {filteredMachambas.length} Machambas
                </span>
              </div>
            </div>

            {/* LEAFLET INTERACTIVE MAP CANVAS CONTAINER */}
            <div className="relative z-10 w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-600/60 mb-4">
              <div ref={mapContainerRef} className="w-full h-72 sm:h-80 z-0 bg-slate-900" />
            </div>

            {/* Visual Interactive Machamba Quick Cards Grid */}
            <div className="relative z-10 my-2">
              {filteredMachambas.length === 0 ? (
                <div className="py-8 text-center text-emerald-200/80 bg-emerald-900/40 rounded-2xl border border-emerald-800/80 p-6">
                  <Sprout className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-bold text-amber-300">Nenhuma machamba corresponde à pesquisa atual.</p>
                  <p className="text-[11px] text-emerald-300/70 mt-1 max-w-md mx-auto">
                    Tente alterar os termos da pesquisa ou selecione outra província/distrito de Moçambique.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Redefinir Pesquisa
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredMachambas.map((m) => {
                    const isSelected = selectedMachamba?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMachamba(m);
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([m.lat, m.lng], 13, {
                              animate: true,
                              duration: 1.2,
                            });
                          }
                        }}
                        className={`p-3 rounded-2xl text-left transition-all border ${
                          isSelected
                            ? "bg-amber-400 text-slate-950 border-amber-300 shadow-lg scale-102"
                            : "bg-emerald-900/80 text-white border-emerald-700 hover:bg-emerald-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold opacity-90 uppercase tracking-wide">
                            📍 {m.district}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              m.farmerOnline ? "bg-emerald-400 shadow-xs" : "bg-slate-400"
                            }`}
                            title={m.farmerOnline ? "Agricultor Online" : "Agricultor Offline"}
                          />
                        </div>
                        <div className="font-extrabold text-xs truncate">{m.name}</div>
                        <div className="text-[11px] opacity-90 truncate mt-0.5 flex items-center gap-1">
                          <span>👨‍🌾 {m.farmerName}</span>
                        </div>
                        <div className="text-[10px] opacity-75 truncate mt-1 flex flex-wrap gap-1">
                          {m.productionTypes.slice(0, 2).map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-black/20 rounded-md">
                              {c}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* District Quick Tags for Selected Province */}
            <div className="relative z-10 pt-3 border-t border-emerald-800/80 text-[11px] flex items-center gap-2 overflow-x-auto text-emerald-300">
              <span className="font-bold text-amber-300 shrink-0 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Distritos Frequentes:
              </span>
              <button
                onClick={() => setSelectedDistrict("TODOS")}
                className={`px-2.5 py-1 rounded-lg shrink-0 border text-[10px] font-bold transition-all ${
                  selectedDistrict === "TODOS"
                    ? "bg-amber-400 text-slate-950 border-amber-300"
                    : "bg-emerald-900/60 border-emerald-800 hover:bg-emerald-800"
                }`}
              >
                Todos
              </button>
              {(currentProvinceObj ? currentProvinceObj.districts : MOZAMBIQUE_PROVINCES[1].districts).map((d) => (
                <button
                  key={d.name}
                  onClick={() => setSelectedDistrict(d.name)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 border text-[10px] font-bold transition-all ${
                    selectedDistrict === d.name
                      ? "bg-amber-400 text-slate-950 border-amber-300"
                      : "bg-emerald-900/60 border-emerald-800 hover:bg-emerald-800"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* MACHAMBA DETAIL PANEL */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-emerald-100 flex flex-col justify-between space-y-4">
            {selectedMachamba ? (
              <>
                <div className="space-y-3 text-xs">
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={selectedMachamba.images[0] || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600"}
                      alt={selectedMachamba.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-950/90 text-amber-300 rounded-full font-bold text-[10px] shadow-sm">
                      {selectedMachamba.areaSize}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{selectedMachamba.name}</h3>
                    <p className="text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {selectedMachamba.localidade}, {selectedMachamba.district}, {selectedMachamba.province}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Agricultor:</span>
                      <span className="font-bold text-slate-900">{selectedMachamba.farmerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Estado Online:</span>
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selectedMachamba.farmerOnline ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {selectedMachamba.farmerOnline ? "Online agora" : "Offline"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Contacto Directo:</span>
                      <span className="font-bold text-slate-900">{selectedMachamba.farmerPhone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1.5">Culturas Produzidas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMachamba.productionTypes.map((crop, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-lg text-[10px]">
                          🌱 {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <a
                    href={`tel:${selectedMachamba.farmerPhone}`}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" /> Ligar
                  </a>

                  <button
                    onClick={() => onOpenChatWith(selectedMachamba.farmerId, selectedMachamba.farmerName)}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-amber-300" /> Chat Directo
                  </button>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Sprout className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Selecione uma machamba no mapa para visualizar os detalhes completos.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "PRODUCTS" ? (
        /* PRODUCTS TAB DISPLAY */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              Produtos Agrícolas Encontrados na Região ({filteredProducts.length})
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Nenhum produto encontrado para o filtro selecionado.</p>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste os termos de pesquisa ou a seleção de província/distrito.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-32 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src={p.images[0] || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-950/80 text-amber-300 rounded-md font-bold text-[10px]">
                        {p.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        {p.district}, {p.province}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Preço:</span>
                      <span className="text-sm font-extrabold text-emerald-800">{p.pricePerUnit} MT</span>
                      <span className="text-[10px] text-slate-500"> / {p.unit}</span>
                    </div>

                    <button
                      onClick={() => onOpenChatWith(p.farmerId, p.farmerName)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-300" /> Contactar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* GPS TRACKING TAB DISPLAY WITH MAPSCREEN */
        <div className="space-y-6">
          <MapScreen onOpenChatWith={onOpenChatWith} />
        </div>
      )}
    </div>
  );
};

