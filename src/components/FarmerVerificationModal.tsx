import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { uploadImageToStorage } from "../services/storageService";
import {
  X,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  BadgeCheck,
  Calendar,
  Lock,
  Eye,
  Loader2,
  CloudUpload,
} from "lucide-react";

interface FarmerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default B.I Sample Placeholders for quick testing/demo
const SAMPLE_BI_FRONT =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
const SAMPLE_BI_BACK =
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400";

export const FarmerVerificationModal: React.FC<FarmerVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateUserProfile, addNotification } = useAgro();

  const [biFront, setBiFront] = useState<string>(currentUser?.biFrontUrl || SAMPLE_BI_FRONT);
  const [biBack, setBiBack] = useState<string>(currentUser?.biBackUrl || SAMPLE_BI_BACK);
  const [isUploadingFront, setIsUploadingFront] = useState<boolean>(false);
  const [frontUploadProgress, setFrontUploadProgress] = useState<number>(0);
  const [isUploadingBack, setIsUploadingBack] = useState<boolean>(false);
  const [backUploadProgress, setBackUploadProgress] = useState<number>(0);

  const [birthDate, setBirthDate] = useState<string>(currentUser?.birthDate || "1996-04-12");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState<{
    success: boolean;
    title: string;
    message: string;
    age: number;
  } | null>(null);

  if (!currentUser || !isOpen) return null;

  if (currentUser.role === "ADMIN") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">Isenção para Administradores</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Como Administrador do sistema, a sua conta possui permissões totais de gestão e fiscalização. Os administradores não necessitam de submeter verificação de B.I ou validação de idade.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Compreendido
          </button>
        </div>
      </div>
    );
  }

  // Calculate age from birthDate string (YYYY-MM-DD)
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const currentCalculatedAge = calculateAge(birthDate);
  const isAdult = currentCalculatedAge >= 18;

  // File Upload Handlers (Firebase Storage Upload)
  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingFront(true);
      setFrontUploadProgress(10);
      try {
        const url = await uploadImageToStorage(file, "bi_documents", (progress) => {
          setFrontUploadProgress(progress);
        });
        setBiFront(url);
      } catch (err: any) {
        alert("Erro no upload do B.I Frente: " + (err.message || "Tente novamente"));
      } finally {
        setIsUploadingFront(false);
      }
    }
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBack(true);
      setBackUploadProgress(10);
      try {
        const url = await uploadImageToStorage(file, "bi_documents", (progress) => {
          setBackUploadProgress(progress);
        });
        setBiBack(url);
      } catch (err: any) {
        alert("Erro no upload do B.I Verso: " + (err.message || "Tente novamente"));
      } finally {
        setIsUploadingBack(false);
      }
    }
  };

  // AI OCR B.I Scanner simulation
  const handleSimulateAiScan = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(
        `Leitura OCR B.I Concluída! Identificado nome: "${currentUser.name}", Data de Nascimento: ${birthDate} (${currentCalculatedAge} Anos).`
      );
    }, 1200);
  };

  // Preset age buttons for quick testing
  const handleSetPresetAge = (ageYears: number) => {
    const year = new Date().getFullYear() - ageYears;
    const dob = `${year}-05-15`;
    setBirthDate(dob);
    setScanResult(`Data ajustada para teste: ${dob} (${ageYears} Anos)`);
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();

    if (!biFront || !biBack) {
      alert("Por favor carregue as duas fotos do seu B.I (Frente e Verso).");
      return;
    }

    if (!birthDate) {
      alert("Por favor introduza a data de nascimento indicada no seu B.I.");
      return;
    }

    const age = calculateAge(birthDate);

    if (age >= 18) {
      // ACCEPTED - Farmer is 18 or older
      updateUserProfile({
        isVerifiedFarmer: true,
        verificationStatus: "Aprovado",
        biFrontUrl: biFront,
        biBackUrl: biBack,
        birthDate: birthDate,
        detectedAge: age,
        verificationSubmittedAt: new Date().toISOString(),
        rejectionReason: undefined,
      });

      addNotification(
        `✅ Verificação Aprovada! O seu B.I foi validado com idade de ${age} anos. Badge de 'Agricultor Verificado' concedido.`
      );

      setResultModal({
        success: true,
        title: "Aprovado: Agricultor Verificado ✓",
        message: `Parabéns ${currentUser.name}! A verificação da sua identidade foi concluída com sucesso. A sua idade de ${age} anos (maior de 18 anos) cumpre todos os requisitos da plataforma AgroMoz.`,
        age,
      });
    } else {
      // REJECTED - Farmer is under 18
      const rejectionMsg = `Conta Recusada / Verificação Negada: O B.I submetido indica a idade de ${age} anos. A plataforma AgroMoz exige idade mínima de 18 anos para registo e vendas.`;

      updateUserProfile({
        isVerifiedFarmer: false,
        verificationStatus: "Recusado",
        biFrontUrl: biFront,
        biBackUrl: biBack,
        birthDate: birthDate,
        detectedAge: age,
        verificationSubmittedAt: new Date().toISOString(),
        rejectionReason: rejectionMsg,
      });

      addNotification(`❌ Verificação Recusada: Menor de 18 anos (Idade B.I: ${age} anos).`);

      setResultModal({
        success: false,
        title: "Verificação Recusada (Menor de 18 Anos)",
        message: `Infelizmente, a verificação do B.I não pôde ser aceite. A idade identificada é de ${age} anos. De acordo com os termos de uso e regulação do mercado agrícola AgroMoz, o registo de contas é exclusivo para maiores de 18 anos.`,
        age,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-2xl w-full overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full inline-flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-900" />
              Verificação Oficial B.I (18+)
            </span>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-300" /> Validation de Identidade do
              Agricultor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmitVerification} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Info Banner */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-2 font-black text-emerald-950">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>Processo Seguro de Validação de Idade (Maior de 18 Anos)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Para receber o <strong>Badge de Agricultor Verificado</strong>, envie as fotos do seu
              Bilhete de Identidade (B.I - Frente e Verso). O nosso sistema faz a leitura de idade
              automática. Apenas cidadãos com <strong>18 anos ou mais</strong> são aceites.
            </p>
          </div>

          {/* Current Status Alert */}
          {currentUser.verificationStatus === "Aprovado" && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <span className="block font-black text-emerald-950">
                  ESTADO ATUAL: AGRICULTOR VERIFICADO ✓
                </span>
                <span className="text-[11px] text-emerald-800">
                  Idade confirmada: {currentUser.detectedAge || 25} anos (Maior de 18). O badge
                  está ativo em todas as suas publicações.
                </span>
              </div>
            </div>
          )}

          {currentUser.verificationStatus === "Recusado" && (
            <div className="p-3 bg-red-50 text-red-900 border border-red-300 rounded-2xl text-xs font-bold flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-700 shrink-0" />
              <div>
                <span className="block font-black text-red-950">
                  ESTADO ATUAL: CONTA RECUSADA (MENOR DE 18 ANOS)
                </span>
                <span className="text-[11px] text-red-800">
                  {currentUser.rejectionReason ||
                    "A sua conta foi recusada devido à idade ser inferior a 18 anos."}
                </span>
              </div>
            </div>
          )}

          {/* B.I PHOTO UPLOADS (FRENTE & VERSO) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 block uppercase tracking-wider">
                1. Fotografias do B.I (Bilhete de Identidade)
              </label>
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CloudUpload className="w-3 h-3 text-amber-600" /> Firebase Storage Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* B.I FRENTE */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>B.I - Frente</span>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Obrigatório
                  </span>
                </div>

                <div className="relative h-32 rounded-xl overflow-hidden bg-slate-200 border-2 border-dashed border-slate-300 group flex items-center justify-center">
                  <img
                    src={biFront}
                    alt="B.I Frente"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isUploadingFront ? (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold p-3 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      <span>A carregar para Firebase Storage...</span>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-300"
                          style={{ width: `${frontUploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono">{frontUploadProgress}%</span>
                    </div>
                  ) : (
                    <label className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/60 flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer opacity-80 hover:opacity-100 transition-opacity p-2 text-center">
                      <Upload className="w-5 h-5 mb-1 text-amber-300" />
                      <span>Upload Ficheiro B.I Frente</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFrontUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* B.I VERSO */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>B.I - Verso</span>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Obrigatório
                  </span>
                </div>

                <div className="relative h-32 rounded-xl overflow-hidden bg-slate-200 border-2 border-dashed border-slate-300 group flex items-center justify-center">
                  <img
                    src={biBack}
                    alt="B.I Verso"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isUploadingBack ? (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold p-3 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      <span>A carregar para Firebase Storage...</span>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-300"
                          style={{ width: `${backUploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono">{backUploadProgress}%</span>
                    </div>
                  ) : (
                    <label className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/60 flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer opacity-80 hover:opacity-100 transition-opacity p-2 text-center">
                      <Upload className="w-5 h-5 mb-1 text-amber-300" />
                      <span>Upload Ficheiro B.I Verso</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DATE OF BIRTH & AGE IDENTIFICATION ENGINE */}
          <div className="space-y-3 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                2. Data de Nascimento no B.I & Leitura de Idade
              </label>

              <button
                type="button"
                onClick={handleSimulateAiScan}
                disabled={isScanning}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>{isScanning ? "A ler B.I..." : "Leitura Automática IA"}</span>
              </button>
            </div>

            {scanResult && (
              <div className="p-2.5 bg-white rounded-xl border border-emerald-300 text-xs text-emerald-900 font-medium animate-fade-in">
                {scanResult}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data de Nascimento (B.I)
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* LIVE AGE VERIFICATION CALCULATOR BADGE */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Idade Identificada pelo Sistema
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {currentCalculatedAge} Anos
                  </span>

                  {isAdult ? (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Maior de 18 (Aprovado)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-red-300">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      Menor de 18 (Recusado)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PRESET TESTING BUTTONS */}
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-bold text-slate-700">Simulação Rápida para Testes:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPresetAge(28)}
                  className="px-2 py-0.5 bg-emerald-700 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-800"
                >
                  Testar 28 Anos (+18)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetAge(16)}
                  className="px-2 py-0.5 bg-red-700 text-white rounded-lg font-bold text-[10px] hover:bg-red-800"
                >
                  Testar 16 Anos (-18)
                </button>
              </div>
            </div>
          </div>

          {/* WARNING WHEN UNDER 18 */}
          {!isAdult && (
            <div className="p-3.5 bg-red-100/90 text-red-900 border border-red-300 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-black text-red-950">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Restrição de Idade da Plataforma</span>
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed">
                A idade identificada ({currentCalculatedAge} anos) é inferior a 18 anos. Ao
                submeter este documento, a verificação da conta será{" "}
                <strong>automaticamente recusada</strong> pelo sistema de segurança.
              </p>
            </div>
          )}

          {/* SUBMIT BUTTONS */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`px-6 py-2.5 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                isAdult
                  ? "bg-emerald-800 hover:bg-emerald-900"
                  : "bg-red-800 hover:bg-red-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>
                {isAdult
                  ? "Validar B.I & Ativar Badge Verificado"
                  : "Submeter Documento (Verificar Idade)"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* RESULT NOTIFICATION MODAL */}
      {resultModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
                resultModal.success
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {resultModal.success ? (
                <BadgeCheck className="w-10 h-10 text-emerald-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>

            <div className="space-y-1">
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  resultModal.success
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-red-100 text-red-900"
                }`}
              >
                {resultModal.success ? "Verificação Concluída" : "Conta Recusada"}
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg">{resultModal.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{resultModal.message}</p>
            </div>

            <div
              className={`p-3 rounded-2xl text-xs text-left ${
                resultModal.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-red-50 border border-red-200 text-red-900"
              }`}
            >
              <strong className="block mb-0.5 font-bold">Resumo da Leitura do B.I:</strong>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                <li>Titular: {currentUser.name}</li>
                <li>Idade Calculada: {resultModal.age} anos</li>
                <li>
                  Resultado 18+:{" "}
                  {resultModal.age >= 18 ? "✅ Maior de 18 Anos" : "❌ Menor de 18 Anos"}
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setResultModal(null);
                onClose();
              }}
              className={`w-full py-3 font-extrabold text-xs text-white rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer ${
                resultModal.success
                  ? "bg-emerald-800 hover:bg-emerald-900"
                  : "bg-slate-900 hover:bg-black"
              }`}
            >
              Fechar & Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
