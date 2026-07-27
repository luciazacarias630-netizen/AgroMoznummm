import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES, PRODUCT_CATEGORIES } from "../data/mozambiqueLocations";
import { Product, StockStatus } from "../types";
import { FarmerSalesReports } from "./FarmerSalesReports";
import {
  findMatchingCropByText,
  simulateAICropScan,
  CROP_DATABASE,
} from "../utils/productImageScanner";
import {
  Sprout,
  PlusCircle,
  Package,
  TrendingUp,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Smartphone,
  Info,
  ShieldAlert,
  ListOrdered,
  Users,
  ShieldCheck,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Camera,
  Sparkles,
  Scan,
  Check,
  Image as ImageIcon,
} from "lucide-react";

export const FarmerDashboard: React.FC = () => {
  const {
    currentUser,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    machambas,
    addMachamba,
    receiverPhone,
    transactions,
  } = useAgro();

  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [showAddMachambaModal, setShowAddMachambaModal] = useState(false);

  // New Product form state
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState<Product["category"]>("Hortaliças");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState<number>(300);
  const [prodUnit, setProdUnit] = useState("caixa (20kg)");
  const [prodQty, setProdQty] = useState<number>(50);
  const [prodImgUrl, setProdImgUrl] = useState(
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600"
  );
  const [termsAccepted, setTermsAccepted] = useState(false);

  // AI Product Scanner & Auto-Detection state
  const [isScanning, setIsScanning] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("Iniciando câmara do dispositivo...");
  const [aiMatchedCropName, setAiMatchedCropName] = useState<string | null>("Tomate Fresco");

  // Auto-match crop photo and category dynamically as the farmer types
  const handleProdNameChange = (nameInput: string) => {
    setProdName(nameInput);
    if (nameInput.trim().length >= 2) {
      const match = findMatchingCropByText(nameInput);
      if (match) {
        setProdImgUrl(match.imageUrl);
        setProdCategory(match.category);
        if (match.defaultUnit) setProdUnit(match.defaultUnit);
        if (match.suggestedPrice && prodPrice === 300) setProdPrice(match.suggestedPrice);
        setAiMatchedCropName(match.name);
      }
    }
  };

  // Run AI Crop Vision Scan
  const handleRunAIScan = async (targetQuery?: string) => {
    setIsScanning(true);
    setScanProgress(20);
    setScanMessage("A digitalizar folhas, fruto e textura da colheita...");

    const p1 = setTimeout(() => {
      setScanProgress(60);
      setScanMessage("A analisar características botânicas com IA AgroMoz...");
    }, 400);

    const p2 = setTimeout(() => {
      setScanProgress(90);
      setScanMessage("A gerar imagem HD e atribuir categoria específica...");
    }, 800);

    const result = await simulateAICropScan(targetQuery || prodName);
    clearTimeout(p1);
    clearTimeout(p2);

    setScanProgress(100);
    setProdImgUrl(result.imageUrl);
    setProdCategory(result.category);
    if (!prodName) setProdName(result.detectedName);
    setProdUnit(result.suggestedUnit);
    if (result.suggestedPrice) setProdPrice(result.suggestedPrice);
    setAiMatchedCropName(result.detectedName);

    setTimeout(() => {
      setIsScanning(false);
      setShowScannerModal(false);
      setScanProgress(0);
    }, 600);
  };

  // Real-time 3% AgroMoz Pricing Margin Calculations
  const basePriceNum = prodPrice || 0;
  const agroMozMargin3Pct = Math.round(basePriceNum * 0.03 * 100) / 100;
  const finalConsumerPrice = basePriceNum + agroMozMargin3Pct;

  // New Machamba form state
  const [mName, setMName] = useState("");
  const [mArea, setMArea] = useState("3 Hectares");
  const [mCrops, setMCrops] = useState("Tomate, Pimento, Alface");
  const [mLocalidade, setMLocalidade] = useState("");

  const farmerProducts = products.filter((p) => p.farmerId === currentUser?.id);
  const farmerOrders = orders.filter((o) => o.farmerId === currentUser?.id);
  const farmerMachambas = machambas.filter((m) => m.farmerId === currentUser?.id);
  const farmerTxs = transactions.filter((t) => t.userId === currentUser?.id);

  // Escrow & Financial Calculations
  const grossRevenue = farmerOrders.reduce((acc, curr) => acc + (curr.subtotal || curr.totalAmount || 0), 0);
  const totalAppliedFees = farmerOrders.reduce(
    (acc, curr) => acc + (curr.platformFee || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.05)),
    0
  );

  const pendingEscrowBalance = farmerOrders
    .filter((o) => o.escrowStatus === "Pendente")
    .reduce((acc, curr) => acc + (curr.farmerNetAmount || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.95)), 0);

  const releasedRevenue = farmerOrders
    .filter((o) => o.escrowStatus === "Liberado")
    .reduce((acc, curr) => acc + (curr.farmerNetAmount || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.95)), 0);

  // Available balance in wallet
  let availableBalance = releasedRevenue;
  farmerTxs.forEach((t) => {
    if (t.type === "SAÍDA") availableBalance -= t.amount;
  });
  availableBalance = Math.max(0, availableBalance);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert("Por favor aceite os Termos e Condições da AgroMoz para publicar o produto.");
      return;
    }

    try {
      addProduct({
        name: prodName,
        category: prodCategory,
        description: prodDesc,
        basePricePerUnit: basePriceNum,
        agroMozMargin: agroMozMargin3Pct,
        pricePerUnit: finalConsumerPrice,
        unit: prodUnit,
        availableQuantity: prodQty,
        images: [prodImgUrl],
        termsAccepted: true,
      });
      setShowAddProdModal(false);
      setProdName("");
      setProdDesc("");
      setTermsAccepted(false);
    } catch (err: any) {
      alert(err.message || "Erro ao publicar produto.");
    }
  };

  const handleCreateMachamba = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addMachamba({
        name: mName,
        areaSize: mArea,
        productionTypes: mCrops.split(",").map((s) => s.trim()),
        localidade: mLocalidade,
      });
      setShowAddMachambaModal(false);
      setMName("");
    } catch (err: any) {
      alert(err.message || "Erro ao registar machamba.");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. FARMER HEADER & MEMBERSHIP BANNER */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.photoUrl}
            alt={currentUser?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentUser?.name}</h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                🌾 Agricultor Registado
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {currentUser?.farmName || "Machamba"} — {currentUser?.district}, {currentUser?.province}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAddMachambaModal(true)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Sprout className="w-4 h-4 text-emerald-700" />
            + Registar Machamba
          </button>

          <button
            onClick={() => setShowAddProdModal(true)}
            className="flex-1 md:flex-initial py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-800/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            + Publicar Produto
          </button>
        </div>
      </div>

      {/* 50 MT FEE STATUS WARNING (IF PENDING) */}
      {!currentUser?.membershipFeePaid && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-3xl text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900">Conta 'Pendente de Pagamento da Taxa de Adesão'</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Efetue o pagamento único de 50 MT para a conta de recebimento oficial <strong className="font-mono">{receiverPhone}</strong> para desbloquear a publicação de produtos no mercado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FINANCIAL STATS CARDS (ESCROW & WALLET) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-800 to-green-950 text-white p-5 rounded-3xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-200">Saldo Disponível</span>
            <div className="p-1.5 bg-emerald-700/60 rounded-xl text-amber-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-serif text-amber-300">
            {availableBalance.toLocaleString()} MT
          </div>
          <span className="text-[10px] text-emerald-200 font-medium block mt-1">
            Pronto para levantamento
          </span>
        </div>

        <div className="bg-amber-500/10 border-2 border-amber-400/50 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Em Custódia
            </span>
            <div className="p-1.5 bg-amber-200/60 rounded-xl text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-serif text-amber-900">
            {pendingEscrowBalance.toLocaleString()} MT
          </div>
          <span className="text-[10px] text-amber-800 font-medium block mt-1">
            A libertar após entrega
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Taxas AgroMoz (5%)</span>
            <div className="p-1.5 bg-amber-50 rounded-xl text-amber-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-serif text-slate-900">
            -{totalAppliedFees.toLocaleString()} MT
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            Comissão por intermediação
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Faturação Bruta</span>
            <div className="p-1.5 bg-emerald-50 rounded-xl text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-serif text-slate-900">
            {grossRevenue.toLocaleString()} MT
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block mt-1">
            {farmerOrders.length} encomendas recebidas
          </span>
        </div>
      </div>

      {/* 3. PAINEL DE CUSTÓDIA & HISTÓRICO FINANCEIRO DAS VENDAS */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-700" />
              Histórico Financeiro & Custódia de Pagamentos (Escrow)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe as suas vendas, a comissão de 5% da AgroMoz e o estado de libertação do dinheiro.
            </p>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Garantia AgroMoz:</strong> O valor do comprador fica protegido em custódia até à entrega.
            </span>
          </div>
        </div>

        {farmerOrders.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">Ainda não realizou nenhuma venda no aplicativo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Pedido / Data</th>
                  <th className="py-3 px-3">Produto & Quantidade</th>
                  <th className="py-3 px-3">Comprador</th>
                  <th className="py-3 px-3">Valor Bruto</th>
                  <th className="py-3 px-3 text-amber-700">Taxa AgroMoz (5%)</th>
                  <th className="py-3 px-3 text-emerald-800">Líquido a Receber</th>
                  <th className="py-3 px-3">Estado Custódia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmerOrders.map((o) => {
                  const sub = o.subtotal || o.totalAmount || 0;
                  const fee = o.platformFee || Math.round(sub * 0.05);
                  const net = o.farmerNetAmount || sub - fee;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{o.id}</span>
                        <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-950 block">{o.productName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {o.quantity} {o.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {o.buyerName}
                        <span className="text-[10px] text-slate-400 block">{o.buyerPhone}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">{sub} MT</td>
                      <td className="py-3 px-3 font-bold text-amber-700 font-mono">-{fee} MT</td>
                      <td className="py-3 px-3 font-extrabold text-emerald-800 font-mono">{net} MT</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1 ${
                            o.escrowStatus === "Liberado"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.escrowStatus === "Reembolsado"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {o.escrowStatus === "Liberado" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Liberado na Carteira
                            </>
                          ) : o.escrowStatus === "Reembolsado" ? (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              Reembolsado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Retido em Custódia
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RELATÓRIOS DE VENDAS E DESEMPENHO DE COLHEITA */}
      <FarmerSalesReports farmerOrders={farmerOrders} farmerProducts={farmerProducts} />

      {/* 4. LIST OF PUBLISHED PRODUCTS & STOCK MANAGEMENT */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-emerald-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            Gestão de Stock e Produtos Publicados
          </h2>
        </div>

        {farmerProducts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">Ainda não publicou nenhum produto agrícola.</p>
            <button
              onClick={() => setShowAddProdModal(true)}
              className="mt-2 text-xs text-emerald-700 font-bold hover:underline"
            >
              + Publicar primeiro produto agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmerProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group"
              >
                <div className="flex gap-3">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                    <p className="text-[11px] text-emerald-800 font-bold">
                      {p.pricePerUnit} MT / {p.unit}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.status === "Disponibile"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "Pouca quantidade"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                {/* Stock Quantity Controls */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Qtd em Stock:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateProduct(p.id, { availableQuantity: Math.max(0, p.availableQuantity - 5) })}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold"
                    >
                      -5
                    </button>
                    <span className="font-bold text-slate-900">{p.availableQuantity} {p.unit}</span>
                    <button
                      onClick={() => updateProduct(p.id, { availableQuantity: p.availableQuantity + 10 })}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-emerald-800"
                    >
                      +10
                    </button>
                  </div>

                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-1 text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODAL TO ADD PRODUCT */}
      {showAddProdModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-emerald-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Publicar Novo Produto Agrícola</h3>
              <button onClick={() => setShowAddProdModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              {/* AI CAMERA SCANNER BANNER BUTTON */}
              <div className="p-3 bg-emerald-950 text-white rounded-2xl border border-emerald-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    Digitalização & Reconhecimento de Imagem IA
                  </span>
                  <span className="text-[9px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                    AgroMoz Vision AI
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300">
                  Fotografe ou digite o nome do produto. A IA identifica a cultura agrícola e seleciona a imagem HD correspondente!
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScannerModal(true);
                      handleRunAIScan(prodName);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Escanear com Câmara / IA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunAIScan(prodName)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-[11px] transition-all flex items-center gap-1 border border-amber-400/30"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Rápido</span>
                  </button>
                </div>
              </div>

              {/* QUICK CROP CHIPS PRESETS */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Seleção Rápida de Culturas (IA):</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Clique para aplicar foto e dados</span>
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CROP_DATABASE.slice(0, 8).map((crop) => (
                    <button
                      key={crop.name}
                      type="button"
                      onClick={() => {
                        setProdName(crop.name);
                        setProdCategory(crop.category);
                        setProdImgUrl(crop.imageUrl);
                        setProdUnit(crop.defaultUnit);
                        setProdPrice(crop.suggestedPrice);
                        setAiMatchedCropName(crop.name);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-semibold border transition-all shrink-0 ${
                        prodImgUrl === crop.imageUrl
                          ? "bg-emerald-100 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400/40"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <img src={crop.imageUrl} alt={crop.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                      <span>{crop.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tomate Maçã, Pimento Verde, Milho, Mandioca..."
                    value={prodName}
                    onChange={(e) => handleProdNameChange(e.target.value)}
                    className="w-full pl-3 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRunAIScan(prodName)}
                      className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                      title="Analisar nome e gerar foto por IA"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>IA Photo</span>
                    </button>
                  </div>
                </div>
                {aiMatchedCropName && (
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> IA identificou: {aiMatchedCropName} (Imagem HD e categoria ajustadas)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: kg, caixa (20kg), saco (50kg)"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço do Agricultor (MT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd Disponível *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodQty}
                    onChange={(e) => setProdQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* TRANSPARENT 3% AGROMOZ PRICE BREAKDOWN CARD */}
              <div className="p-3.5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-800/50 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold border-b border-emerald-800/60 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" /> Cálculo Transparente de Preço
                  </span>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-bold text-[9px]">
                    Política +3% AgroMoz
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Preço definido pelo agricultor:</span>
                    <span className="font-mono font-bold">{basePriceNum} MT/{prodUnit || "unidade"}</span>
                  </div>

                  <div className="flex justify-between items-center text-amber-300">
                    <span>Margem AgroMoz (3%):</span>
                    <span className="font-mono font-bold">+{agroMozMargin3Pct} MT/{prodUnit || "unidade"}</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-300 font-extrabold text-sm pt-1 border-t border-emerald-800/50">
                    <span>Preço final para o consumidor:</span>
                    <span className="font-mono text-amber-300">{finalConsumerPrice} MT/{prodUnit || "unidade"}</span>
                  </div>
                </div>
              </div>

              {/* PRODUCT IMAGE PREVIEW CARD */}
              <div className="p-2.5 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-3">
                <img
                  src={prodImgUrl}
                  alt="Fotografia do produto"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-sm shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                      Fotografia do Produto Atribuída
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Qualidade HD
                    </span>
                  </div>
                  <input
                    type="url"
                    value={prodImgUrl}
                    onChange={(e) => setProdImgUrl(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[10px] text-slate-600 truncate"
                    title="URL da fotografia"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Produto</label>
                <textarea
                  rows={2}
                  placeholder="Descreva a qualidade, origem e características da colheita..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              {/* TERMS & CONDITIONS ACCEPTANCE BOX */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-[11px] text-amber-950 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="accept-terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-700 rounded-md cursor-pointer shrink-0"
                  />
                  <label htmlFor="accept-terms-checkbox" className="font-extrabold text-slate-900 cursor-pointer">
                    Li e aceito os Termos e Condições da AgroMoz.
                  </label>
                </div>

                <div className="pl-6 space-y-1 text-slate-700 text-[10.5px]">
                  <p className="font-semibold text-slate-900">Compreendo que:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Defini o preço do meu produto.</li>
                    <li>
                      A AgroMoz adicionará automaticamente uma margem de 3% ao preço apresentado aos consumidores ({basePriceNum} MT + {agroMozMargin3Pct} MT = {finalConsumerPrice} MT).
                    </li>
                    <li>Estou de acordo com esta política de preços antes de publicar o meu produto.</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={!termsAccepted}
                className={`w-full py-3 font-bold rounded-xl shadow-md transition-all mt-2 ${
                  termsAccepted
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Publicar Produto no Mercado
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL TO REGISTER MACHAMBA */}
      {showAddMachambaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-emerald-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Registar Nova Machamba</h3>
              <button onClick={() => setShowAddMachambaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMachamba} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Machamba *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Machamba Agrícola do Umbelúzi"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tamanho da Área</label>
                  <input
                    type="text"
                    placeholder="Ex: 3 Hectares"
                    value={mArea}
                    onChange={(e) => setMArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Localidade / Povoado</label>
                  <input
                    type="text"
                    placeholder="Ex: Guava / Bairro 4"
                    value={mLocalidade}
                    onChange={(e) => setMLocalidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Culturas Cultivadas</label>
                <input
                  type="text"
                  placeholder="Ex: Tomate, Mandioca, Batata-doce"
                  value={mCrops}
                  onChange={(e) => setMCrops(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md mt-2"
              >
                Mapear e Guardar Machamba
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. VISION AI CAMERA SCANNER MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-emerald-500/40 text-white space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 rounded-xl border border-emerald-500/40 text-emerald-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    Scanner de Produto por IA
                  </h3>
                  <p className="text-[10px] text-emerald-400">AgroMoz Vision Recognition v2.4</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScannerModal(false);
                  setIsScanning(false);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CAMERA VIEWFINDER & SCANNING ANIMATION FRAME */}
            <div className="relative aspect-4/3 w-full bg-black rounded-2xl overflow-hidden border border-emerald-500/50 shadow-inner flex items-center justify-center">
              <img
                src={prodImgUrl}
                alt="Digitalização do produto"
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isScanning ? "brightness-75 scale-105 filter blur-[1px]" : "brightness-100 scale-100"
                }`}
              />

              {/* CAMERA OVERLAY CORNERS */}
              <div className="absolute inset-3 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between items-center text-[9px] font-mono text-emerald-300 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> REC 4K HD
                  </span>
                  <span>AI CROP DETECT</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-emerald-300 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <span>FRAME: 60 FPS</span>
                  <span>CONF: 98.4%</span>
                </div>
              </div>

              {/* LASER SCANNING LINE */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce my-auto top-0 bottom-0 pointer-events-none" />
              )}
            </div>

            {/* SCANNING PROGRESS BAR & STATUS */}
            <div className="space-y-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  {isScanning ? "A digitalizar colheita..." : "Produto Reconhecido com Sucesso!"}
                </span>
                <span className="font-mono text-amber-300 text-[10px]">{scanProgress}%</span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              <p className="text-[10.5px] text-slate-300">{scanMessage}</p>

              {!isScanning && aiMatchedCropName && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Produto Detectado:</span>
                    <span className="font-bold text-amber-300">{aiMatchedCropName}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Categoria Atribuída:</span>
                    <span className="font-bold text-emerald-300">{prodCategory}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Unidade Recomendada:</span>
                    <span className="font-mono text-slate-200">{prodUnit}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRunAIScan(prodName)}
                disabled={isScanning}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-slate-700"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Escanear Novamente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowScannerModal(false);
                  setIsScanning(false);
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Usar esta Imagem</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
