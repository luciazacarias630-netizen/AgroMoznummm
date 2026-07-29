import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueLocations";
import { UserRole } from "../types";
import { AgroMozLogo } from "./AgroMozLogo";
import {
  Sprout,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";

export const AuthScreen: React.FC = () => {
  const { loginUser, registerUser, receiverPhone, users } = useAgro();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Login Form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register Form state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [regProvince, setRegProvince] = useState("Maputo Província");
  const [regDistrict, setRegDistrict] = useState("Marracuene");
  const [regAddress, setRegAddress] = useState("");
  const [regLocalidade, setRegLocalidade] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Farmer specific registration
  const [farmName, setFarmName] = useState("");
  const [farmArea, setFarmArea] = useState("2 Hectares");
  const [cropsText, setCropsText] = useState("Tomate, Pimento, Alface");
  const [bio, setBio] = useState("");

  // Driver specific registration
  const [vehicleType, setVehicleType] = useState<"Motorizada" | "Carrinha" | "Camioneta" | "Bicicleta">("Carrinha");
  const [licensePlate, setLicensePlate] = useState("");

  // Farmer Membership 50 MT Fee Modal
  const [showFarmerFeeModal, setShowFarmerFeeModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"M-Pesa" | "e-Mola">("M-Pesa");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [feePaidSuccess, setFeePaidSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const selectedProvinceObj = MOZAMBIQUE_PROVINCES.find((p) => p.name === regProvince);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!selectedRole) return;

    const user = loginUser(loginPhone, loginPass, selectedRole);
    if (!user) {
      setLoginError("Credenciais inválidas ou utilizador não registado nesta categoria.");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setRegisterError("");

    if (regPass && regConfirmPass && regPass !== regConfirmPass) {
      setRegisterError("As palavras-passe não coincidem.");
      return;
    }

    const cleanDigits = regPhone.replace(/\D/g, "");
    if (cleanDigits.length >= 6) {
      const existing = users.find((u) => u.phone.replace(/\D/g, "") === cleanDigits);
      if (existing) {
        const roleLabel =
          existing.role === "FARMER"
            ? "Agricultor"
            : existing.role === "BUYER"
            ? "Comprador"
            : existing.role === "DRIVER"
            ? "Transportador"
            : "Administrador";
        setRegisterError(
          `O número de telefone (${regPhone}) já está registado como ${roleLabel} (${existing.name}). Faça Login para entrar na sua conta.`
        );
        return;
      }
    }

    try {
      registerUser({
        name: regName || (selectedRole === "FARMER" ? "Novo Agricultor" : selectedRole === "BUYER" ? "Novo Consumidor" : "Novo Transportador"),
        phone: regPhone || "84" + Math.floor(1000000 + Math.random() * 9000000),
        email: regEmail,
        password: regPass,
        province: regProvince,
        district: regDistrict,
        address: regAddress,
        localidade: regLocalidade,
        role: selectedRole,
        farmName: selectedRole === "FARMER" ? (farmName || `Machamba de ${regName || "Guava"}`) : undefined,
        farmArea: selectedRole === "FARMER" ? (farmArea || "2 Hectares") : undefined,
        cropsGrown: selectedRole === "FARMER" ? (cropsText ? cropsText.split(",").map((s) => s.trim()) : ["Tomate", "Pimento"]) : undefined,
        bio: selectedRole === "FARMER" ? bio : undefined,
        vehicleType,
        licensePlate: licensePlate || "MMT-" + Math.floor(10 + Math.random() * 89),
      });
    } catch (err: any) {
      setRegisterError(err.message || "Erro ao efetuar registo.");
    }
  };

  const handleConfirmFarmerFee = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setFeePaidSuccess(true);

      setTimeout(() => {
        try {
          registerUser({
            name: regName || "Novo Agricultor",
            phone: regPhone || "84" + Math.floor(1000000 + Math.random() * 9000000),
            email: regEmail,
            password: regPass,
            province: regProvince,
            district: regDistrict,
            localidade: regLocalidade,
            role: "FARMER",
            farmName: farmName || `Machamba de ${regName || "Guava"}`,
            farmArea: farmArea || "2 Hectares",
            cropsGrown: cropsText ? cropsText.split(",").map((s) => s.trim()) : ["Tomate", "Pimento"],
            bio,
            membershipFeePaid: true,
            membershipFeeStatus: "Aprovado",
          });
        } catch (err: any) {
          setShowFarmerFeeModal(false);
          setFeePaidSuccess(false);
          setRegisterError(err.message || "Erro ao efetuar registo de Agricultor.");
        }
      }, 1000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-900/40 via-green-900/20 to-transparent pointer-events-none -z-10 blur-3xl" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. GRAND BRAND HEADER WITH AGROMOZ LOGO & WELCOME MESSAGE */}
      <div className="w-full max-w-5xl mx-auto text-center pt-4 pb-6">
        {/* AGROMOZ OFFICIAL LOGO BADGE */}
        <div className="inline-flex items-center justify-center mb-4 group transform hover:scale-105 transition-all duration-300">
          <AgroMozLogo size="xl" showText={false} />
        </div>

        {/* WELCOME HEADING */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif">
          Boas-vindas à <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-500">AgroMoz</span>
        </h1>
        
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Plataforma Agrícola Digital de Moçambique</span>
        </div>

        <p className="mt-3 text-xs sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Conectando a <strong className="text-emerald-400 font-semibold">Machamba do Agricultor</strong>, os <strong className="text-amber-400 font-semibold">Compradores</strong> e os <strong className="text-emerald-300 font-semibold">Transportadores</strong> em todo o país.
        </p>
      </div>

      {/* 2. REGISTRATION & LOGIN PORTAL MAIN CONTENT */}
      <div className="w-full max-w-5xl mx-auto my-auto py-4">
        {!selectedRole ? (
          /* STEP 1: THREE LARGE DISTINCT SELECTION BUTTONS */
          <div>
            <div className="text-center mb-8">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">
                Escolha o seu perfil para iniciar sessão ou criar conta
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* BUTTON 1: ENTRAR COMO AGRICULTOR */}
              <div className="bg-slate-800/95 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-900/80 border border-emerald-400/40 flex items-center justify-center text-amber-300 shadow-lg group-hover:scale-110 transition-transform">
                      <Sprout className="w-9 h-9" />
                    </div>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 uppercase tracking-widest">
                      Machamba
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
                    🌾 Agricultor
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    Cadastre a sua machamba, publique culturas agrícolas, gira produtos e receba pagamentos diretos via M-Pesa / e-Mola.
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-700/60">
                  <button
                    onClick={() => {
                      setSelectedRole("FARMER");
                      setAuthMode("LOGIN");
                    }}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
                  >
                    <span>Entrar como Agricultor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRole("FARMER");
                      setAuthMode("REGISTER");
                    }}
                    className="w-full py-2.5 px-4 bg-slate-700/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Criar Nova Conta de Agricultor</span>
                  </button>
                </div>
              </div>

              {/* BUTTON 2: ENTRAR COMO COMPRADOR */}
              <div className="bg-slate-800/95 border-2 border-amber-500/40 hover:border-amber-400 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-900/60 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-lg group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-9 h-9" />
                    </div>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-900/80 border border-amber-500/40 text-amber-300 uppercase tracking-widest">
                      Mercado
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
                    🛒 Comprador
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    Compre hortaliças, frutas e grãos frescos diretamente dos produtores moçambicanos com transparência e entrega ao domicílio.
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-700/60">
                  <button
                    onClick={() => {
                      setSelectedRole("BUYER");
                      setAuthMode("LOGIN");
                    }}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2"
                  >
                    <span>Entrar como Comprador</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRole("BUYER");
                      setAuthMode("REGISTER");
                    }}
                    className="w-full py-2.5 px-4 bg-slate-700/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Criar Nova Conta de Comprador</span>
                  </button>
                </div>
              </div>

              {/* BUTTON 3: ENTRAR COMO TRANSPORTADOR */}
              <div className="bg-slate-800/95 border-2 border-emerald-400/40 hover:border-emerald-300 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg group-hover:scale-110 transition-transform">
                      <Truck className="w-9 h-9" />
                    </div>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 uppercase tracking-widest">
                      Logística
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
                    🚚 Transportador
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    Registe o seu veículo (carrinha, camioneta, motorizada), aceite fretes de transporte das machambas aos mercados e fature com entregas.
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-700/60">
                  <button
                    onClick={() => {
                      setSelectedRole("DRIVER");
                      setAuthMode("LOGIN");
                    }}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
                  >
                    <span>Entrar como Transportador</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRole("DRIVER");
                      setAuthMode("REGISTER");
                    }}
                    className="w-full py-2.5 px-4 bg-slate-700/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Criar Nova Conta de Transportador</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ADMIN ACCESS OPTION */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <button
                onClick={() => {
                  setSelectedRole("ADMIN");
                  setAuthMode("LOGIN");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>⚙️ Acesso do Administrador AgroMoz</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: FORM FOR SELECTED ROLE (LOGIN OR REGISTER) */
          <div className="max-w-md mx-auto">
            <div className="bg-slate-800 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
              {/* Top Navigation & Role Banner */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Centro de Cadastro</span>
                </button>

                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold uppercase">
                  {selectedRole === "FARMER"
                    ? "Agricultor"
                    : selectedRole === "BUYER"
                    ? "Consumidor"
                    : selectedRole === "DRIVER"
                    ? "Transportador"
                    : "Admin"}
                </span>
              </div>

              {/* Header Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-900/80 text-amber-300 border border-emerald-500/30">
                  {selectedRole === "FARMER" ? (
                    <Sprout className="w-7 h-7" />
                  ) : selectedRole === "BUYER" ? (
                    <ShoppingBag className="w-7 h-7 text-amber-400" />
                  ) : selectedRole === "DRIVER" ? (
                    <Truck className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-purple-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {authMode === "REGISTER" ? "Formulário de Cadastro" : "Login de Acesso"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedRole === "FARMER"
                      ? "Parte do Agricultor / Produtor"
                      : selectedRole === "BUYER"
                      ? "Parte do Consumidor / Comprador"
                      : selectedRole === "DRIVER"
                      ? "Parte do Transportador / Entregador"
                      : "Área de Administração"}
                  </p>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 bg-slate-900/90 p-1 rounded-2xl mb-6 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setAuthMode("LOGIN")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    authMode === "LOGIN"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Entrar (Login)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("REGISTER")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    authMode === "REGISTER"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Criar Conta (Cadastro)
                </button>
              </div>

              {/* Error banner */}
              {loginError && (
                <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {authMode === "LOGIN" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número de Telefone ou E-mail
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: 841234567 ou 861122334"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Palavra-passe (Senha)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Entrar na AgroMoz</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {users.filter((u) => u.role === selectedRole).length > 0 && (
                      <div className="pt-2 border-t border-slate-700/60 text-left">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                          Contas Registadas ({selectedRole === "FARMER" ? "Agricultores" : selectedRole === "BUYER" ? "Compradores" : selectedRole === "DRIVER" ? "Transportadores" : "Admins"}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {users
                            .filter((u) => u.role === selectedRole)
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setLoginPhone(u.phone);
                                  setLoginPass(u.password || "123");
                                  setLoginError("");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-[11px] text-emerald-300 border border-slate-700 transition-all flex items-center gap-1.5"
                              >
                                <span className="font-bold">{u.name}</span>
                                <span className="text-slate-400 text-[10px]">({u.phone})</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {registerError && (
                    <div className="p-3 bg-red-950/90 border border-red-500/60 text-red-200 rounded-2xl text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{registerError}</span>
                      </div>
                      {registerError.includes("já está registado") && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginPhone(regPhone);
                            setAuthMode("LOGIN");
                            setRegisterError("");
                          }}
                          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <span>Ir para Entrar (Login) com {regPhone}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {selectedRole === "FARMER" && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-300">Registo 100% Gratuito:</span>
                        <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                          O registo na AgroMoz é gratuito. Comece a publicar as suas colheitas e a vender diretamente aos compradores sem taxas de adesão.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mateus Cossa"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Telefone (M-Pesa/e-Mola) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 841234567"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        E-mail (opcional)
                      </label>
                      <input
                        type="email"
                        placeholder="seu.email@agromoz.mz"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Província *
                      </label>
                      <select
                        value={regProvince}
                        onChange={(e) => {
                          setRegProvince(e.target.value);
                          const firstDist = MOZAMBIQUE_PROVINCES.find((p) => p.name === e.target.value)?.districts[0]?.name || "";
                          setRegDistrict(firstDist);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {MOZAMBIQUE_PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Distrito *
                      </label>
                      <select
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {selectedProvinceObj?.districts.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Specific fields per role */}
                  {selectedRole === "FARMER" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Nome da Machamba
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Machamba de Guava"
                            value={farmName}
                            onChange={(e) => setFarmName(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Tamanho da Machamba
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 2 Hectares"
                            value={farmArea}
                            onChange={(e) => setFarmArea(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Culturas Produzidas *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Tomate, Pimento, Alface, Mandioca"
                          value={cropsText}
                          onChange={(e) => setCropsText(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                        />
                      </div>
                    </>
                  )}

                  {selectedRole === "BUYER" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Endereço de Entrega Principal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Av. Eduardo Mondlane, Bairro Central"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                      />
                    </div>
                  )}

                  {selectedRole === "DRIVER" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tipo de Veículo *
                        </label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                        >
                          <option value="Carrinha">Carrinha / Pick-up</option>
                          <option value="Motorizada">Motorizada</option>
                          <option value="Camioneta">Camioneta de Carga</option>
                          <option value="Bicicleta">Bicicleta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Matrícula do Veículo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: MMT-84-21"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Palavra-passe *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirmar Senha *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regConfirmPass}
                        onChange={(e) => setRegConfirmPass(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/50 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{selectedRole === "FARMER" ? "Continuar para Pagamento da Taxa" : "Concluir Cadastro"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER CREDIT */}
      <div className="w-full text-center text-xs text-slate-500 pt-6">
        <p>© AgroMoz - Conectando o Sector Agrícola de Moçambique</p>
      </div>
    </div>
  );
};
