import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Filter,
  Download,
  Sprout,
  ArrowUpRight,
  PieChart as PieIcon,
  Award,
} from "lucide-react";

interface SalesReportsProps {
  farmerOrders?: any[];
  farmerProducts?: any[];
}

export const FarmerSalesReports: React.FC<SalesReportsProps> = ({
  farmerOrders = [],
  farmerProducts = [],
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"6M" | "2026" | "EPOCA">("6M");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Mock monthly performance data calibrated for Mozambican agricultural harvest cycles
  const monthlyData = [
    { mes: "Fev", receita: 24500, colheitaKg: 1200, encomendas: 14, produtoTop: "Tomate Rijo" },
    { mes: "Mar", receita: 31000, colheitaKg: 1550, encomendas: 18, produtoTop: "Pimento Verde" },
    { mes: "Abr", receita: 28400, colheitaKg: 1400, encomendas: 16, produtoTop: "Tomate Rijo" },
    { mes: "Mai", receita: 42000, colheitaKg: 2100, encomendas: 25, produtoTop: "Mandioca Doce" },
    { mes: "Jun", receita: 38500, colheitaKg: 1950, encomendas: 22, produtoTop: "Milho Amarelo" },
    { mes: "Jul", receita: 54000, colheitaKg: 2700, encomendas: 31, produtoTop: "Batata-recheada" },
  ];

  // Revenue breakdown by crop category
  const categoryData = [
    { name: "Hortaliças (Tomate, Pimento)", value: 45, color: "#166534" },
    { name: "Tubérculos (Mandioca, Batata)", value: 25, color: "#ca8a04" },
    { name: "Cereais (Milho, Feijão)", value: 20, color: "#2563eb" },
    { name: "Frutas (Manga, Banana)", value: 10, color: "#ea580c" },
  ];

  // Total summary calculations
  const totalPeriodRevenue = monthlyData.reduce((acc, curr) => acc + curr.receita, 0);
  const totalPeriodKg = monthlyData.reduce((acc, curr) => acc + curr.colheitaKg, 0);
  const totalPeriodOrders = monthlyData.reduce((acc, curr) => acc + curr.encomendas, 0);
  const avgOrderValue = Math.round(totalPeriodRevenue / totalPeriodOrders);

  // Custom Tooltip for ComposedChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5">
          <p className="font-extrabold text-amber-400 border-b border-slate-700 pb-1">
            Mês: {label} 2026
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Receita Bruta:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {payload[0]?.value?.toLocaleString()} MT
            </span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Volume Colhido:</span>
            <span className="font-bold text-amber-300 font-mono">
              {payload[1]?.value?.toLocaleString()} kg
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleExportReport = () => {
    alert("Relatório de Vendas exportado com sucesso em formato PDF/CSV!");
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-emerald-100 space-y-6">
      {/* SECTION HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 text-amber-300 rounded-2xl shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Relatórios de Vendas & Performance de Colheita
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe a evolução de receita em Meticais (MT) e volume colhido por mês nas suas machambas.
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Export Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setSelectedPeriod("6M")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedPeriod === "6M"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:text-emerald-900"
              }`}
            >
              Últimos 6 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod("2026")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedPeriod === "2026"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:text-emerald-900"
              }`}
            >
              Ano 2026
            </button>
            <button
              onClick={() => setSelectedPeriod("EPOCA")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedPeriod === "EPOCA"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:text-emerald-900"
              }`}
            >
              Época Agrícola
            </button>
          </div>

          <button
            onClick={handleExportReport}
            className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Exportar
          </button>
        </div>
      </div>

      {/* HIGHLIGHT SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-emerald-200 font-bold">Faturação Total no Período</span>
            <div className="p-1.5 bg-emerald-700/60 rounded-xl text-amber-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {totalPeriodRevenue.toLocaleString()} MT
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-200 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">+18.4%</span> comparado ao mês anterior
          </div>
        </div>

        {/* Total Volume Harvested */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-900">Total Colhido / Vendido</span>
            <div className="p-1.5 bg-amber-200/80 rounded-xl text-amber-900">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalPeriodKg.toLocaleString()} <span className="text-sm font-sans font-bold text-amber-800">kg</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-600 font-medium">
            Média de <strong>{Math.round(totalPeriodKg / monthlyData.length)} kg</strong> por mês
          </p>
        </div>

        {/* Average Ticket Value */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-600">Valor Médio por Encomenda</span>
            <div className="p-1.5 bg-slate-200 rounded-xl text-slate-800">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-900">
            {avgOrderValue.toLocaleString()} MT
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">
            Baseado em <strong>{totalPeriodOrders}</strong> encomendas concluídas
          </p>
        </div>

        {/* Top Performing Crop */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-emerald-900">Cultura Mais Rentável</span>
            <div className="p-1.5 bg-emerald-200 rounded-xl text-emerald-900">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            Tomate Rijo de Machamba
          </div>
          <p className="mt-1 text-[11px] text-emerald-800 font-bold">
            Rendimento: ~45% do volume total
          </p>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* MAIN BAR / LINE COMBINED CHART (2 COLUMNS) */}
        <div className="lg:col-span-2 bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Evolução Mensal: Receita (MT) & Volume (Kg)
              </h3>
              <p className="text-[11px] text-slate-500">
                Barras verdes indicam faturamento | Linha dourada indica volume de colheita em kg
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-3 h-3 bg-emerald-700 rounded-sm inline-block" /> Receita (MT)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 bg-amber-500 rounded-full inline-block" /> Colheita (kg)
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#166534" }}
                  tickFormatter={(val) => `${val / 1000}k MT`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#b45309" }}
                  tickFormatter={(val) => `${val}kg`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  yAxisId="left"
                  dataKey="receita"
                  name="Receita (MT)"
                  fill="#15803d"
                  radius={[8, 8, 0, 0]}
                  barSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="colheitaKg"
                  name="Volume (kg)"
                  stroke="#d97706"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART FOR REVENUE DISTRIBUTION BY CROP CATEGORY */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-emerald-800" />
              Distribuição por Tipo de Cultura
            </h3>
            <p className="text-[11px] text-slate-500">
              Percentual das vendas agrupado por categoria agrícola.
            </p>
          </div>

          <div className="h-44 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}%`, "Quota de Vendas"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* LEGEND */}
          <div className="space-y-1.5 text-[11px] border-t border-slate-200 pt-3">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 font-medium truncate">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-900 font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
