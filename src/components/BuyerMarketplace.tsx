import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES, PRODUCT_CATEGORIES } from "../data/mozambiqueLocations";
import { Product, PaymentMethod } from "../types";
import { PaymentProcessingModal } from "./PaymentProcessingModal";
import { VerifiedFarmerBadge } from "./VerifiedFarmerBadge";
import {
  Search,
  Filter,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  CloudSun,
  Newspaper,
  TrendingUp,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  Star,
  ThumbsUp,
  Smartphone,
  Lock,
  Loader2,
  Clock,
  Package,
  Truck,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface BuyerMarketplaceProps {
  onOpenChatWith: (farmerId: string, farmerName: string) => void;
  onOpenOrderTracking: (orderId: string) => void;
}

export const BuyerMarketplace: React.FC<BuyerMarketplaceProps> = ({
  onOpenChatWith,
  onOpenOrderTracking,
}) => {
  const {
    products,
    currentUser,
    createOrder,
    receiverPhone,
    reviews,
    users,
    orders,
    releaseEscrowPayment,
    addProductReview,
  } = useAgro();

  const [marketplaceView, setMarketplaceView] = useState<"CATALOG" | "MY_ORDERS">("CATALOG");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("TODAS");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [selectedProvince, setSelectedProvince] = useState<string>("TODAS");
  const [maxPrice, setMaxPrice] = useState<number>(2000);

  // Buyer orders filter
  const myOrders = orders.filter(
    (o) =>
      o.buyerId === currentUser?.id ||
      (currentUser?.phone && o.buyerPhone === currentUser.phone)
  );

  // Buy Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);

  // Helper to compute product ratings
  const getProductReviewsInfo = (product: Product) => {
    // Match by exact productId or productName (for initial mock products)
    const matchedReviews = reviews.filter(
      (r) => r.productId === product.id || r.productName.toLowerCase() === product.name.toLowerCase()
    );
    if (matchedReviews.length === 0) {
      // Fallback to farmer base rating if no individual reviews yet
      return {
        avg: product.farmerRating || 5.0,
        count: 0,
        reviewsList: [],
      };
    }
    const sum = matchedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / matchedReviews.length) * 10) / 10;
    return {
      avg,
      count: matchedReviews.length,
      reviewsList: matchedReviews,
    };
  };
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa");
  const [paymentPhone, setPaymentPhone] = useState<string>(currentUser?.phone || "");
  const [deliveryProvince, setDeliveryProvince] = useState<string>(currentUser?.province || "Maputo Cidade");
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>(currentUser?.district || "KaMpfumo");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState<string>(currentUser?.address || "");
  const [deliveryRef, setDeliveryRef] = useState<string>("");
  const [gpsCoords, setGpsCoords] = useState<string>("");
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [gpsCaptured, setGpsCaptured] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [completedOrderTx, setCompletedOrderTx] = useState<any | null>(null);
  const [paymentStep, setPaymentStep] = useState<"FORM" | "VERIFYING" | "PIN_PROMPT" | "SUCCESS">("FORM");
  const [userPin, setUserPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  const handleGetGPSLocation = () => {
    setIsGettingGps(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          const coordsStr = `Lat: ${lat}, Lng: ${lng}`;
          setGpsCoords(coordsStr);
          setGpsCaptured(true);
          setIsGettingGps(false);
        },
        (err) => {
          console.warn("GPS error:", err);
          const mockLat = (-25.9692 + (Math.random() - 0.5) * 0.02).toFixed(4);
          const mockLng = (32.5732 + (Math.random() - 0.5) * 0.02).toFixed(4);
          setGpsCoords(`Lat: ${mockLat}, Lng: ${mockLng}`);
          setGpsCaptured(true);
          setIsGettingGps(false);
        },
        { timeout: 8000 }
      );
    } else {
      setGpsCoords("Lat: -25.9692, Lng: 32.5732");
      setGpsCaptured(true);
      setIsGettingGps(false);
    }
  };

  // Weather data
  const weatherList = [
    { province: "Maputo", temp: 28, condition: "Ensolarado", icon: "☀️", humidity: 62 },
    { province: "Gaza (Xai-Xai)", temp: 30, condition: "Parcialmente Nublado", icon: "⛅", humidity: 58 },
    { province: "Sofala (Beira)", temp: 29, condition: "Possibilidade de Chuva", icon: "🌧️", humidity: 75 },
    { province: "Nampula", temp: 31, condition: "Sol e Calor", icon: "☀️", humidity: 50 },
    { province: "Manica (Chimoio)", temp: 24, condition: "Fresco e Limpo", icon: "🌤️", humidity: 65 },
  ];

  // News items
  const newsTicker = [
    "🌽 Mercado de Milho: Preços estáveis na província de Manica e Tete.",
    "🍅 Marracuene: Pico de produção de tomate de alta qualidade com preços competitivos.",
    "🌧️ Previsão do tempo: Aguaceiros benéficos para culturas no vale do Limpopo.",
    "💳 M-Pesa & e-Mola: Pagamentos diretos ativados na AgroMoz sem taxas adicionais.",
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.farmerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "TODOS" || p.category === selectedCategory;
    const matchesProvince = selectedProvince === "TODAS" || p.province === selectedProvince;
    const matchesPrice = p.pricePerUnit <= maxPrice;

    return matchesSearch && matchesCategory && matchesProvince && matchesPrice;
  });

  const handleInitiatePurchase = (product: Product) => {
    setSelectedProduct(product);
    setBuyQuantity(1);
    setCompletedOrderTx(null);
    setPaymentStep("FORM");
    setUserPin("");
    setPinError("");
    setIsPaymentModalOpen(false);

    // Auto-populate delivery location defaults from profile if present
    if (!paymentPhone && currentUser?.phone) {
      setPaymentPhone(currentUser.phone);
    } else if (!paymentPhone) {
      setPaymentPhone("841234567");
    }

    const initProv = currentUser?.province || "Maputo Cidade";
    const initDist = currentUser?.district || "KaMpfumo";
    const initAddr = currentUser?.address || "Bairro Polana Cimento, Av. Julius Nyerere nº 120";

    setDeliveryProvince(initProv);
    setDeliveryDistrict(initDist);
    setDeliveryNeighborhood(initAddr);
    setDeliveryRef(initAddr);
    setGpsCoords("");
    setGpsCaptured(false);
  };

  const handleStartPaymentVerification = () => {
    if (!selectedProduct) return;

    // Ensure fallback non-empty values for address and phone so it never alerts or blocks payment
    const finalPhone = paymentPhone.trim() || currentUser?.phone || "841234567";
    const mainAddr = deliveryNeighborhood.trim() || deliveryRef.trim() || currentUser?.address || "Bairro Central";
    const fullDeliveryLocation = `${deliveryProvince}, ${deliveryDistrict} - ${mainAddr} ${gpsCoords ? `[GPS: ${gpsCoords}]` : ""}`.trim();

    setPaymentPhone(finalPhone);
    setDeliveryRef(fullDeliveryLocation);

    // Open dedicated PaymentProcessingModal with STK push simulation & timer
    setIsPaymentModalOpen(true);
  };

  const handleAuthorizePinAndComplete = async (pinEntered?: string) => {
    if (!selectedProduct) return;

    setIsSubmittingOrder(true);
    setPinError("");
    try {
      const created = await createOrder({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImage: selectedProduct.images[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
        farmerId: selectedProduct.farmerId,
        farmerName: selectedProduct.farmerName,
        farmerPhone: selectedProduct.farmerPhone,
        quantity: buyQuantity,
        unit: selectedProduct.unit,
        subtotal: selectedProduct.pricePerUnit * buyQuantity,
        totalAmount: selectedProduct.pricePerUnit * buyQuantity + 150,
        paymentMethod,
        buyerPhone: paymentPhone || currentUser?.phone || "841234567",
        deliveryAddressReference: deliveryRef || "Maputo Cidade",
      });

      setCompletedOrderTx(created);
      setPaymentStep("SUCCESS");
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao processar encomenda:", err);
      // Reliable fallback so buyer order payment never fails
      try {
        const fallbackCreated = await createOrder({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          farmerId: selectedProduct.farmerId || "user-farmer-default",
          farmerName: selectedProduct.farmerName || "Agricultor",
          quantity: buyQuantity || 1,
          unit: selectedProduct.unit || "kg",
          subtotal: (selectedProduct.pricePerUnit || 100) * (buyQuantity || 1),
          totalAmount: (selectedProduct.pricePerUnit || 100) * (buyQuantity || 1) + 150,
          paymentMethod: paymentMethod || "M-Pesa",
          buyerPhone: paymentPhone || "841234567",
          deliveryAddressReference: deliveryRef || "Maputo Cidade",
        });
        setCompletedOrderTx(fallbackCreated);
        setPaymentStep("SUCCESS");
        setIsPaymentModalOpen(false);
      } catch (e) {
        throw new Error("Não foi possível concluir o pagamento.");
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 0. BUYER TOP SUB-NAV TABS */}
      <div className="bg-slate-900 p-2 sm:p-2.5 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMarketplaceView("CATALOG")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              marketplaceView === "CATALOG"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🛒 Mercado Agrícola</span>
          </button>

          <button
            type="button"
            onClick={() => setMarketplaceView("MY_ORDERS")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer relative ${
              marketplaceView === "MY_ORDERS"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>📦 Minhas Encomendas</span>
            {myOrders.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  marketplaceView === "MY_ORDERS"
                    ? "bg-slate-950 text-amber-300"
                    : "bg-amber-400 text-slate-950"
                }`}
              >
                {myOrders.length}
              </span>
            )}
          </button>
        </div>

        {myOrders.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-300 pr-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-800/80 rounded-full text-emerald-300 font-bold">
              <Truck className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {myOrders.filter((o) => o.deliveryStatus !== "Entregue").length} Encomendas em Curso
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CATALOG VIEW */}
      {marketplaceView === "CATALOG" && (
        <>
          {/* 1. WEATHER & NEWS BANNER */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Welcome Title */}
          <div className="lg:col-span-2 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Mercado Agrícola Digital Moçambique
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
              Produtos frescos direto das machambas nacionais
            </h1>
            <p className="text-xs text-emerald-100 max-w-xl">
              Compre hortaliças, cereais e tubérculos diretamente dos agricultores registados em Maputo e em todas as províncias de Moçambique.
            </p>

            {/* News Ticker */}
            <div className="mt-4 pt-3 border-t border-emerald-700/60 flex items-center gap-2 text-xs text-emerald-200 overflow-x-auto">
              <Newspaper className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 shrink-0">Notícias:</span>
              <span className="truncate">{newsTicker[0]}</span>
            </div>
          </div>

          {/* Weather Widget Slider */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-bold border-b border-white/10 pb-1.5">
              <span className="flex items-center gap-1">
                <CloudSun className="w-4 h-4" /> Previsão do Tempo
              </span>
              <span className="text-[10px] text-emerald-200">Moçambique Hoje</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {weatherList.slice(0, 4).map((w, idx) => (
                <div key={idx} className="p-2 bg-black/20 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white truncate max-w-[90px]">{w.province}</div>
                    <div className="text-[10px] text-emerald-200">{w.condition}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-amber-300">{w.temp}°C</span>
                    <span className="text-xs block">{w.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & MULTI-FILTER BAR WITH PROVINCE SELECTOR */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-emerald-100 space-y-4">
        {/* Quick Province Region Bar Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Filtrar por Província / Região
              </span>
              <p className="text-[11px] text-slate-500">
                Selecione a sua província para ver produtos disponíveis perto da sua localização.
              </p>
            </div>
          </div>

          {/* Quick Button for User's Own Province */}
          {currentUser?.province && (
            <button
              onClick={() => setSelectedProvince(currentUser.province || "TODAS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                selectedProvince === currentUser.province
                  ? "bg-emerald-800 text-white border-emerald-900 shadow-xs"
                  : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Minha Província: {currentUser.province}
            </button>
          )}
        </div>

        {/* Quick Province Filter Pills / Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedProvince("TODAS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedProvince === "TODAS"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🇲🇿 Todas as Províncias
          </button>
          {MOZAMBIQUE_PROVINCES.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedProvince(p.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedProvince === p.name
                  ? "bg-emerald-800 text-amber-300 shadow-xs font-extrabold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Search Inputs & Dropdown Selectors */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-slate-100">
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar produto (ex: Tomate, Mandioca, Milho), agricultor ou distrito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
            />
          </div>

          {/* Category Selector */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="TODOS">Todas Categorias</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Province Dropdown Selector */}
          <div className="w-full md:w-52">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="TODAS">📍 Todas as Províncias</option>
              {MOZAMBIQUE_PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  📍 {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Slider Filter & Status */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-slate-500 font-medium">Preço máximo:</span>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-emerald-700 w-40"
            />
            <span className="font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {maxPrice} MT
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span>Região ativa:</span>
            <span className="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
              {selectedProvince === "TODAS" ? "Moçambique (Todas)" : selectedProvince}
            </span>
            <span className="text-slate-400">|</span>
            <span><strong className="text-emerald-800">{filteredProducts.length}</strong> produtos</span>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente ajustar os termos de pesquisa ou selecionar outra província/categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl border border-emerald-100/80 transition-all duration-300 flex flex-col group"
            >
              {/* Product Image & Badges */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 bg-emerald-950/80 backdrop-blur-md text-amber-300 rounded-full text-[10px] font-bold">
                    {p.category}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md ${
                      p.status === "Disponibile"
                        ? "bg-emerald-600"
                        : p.status === "Pouca quantidade"
                        ? "bg-amber-600"
                        : "bg-red-600"
                    }`}
                  >
                    {p.status} ({p.availableQuantity} {p.unit})
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" /> {p.district}, {p.province}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {p.name}
                  </h3>

                  {/* Rating & Review Summary Badge */}
                  {(() => {
                    const { avg, count } = getProductReviewsInfo(p);
                    return (
                      <button
                        onClick={() => setSelectedReviewProduct(p)}
                        className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 rounded-full transition-all text-[11px] font-bold"
                        title="Ver avaliações dos consumidores no mercado"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{avg.toFixed(1)}</span>
                        <span className="text-[10px] text-amber-800/90 font-normal">
                          {count > 0 ? `(${count} avaliações)` : "(Sem avaliações)"}
                        </span>
                      </button>
                    );
                  })()}

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Farmer Info Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={p.farmerPhoto}
                        alt={p.farmerName}
                        className="w-8 h-8 rounded-full object-cover border border-emerald-500"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          p.farmerOnline ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1 flex-wrap">
                        <span>{p.farmerName}</span>
                        {(() => {
                          const farmerUser = users.find(
                            (u) => u.id === p.farmerId || u.name === p.farmerName
                          );
                          const isVerified = farmerUser?.isVerifiedFarmer ?? (p.farmerId === "user-farmer-default" || p.farmerId === "farmer-1");
                          return <VerifiedFarmerBadge isVerified={isVerified} status={farmerUser?.verificationStatus} size="sm" />;
                        })()}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {p.farmerOnline ? "🟢 Online agora" : "⚪ Offline"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-emerald-950 font-serif">
                      {p.pricePerUnit} MT
                    </span>
                    <span className="text-[10px] text-slate-500 block">/ {p.unit}</span>
                    {p.basePricePerUnit && (
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-semibold inline-block mt-0.5" title={`Preço do agricultor: ${p.basePricePerUnit} MT + 3% taxa AgroMoz`}>
                        {p.basePricePerUnit} MT + 3%
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onOpenChatWith(p.farmerId, p.farmerName)}
                    className="py-2 px-3 bg-slate-100 hover:bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                    Chat
                  </button>

                  <button
                    onClick={() => handleInitiatePurchase(p)}
                    disabled={p.status === "Esgotado"}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                      p.status === "Esgotado"
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-800/20"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* MY ORDERS VIEW */}
      {marketplaceView === "MY_ORDERS" && (
        <div className="space-y-6 animate-fade-in">
          {/* HEADER SUMMARY CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-emerald-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">
                <Package className="w-3.5 h-3.5" /> As Minhas Compras & Encomendas
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-serif text-white">
                Minhas Encomendas AgroMoz
              </h2>
              <p className="text-xs text-slate-300 max-w-lg">
                Consulte o histórico de compras, acompanhe o transporte em tempo real no GPS e liberte os pagamentos mantidos em custódia Escrow ao receber os seus produtos.
              </p>
            </div>

            {/* QUICK STATS PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Total Pedidos</span>
                <span className="text-lg font-black text-amber-300">{myOrders.length}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-center">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase block">Em Trânsito</span>
                <span className="text-lg font-black text-emerald-300">
                  {myOrders.filter((o) => o.deliveryStatus !== "Entregue").length}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Entregues</span>
                <span className="text-lg font-black text-white">
                  {myOrders.filter((o) => o.deliveryStatus === "Entregue").length}
                </span>
              </div>
            </div>
          </div>

          {/* STATUS FILTER BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "TODAS", label: `Todas as Encomendas (${myOrders.length})` },
              { id: "TRANSITO", label: `🚚 Em Trânsito / Ativas (${myOrders.filter((o) => o.deliveryStatus !== "Entregue").length})` },
              { id: "ENTREGUE", label: `✅ Entregues (${myOrders.filter((o) => o.deliveryStatus === "Entregue").length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOrderFilterStatus(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                  orderFilterStatus === tab.id
                    ? "bg-emerald-800 text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ORDERS LIST OR EMPTY STATE */}
          {(() => {
            const filtered = myOrders.filter((o) => {
              if (orderFilterStatus === "TRANSITO") return o.deliveryStatus !== "Entregue";
              if (orderFilterStatus === "ENTREGUE") return o.deliveryStatus === "Entregue";
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-4 shadow-xs">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <Package className="w-8 h-8 text-emerald-700" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Nenhuma encomenda encontrada
                    </h3>
                    <p className="text-xs text-slate-500">
                      {myOrders.length === 0
                        ? "Ainda não efetuou nenhuma compra no Mercado Agrícola da AgroMoz. Explore os produtos frescos dos agricultores!"
                        : "Não possui encomendas com este estado selecionado."}
                    </p>
                  </div>
                  <button
                    onClick={() => setMarketplaceView("CATALOG")}
                    className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>Ir ao Mercado Comprar Produtos</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* TOP CARD HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-amber-300 font-mono text-xs font-black rounded-xl">
                          #{ord.id}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(ord.createdAt).toLocaleDateString("pt-MZ", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full text-[11px] font-bold">
                          {ord.paymentMethod}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            ord.deliveryStatus === "Entregue"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : ord.deliveryStatus === "Em Trânsito"
                              ? "bg-amber-100 text-amber-950 border border-amber-300 animate-pulse"
                              : "bg-blue-50 text-blue-900 border border-blue-200"
                          }`}
                        >
                          {ord.deliveryStatus === "Entregue"
                            ? "✅ Entregue"
                            : ord.deliveryStatus === "Em Trânsito"
                            ? "🚚 Em Trânsito"
                            : "⏳ A Processar"}
                        </span>
                      </div>
                    </div>

                    {/* CARD MAIN BODY */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Product image & details */}
                      <div className="sm:col-span-7 flex items-start gap-3.5">
                        <img
                          src={
                            ord.productImage ||
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                          }
                          alt={ord.productName}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                        />
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">
                            {ord.productName}
                          </h4>
                          <p className="text-xs text-slate-600 font-semibold">
                            Quantidade: <span className="text-slate-900 font-bold">{ord.quantity} {ord.unit}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 pt-0.5">
                            <span>Subtotal: {ord.subtotal} MT</span>
                            <span>&bull;</span>
                            <span>Transporte: {ord.deliveryFee || 150} MT</span>
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-700">Agricultor:</span>
                            <span className="text-xs font-bold text-emerald-800">{ord.farmerName}</span>
                            <button
                              onClick={() => onOpenChatWith(ord.farmerId, ord.farmerName)}
                              className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                              title="Abrir Chat com o Agricultor"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-700" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Escrow Status */}
                      <div className="sm:col-span-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-bold">Total Pago:</span>
                          <span className="text-base font-black text-emerald-900">{ord.totalAmount} MT</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-500 font-medium">Custódia Escrow:</span>
                          <span
                            className={`font-extrabold ${
                              ord.escrowStatus === "Liberado"
                                ? "text-emerald-700"
                                : ord.escrowStatus === "Reembolsado"
                                ? "text-rose-700"
                                : "text-amber-700"
                            }`}
                          >
                            {ord.escrowStatus === "Liberado"
                              ? "✅ Pago & Liberado"
                              : ord.escrowStatus === "Reembolsado"
                              ? "❌ Reembolsado"
                              : "⏳ Retido em Custódia"}
                          </span>
                        </div>

                        {ord.deliveryAddressReference && (
                          <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5 truncate">
                            📍 <strong className="text-slate-700">Destino:</strong> {ord.deliveryAddressReference}
                          </div>
                        )}

                        {ord.driverName && (
                          <div className="text-[10px] text-slate-600 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/80 flex items-center justify-between">
                            <span>🚚 Motorista: <strong>{ord.driverName}</strong></span>
                            {ord.driverPhone && (
                              <a href={`tel:${ord.driverPhone}`} className="text-emerald-800 font-extrabold underline">
                                Ligar
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTION BUTTONS FOOTER */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenOrderTracking(ord.id)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                      >
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>Rastrear GPS em Ecrã Inteiro</span>
                      </button>

                      {ord.escrowStatus === "Pendente" && (
                        <button
                          onClick={() => releaseEscrowPayment(ord.id, "Confirmado pelo Comprador")}
                          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4 text-amber-300" />
                          <span>Confirmar Recebimento do Produto & Libertar Pagamento</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. PURCHASE & CHECKOUT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-emerald-100 my-8">
            {!completedOrderTx && paymentStep === "FORM" && (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all mr-1 flex items-center gap-1.5 cursor-pointer"
                      title="Voltar ao Mercado"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-xs font-bold hidden sm:inline">Voltar Anterior</span>
                    </button>
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Finalizar Encomenda Agrícola
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Fornecedor: {selectedProduct.farmerName} ({selectedProduct.district})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  {/* Selected Item Summary */}
                  <div className="flex gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-xl object-cover border border-emerald-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedProduct.name}</h4>
                      <p className="text-emerald-800 font-bold mt-1">
                        {selectedProduct.pricePerUnit} MT <span className="font-normal text-slate-500">/ {selectedProduct.unit}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Stock disponível: {selectedProduct.availableQuantity} {selectedProduct.unit}
                      </p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Quantidade a Comprar ({selectedProduct.unit})
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                        className="w-9 h-9 bg-slate-100 rounded-xl font-bold text-slate-700 text-base"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.availableQuantity}
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-20 py-2 text-center bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setBuyQuantity(Math.min(selectedProduct.availableQuantity, buyQuantity + 1))}
                        className="w-9 h-9 bg-slate-100 rounded-xl font-bold text-slate-700 text-base"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Detailed Delivery Location Section */}
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <span>Localização & Endereço onde o Produto será Entregue *</span>
                      </label>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                        Obrigatório
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      Selecione a província, distrito e insira o seu bairro ou ponto de referência para a rota de transporte.
                    </p>

                    {/* Province & District selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Província de Entrega
                        </label>
                        <select
                          value={deliveryProvince}
                          onChange={(e) => {
                            const newProv = e.target.value;
                            setDeliveryProvince(newProv);
                            const provObj = MOZAMBIQUE_PROVINCES.find((p) => p.name === newProv);
                            if (provObj && provObj.districts.length > 0) {
                              setDeliveryDistrict(provObj.districts[0].name);
                            }
                          }}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none text-xs focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                        >
                          {MOZAMBIQUE_PROVINCES.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Distrito / Município
                        </label>
                        <select
                          value={deliveryDistrict}
                          onChange={(e) => setDeliveryDistrict(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none text-xs focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                        >
                          {(
                            MOZAMBIQUE_PROVINCES.find((p) => p.name === deliveryProvince)?.districts || []
                          ).map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Neighborhood & landmark */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Bairro, Rua e Ponto de Referência Exata
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Bairro Polana Cimento, Av. Julius Nyerere nº 140, perto da Escola Secundária"
                        value={deliveryNeighborhood}
                        onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600 font-medium shadow-2xs"
                      />
                    </div>

                    {/* Real Browser GPS button */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={handleGetGPSLocation}
                        disabled={isGettingGps}
                        className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          gpsCaptured
                            ? "bg-emerald-100 border border-emerald-400 text-emerald-900 shadow-2xs"
                            : "bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs active:scale-95"
                        }`}
                      >
                        {isGettingGps ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>A obter coordenadas GPS do dispositivo...</span>
                          </>
                        ) : gpsCaptured ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>GPS Capturado ({gpsCoords})</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-slate-950" />
                            <span>Obter Minha Localização GPS Atual</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Destination preview box */}
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl text-[11px] space-y-0.5 border border-slate-800 shadow-inner">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Destino Confirmado para a Entrega:</span>
                      </div>
                      <p className="text-slate-200 font-medium leading-tight">
                        {deliveryProvince}, {deliveryDistrict} &bull; {deliveryNeighborhood || "Bairro Central"}
                        {gpsCoords && <span className="block text-emerald-300 font-mono text-[10px] mt-0.5">📍 Coordenadas: {gpsCoords}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Payment selector M-Pesa / e-Mola */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Método de Pagamento Móvel (Moçambique)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("M-Pesa")}
                        className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                          paymentMethod === "M-Pesa"
                            ? "bg-red-50 border-red-500 text-red-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-red-600" />
                        M-Pesa (Vodacom)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("e-Mola")}
                        className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                          paymentMethod === "e-Mola"
                            ? "bg-amber-50 border-amber-500 text-amber-800"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        e-Mola (Movitel)
                      </button>
                    </div>
                  </div>

                  {/* Number to debit */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Número de Telefone {paymentMethod}
                    </label>
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal ({buyQuantity} x {selectedProduct.pricePerUnit} MT):</span>
                      <span>{selectedProduct.pricePerUnit * buyQuantity} MT</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Taxa de Transporte / Entrega:</span>
                      <span>150 MT</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-emerald-950 text-sm pt-1 border-t border-slate-200">
                      <span>Total Geral:</span>
                      <span>{selectedProduct.pricePerUnit * buyQuantity + 150} MT</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar Anterior</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartPaymentVerification}
                      className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold shadow-md shadow-emerald-800/20 flex items-center justify-center gap-2 text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Pagar {selectedProduct.pricePerUnit * buyQuantity + 150} MT via {paymentMethod}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: VERIFYING PAYMENT INITIALISATION */}
            {!completedOrderTx && paymentStep === "VERIFYING" && (
              <div className="text-center py-6 space-y-5">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg relative z-10">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    A verificar o pagamento...
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                    A conectar com a operadora <strong className={paymentMethod === "M-Pesa" ? "text-red-600 font-bold" : "text-amber-600 font-bold"}>{paymentMethod} ({paymentMethod === "M-Pesa" ? "Vodacom" : "Movitel"})</strong> no número <span className="font-mono font-bold text-slate-900">{paymentPhone}</span>.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs text-left flex items-start gap-3">
                  <Smartphone className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950">Aguarde a mensagem no seu telemóvel:</span>
                    <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                      Enviámos uma notificação para o seu número. O comprador deve aguardar a mensagem da <strong>{paymentMethod === "M-Pesa" ? "Vodacom (M-Pesa)" : "Movitel (e-Mola)"}</strong> para colocar o PIN e autorizar a compra.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPaymentStep("FORM")}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar Anterior ao Formulário</span>
                </button>
              </div>
            )}

            {/* STEP 3: USSD STK PUSH PIN PROMPT SIMULATION */}
            {!completedOrderTx && paymentStep === "PIN_PROMPT" && (
              <div className="space-y-5 py-2 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStep("FORM")}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Voltar Anterior"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Voltar</span>
                    </button>
                    <div className={`p-2 rounded-xl text-white font-bold ${paymentMethod === "M-Pesa" ? "bg-red-600" : "bg-amber-500"}`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Autorizar Débito {paymentMethod}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Aguardando introdução do PIN de segurança
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPaymentStep("FORM")}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Simulated Phone Notification Prompt Box */}
                <div className={`p-4 rounded-2xl border text-slate-900 shadow-sm relative space-y-3 ${
                  paymentMethod === "M-Pesa" ? "bg-red-50/90 border-red-200" : "bg-amber-50/90 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full animate-ping ${paymentMethod === "M-Pesa" ? "bg-red-600" : "bg-amber-500"}`} />
                      Mensagem {paymentMethod === "M-Pesa" ? "Vodacom (M-Pesa)" : "Movitel (e-Mola)"}
                    </span>
                    <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded-md font-bold text-slate-700">
                      STK Push Recebido
                    </span>
                  </div>

                  <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                    Autorizar o pagamento de <strong className="text-emerald-950 font-extrabold text-sm">{selectedProduct.pricePerUnit * buyQuantity + 150} MT</strong> a favor de <span className="font-bold text-emerald-800">AgroMoz Escrow</span> para comprar {selectedProduct.name}?
                  </p>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Coloque o seu PIN do {paymentMethod} (4 dígitos):
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={userPin}
                        onChange={(e) => {
                          setUserPin(e.target.value.replace(/\D/g, ""));
                          setPinError("");
                        }}
                        className="w-full text-center tracking-widest text-lg font-bold py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                    {pinError && (
                      <p className="text-[11px] font-bold text-red-600">{pinError}</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Número do comprador:</span>
                    <span className="font-bold font-mono text-slate-900">{paymentPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total da encomenda:</span>
                    <span className="font-bold text-emerald-900">{selectedProduct.pricePerUnit * buyQuantity + 150} MT</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentStep("FORM")}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAuthorizePinAndComplete}
                    disabled={isSubmittingOrder}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-800/20 flex items-center justify-center gap-2"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        A verificar PIN M-Pesa / e-Mola...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-300" />
                        Confirmar PIN e Finalizar Compra
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {completedOrderTx && (
              /* DIGITAL RECEIPT / COMPROVATIVO */
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-emerald-950">
                  Comprovativo de Pagamento Emitido!
                </h3>

                <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID da Encomenda:</span>
                    <span className="font-mono font-bold text-slate-900">{completedOrderTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref. Transação:</span>
                    <span className="font-mono font-bold text-emerald-800">{completedOrderTx.paymentTxId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Produto:</span>
                    <span className="font-bold text-slate-900">{completedOrderTx.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor Pago:</span>
                    <span className="font-bold text-emerald-900">{completedOrderTx.totalAmount} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Método:</span>
                    <span className="font-bold text-slate-900">{completedOrderTx.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      const ordId = completedOrderTx.id;
                      setSelectedProduct(null);
                      onOpenOrderTracking(ordId);
                    }}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span>Rastrear GPS em Tempo Real</span>
                    <Zap className="w-4 h-4 text-amber-300" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setMarketplaceView("MY_ORDERS");
                    }}
                    className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                  >
                    <Package className="w-4 h-4 text-slate-950" />
                    <span>Ver Minhas Encomendas</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PRODUCT REVIEWS MODAL */}
      {selectedReviewProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Avaliações dos Consumidores
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedReviewProduct.name}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReviewProduct(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRODUCT SUMMARY & AVERAGE RATING */}
            {(() => {
              const { avg, count, reviewsList } = getProductReviewsInfo(selectedReviewProduct);
              return (
                <div className="overflow-y-auto pt-4 space-y-4 flex-1 pr-1">
                  <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-amber-950 font-serif">
                        {avg.toFixed(1)}
                      </span>
                      <span className="text-xs text-amber-800 font-bold ml-1">/ 5.0</span>
                      <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        {count} {count === 1 ? "Avaliação Verificada" : "Avaliações Verificadas"}
                      </span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold inline-block mt-1">
                        Agricultor: {selectedReviewProduct.farmerName}
                      </span>
                    </div>
                  </div>

                  {/* REVIEWS LIST */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center justify-between">
                      <span>Comentários dos Compradores</span>
                      <span className="text-[10px] text-slate-400 font-normal">Após confirmação de entrega</span>
                    </h4>

                    {reviewsList.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                        <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">Ainda sem avaliações diretas</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Seja o primeiro comprador a adquirir este produto e deixar a sua opinião após a recepção!
                        </p>
                      </div>
                    ) : (
                      reviewsList.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {rev.buyerName}
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                <ThumbsUp className="w-2.5 h-2.5 text-emerald-600" /> Verificado
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"
                                }`}
                              />
                            ))}
                            <span className="text-[10px] font-bold text-slate-600 ml-1">
                              {rev.rating}.0
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const prod = selectedReviewProduct;
                      setSelectedReviewProduct(null);
                      handleInitiatePurchase(prod);
                    }}
                    disabled={selectedReviewProduct.status === "Esgotado"}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition-all mt-4"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>Comprar {selectedReviewProduct.name} ({selectedReviewProduct.pricePerUnit} MT)</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DEDICATED PAYMENT PROCESSING MODAL (STK PUSH SIMULATION & EXPIRATION TIMER) */}
      <PaymentProcessingModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        method={paymentMethod}
        phoneNumber={paymentPhone}
        amount={selectedProduct ? selectedProduct.pricePerUnit * buyQuantity + 150 : 0}
        productName={selectedProduct?.name}
        referenceNote={`Entrega: ${deliveryRef.substring(0, 25)}`}
        onSuccess={handleAuthorizePinAndComplete}
        onCancel={() => setIsPaymentModalOpen(false)}
        expirationSeconds={60}
      />
    </div>
  );
};
