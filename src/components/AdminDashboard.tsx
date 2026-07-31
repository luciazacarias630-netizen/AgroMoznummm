import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { UserProfile } from "../types";
import { VerifiedFarmerBadge } from "./VerifiedFarmerBadge";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  BadgeCheck,
  UserCheck,
  UserX,
  UserPlus,
  Filter,
  User,
  Sprout,
  Truck,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const {
    users,
    verifyFarmerBiIdentity,
    approveDriverAccount,
  } = useAgro();

  // Active filter tab
  const [filterStatus, setFilterStatus] = useState<"ALL" | "VERIFIED" | "REJECTED" | "PENDING">("ALL");
  const [filterRole, setFilterRole] = useState<"ALL" | "FARMER" | "DRIVER" | "BUYER">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // --- MÉTRICAS EXCLUSIVAS DO ADMINISTRADOR ---
  // 1. Quantas pessoas cadastradas
  const totalCadastrados = users.length;
  const cadastradosFarmers = users.filter((u) => u.role === "FARMER").length;
  const cadastradosDrivers = users.filter((u) => u.role === "DRIVER").length;
  const cadastradosBuyers = users.filter((u) => u.role === "BUYER").length;

  // 2. Quantas pessoas verificadas
  const totalVerificados = users.filter(
    (u) =>
      u.isVerifiedFarmer ||
      u.isApproved ||
      u.verificationStatus === "Aprovado" ||
      u.role === "BUYER"
  ).length;

  const verificadosFarmers = users.filter(
    (u) => u.role === "FARMER" && (u.isVerifiedFarmer || u.verificationStatus === "Aprovado")
  ).length;

  const verificadosDrivers = users.filter(
    (u) => u.role === "DRIVER" && u.isApproved === true
  ).length;

  const verificadosBuyers = cadastradosBuyers;

  // 3. Quantas pessoas recusadas
  const totalRecusados = users.filter(
    (u) => u.verificationStatus === "Recusado" || !!u.rejectionReason || u.isApproved === false
  ).length;

  const recusadosFarmers = users.filter(
    (u) => u.role === "FARMER" && (u.verificationStatus === "Recusado" || !!u.rejectionReason)
  ).length;

  const recusadosDrivers = users.filter(
    (u) => u.role === "DRIVER" && u.isApproved === false && !!u.rejectionReason
  ).length;

  // Total Pendentes
  const totalPendentes = users.filter(
    (u) =>
      !u.isVerifiedFarmer &&
      u.verificationStatus !== "Aprovado" &&
      u.verificationStatus !== "Recusado" &&
      !u.rejectionReason &&
      u.role !== "BUYER"
  ).length;

  // Filtragem ativa de utilizadores
  const filteredUsers = users.filter((u) => {
    // Filtro por papel
    if (filterRole !== "ALL" && u.role !== filterRole) return false;

    // Filtro por estado
    const isVerif =
      u.isVerifiedFarmer || u.isApproved || u.verificationStatus === "Aprovado" || u.role === "BUYER";
    const isRej = u.verificationStatus === "Recusado" || !!u.rejectionReason || u.isApproved === false;
    const isPend = !isVerif && !isRej;

    if (filterStatus === "VERIFIED" && !isVerif) return false;
    if (filterStatus === "REJECTED" && !isRej) return false;
    if (filterStatus === "PENDING" && !isPend) return false;

    // Filtro por termo de pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(term);
      const matchPhone = u.phone.includes(term);
      const matchProvince = (u.province || "").toLowerCase().includes(term);
      const matchDistrict = (u.district || "").toLowerCase().includes(term);
      return matchName || matchPhone || matchProvince || matchDistrict;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* BANNER PRINCIPAL DO ADMINISTRADOR */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-900/50">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md shrink-0 border border-amber-300">
            <ShieldCheck className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                Painel do Administrador
              </span>
              <span className="text-xs text-emerald-300 font-bold">AgroMoz System</span>
            </div>
            <h1 className="text-xl font-bold font-serif text-white mt-1">
              Controlo de Pessoas e Verificações de B.I
            </h1>
            <p className="text-xs text-slate-300">
              Gerencie a lista de pessoas cadastradas, contas verificadas com Check Verde e registos recusados.
            </p>
          </div>
        </div>

        <div className="bg-emerald-900/80 px-4 py-2.5 rounded-2xl border border-emerald-700/80 text-xs flex items-center gap-3 shrink-0">
          <BadgeCheck className="w-5 h-5 text-amber-300" />
          <div>
            <span className="text-emerald-200 block text-[10px] font-semibold">Sistema Ativo & Operacional</span>
            <span className="font-mono font-bold text-white text-xs">{totalCadastrados} Utilizadores Totais</span>
          </div>
        </div>
      </div>

      {/* AS 3 MÉTRICAS EXCLUSIVAS SOLICITADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. QUANTAS PESSOAS CADASTRADAS */}
        <div className="p-5 bg-white rounded-3xl border border-emerald-100 shadow-xs space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Pessoas Cadastradas
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </span>
          </div>

          <div>
            <div className="text-3xl font-black font-serif text-slate-900">{totalCadastrados}</div>
            <p className="text-[11px] text-slate-500 font-medium">Total de contas registadas na plataforma</p>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px] font-bold">
            <span className="text-emerald-800 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" /> {cadastradosFarmers} Agric.
            </span>
            <span className="text-amber-900 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-600" /> {cadastradosDrivers} Transp.
            </span>
            <span className="text-blue-900 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" /> {cadastradosBuyers} Compr.
            </span>
          </div>
        </div>

        {/* 2. QUANTAS PESSOAS VERIFICADAS */}
        <div className="p-5 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl shadow-md space-y-3 relative overflow-hidden border border-emerald-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-amber-300" />
              Pessoas Verificadas
            </span>
            <span className="p-2 bg-emerald-800/80 text-amber-300 rounded-xl border border-emerald-600">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>

          <div>
            <div className="text-3xl font-black font-serif text-amber-300">{totalVerificados}</div>
            <p className="text-[11px] text-emerald-200 font-medium">Contas aprovadas com Check Verde e B.I ativo</p>
          </div>

          <div className="pt-2 border-t border-emerald-800/80 grid grid-cols-3 gap-1 text-[11px] font-bold text-emerald-100">
            <span>🟢 {verificadosFarmers} Agric.</span>
            <span>🟢 {verificadosDrivers} Transp.</span>
            <span>🟢 {verificadosBuyers} Compr.</span>
          </div>
        </div>

        {/* 3. QUANTAS PESSOAS RECUSADAS */}
        <div className="p-5 bg-white rounded-3xl border border-red-200 shadow-xs space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              Pessoas Recusadas
            </span>
            <span className="p-2 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <UserX className="w-5 h-5" />
            </span>
          </div>

          <div>
            <div className="text-3xl font-black font-serif text-red-600">{totalRecusados}</div>
            <p className="text-[11px] text-red-800 font-medium">Documentos inválidos ou idade inferior a 18 anos</p>
          </div>

          <div className="pt-2 border-t border-red-100 grid grid-cols-2 gap-1 text-[11px] font-bold text-red-800">
            <span>🔴 {recusadosFarmers} Agric. Recusados</span>
            <span>🔴 {recusadosDrivers} Transp. Recusados</span>
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLO DE UTILIZADORES */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-emerald-100 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              Lista e Gestão Administrativa de Utilizadores
            </h3>
            <p className="text-xs text-slate-500">
              Verifique os dados cadastrais e aprove ou recuse com 1 clique a verificação de B.I dos utilizadores.
            </p>
          </div>

          {/* FILTROS E PESQUISA */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Estado */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-700">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === "ALL" ? "bg-emerald-800 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Todas ({totalCadastrados})
              </button>
              <button
                onClick={() => setFilterStatus("VERIFIED")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === "VERIFIED" ? "bg-emerald-700 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Verificadas ({totalVerificados})
              </button>
              <button
                onClick={() => setFilterStatus("REJECTED")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === "REJECTED" ? "bg-red-700 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Recusadas ({totalRecusados})
              </button>
              <button
                onClick={() => setFilterStatus("PENDING")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === "PENDING" ? "bg-amber-600 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Pendentes ({totalPendentes})
              </button>
            </div>

            {/* Filtro por Papel */}
            <select
              value={filterRole}
              onChange={(e: any) => setFilterRole(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800 cursor-pointer"
            >
              <option value="ALL">Todos os Papéis</option>
              <option value="FARMER">👨‍🌾 Agricultores ({cadastradosFarmers})</option>
              <option value="DRIVER">🚚 Transportadores ({cadastradosDrivers})</option>
              <option value="BUYER">🛒 Compradores ({cadastradosBuyers})</option>
            </select>

            {/* Pesquisa */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar por nome, telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none w-48 focus:w-60 transition-all"
              />
            </div>
          </div>
        </div>

        {/* TABELA DE UTILIZADORES */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Nome / Contacto</th>
                <th className="py-3 px-3">Papel na Plataforma</th>
                <th className="py-3 px-3">Província / Distrito</th>
                <th className="py-3 px-3">B.I & Idade</th>
                <th className="py-3 px-3">Estado de Verificação</th>
                <th className="py-3 px-3 text-right">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum utilizador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isVerified =
                    u.isVerifiedFarmer ||
                    u.isApproved ||
                    u.verificationStatus === "Aprovado" ||
                    u.role === "BUYER";

                  const isRejected =
                    u.verificationStatus === "Recusado" ||
                    !!u.rejectionReason ||
                    u.isApproved === false;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{u.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" /> {u.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            u.role === "FARMER"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : u.role === "DRIVER"
                              ? "bg-amber-100 text-amber-950 border border-amber-300"
                              : u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-950 border border-purple-300"
                              : "bg-blue-100 text-blue-900 border border-blue-300"
                          }`}
                        >
                          {u.role === "FARMER" ? (
                            <>
                              <Sprout className="w-3 h-3 text-emerald-700" /> Agricultor
                            </>
                          ) : u.role === "DRIVER" ? (
                            <>
                              <Truck className="w-3 h-3 text-amber-700" /> Transportador
                            </>
                          ) : u.role === "ADMIN" ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-purple-700" /> Administrador
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3 h-3 text-blue-700" /> Comprador
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {u.district || "Distrito"}, {u.province || "Província"}
                        </span>
                        {u.farmName && (
                          <span className="text-[10px] text-emerald-800 font-medium block">
                            Machamba: {u.farmName}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {u.detectedAge ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-block ${
                              u.detectedAge >= 18 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            🎂 {u.detectedAge} Anos {u.detectedAge >= 18 ? "(Maior 18+)" : "(Menor)"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Doc. Padrão</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {isVerified ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-extrabold rounded-full text-[10px] flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verificado / Aprovado
                            </span>
                            {u.role === "FARMER" && <VerifiedFarmerBadge isVerified={true} size="sm" />}
                          </div>
                        ) : isRejected ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 bg-red-100 text-red-900 font-extrabold rounded-full text-[10px] flex items-center gap-1 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> Recusado
                            </span>
                            {u.rejectionReason && (
                              <p className="text-[10px] text-red-600 font-medium italic max-w-xs truncate">
                                {u.rejectionReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-extrabold rounded-full text-[10px] flex items-center gap-1 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendente de Análise
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Aprovar / Dar Check Verde */}
                          {(!isVerified || isRejected) && (
                            <button
                              onClick={() => {
                                if (u.role === "FARMER") {
                                  verifyFarmerBiIdentity(u.id, true, u.detectedAge || 25);
                                } else if (u.role === "DRIVER") {
                                  approveDriverAccount(u.id);
                                } else {
                                  verifyFarmerBiIdentity(u.id, true, 25);
                                }
                              }}
                              className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Aprovar conta e atribuir Check Verde de Verificação"
                            >
                              <BadgeCheck className="w-3 h-3 text-amber-300" /> Aprovar
                            </button>
                          )}

                          {/* Botão Recusar */}
                          {(!isRejected) && (
                            <button
                              onClick={() => {
                                const reason = prompt("Motivo da Recusa do B.I / Conta:", "Documentação inválida ou Idade inferior a 18 anos");
                                if (reason !== null) {
                                  verifyFarmerBiIdentity(u.id, false, u.detectedAge || 16, reason);
                                }
                              }}
                              className="py-1 px-2.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                              title="Recusar conta de utilizador"
                            >
                              Recusar
                            </button>
                          )}
                        </div>
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
  );
};
