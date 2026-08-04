import React, { useState, useEffect } from "react";
import { useAgro } from "../context/AgroContext";
import { Levantamento } from "../types";
import { confirmarLevantamento, reverterLevantamento } from "../services/levantamento";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Building2,
  User,
  ArrowUpRight,
  ShieldCheck,
  TrendingDown,
  Check,
  Ban,
} from "lucide-react";

export const AdminWithdrawalDashboard: React.FC = () => {
  const { users, levantamentos: contextLevantamentos, pushNotification, addNotification } = useAgro();

  // Local state for live Firestore / Context synchronization
  const [firestoreLevantamentos, setFirestoreLevantamentos] = useState<Levantamento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDENTE" | "CONCLUIDO" | "FALHADO">("ALL");
  const [filterOperadora, setFilterOperadora] = useState<"ALL" | "mpesa" | "emola">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Listen in real-time to the /levantamentos collection in Firestore
  useEffect(() => {
    setIsLoading(true);
    if (!db) {
      setIsLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, "levantamentos"),
      (snapshot) => {
        const items: Levantamento[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Levantamento),
          });
        });
        // Sort descending by creation date
        items.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        setFirestoreLevantamentos(items);
        setIsLoading(false);
      },
      (error) => {
        console.warn("Realtime /levantamentos listener notice:", error.message);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Merge Firestore items with Context items (ensuring no duplicates)
  const allLevantamentosMap: Record<string, Levantamento> = {};
  contextLevantamentos.forEach((item) => {
    if (item.id) allLevantamentosMap[item.id] = item;
  });
  firestoreLevantamentos.forEach((item) => {
    if (item.id) allLevantamentosMap[item.id] = item;
  });

  const allLevantamentos: Levantamento[] = Object.values(allLevantamentosMap).sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );

  // Filtered withdrawal list
  const filteredList = allLevantamentos.filter((item) => {
    // Filter by status
    if (filterStatus === "PENDENTE") {
      if (item.estado !== "processando" && item.estado !== "pendente" as any) return false;
    } else if (filterStatus === "CONCLUIDO") {
      if (item.estado !== "concluido") return false;
    } else if (filterStatus === "FALHADO") {
      if (item.estado !== "falhado") return false;
    }

    // Filter by provider
    if (filterOperadora !== "ALL" && item.operadora !== filterOperadora) {
      return false;
    }

    // Filter by search query
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const userObj = users.find((u) => u.id === item.userId);
      const userName = (userObj?.name || "").toLowerCase();
      const userPhone = userObj?.phone || "";
      const levPhone = item.numeroTelefone || "";
      const levId = (item.id || "").toLowerCase();

      const matchName = userName.includes(query);
      const matchPhone = userPhone.includes(query) || levPhone.includes(query);
      const matchId = levId.includes(query);

      if (!matchName && !matchPhone && !matchId) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalCount = allLevantamentos.length;
  const totalAmount = allLevantamentos.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const pendingList = allLevantamentos.filter(
    (i) => i.estado === "processando" || (i.estado as any) === "pendente"
  );
  const pendingCount = pendingList.length;
  const pendingAmount = pendingList.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const completedList = allLevantamentos.filter((i) => i.estado === "concluido");
  const completedCount = completedList.length;
  const completedAmount = completedList.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const failedList = allLevantamentos.filter((i) => i.estado === "falhado");
  const failedCount = failedList.length;
  const failedAmount = failedList.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // Admin Manual Approval
  const handleApproveWithdrawal = async (item: Levantamento) => {
    if (!item.id) return;
    if (!window.confirm(`Confirma a aprovação manual do levantamento #${item.id} de ${item.valor} MZN?`)) {
      return;
    }

    setProcessingId(item.id);
    try {
      await confirmarLevantamento(item.id, item.userId);
      addNotification(`Levantamento #${item.id} marcado como concluído.`);
      pushNotification({
        title: `✅ Levantamento Concluído (${item.operadora.toUpperCase()})`,
        message: `O levantamento de ${item.valor} MZN para o número +258 ${item.numeroTelefone} foi processado e concluído.`,
        type: "SYSTEM",
        targetUserId: item.userId,
      });
    } catch (err: any) {
      alert(`Erro ao aprovar levantamento: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Admin Manual Reversal
  const handleRejectWithdrawal = async (item: Levantamento) => {
    if (!item.id) return;
    const reason = window.prompt(
      `Motivo da recusa/reversão do levantamento #${item.id}:`,
      "Número incorreto ou rejeição da operadora"
    );

    if (reason === null) return; // User cancelled prompt

    setProcessingId(item.id);
    try {
      await reverterLevantamento(item.id, item.userId, item.valor, reason || "Rejeitado pelo Administrador");
      addNotification(`Levantamento #${item.id} revertido. Saldo devolvido ao utilizador.`);
      pushNotification({
        title: `❌ Levantamento Revertido`,
        message: `O seu pedido de levantamento de ${item.valor} MZN foi cancelado. Motivo: ${reason}. O valor foi devolvido ao seu saldo disponível.`,
        type: "SYSTEM",
        targetUserId: item.userId,
      });
    } catch (err: any) {
      alert(`Erro ao reverter levantamento: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert("Nenhum levantamento disponível para exportar.");
      return;
    }

    const headers = [
      "ID Levantamento",
      "ID Utilizador",
      "Nome Utilizador",
      "Valor (MZN)",
      "Telefone Destino",
      "Operadora",
      "Estado",
      "Motivo Falha",
      "Data Criacao",
      "Data Conclusao",
    ];

    const rows = filteredList.map((item) => {
      const userObj = users.find((u) => u.id === item.userId);
      return [
        item.id || "",
        item.userId || "",
        userObj?.name || "Desconhecido",
        item.valor || 0,
        item.numeroTelefone || "",
        item.operadora.toUpperCase(),
        item.estado.toUpperCase(),
        item.motivoFalha || "",
        item.criadoEm ? new Date(item.criadoEm).toLocaleString("pt-MZ") : "",
        item.concluidoEm ? new Date(item.concluidoEm).toLocaleString("pt-MZ") : "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `agromoz_levantamentos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0 border border-emerald-300">
            <Wallet className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                M-Pesa / e-Mola B2C
              </span>
              <span className="text-xs text-emerald-300 font-bold">Coleção /levantamentos</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-white mt-1">
              Gestão de Pedidos de Levantamento
            </h2>
            <p className="text-xs text-slate-300">
              Acompanhe todas as transferências de saída B2C para contas de carteira móvel dos utilizadores.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm self-start md:self-auto shrink-0 border border-emerald-500/50"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* SUMMARY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Solicitações */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Levantamentos</span>
            <div className="text-xl font-black font-serif text-slate-900 mt-1">{totalCount}</div>
            <span className="text-xs font-semibold text-slate-600">{totalAmount.toLocaleString()} MZN</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pendentes / Processando */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <span>Pendentes / Processando</span>
            </span>
            <div className="text-xl font-black font-serif text-amber-950 mt-1">{pendingCount}</div>
            <span className="text-xs font-semibold text-amber-800">{pendingAmount.toLocaleString()} MZN em trânsito</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Concluídos */}
        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Concluídos com Sucesso</span>
            <div className="text-xl font-black font-serif text-emerald-950 mt-1">{completedCount}</div>
            <span className="text-xs font-semibold text-emerald-800">{completedAmount.toLocaleString()} MZN transferidos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Falhados / Revertidos */}
        <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Falhados / Revertidos</span>
            <div className="text-xl font-black font-serif text-rose-950 mt-1">{failedCount}</div>
            <span className="text-xs font-semibold text-rose-800">{failedAmount.toLocaleString()} MZN devolvidos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-200/80 text-rose-900 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome do utilizador, telefone ou ID de levantamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                filterStatus === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus("PENDENTE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filterStatus === "PENDENTE"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-amber-100/70 text-amber-900 hover:bg-amber-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes ({pendingCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus("CONCLUIDO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filterStatus === "CONCLUIDO"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluídos ({completedCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus("FALHADO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filterStatus === "FALHADO"
                  ? "bg-rose-700 text-white shadow-xs"
                  : "bg-rose-100/70 text-rose-900 hover:bg-rose-200"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Falhados ({failedCount})</span>
            </button>
          </div>
        </div>

        {/* Operadora Filter & Results Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Operadora:</span>
            <button
              onClick={() => setFilterOperadora("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterOperadora === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterOperadora("mpesa")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterOperadora === "mpesa" ? "bg-rose-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🔴 M-Pesa
            </button>
            <button
              onClick={() => setFilterOperadora("emola")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterOperadora === "emola" ? "bg-amber-500 text-slate-950 font-extrabold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🟡 e-Mola
            </button>
          </div>

          <div>
            A mostrar <strong className="text-slate-900">{filteredList.length}</strong> de{" "}
            <strong className="text-slate-900">{allLevantamentos.length}</strong> solicitação(ões)
          </div>
        </div>
      </div>

      {/* WITHDRAWALS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold">A carregar registos da coleção /levantamentos...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Nenhum pedido de levantamento encontrado</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Não existem registos de levantamentos que correspondam aos filtros ou termo de pesquisa selecionado.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const userObj = users.find((u) => u.id === item.userId);
              const userName = userObj?.name || `Utilizador #${item.userId.substring(0, 6)}`;
              const userRole = userObj?.role === "FARMER" ? "Agricultor" : userObj?.role === "DRIVER" ? "Transportador" : "Comprador";
              const isVerified = userObj?.isVerifiedFarmer || userObj?.isApproved || userObj?.verificationStatus === "Aprovado";

              const isPending = item.estado === "processando" || (item.estado as any) === "pendente";
              const isCompleted = item.estado === "concluido";
              const isFailed = item.estado === "falhado";

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: User & Withdrawal Info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 text-sm shadow-xs ${
                        isPending
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : isCompleted
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-rose-100 text-rose-900 border border-rose-300"
                      }`}
                    >
                      {item.operadora === "mpesa" ? "MP" : "EM"}
                    </div>

                    <div className="space-y-1">
                      {/* Name, Role & Verification Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{userName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {userRole}
                        </span>
                        {isVerified && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>B.I Verificado</span>
                          </span>
                        )}
                      </div>

                      {/* Phone & Operator details */}
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2.5">
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          +258 {item.numeroTelefone}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 capitalize flex items-center gap-1">
                          {item.operadora === "mpesa" ? (
                            <span className="text-rose-600 font-extrabold">🔴 M-Pesa B2C</span>
                          ) : (
                            <span className="text-amber-600 font-extrabold">🟡 e-Mola B2C</span>
                          )}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 font-mono text-[11px]">ID: {item.id}</span>
                      </div>

                      {/* Date & Failure Reason */}
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                        <span>
                          Solicitado em: {item.criadoEm ? new Date(item.criadoEm).toLocaleString("pt-MZ") : "N/A"}
                        </span>
                        {item.concluidoEm && (
                          <span className="text-emerald-700 font-medium">
                            • Concluído: {new Date(item.concluidoEm).toLocaleString("pt-MZ")}
                          </span>
                        )}
                        {isFailed && item.motivoFalha && (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Motivo: {item.motivoFalha}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount, Status Badge & Admin Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Amount & Status Badge */}
                    <div className="text-left md:text-right space-y-1">
                      <div className="text-lg font-black font-serif text-slate-900">
                        {item.valor.toLocaleString()} MT
                      </div>

                      {/* STATUS BADGES */}
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Processando (Pendente)</span>
                          </span>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Concluído</span>
                          </span>
                        )}

                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-1 rounded-full bg-rose-100 text-rose-950 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-700" />
                            <span>Falhado (Revertido)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Action Buttons (only for pending requests) */}
                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveWithdrawal(item)}
                          disabled={processingId === item.id}
                          title="Aprovar e Confirmar Pagamento B2C"
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Aprovar</span>
                        </button>

                        <button
                          onClick={() => handleRejectWithdrawal(item)}
                          disabled={processingId === item.id}
                          title="Reverter Saldo para o Utilizador"
                          className="bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer border border-rose-300 disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-700" />
                          <span className="hidden sm:inline">Reverter</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
