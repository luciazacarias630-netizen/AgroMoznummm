import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueLocations";
import { PlantDiagnosisResult } from "../types";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  DollarSign,
  Sprout,
  Bot,
  AlertCircle,
  Smartphone,
  Send,
  Sparkles,
  MapPin,
  TrendingUp,
  FileText,
  Search,
  Clock,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const {
    users,
    products,
    orders,
    machambas,
    receiverPhone,
    setReceiverPhone,
    approveFarmerFee,
    rejectFarmerFee,
    approveDriverAccount,
    releaseEscrowPayment,
    refundEscrowPayment,
  } = useAgro();

  const [activeTab, setActiveTab] = useState<"CUSTODIA" | "APROVACOES" | "RECEBIMENTO" | "AI_DIAGNOSTICO" | "RELATORIOS">("CUSTODIA");
  const [escrowFilter, setEscrowFilter] = useState<"ALL" | "Pendente" | "Liberado" | "Reembolsado">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // AI Diagnostic State
  const [cropNameInput, setCropNameInput] = useState("Tomate");
  const [descInput, setDescInput] = useState("As folhas do tomateiro estão amareladas com manchas pretas e bordos secos.");
  const [imgBase64, setImgBase64] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<PlantDiagnosisResult | null>(null);

  // Config receiver phone input
  const [newReceiverPhone, setNewReceiverPhone] = useState(receiverPhone);

  const pendingFarmers = users.filter((u) => u.role === "FARMER" && !u.membershipFeePaid);
  const pendingDrivers = users.filter((u) => u.role === "DRIVER" && !u.isApproved);

  // Escrow Calculations
  const grossEscrowTotal = orders.reduce((acc, curr) => acc + (curr.subtotal || curr.totalAmount || 0), 0);
  const totalAgroMozFees = orders.reduce((acc, curr) => acc + (curr.platformFee || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.05)), 0);
  const pendingEscrowAmount = orders
    .filter((o) => o.escrowStatus === "Pendente")
    .reduce((acc, curr) => acc + (curr.subtotal || curr.totalAmount || 0), 0);
  const releasedToFarmersAmount = orders
    .filter((o) => o.escrowStatus === "Liberado")
    .reduce((acc, curr) => acc + (curr.farmerNetAmount || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.95)), 0);

  const totalCommissions = orders.reduce((acc, curr) => acc + curr.deliveryFee, 0) + totalAgroMozFees;

  const handleRunAIDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setDiagnosisResult(null);

    try {
      const res = await fetch("/api/ai/diagnose-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: cropNameInput,
          description: descInput,
          imageBase64: imgBase64,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();
      if (data.diagnosis) {
        setDiagnosisResult(data.diagnosis);
      } else if (data.fallback) {
        setDiagnosisResult(data.fallback);
      }
    } catch (err: any) {
      alert("Erro ao comunicar com o servidor de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateReceiverPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiverPhone(newReceiverPhone);
    alert(`Conta de recebimento M-Pesa / e-Mola atualizada para: ${newReceiverPhone}`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif">Painel Administrativo AgroMoz</h1>
            <p className="text-xs text-slate-400">
              Controlo global da plataforma, aprovações, pagamentos e Inteligência Agrícola.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-xs flex items-center gap-3">
          <div>
            <span className="text-slate-400 block text-[10px]">Conta de Recebimento Ativa:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{receiverPhone}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-emerald-100 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("CUSTODIA")}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "CUSTODIA"
              ? "bg-emerald-800 text-amber-300 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-1.5 text-amber-400" /> Custódia & Taxas AgroMoz (5%)
        </button>

        <button
          onClick={() => setActiveTab("APROVACOES")}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "APROVACOES"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" /> Aprovações ({pendingFarmers.length + pendingDrivers.length})
        </button>

        <button
          onClick={() => setActiveTab("RECEBIMENTO")}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "RECEBIMENTO"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Smartphone className="w-4 h-4 inline mr-1.5" /> Conta M-Pesa / e-Mola
        </button>

        <button
          onClick={() => setActiveTab("AI_DIAGNOSTICO")}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "AI_DIAGNOSTICO"
              ? "bg-emerald-800 text-amber-300 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Bot className="w-4 h-4 inline mr-1.5 text-amber-400" /> IA Diagnóstico de Doenças
        </button>

        <button
          onClick={() => setActiveTab("RELATORIOS")}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "RELATORIOS"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" /> Relatórios Financeiros
        </button>
      </div>

      {/* CONTENT FOR TAB 0: ESCROW & SPLIT PAYMENTS MANAGEMENT */}
      {activeTab === "CUSTODIA" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-emerald-100 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-bold block">Total Processado em Custódia</span>
              <div className="text-2xl font-black font-serif text-slate-900">{grossEscrowTotal.toLocaleString()} MT</div>
              <p className="text-[10px] text-slate-400">Soma bruta de vendas no aplicativo</p>
            </div>

            <div className="p-5 bg-emerald-900 text-white rounded-3xl shadow-md space-y-2">
              <span className="text-xs text-emerald-200 font-bold block">Taxas AgroMoz Cobradas (5%)</span>
              <div className="text-2xl font-black font-serif text-amber-300">{totalAgroMozFees.toLocaleString()} MT</div>
              <p className="text-[10px] text-emerald-200">Lucro líquido de intermediação</p>
            </div>

            <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 space-y-2">
              <span className="text-xs text-amber-900 font-bold block">Pendentes em Custódia</span>
              <div className="text-2xl font-black font-serif text-amber-900">{pendingEscrowAmount.toLocaleString()} MT</div>
              <p className="text-[10px] text-amber-800">Retido no fundo a aguardar entrega</p>
            </div>

            <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-200 space-y-2">
              <span className="text-xs text-emerald-900 font-bold block">Liberado aos Agricultores</span>
              <div className="text-2xl font-black font-serif text-emerald-900">{releasedToFarmersAmount.toLocaleString()} MT</div>
              <p className="text-[10px] text-emerald-800">Entregue e creditado na carteira</p>
            </div>
          </div>

          {/* Orders Table with Escrow Controls */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                  Gestão de Pagamentos em Custódia & Reclamações
                </h3>
                <p className="text-xs text-slate-500">
                  Acompanhe e controle o fluxo de dinheiro com comissão de 5% da AgroMoz.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-700">
                  <button
                    onClick={() => setEscrowFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      escrowFilter === "ALL" ? "bg-emerald-800 text-white shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Todos ({orders.length})
                  </button>
                  <button
                    onClick={() => setEscrowFilter("Pendente")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      escrowFilter === "Pendente" ? "bg-amber-600 text-white shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Pendentes ({orders.filter((o) => o.escrowStatus === "Pendente").length})
                  </button>
                  <button
                    onClick={() => setEscrowFilter("Liberado")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      escrowFilter === "Liberado" ? "bg-emerald-700 text-white shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Liberados ({orders.filter((o) => o.escrowStatus === "Liberado").length})
                  </button>
                  <button
                    onClick={() => setEscrowFilter("Reembolsado")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      escrowFilter === "Reembolsado" ? "bg-red-700 text-white shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Reembolsados ({orders.filter((o) => o.escrowStatus === "Reembolsado").length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">ID Pedido / Data</th>
                    <th className="py-3 px-3">Comprador</th>
                    <th className="py-3 px-3">Agricultor</th>
                    <th className="py-3 px-3">Produto & Qtd</th>
                    <th className="py-3 px-3">Valor Bruto</th>
                    <th className="py-3 px-3">Taxa AgroMoz (5%)</th>
                    <th className="py-3 px-3">Líquido Agricultor</th>
                    <th className="py-3 px-3">Estado Custódia</th>
                    <th className="py-3 px-3 text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Nenhum pedido registado ainda no sistema.
                      </td>
                    </tr>
                  ) : (
                    orders
                      .filter((o) => escrowFilter === "ALL" || o.escrowStatus === escrowFilter)
                      .filter(
                        (o) =>
                          o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.id.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((o) => {
                        const sub = o.subtotal || o.totalAmount || 0;
                        const fee = o.platformFee || Math.round(sub * 0.05);
                        const net = o.farmerNetAmount || sub - fee;

                        return (
                          <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-slate-900 block">{o.id}</span>
                              <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {o.buyerName}
                              <span className="text-[10px] text-slate-400 block">{o.buyerPhone}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {o.farmerName}
                              <span className="text-[10px] text-slate-400 block">{o.farmerPhone}</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-950">
                              {o.productName}
                              <span className="text-[10px] text-slate-500 font-normal block">
                                {o.quantity} {o.unit}
                              </span>
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
                                    <CheckCircle2 className="w-3 h-3" /> Liberado ao Agricultor
                                  </>
                                ) : o.escrowStatus === "Reembolsado" ? (
                                  <>
                                    <XCircle className="w-3 h-3" /> Reembolsado ao Comprador
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" /> Pendente em Custódia
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {o.escrowStatus === "Pendente" && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => releaseEscrowPayment(o.id, "Liberação manual pelo Administrador")}
                                    className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-xs"
                                  >
                                    Liberar {net} MT
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Motivo do Reembolso ao Comprador:", "Produto danificado ou indisponível");
                                      if (reason) refundEscrowPayment(o.id, reason);
                                    }}
                                    className="py-1 px-2.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-bold"
                                  >
                                    Reembolsar
                                  </button>
                                </div>
                              )}
                              {o.escrowStatus === "Liberado" && (
                                <span className="text-[10px] text-slate-400 font-medium italic">
                                  Entregue & Pago
                                </span>
                              )}
                              {o.escrowStatus === "Reembolsado" && (
                                <span className="text-[10px] text-red-500 font-medium italic">
                                  {o.refundReason || "Devolvido"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 1: PENDING APPROVALS */}
      {activeTab === "APROVACOES" && (
        <div className="space-y-6">
          {/* Farmers Registration Status */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              Verificação e Registo de Agricultores ({pendingFarmers.length} Pendentes)
            </h3>

            {pendingFarmers.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-2xl">
                Todos os agricultores registados estão ativos com inscrição gratuita.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingFarmers.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{f.name} ({f.phone})</div>
                      <p className="text-slate-600">
                        Machamba: {f.farmName || "Sem nome"} — {f.district}, {f.province}
                      </p>
                      <span className="text-[10px] font-bold text-amber-800">
                        Estado: Pendente de Aprovação
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => rejectFarmerFee(f.id)}
                        className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-xl"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => approveFarmerFee(f.id)}
                        className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-300" /> Aprovar Agricultor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 2: RECEIVER PHONE CONFIG */}
      {activeTab === "RECEBIMENTO" && (
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 max-w-lg mx-auto space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-700" />
            Configuração da Conta de Recebimento da Plataforma
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Todos os pagamentos de comissões e serviços da AgroMoz são encaminhados para a conta principal M-Pesa ou e-Mola abaixo configurada.
          </p>

          <form onSubmit={handleUpdateReceiverPhone} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Número de Telefone Principal (M-Pesa / e-Mola)
              </label>
              <input
                type="tel"
                required
                value={newReceiverPhone}
                onChange={(e) => setNewReceiverPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-emerald-900 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
            >
              Guardar Nova Conta de Recebimento
            </button>
          </form>
        </div>
      )}

      {/* CONTENT FOR TAB 3: GEMINI AI PLANT DIAGNOSTICS */}
      {activeTab === "AI_DIAGNOSTICO" && (
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Inteligência Artificial Agrícola (Gemini 3.6 Flash)
              </h3>
              <p className="text-xs text-slate-500">
                Diagnóstico automático de doenças e pragas em plantações de Moçambique.
              </p>
            </div>
          </div>

          <form onSubmit={handleRunAIDiagnosis} className="space-y-4 text-xs max-w-xl">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Cultura *</label>
                <input
                  type="text"
                  required
                  value={cropNameInput}
                  onChange={(e) => setCropNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Upload Fotografia da Planta (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imgBase64}
                  onChange={(e) => setImgBase64(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sintomas Observados na Planta *</label>
              <textarea
                rows={3}
                required
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                "A analisar com Gemini AI..."
              ) : (
                <>
                  <Bot className="w-4 h-4 text-amber-400" /> Diagnosticar Doença com IA
                </>
              )}
            </button>
          </form>

          {/* Diagnosis Result Output */}
          {diagnosisResult && (
            <div className="mt-6 p-6 bg-emerald-50/80 rounded-3xl border border-emerald-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-extrabold text-emerald-950 text-sm">
                  Resultado do Diagnóstico: {diagnosisResult.diseaseName}
                </span>
                <span className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-full text-[10px]">
                  Confiança: {Math.round(diagnosisResult.confidenceScore * 100)}%
                </span>
              </div>

              <p className="text-slate-800 font-medium leading-relaxed">{diagnosisResult.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                  <h5 className="font-bold text-emerald-900 mb-1">Tratamento Orgânico Recomendado:</h5>
                  <p className="text-slate-700">{diagnosisResult.organicTreatment}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                  <h5 className="font-bold text-emerald-900 mb-1">Medidas de Prevenção:</h5>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {diagnosisResult.preventiveMeasures?.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT FOR TAB 4: REPORTS */}
      {activeTab === "RELATORIOS" && (
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Relatório Financeiro da Plataforma AgroMoz</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block">Total de Transações Procesadas:</span>
              <strong className="text-lg font-bold text-slate-900">{orders.length}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block">Comissões de Transporte Acumuladas:</span>
              <strong className="text-lg font-bold text-emerald-900">{totalCommissions} MT</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block">Total de Utilizadores Reais:</span>
              <strong className="text-lg font-bold text-slate-900">{users.length}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
