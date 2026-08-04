import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { PaymentMethod, WalletTransaction } from "../types";
import { PaymentProcessor } from "../services/paymentProcessor";
import { PaymentProcessingModal } from "./PaymentProcessingModal";
import {
  X,
  ArrowLeft,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Zap,
  Send,
  ShoppingBag,
  Info,
  Building2,
  TrendingUp,
} from "lucide-react";

interface WalletModalProps {
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
  const {
    currentUser,
    transactions,
    orders,
    withdrawWalletFunds,
    depositWalletFunds,
    getCarteira,
    transacoesCarteira,
  } = useAgro();

  const isFarmer = currentUser?.role === "FARMER";
  const isDriver = currentUser?.role === "DRIVER";
  const isAdmin = currentUser?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"DEPOSIT_PAY" | "ESCROW" | "WITHDRAW">(
    isAdmin ? "WITHDRAW" : "WITHDRAW"
  );

  // Live Cloud Wallet Data (/carteiras/{userId})
  const liveCarteira = currentUser ? getCarteira(currentUser.id) : null;

  // Payment/Deposit Module States (For Farmers/Drivers testing or deposits)
  const [payMethod, setPayMethod] = useState<PaymentMethod>("M-Pesa");
  const [payPhone, setPayPhone] = useState<string>(currentUser?.phone || "841234567");
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payPurpose, setPayPurpose] = useState<string>("Pagamento de Encomenda / Compra em Custódia");
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);
  const [showUssdModal, setShowUssdModal] = useState<boolean>(false);
  const [ussdPin, setUssdPin] = useState<string>("");
  const [createdTx, setCreatedTx] = useState<WalletTransaction | null>(null);

  // Withdraw States
  const [amountInput, setAmountInput] = useState<number>(500);
  const [methodInput, setMethodInput] = useState<PaymentMethod>("M-Pesa");
  const [phoneInput, setPhoneInput] = useState<string>(currentUser?.phone || "841234567");
  const [pinInput, setPinInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [withdrawFeedback, setWithdrawFeedback] = useState<string | null>(null);

  // Filter user transactions from legacy & new /transacoes_carteira
  const userTxs = transactions.filter((t) => t.userId === currentUser?.id);
  const userCarteiraTxs = transacoesCarteira.filter((t) => t.userId === currentUser?.id);

  // --- CÁLCULOS EXCLUSIVOS DE GANHOS DA APLICAÇÃO PARA O ADMINISTRADOR ---
  const totalPlatformEarnings = orders.reduce(
    (sum, o) => sum + (o.platformFee || Math.round((o.subtotal || o.totalAmount || 0) * 0.05)),
    0
  );

  const totalAdminWithdrawals = userTxs
    .filter((t) => t.type === "SAÍDA")
    .reduce((sum, t) => sum + t.amount, 0);

  const adminAvailableBalance = Math.max(0, totalPlatformEarnings - totalAdminWithdrawals);

  // Balance values from /carteiras/{userId}
  const currentBalance = isAdmin
    ? adminAvailableBalance
    : liveCarteira
    ? liveCarteira.saldoDisponivel
    : 0;

  const pendingEscrowBalance = liveCarteira ? liveCarteira.saldoRetido : 0;

  // Initiate M-Pesa or e-Mola Payment / Deposit
  const handleInitiateMobilePayment = (e: React.FormEvent) => {
    e.preventDefault();

    const phoneCheck = PaymentProcessor.validatePhoneNumber(payPhone, payMethod);
    if (!phoneCheck.valid) {
      alert(phoneCheck.message);
      return;
    }

    if (payAmount <= 0) {
      alert("Insira um valor superior a 0 MT.");
      return;
    }

    setShowUssdModal(true);
  };

  // Confirm USSD Push simulation
  const handleConfirmUssdPush = async (providedPin: string) => {
    setIsSubmittingPay(true);

    const payRes = await PaymentProcessor.processMobilePayment({
      amount: payAmount,
      phoneNumber: payPhone,
      method: payMethod,
      buyerId: currentUser?.id || "guest",
      referenceNote: payPurpose,
    });

    if (payRes.success) {
      const newTx = depositWalletFunds(
        payAmount,
        payMethod,
        payPhone,
        `${payPurpose} [${payMethod}]`
      );

      setCreatedTx(newTx);
      setIsSubmittingPay(false);
      setShowUssdModal(false);
      setUssdPin("");
    } else {
      setIsSubmittingPay(false);
      throw new Error(payRes.message || "Falha na autorização do PIN.");
    }
  };

  // Handle Withdraw submit
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawFeedback(null);

    if (amountInput < 100) {
      alert("O valor mínimo de levantamento é de 100 MT.");
      return;
    }

    if (amountInput > currentBalance) {
      alert(`Saldo insuficiente. O seu saldo disponível é de ${currentBalance} MT.`);
      return;
    }

    if (pinInput.length < 4) {
      alert("Introduza o PIN de segurança de 4 dígitos.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const ok = withdrawWalletFunds(amountInput, methodInput, phoneInput);
      setIsProcessing(false);
      if (ok) {
        setWithdrawFeedback(`Solicitação de levantamento de ${amountInput} MT criada com sucesso! O documento foi registrado em 'transacoes_carteira' com tipo 'levantamento' e estado 'pendente'.`);
        setPinInput("");
        setAmountInput(100);
      } else {
        alert("Não foi possível processar a solicitação de levantamento.");
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white max-w-xl w-full rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-5 my-6">
        
        {/* HEADER WITH VOLTAR / BACK BUTTON */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-amber-300 hover:text-white rounded-2xl transition-all flex items-center gap-2 text-xs font-black shrink-0 border border-emerald-700/80 shadow-md active:scale-95 cursor-pointer"
              title="Voltar e sair da Carteira"
            >
              <ArrowLeft className="w-5 h-5 text-amber-300 stroke-[2.5]" />
              <span className="text-amber-300 font-extrabold">Voltar</span>
            </button>

            <div className="p-2 rounded-2xl bg-amber-400 text-slate-950 font-extrabold shadow-sm shrink-0">
              <Wallet className="w-4.5 h-4.5" />
            </div>

            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5 truncate">
                <span className="truncate">
                  {isAdmin ? "Carteira do Administrador" : "Carteira Digital"}
                </span>
                <span className="hidden sm:inline text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                  AgroMoz
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all shrink-0 cursor-pointer"
            title="Fechar carteira"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. SE FOR COMPRADOR */}
        {currentUser?.role === "BUYER" ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Os Compradores Não Necessitam de Carteira Digital
              </h4>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Como comprador, os seus pagamentos de produtos agrícolas são efetuados <strong>diretamente via M-Pesa ou e-Mola</strong> durante o checkout da compra.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 text-xs text-left max-w-md mx-auto space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Quem utiliza a Carteira AgroMoz?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                <li><strong>Agricultores:</strong> Para receber o pagamento das suas vendas agrícolas.</li>
                <li><strong>Transportadores:</strong> Para receber o valor dos fretes de transporte.</li>
                <li><strong>Administradores:</strong> Para gerir os ganhos por comissão da aplicação e efetuar levantamentos.</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Compreender e Voltar ao Mercado
            </button>
          </div>
        ) : isAdmin ? (
          /* 2. SE FOR ADMINISTRADOR: APENAS OS VALORES GANHOS PELA APLICAÇÃO E O LEVANTAMENTO */
          <div className="space-y-5">
            {/* CARDS DE MÉTRICAS EXCLUSIVAS DO ADMINISTRADOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* CARD 1: VALORES GANHOS PELA APLICAÇÃO (COMISSÃO AGROMOZ 5%) */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-4.5 rounded-2xl shadow-lg relative overflow-hidden border border-emerald-900">
                <div className="relative z-10 flex flex-col justify-between h-24">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-300 font-extrabold flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      Ganhos da Aplicação
                    </span>
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[9px] uppercase">
                      Comissão 5%
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-black font-serif text-amber-300">
                      {totalPlatformEarnings.toLocaleString()} MT
                    </div>
                    <div className="text-[10px] text-emerald-200 mt-0.5 font-medium">
                      Total acumulado de taxas de serviço AgroMoz
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: SALDO DISPONÍVEL PARA LEVANTAMENTO */}
              <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 text-white p-4.5 rounded-2xl shadow-lg relative overflow-hidden border border-emerald-700/60">
                <div className="relative z-10 flex flex-col justify-between h-24">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-200 font-extrabold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Saldo p/ Levantamento
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-full font-black text-[9px] uppercase">
                      Líquido
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-black font-serif text-white">
                      {adminAvailableBalance.toLocaleString()} MT
                    </div>
                    <div className="text-[10px] text-emerald-200 mt-0.5 font-medium">
                      Pronto para transferir via M-Pesa ou e-Mola
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FORMULÁRIO DE LEVANTAMENTO DOS GANHOS DO ADMINISTRADOR */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-extrabold text-slate-900">
                <span className="flex items-center gap-1.5 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-amber-600" />
                  Efetuar Levantamento dos Ganhos da Aplicação
                </span>
                <span className="text-emerald-800 font-black font-serif text-xs">
                  Disponível: {adminAvailableBalance.toLocaleString()} MT
                </span>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-800 mb-1">Operador Móvel *</label>
                    <select
                      value={methodInput}
                      onChange={(e) => setMethodInput(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:border-emerald-600"
                    >
                      <option value="M-Pesa">M-Pesa (Vodacom)</option>
                      <option value="e-Mola">e-Mola (Movitel)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-800 mb-1">Valor a Levantar (MT) *</label>
                    <input
                      type="number"
                      min="10"
                      max={adminAvailableBalance}
                      required
                      value={amountInput}
                      onChange={(e) => setAmountInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-black text-emerald-900 text-sm focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Número de Telemóvel Destinatário *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">+258</span>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="841234567"
                      className="w-full pl-14 pr-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> PIN de Segurança de 4 Dígitos *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-mono text-center tracking-widest text-sm focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || adminAvailableBalance <= 0}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 ${
                    adminAvailableBalance <= 0
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-800 hover:bg-emerald-900 text-white"
                  }`}
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>
                    {isProcessing
                      ? "A processar levantamento..."
                      : `Confirmar Levantamento de ${amountInput} MT`}
                  </span>
                </button>
              </form>
            </div>

            {/* HISTÓRICO DE GANHOS E LEVANTAMENTOS DO ADMINISTRADOR */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  Histórico de Ganhos por Comissão e Levantamentos
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {orders.length} vendas efetuadas
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {/* 1. LISTA DE COMISSÕES GANHAS POR PEDIDO */}
                {orders.map((ord) => {
                  const fee = ord.platformFee || Math.round((ord.subtotal || ord.totalAmount || 0) * 0.05);
                  return (
                    <div
                      key={`fee-${ord.id}`}
                      className="p-3 bg-emerald-50/60 hover:bg-emerald-50 rounded-2xl flex items-center justify-between text-xs border border-emerald-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 font-bold">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">
                            Comissão AgroMoz 5% — {ord.productName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Pedido #{ord.id} | Vendedor: {ord.farmerName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black font-serif text-emerald-800 text-sm">
                          +{fee} MT
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 inline-block">
                          Ganho da Aplicação
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 2. LISTA DE LEVANTAMENTOS EFETUADOS PELO ADMIN */}
                {userTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between text-xs border border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-800 shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">{tx.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.timestamp).toLocaleString()} | Ref: {tx.reference}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black font-serif text-slate-900 text-sm">
                        -{tx.amount} MT
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 inline-block">
                        Levantado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTÃO VOLTAR / FECHAR */}
            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-950 text-amber-300 hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                <span>Voltar e Sair da Carteira</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3. SE FOR AGRICULTOR OU TRANSPORTADOR: VISUALIZAÇÃO PADRÃO DA CARTEIRA */
          <>
            {/* BALANCE METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 text-white p-4.5 rounded-2xl shadow-lg relative overflow-hidden border border-emerald-700/50">
                <div className="relative z-10 flex flex-col justify-between h-22">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-200 font-medium">Saldo Livre Disponível</span>
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-bold text-[9px]">
                      Disponível
                    </span>
                  </div>

                  <div className="text-2xl font-black font-serif text-amber-300">
                    {currentBalance.toLocaleString()} MT
                  </div>

                  <div className="text-[10px] text-emerald-200 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />{" "}
                    {isFarmer
                      ? "Recebido das vendas agrícolas (Pronto p/ levantamento)"
                      : isDriver
                      ? "Recebido dos fretes (Pronto p/ levantamento)"
                      : "Pronto para levantamento"}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border-2 border-amber-300/80 text-amber-950 p-4.5 rounded-2xl relative overflow-hidden shadow-xs">
                <div className="relative z-10 flex flex-col justify-between h-22">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-900 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Em Custódia (Escrow)
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-extrabold text-[9px] uppercase">
                      Pendente
                    </span>
                  </div>

                  <div className="text-2xl font-black font-serif text-amber-900">
                    {pendingEscrowBalance.toLocaleString()} MT
                  </div>

                  <div className="text-[10px] text-amber-800 font-medium truncate">
                    {isFarmer ? "A libertar para si após a entrega" : "Protegido em garantia até à entrega"}
                  </div>
                </div>
              </div>
            </div>

            {/* NAVIGATION TABS */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-extrabold">
              <button
                onClick={() => setActiveTab("ESCROW")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "ESCROW"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Fundo Custódia ({orders.filter((o) => o.escrowStatus === "Pendente").length})</span>
              </button>

              <button
                onClick={() => setActiveTab("WITHDRAW")}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "WITHDRAW"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-300" />
                <span>Levantar Saldo</span>
              </button>
            </div>

            {/* TAB CONTENT: ESCROW FUND SYSTEM DETAILS */}
            {activeTab === "ESCROW" && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-900 text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    Como Funciona a Proteção por Custódia (Escrow)?
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 leading-relaxed">
                    <li>
                      O comprador efetua o pagamento via <strong>M-Pesa</strong> ou <strong>e-Mola</strong>.
                    </li>
                    <li>
                      A transação é registrada com status <strong>PENDENTE</strong>.
                    </li>
                    <li>
                      O agricultor e o transportador preparam e entregam a encomenda na localização indicada.
                    </li>
                    <li>
                      Após a entrega confirmada, a AgroMoz desconta a taxa da plataforma (5%) e libera o valor líquido para a conta do agricultor.
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs">
                    As Suas Encomendas Retidas em Custódia ({orders.filter((o) => o.escrowStatus === "Pendente").length})
                  </h4>

                  {orders.filter((o) => o.escrowStatus === "Pendente").length === 0 ? (
                    <p className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                      Nenhuma encomenda retida em custódia no momento.
                    </p>
                  ) : (
                    orders
                      .filter((o) => o.escrowStatus === "Pendente")
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900">{ord.productName}</div>
                            <div className="text-[10px] text-slate-500">
                              Vendedor: {ord.farmerName} | Pedido #{ord.id}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-amber-700 font-serif">{ord.totalAmount} MT</div>
                            <span className="inline-block bg-amber-100 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              Pendente (Aguardando Entrega)
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: WITHDRAWAL FORM FOR FARMERS / DRIVERS */}
            {activeTab === "WITHDRAW" && (
              <div className="space-y-4">
                {withdrawFeedback && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-emerald-950">Solicitação Enviada!</p>
                      <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">{withdrawFeedback}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleWithdrawSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-900">
                    <span>Transferir do Saldo Livre para Carteira Móvel</span>
                    <span className="text-emerald-700 font-extrabold font-serif">
                      Disponível: {currentBalance} MT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Método *</label>
                      <select
                        value={methodInput}
                        onChange={(e) => setMethodInput(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                      >
                        <option value="M-Pesa">M-Pesa (Vodacom)</option>
                        <option value="e-Mola">e-Mola (Movitel)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Valor (MT) *</label>
                      <input
                        type="number"
                        min="50"
                        max={currentBalance}
                        value={amountInput}
                        onChange={(e) => setAmountInput(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold text-emerald-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número Destinatário *</label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> PIN de Segurança (4 dígitos) *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none font-mono text-center tracking-widest text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {isProcessing ? "A processar transferência..." : "Confirmar Levantamento"}
                  </button>
                </form>
              </div>
            )}

            {/* HISTÓRICO DE TRANSAÇÕES GERAL & TRANSAÇÕES DE CARTEIRA */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <span>Histórico de Transações</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Cloud Firestore
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {userTxs.length + userCarteiraTxs.length} registo(s)
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {/* 1. REGISTOS DE transacoes_carteira */}
                {userCarteiraTxs.map((txc) => (
                  <div
                    key={txc.id}
                    className="p-3 bg-amber-50/50 hover:bg-amber-50 rounded-2xl flex items-center justify-between text-xs border border-amber-200/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          txc.estado === "pendente"
                            ? "bg-amber-200 text-amber-900"
                            : txc.tipo === "deposito" || txc.tipo === "liberacao"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {txc.estado === "pendente" ? (
                          <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                        ) : txc.tipo === "deposito" || txc.tipo === "liberacao" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span className="capitalize">{txc.tipo}</span>
                          <span className="text-[10px] font-mono text-slate-500">({txc.referenciaExterna})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{new Date(txc.criadoEm).toLocaleString()}</span>
                          <span className="text-amber-800 font-medium">/transacoes_carteira</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black font-serif text-sm ${
                          txc.tipo === "deposito" || txc.tipo === "liberacao" ? "text-emerald-800" : "text-slate-900"
                        }`}
                      >
                        {txc.tipo === "deposito" || txc.tipo === "liberacao" ? "+" : "-"}{txc.valor} MT
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase ${
                          txc.estado === "pendente"
                            ? "bg-amber-200 text-amber-950 border border-amber-300 animate-pulse"
                            : txc.estado === "concluido"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-rose-100 text-rose-900"
                        }`}
                      >
                        {txc.estado}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 2. LEGACY WALLET TRANSACTIONS */}
                {userTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-50 rounded-2xl flex items-center justify-between text-xs border border-slate-200/70"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          tx.status === "Pendente"
                            ? "bg-amber-100 text-amber-900"
                            : tx.type === "ENTRADA"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {tx.status === "Pendente" ? (
                          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        ) : tx.type === "ENTRADA" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{tx.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{new Date(tx.timestamp).toLocaleString()}</span>
                          <span>• Ref: {tx.reference}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black font-serif text-sm ${
                          tx.type === "ENTRADA" ? "text-emerald-800" : "text-slate-900"
                        }`}
                      >
                        {tx.type === "ENTRADA" ? "+" : "-"}{tx.amount} MT
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          tx.status === "Pendente"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : tx.status === "Pago"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tx.status === "Pendente" ? "PENDENTE (Custódia)" : tx.status}
                      </span>
                    </div>
                  </div>
                ))}

                {userTxs.length === 0 && userCarteiraTxs.length === 0 && (
                  <p className="text-[11px] text-slate-400 text-center py-4">Sem histórico recente.</p>
                )}
              </div>
            </div>

            {/* BOTTOM EXIT / VOLTAR BUTTON */}
            <div className="pt-3 border-t border-slate-100 flex justify-center">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-950 text-amber-300 hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                <span>Voltar e Sair da Carteira</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* PAYMENT PROCESSING MODAL OVERLAY */}
      <PaymentProcessingModal
        isOpen={showUssdModal}
        onClose={() => setShowUssdModal(false)}
        method={payMethod}
        phoneNumber={payPhone}
        amount={payAmount}
        referenceNote={payPurpose}
        onSuccess={handleConfirmUssdPush}
        onCancel={() => {
          setShowUssdModal(false);
          setUssdPin("");
        }}
        expirationSeconds={60}
      />
    </div>
  );
};
