import React, { useState, useMemo } from "react";
import { useAgro } from "../context/AgroContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  MapPin,
  Users,
  Sprout,
  ShieldCheck,
  Calendar,
  Activity,
  PackageCheck,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

const MOZAMBIQUE_PROVINCES = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
];

const CATEGORY_COLORS: Record<string, string> = {
  Hortaliças: "#10b981", // Emerald
  Cereais: "#f59e0b", // Amber
  Frutas: "#ef4444", // Red
  Tubérculos: "#8b5cf6", // Purple
  Leguminosas: "#3b82f6", // Blue
  "Animais/Aves": "#ec4899", // Pink
  Outros: "#64748b", // Slate
};

const STATUS_COLORS: Record<string, string> = {
  "Pedido recebido": "#3b82f6", // Blue
  "Preparando encomenda": "#f59e0b", // Amber
  "Entregador a caminho": "#8b5cf6", // Purple
  Entregue: "#10b981", // Emerald
  Cancelado: "#ef4444", // Red
};

const USER_ROLE_COLORS = {
  FARMER: "#059669", // Emerald
  BUYER: "#2563eb", // Blue
  DRIVER: "#d97706", // Amber
  ADMIN: "#7c3aed", // Purple
};

export const AdminAnalyticsDashboard: React.FC = () => {
  const { users, products, orders, machambas } = useAgro();

  const [timeRange, setTimeRange] = useState<"ALL" | "MONTH" | "WEEK">("ALL");
  const [selectedChartTab, setSelectedChartTab] = useState<"OVERVIEW" | "REGIONAL" | "PRODUCTS" | "USERS">("OVERVIEW");

  // --- FILTERED ORDERS BASED ON TIME RANGE ---
  const filteredOrders = useMemo(() => {
    if (timeRange === "ALL") return orders;

    const now = new Date();
    const days = timeRange === "WEEK" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return orders.filter((o) => {
      if (!o.createdAt) return true;
      return new Date(o.createdAt) >= cutoff;
    });
  }, [orders, timeRange]);

  // --- KEY PERFORMANCE METRICS ---
  const totalVolumeMT = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalAgroMozMarginMT = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.platformFee || (o.subtotal || 0) * 0.03 || 0), 0);
  }, [filteredOrders]);

  const deliveredOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.deliveryStatus === "Entregue").length;
  }, [filteredOrders]);

  const activeProvincesCount = useMemo(() => {
    const provs = new Set<string>();
    users.forEach((u) => u.province && provs.add(u.province));
    products.forEach((p) => p.province && provs.add(p.province));
    machambas.forEach((m) => m.province && provs.add(m.province));
    return provs.size;
  }, [users, products, machambas]);

  // --- DADOS PARA GRÁFICO 1: TENDÊNCIA DE ATIVIDADE TEMPORAL (VOLUME DE VENDAS E ENCOMENDAS) ---
  const activityTrendData = useMemo(() => {
    // Generate a list of recent dates or labels
    const daysCount = timeRange === "WEEK" ? 7 : timeRange === "MONTH" ? 14 : 10;
    const dataMap: Record<string, { date: string; volumeMT: number; ordersCount: number; newProducts: number }> = {};

    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" });
      dataMap[label] = { date: label, volumeMT: 0, ordersCount: 0, newProducts: 0 };
    }

    filteredOrders.forEach((o) => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      const label = d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" });
      if (dataMap[label]) {
        dataMap[label].volumeMT += o.totalAmount || 0;
        dataMap[label].ordersCount += 1;
      }
    });

    products.forEach((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : new Date();
      const label = d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" });
      if (dataMap[label]) {
        dataMap[label].newProducts += 1;
      }
    });

    return Object.values(dataMap);
  }, [filteredOrders, products, timeRange]);

  // --- DADOS PARA GRÁFICO 2: DISTRIBUIÇÃO REGIONAL POR PROVÍNCIA ---
  const regionalDistributionData = useMemo(() => {
    const provCounts: Record<string, { province: string; farmers: number; products: number; orders: number; machambas: number }> = {};

    MOZAMBIQUE_PROVINCES.forEach((p) => {
      provCounts[p] = { province: p, farmers: 0, products: 0, orders: 0, machambas: 0 };
    });

    users.forEach((u) => {
      if (u.role === "FARMER" && u.province) {
        const provMatch = MOZAMBIQUE_PROVINCES.find((p) => p.toLowerCase() === u.province.toLowerCase()) || "Maputo Província";
        if (provCounts[provMatch]) provCounts[provMatch].farmers += 1;
      }
    });

    products.forEach((p) => {
      if (p.province) {
        const provMatch = MOZAMBIQUE_PROVINCES.find((prov) => prov.toLowerCase() === p.province.toLowerCase()) || "Maputo Província";
        if (provCounts[provMatch]) provCounts[provMatch].products += 1;
      }
    });

    filteredOrders.forEach((o) => {
      const prov = o.buyerProvince || "Maputo Província";
      const provMatch = MOZAMBIQUE_PROVINCES.find((p) => p.toLowerCase() === prov.toLowerCase()) || "Maputo Província";
      if (provCounts[provMatch]) provCounts[provMatch].orders += 1;
    });

    machambas.forEach((m) => {
      if (m.province) {
        const provMatch = MOZAMBIQUE_PROVINCES.find((p) => p.toLowerCase() === m.province.toLowerCase()) || "Maputo Província";
        if (provCounts[provMatch]) provCounts[provMatch].machambas += 1;
      }
    });

    return Object.values(provCounts).filter(
      (item) => item.farmers > 0 || item.products > 0 || item.orders > 0 || item.machambas > 0
    );
  }, [users, products, filteredOrders, machambas]);

  // --- DADOS PARA GRÁFICO 3: ESTADO DAS ENCOMENDAS (DONUT CHART) ---
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      "Pedido recebido": 0,
      "Preparando encomenda": 0,
      "Entregador a caminho": 0,
      Entregue: 0,
      Cancelado: 0,
    };

    filteredOrders.forEach((o) => {
      const st = o.deliveryStatus || "Pedido recebido";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || "#64748b",
      }));
  }, [filteredOrders]);

  // --- DADOS PARA GRÁFICO 4: PRODUTOS POR CATEGORIA AGRÍCOLA ---
  const productCategoryData = useMemo(() => {
    const categoryCounts: Record<string, { name: string; count: number; totalStock: number; color: string }> = {};

    products.forEach((p) => {
      const cat = p.category || "Hortaliças";
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = {
          name: cat,
          count: 0,
          totalStock: 0,
          color: CATEGORY_COLORS[cat] || "#64748b",
        };
      }
      categoryCounts[cat].count += 1;
      categoryCounts[cat].totalStock += Number(p.availableQuantity) || 0;
    });

    return Object.values(categoryCounts);
  }, [products]);

  // --- DADOS PARA GRÁFICO 5: DESGLOSE DE UTILIZADORES & VERIFICAÇÃO BI ---
  const userRoleData = useMemo(() => {
    const roleCounts = {
      FARMER: 0,
      DRIVER: 0,
      BUYER: 0,
      ADMIN: 0,
    };

    users.forEach((u) => {
      if (roleCounts[u.role] !== undefined) {
        roleCounts[u.role] += 1;
      }
    });

    return [
      { name: "Agricultores", value: roleCounts.FARMER, color: USER_ROLE_COLORS.FARMER },
      { name: "Transportadores", value: roleCounts.DRIVER, color: USER_ROLE_COLORS.DRIVER },
      { name: "Compradores", value: roleCounts.BUYER, color: USER_ROLE_COLORS.BUYER },
      { name: "Administradores", value: roleCounts.ADMIN, color: USER_ROLE_COLORS.ADMIN },
    ].filter((item) => item.value > 0);
  }, [users]);

  // Format currency helper
  const formatMT = (val: number) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace("MZN", "MT");
  };

  return (
    <div className="space-y-6">
      {/* HEADER DO DASHBOARD COM CONTROLES DE TEMPO & STATUS AO VIVO */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-700 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-serif text-slate-900">
                  Analytics & Visualização de Dados da AgroMoz
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Monitorização em tempo real das transações, volume de encomendas e expansão pelas províncias.
              </p>
            </div>
          </div>
        </div>

        {/* SELECTOR DE PERÍODO & SELETOR DE VISTA */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-700">
            <button
              onClick={() => setTimeRange("ALL")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "ALL" ? "bg-slate-900 text-white shadow-xs" : "hover:text-slate-900 cursor-pointer"
              }`}
            >
              Todo Histórico
            </button>
            <button
              onClick={() => setTimeRange("MONTH")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "MONTH" ? "bg-slate-900 text-white shadow-xs" : "hover:text-slate-900 cursor-pointer"
              }`}
            >
              Últimos 30 Dias
            </button>
            <button
              onClick={() => setTimeRange("WEEK")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "WEEK" ? "bg-slate-900 text-white shadow-xs" : "hover:text-slate-900 cursor-pointer"
              }`}
            >
              Últimos 7 Dias
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: VOLUME DE VENDAS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-3xl shadow-md border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Volume de Vendas (MT)
            </span>
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-serif text-white">
            {formatMT(totalVolumeMT)}
          </div>
          <p className="text-[11px] text-slate-400">
            Total movimentado em {filteredOrders.length} encomenda(s) no mercado
          </p>
        </div>

        {/* CARD 2: MARGEM AGROMOZ (3%) */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Receita AgroMoz (3%)
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-serif text-emerald-900">
            {formatMT(totalAgroMozMarginMT)}
          </div>
          <p className="text-[11px] text-slate-500">
            Comissão da plataforma arrecadada de serviços prestados
          </p>
        </div>

        {/* CARD 3: ENCOMENDAS ENTREGUES */}
        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              Taxa de Conclusão
            </span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-serif text-blue-950">
            {deliveredOrdersCount} / {filteredOrders.length}
          </div>
          <p className="text-[11px] text-slate-500">
            {filteredOrders.length > 0
              ? `${Math.round((deliveredOrdersCount / filteredOrders.length) * 100)}% das encomendas entregues`
              : "Sem encomendas registadas"}
          </p>
        </div>

        {/* CARD 4: PROVÍNCIAS ATIVAS */}
        <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-purple-600" />
              Presença Nacional
            </span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <Sprout className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-serif text-purple-950">
            {activeProvincesCount} de 11
          </div>
          <p className="text-[11px] text-slate-500">
            Províncias de Moçambique com machambas e produtos ativos
          </p>
        </div>
      </div>

      {/* SELEÇÃO DE VISTA DE GRÁFICOS (ABAS) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedChartTab("OVERVIEW")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            selectedChartTab === "OVERVIEW"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Tendência de Vendas e Atividade
        </button>

        <button
          onClick={() => setSelectedChartTab("REGIONAL")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            selectedChartTab === "REGIONAL"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <MapPin className="w-4 h-4" /> Distribuição Regional por Província
        </button>

        <button
          onClick={() => setSelectedChartTab("PRODUCTS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            selectedChartTab === "PRODUCTS"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Categorias & Produtos Agrícolas
        </button>

        <button
          onClick={() => setSelectedChartTab("USERS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            selectedChartTab === "USERS"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Users className="w-4 h-4" /> Papéis e Estado de Encomendas
        </button>
      </div>

      {/* ÁREA PRINCIPAL DOS GRÁFICOS COM RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO PRINCIPAL (2 COLUNAS) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          {selectedChartTab === "OVERVIEW" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                    Evolução do Volume de Vendas e Encomendas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Histórico de volume financeiro em Meticais (MT) e novas encomendas realizadas.
                  </p>
                </div>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "16px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === "volumeMT") return [formatMT(Number(value)), "Volume Vendas (MT)"];
                        if (name === "ordersCount") return [`${value} encomenda(s)`, "Total Encomendas"];
                        return [value, name];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="volumeMT"
                      name="Volume Vendas (MT)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorVolume)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="ordersCount"
                      name="Qtd. Encomendas"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedChartTab === "REGIONAL" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-700" />
                    Distribuição Agrícola e Mercado por Província
                  </h3>
                  <p className="text-xs text-slate-500">
                    Número de agricultores, machambas ativas, produtos e encomendas por província.
                  </p>
                </div>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalDistributionData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="province" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" interval={0} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "16px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }} />
                    <Bar dataKey="farmers" name="Agricultores" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="products" name="Produtos Publicados" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="machambas" name="Machambas Registadas" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="orders" name="Encomendas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedChartTab === "PRODUCTS" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-700" />
                    Oferta Agrícola por Categoria no Mercado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Volume de anúncios de produtos por tipo de cultura agrícola na AgroMoz.
                  </p>
                </div>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productCategoryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "16px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${val} anúncio(s)`, "Total de Produtos"]}
                    />
                    <Bar dataKey="count" name="Número de Anúncios" radius={[0, 8, 8, 0]}>
                      {productCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedChartTab === "USERS" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-700" />
                    Composição da Comunidade e Papéis de Utilizador
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proporção entre Agricultores, Transportadores, Compradores e Administradores.
                  </p>
                </div>
              </div>

              <div className="h-80 w-full pt-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-role-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "16px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${val} utilizador(es)`, "Total"]}
                    />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR DE GRÁFICOS ADICIONAIS (ESTADO DE ENCOMENDAS & RESUMO RÁPIDO) */}
        <div className="space-y-6">
          {/* GRÁFICO CIRCULAR: ESTADO DAS ENCOMENDAS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                Estado das Encomendas
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredOrders.length} Totais
              </span>
            </div>

            <div className="h-48 w-full">
              {orderStatusData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Nenhuma encomenda registada no período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "14px",
                        border: "none",
                        color: "#fff",
                        fontSize: "11px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* LEGENDA CUSTOMIZADA */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {orderStatusData.map((st) => (
                <div key={st.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.name}
                  </span>
                  <span className="font-bold text-slate-900">{st.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL DE SÍNTESE DE DESEMPENHO TÉCNICO & SEGURANÇA */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-5 rounded-3xl shadow-md border border-emerald-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Segurança & Verificação
              </span>
              <span className="px-2 py-0.5 bg-emerald-800 text-emerald-200 text-[10px] font-bold rounded-full">
                AgroMoz Cloud
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Garantia Escrow Ativa:</span>
                <span className="font-mono font-bold text-amber-300">
                  {formatMT(
                    filteredOrders
                      .filter((o) => o.escrowStatus === "Pendente")
                      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Machambas Mapeadas:</span>
                <span className="font-mono font-bold text-emerald-300">{machambas.length} Machamba(s)</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Produtos no Mercado:</span>
                <span className="font-mono font-bold text-blue-300">{products.length} Produto(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
