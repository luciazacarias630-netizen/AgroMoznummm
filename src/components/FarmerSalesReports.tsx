import React, { useState, useMemo } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  Download,
  Sprout,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Printer,
  Table,
} from "lucide-react";
import { Order, Product } from "../types";
import { useAgro } from "../context/AgroContext";
import { exportSalesToCSV, exportSalesToPDF } from "../utils/salesExport";

interface SalesReportsProps {
  farmerOrders?: Order[];
  farmerProducts?: Product[];
}

export const FarmerSalesReports: React.FC<SalesReportsProps> = ({
  farmerOrders = [],
  farmerProducts = [],
}) => {
  const { currentUser } = useAgro();
  const [selectedPeriod, setSelectedPeriod] = useState<"6M" | "2026" | "EPOCA">("6M");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showLedgerTable, setShowLedgerTable] = useState(true);

  // Period Label string
  const periodLabel = useMemo(() => {
    if (selectedPeriod === "6M") return "Últimos 6 Meses";
    if (selectedPeriod === "2026") return "Ano de 2026";
    return "Época Agrícola (12 Meses)";
  }, [selectedPeriod]);

  // Filter valid non-cancelled orders based on selected time period
  const validOrders = useMemo(() => {
    const valid = farmerOrders.filter(
      (o) => o.escrowStatus !== "Cancelado" && o.escrowStatus !== "Reembolsado"
    );

    const now = new Date();
    return valid.filter((o) => {
      if (!o.createdAt) return true;
      const orderDate = new Date(o.createdAt);
      if (selectedPeriod === "6M") {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return orderDate >= sixMonthsAgo;
      } else if (selectedPeriod === "2026") {
        return orderDate.getFullYear() === 2026;
      } else if (selectedPeriod === "EPOCA") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return orderDate >= oneYearAgo;
      }
      return true;
    });
  }, [farmerOrders, selectedPeriod]);

  // Real calculations derived from actual farmer orders
  const totalRevenue = useMemo(() => {
    return validOrders.reduce(
      (acc, curr) => acc + (curr.subtotal || curr.totalAmount || 0),
      0
    );
  }, [validOrders]);

  const totalFarmerNetRevenue = useMemo(() => {
    return validOrders.reduce(
      (acc, curr) =>
        acc +
        (curr.farmerNetAmount ||
          Math.round((curr.subtotal || curr.totalAmount || 0) * 0.95)),
      0
    );
  }, [validOrders]);

  const totalQuantity = useMemo(() => {
    return validOrders.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [validOrders]);

  const totalOrdersCount = validOrders.length;

  const avgOrderValue = useMemo(() => {
    return totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  }, [totalRevenue, totalOrdersCount]);

  const releasedOrdersCount = useMemo(() => {
    return validOrders.filter((o) => o.escrowStatus === "Liberado").length;
  }, [validOrders]);

  const pendingOrdersCount = useMemo(() => {
    return validOrders.filter((o) => o.escrowStatus === "Pendente").length;
  }, [validOrders]);

  // Determine top performing crop dynamically from real orders
  const topCropInfo = useMemo(() => {
    if (validOrders.length === 0) {
      if (farmerProducts.length > 0) {
        return {
          name: farmerProducts[0].name,
          subtext: "Produto ativo com maior stock",
        };
      }
      return {
        name: "Sem vendas registradas",
        subtext: "Publique produtos para iniciar vendas",
      };
    }

    const revenueByProduct: Record<string, number> = {};

    validOrders.forEach((o) => {
      const name = o.productName || "Produto Agrícola";
      const rev = o.subtotal || o.totalAmount || 0;
      revenueByProduct[name] = (revenueByProduct[name] || 0) + rev;
    });

    let bestProduct = "";
    let maxRevenue = 0;

    Object.entries(revenueByProduct).forEach(([pName, rev]) => {
      if (rev > maxRevenue) {
        maxRevenue = rev;
        bestProduct = pName;
      }
    });

    const pct = totalRevenue > 0 ? Math.round((maxRevenue / totalRevenue) * 100) : 0;

    return {
      name: bestProduct || "Produto Agrícola",
      subtext: `Rendimento: ~${pct}% do faturamento (${maxRevenue.toLocaleString()} MT)`,
    };
  }, [validOrders, totalRevenue, farmerProducts]);

  const handleExportCSV = () => {
    exportSalesToCSV(validOrders, currentUser?.name || "Agricultor AgroMoz", periodLabel);
    setShowExportOptions(false);
  };

  const handleExportPDF = () => {
    exportSalesToPDF(validOrders, currentUser, periodLabel, {
      totalGross: totalRevenue,
      totalNet: totalFarmerNetRevenue,
      totalQty: totalQuantity,
      count: totalOrdersCount,
    });
    setShowExportOptions(false);
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
                Extratos financeiros e relatórios exportáveis para contabilidade agrícola.
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setSelectedPeriod("6M")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedPeriod === "6M"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:text-emerald-900"
              }`}
            >
              Últimos 6 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod("2026")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedPeriod === "2026"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:text-emerald-900"
              }`}
            >
              Ano 2026
            </button>
            <button
              onClick={() => setSelectedPeriod("EPOCA")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedPeriod === "EPOCA"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:text-emerald-900"
              }`}
            >
              Época Agrícola
            </button>
          </div>

          {/* EXPORT DROPDOWN MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="py-2 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Exportar Vendas</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-emerald-200 p-2 z-30 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Escolha o formato de contabilidade
                </div>

                <button
                  onClick={handleExportPDF}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-3 group cursor-pointer"
                >
                  <div className="p-2 bg-red-100 text-red-700 rounded-xl group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Relatório em PDF (Imprimir)
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Documento oficial com cabeçalho AgroMoz e selo
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-3 group cursor-pointer"
                >
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Ficheiro CSV (Excel / Contabilidade)
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Dados tabulares separados por ponto e vírgula
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HIGHLIGHT SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-emerald-200 font-bold">Faturação Total (Bruta)</span>
            <div className="p-1.5 bg-emerald-700/60 rounded-xl text-amber-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {totalRevenue.toLocaleString()} MT
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-200 font-medium border-t border-emerald-700/50 pt-1.5">
            <span>Líquido a receber:</span>
            <span className="font-bold text-amber-300 font-mono">
              {totalFarmerNetRevenue.toLocaleString()} MT
            </span>
          </div>
        </div>

        {/* Total Volume Harvested/Sold */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-900">Total Colhido / Vendido</span>
            <div className="p-1.5 bg-amber-200/80 rounded-xl text-amber-900">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalQuantity.toLocaleString()}{" "}
            <span className="text-sm font-sans font-bold text-amber-800">unidades/kg</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            Registado em <strong>{totalOrdersCount}</strong> encomendas
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
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> {releasedOrdersCount} Liberadas
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <Clock className="w-3 h-3" /> {pendingOrdersCount} Retidas
            </span>
          </div>
        </div>

        {/* Top Performing Crop */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-emerald-900">Cultura Mais Rentável</span>
            <div className="p-1.5 bg-emerald-200 rounded-xl text-emerald-900">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 truncate" title={topCropInfo.name}>
            {topCropInfo.name}
          </div>
          <p className="mt-1 text-[11px] text-emerald-800 font-bold truncate">
            {topCropInfo.subtext}
          </p>
        </div>
      </div>

      {/* ACCOUNTING LEDGER PREVIEW TABLE */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowLedgerTable(!showLedgerTable)}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-800 hover:text-emerald-800 cursor-pointer"
          >
            <Table className="w-4 h-4 text-emerald-700" />
            <span>Extrato de Vendas para Contabilidade ({validOrders.length} Lançamentos)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLedgerTable ? "rotate-180" : ""}`} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-red-700" />
              <span>Baixar PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Baixar CSV</span>
            </button>
          </div>
        </div>

        {showLedgerTable && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50">
            {validOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhum registo de venda encontrado para o período selecionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-[10px] text-slate-600 font-extrabold uppercase">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Nº Pedido</th>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3">Qtd</th>
                    <th className="py-2.5 px-3">Faturação Bruta</th>
                    <th className="py-2.5 px-3 text-amber-800">Taxa 5%</th>
                    <th className="py-2.5 px-3 text-emerald-800">Líquido</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {validOrders.map((ord) => {
                    const gross = ord.subtotal || ord.totalAmount || 0;
                    const fee = ord.platformFee || Math.round(gross * 0.05);
                    const net = ord.farmerNetAmount || gross - fee;
                    return (
                      <tr key={ord.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2 px-3 text-[11px] text-slate-500 font-medium">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("pt-MZ") : "N/A"}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 text-[11px]">
                          #{ord.id.slice(-6)}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{ord.productName}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {ord.quantity} {ord.unit}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{gross} MT</td>
                        <td className="py-2 px-3 font-mono text-amber-700 font-medium">-{fee} MT</td>
                        <td className="py-2 px-3 font-mono font-black text-emerald-800">{net} MT</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                              ord.escrowStatus === "Liberado"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {ord.escrowStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


