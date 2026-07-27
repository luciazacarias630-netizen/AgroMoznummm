import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { PaymentMethod, WalletTransaction } from "../types";
import { PaymentProcessor } from "../services/paymentProcessor";
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Zap,
  CreditCard,
  Send,
  AlertCircle,
  HelpCircle,
  Sparkles,
  PhoneCall,
  RefreshCw,
  Info,
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
    confirmPendingTransaction,
  } = useAgro();

  const [activeTab, setActiveTab] = useState<"DEPOSIT_PAY" | "ESCROW" | "WITHDRAW">("DEPOSIT_PAY");

  // Payment/Deposit Module States
  const [payMethod, setPayMethod] = useState<PaymentMethod>("M-Pesa");
  const [payPhone, setPayPhone] = useState<string>(currentUser?.phone || "841234567");
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payPurpose, setPayPurpose] = useState<string>("Pagamento de Encomenda / Compra em Custódia");
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);
  const [showUssdModal, setShowUssdModal] = useState<boolean>(false);
  const [ussdPin, setUssdPin] = useState<string>("");
  const [createdTx, setCreatedTx] = useState<WalletTransaction | null>(null);

  // Withdraw States
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [amountInput, setAmountInput] = useState<number>(500);
  const [methodInput, setMethodInput] = useState<PaymentMethod>("M-Pesa");
  const [phoneInput, setPhoneInput] = useState<string>(currentUser?.phone || "");
  const [pinInput, setPinInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Filter user transactions
  const userTxs = transactions.filter((t) => t.userId === currentUser?.id);

  // Calculate Escrow Metrics
  const isFarmer = currentUser?.role === "FARMER";
  const farmerOrders = orders.filter((o) => o.farmerId === currentUser?.id);
  const buyerOrders = orders.filter((o) => o.buyerId === currentUser?.id);

  const pendingEscrowBalance = isFarmer
    ? farmerOrders
        .filter((o) => o.escrowStatus === "Pendente")
        .reduce((sum, o) => sum + (o.farmerNetAmount || Math.round(o.subtotal * 0.95)), 0)
    : buyerOrders
        .filter((o) => o.escrowStatus === "Pendente")
        .reduce((sum, o) => sum + o.totalAmount, 0);

  const calculateAvailableBalance = () => {
    let balance = isFarmer ? 0 : 2500; // Base start credit
    userTxs.forEach((t) => {
      if (t.type === "ENTRADA" && t.status !== "Pendente") balance += t.amount;
      else if (t.type === "SAÍDA") balance -= t.amount;
    });
    return Math.max(0, balance);
  };

  const currentBalance = calculateAvailableBalance();

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

    // Open simulated USSD push confirmation dialog on user's phone
    setShowUssdModal(true);
  };

  // Confirm USSD Push simulation via PaymentProcessor
  const handleConfirmUssdPush = async () => {
    if (ussdPin.length < 4) {
      alert("Por favor digite o PIN de 4 dígitos no telemóvel.");
      return;
    }

    setIsSubmittingPay(true);

    const payRes = await PaymentProcessor.processMobilePayment({
      amount: payAmount,
      phoneNumber: payPhone,
      method: payMethod,
      buyerId: currentUser?.id || "guest",
      referenceNote: payPurpose,
    });

    if (payRes.success) {
      // Call depositWalletFunds -> Creates transaction with STATUS: 'Pendente' in DB
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
      alert(payRes.message);
      setIsSubmittingPay(false);
    }
  };

  // Handle Withdraw submit
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountInput > currentBalance) {
      alert("Saldo insuficiente para efetuar esta transferência.");
      return;
    }

    if (pinInput.length < 4) {
      alert("Introduza o PIN de segurança de 4 dígitos.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      withdrawWalletFunds(amountInput, methodInput, phoneInput);
      setIsProcessing(false);
      setShowWithdraw(false);
      setPinInput("");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white max-w-xl w-full rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-5 my-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-extrabold shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>Carteira Digital AgroMoz</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  M-Pesa & e-Mola
                </span>
              </h3>
              <p className="text-xs text-slate-500">Módulo de Pagamentos e Fundo de Custódia Escrow</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                <Zap className="w-3 h-3 text-amber-400" /> Pronto para compras ou levantamento
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
            onClick={() => setActiveTab("DEPOSIT_PAY")}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "DEPOSIT_PAY"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Pagar / Depositar</span>
          </button>

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
            <span>Levantar</span>
          </button>
        </div>

        {/* TAB CONTENT 1: M-PESA & E-MOLA PAYMENT INTEGRATION MODULE */}
        {activeTab === "DEPOSIT_PAY" && (
          <div className="space-y-4">
            
            {/* SUCCESS BANNER WHEN PAYMENT IS CREATED AS 'PENDENTE' */}
            {createdTx && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-emerald-900 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Pagamento {createdTx.method} Iniciado com Sucesso!
                  </span>
                  <span className="bg-amber-300 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px]">
                    Status: PENDENTE
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  O pedido de pagamento de <strong>{createdTx.amount} MT</strong> via{" "}
                  <strong>{createdTx.method}</strong> foi processado. O status da transação foi salvo
                  como <strong>"PENDENTE"</strong> no banco de dados e ficará retido em garantia
                  (Escrow) até à confirmação de entrega do produto.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Ref. Transação: {createdTx.reference} | ID: {createdTx.id}
                </div>
              </div>
            )}

            <form onSubmit={handleInitiateMobilePayment} className="space-y-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  Efetuar Pagamento M-Pesa / e-Mola Directo
                </h4>
                <span className="text-[10px] text-slate-500 font-semibold">Moçambique MZN (MT)</span>
              </div>

              {/* OPERATOR SELECTOR */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Selecione o Operador de Pagamento Móvel *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("M-Pesa");
                      if (payPhone.startsWith("86") || payPhone.startsWith("87")) setPayPhone("841234567");
                    }}
                    className={`p-3 rounded-2xl border-2 font-extrabold flex items-center justify-between transition-all ${
                      payMethod === "M-Pesa"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-xs">
                        M
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-black">M-Pesa</span>
                        <span className="text-[9px] text-slate-500 block font-normal">Vodacom (84 / 85)</span>
                      </div>
                    </div>
                    {payMethod === "M-Pesa" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("e-Mola");
                      if (payPhone.startsWith("84") || payPhone.startsWith("85")) setPayPhone("861234567");
                    }}
                    className={`p-3 rounded-2xl border-2 font-extrabold flex items-center justify-between transition-all ${
                      payMethod === "e-Mola"
                        ? "border-amber-500 bg-amber-50 text-amber-950 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-xs">
                        e
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-black">e-Mola</span>
                        <span className="text-[9px] text-slate-500 block font-normal">Movitel (86 / 87)</span>
                      </div>
                    </div>
                    {payMethod === "e-Mola" && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>

              {/* PHONE NUMBER FIELD */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Número de Telemóvel da Carteira *</label>
                  {currentUser?.phone && (
                    <button
                      type="button"
                      onClick={() => setPayPhone(currentUser.phone)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline"
                    >
                      Usar meu contacto ({currentUser.phone})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+258</span>
                  <input
                    type="tel"
                    required
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="84 123 4567"
                    className="w-full pl-14 pr-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* AMOUNT FIELD WITH QUICK PRESETS */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Valor do Pagamento (MT / Meticais) *</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-black text-emerald-900 text-base focus:border-emerald-600"
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Rápido:</span>
                  {[200, 500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                        payAmount === amt
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {amt} MT
                    </button>
                  ))}
                </div>
              </div>

              {/* PURPOSE / REFERENCE */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">Finalidade / Referência *</label>
                <select
                  value={payPurpose}
                  onChange={(e) => setPayPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none text-slate-800 font-medium"
                >
                  <option value="Pagamento de Encomenda / Compra em Custódia">
                    Pagamento de Encomenda de Machamba (Em Custódia)
                  </option>
                  <option value="Aporte de Fundo de Garantia de Frete">
                    Fundo de Garantia de Transporte / Frete
                  </option>
                  <option value="Recarga de Saldo Livre da Carteira">
                    Recarga de Saldo Livre da Carteira AgroMoz
                  </option>
                </select>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-green-900 hover:from-emerald-900 hover:to-green-950 text-white font-black rounded-2xl shadow-md text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>Pagar {payAmount.toLocaleString()} MT via {payMethod} (Status: Pendente)</span>
              </button>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[10px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mecanismo de Segurança:</strong> Assim que clicar para pagar, a transação fica com o estado <strong>PENDENTE</strong>. O dinheiro não vai direto para o vendedor; ele é mantido protegido na conta Escrow da AgroMoz até o produto ser entregue!
                </span>
              </div>
            </form>
          </div>
        )}

        {/* TAB CONTENT 2: ESCROW FUND SYSTEM DETAILS */}
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
                  A transação é registrada no banco de dados com status <strong>PENDENTE</strong>.
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

        {/* TAB CONTENT 3: WITHDRAWAL FORM */}
        {activeTab === "WITHDRAW" && (
          <div className="space-y-4">
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
                    onChange={(e) => setMethodInput(e.target.value as any)}
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
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all"
              >
                {isProcessing ? "A processar transferência..." : "Confirmar Levantamento"}
              </button>
            </form>
          </div>
        )}

        {/* HISTÓRICO DE TRANSAÇÕES GERAL */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-800">Histórico de Transações do Banco de Dados</h4>
            <span className="text-[10px] text-slate-400">{userTxs.length} registo(s)</span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
            {userTxs.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4">Sem histórico recente.</p>
            ) : (
              userTxs.map((tx) => (
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* SIMULATED MOBILE USSD PUSH CONFIRMATION MODAL OVERLAY */}
      {showUssdModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-900 text-white max-w-sm w-full rounded-3xl p-6 border-2 border-amber-400 shadow-2xl space-y-4 animate-scaleUp">
            
            {/* OPERATOR HEADER */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div
                className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-sm ${
                  payMethod === "M-Pesa" ? "bg-red-600 text-white" : "bg-amber-400 text-slate-950"
                }`}
              >
                {payMethod === "M-Pesa" ? "M" : "e"}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  {payMethod === "M-Pesa" ? "Vodacom M-Pesa" : "Movitel e-Mola"}
                </h4>
                <p className="text-[10px] text-amber-300">Aviso USSD Push no Telemóvel</p>
              </div>
            </div>

            {/* MESSAGE */}
            <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 text-xs space-y-1">
              <p className="text-slate-200">
                Deseja autorizar o pagamento de{" "}
                <strong className="text-amber-300">{payAmount} MT</strong> para{" "}
                <strong>AgroMoz Moçambique Lda</strong>?
              </p>
              <p className="text-[10px] text-slate-400">
                Número: +258 {payPhone} | Ref: {payPurpose.substring(0, 30)}...
              </p>
            </div>

            {/* PIN INPUT FIELD */}
            <div className="space-y-1 text-xs">
              <label className="block text-slate-300 font-bold text-center">
                Digite o PIN M-Pesa/e-Mola (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={4}
                value={ussdPin}
                onChange={(e) => setUssdPin(e.target.value)}
                placeholder="••••"
                className="w-full py-2.5 bg-slate-950 border-2 border-amber-400/60 rounded-xl text-center text-white font-mono text-lg tracking-widest outline-none focus:border-amber-400"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUssdModal(false);
                  setUssdPin("");
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmUssdPush}
                disabled={isSubmittingPay}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                {isSubmittingPay ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Autorizar Pagamento</span>
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-500 font-medium">
              Transação protegida com status 'PENDENTE' até confirmação de entrega.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
