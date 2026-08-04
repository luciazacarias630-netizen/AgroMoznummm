import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueLocations";
import { VerifiedFarmerBadge } from "./VerifiedFarmerBadge";
import { FarmerVerificationModal } from "./FarmerVerificationModal";
import { uploadImageToStorage } from "../services/storageService";
import {
  X,
  Camera,
  Upload,
  User,
  Phone,
  MapPin,
  Check,
  Sparkles,
  Save,
  Image as ImageIcon,
  Building,
  ShieldCheck,
  BadgeCheck,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset avatars for quick selection
const PRESET_AVATARS = [
  {
    label: "Agricultor 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
  },
  {
    label: "Agricultor 2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
  },
  {
    label: "Produtora 1",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
  },
  {
    label: "Produtora 2",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=300",
  },
  {
    label: "Transportador",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
  },
  {
    label: "Comprador",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useAgro();

  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl || PRESET_AVATARS[0].url);
  const [province, setProvince] = useState(currentUser?.province || "Maputo Província");
  const [district, setDistrict] = useState(currentUser?.district || "");
  const [farmName, setFarmName] = useState(currentUser?.farmName || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [photoTab, setPhotoTab] = useState<"UPLOAD" | "PRESETS" | "URL">("UPLOAD");
  const [customUrl, setCustomUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  if (!currentUser || !isOpen) return null;

  // Handle local image file selection and Firebase Storage upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("A imagem selecionada é muito grande. Por favor escolha um ficheiro até 10MB.");
        return;
      }
      setIsUploadingPhoto(true);
      setUploadProgress(10);
      try {
        const url = await uploadImageToStorage(file, "profiles", (progress) => {
          setUploadProgress(progress);
        });
        setPhotoUrl(url);
      } catch (err: any) {
        alert("Erro ao carregar a foto de perfil: " + (err.message || "Tente novamente."));
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim().startsWith("http")) {
      setPhotoUrl(customUrl.trim());
    } else {
      alert("Por favor introduza um link de imagem válido (http/https)");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor introduza o seu nome.");
      return;
    }

    updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      photoUrl,
      province,
      district,
      farmName: farmName.trim(),
      bio: bio.trim(),
    });

    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      onClose();
    }, 1200);
  };

  const selectedProvinceData = MOZAMBIQUE_PROVINCES.find((p) => p.name === province);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-lg w-full overflow-hidden relative">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700 p-6 text-white flex items-center justify-between relative">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full">
              Meu Perfil AgroMoz
            </span>
            <h3 className="text-xl font-extrabold flex items-center gap-2">
              <User className="w-5 h-5 text-amber-300" /> Editar Perfil & Fotografia
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-100 text-emerald-900 border-b border-emerald-200 text-xs font-extrabold flex items-center justify-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>Foto de Perfil e Dados Atualizados com Sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* PHOTO EDITING SECTION */}
          <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <label className="text-xs font-extrabold text-slate-900 block uppercase tracking-wider">
              Fotografia de Perfil
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview Badge */}
              <div className="relative shrink-0 group">
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-600 shadow-md group-hover:brightness-95 transition-all"
                />
                <div className="absolute bottom-0 right-0 p-2 bg-amber-500 text-slate-950 rounded-full border-2 border-white shadow-sm">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              {/* Photo Upload Tabs */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPhotoTab("UPLOAD")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      photoTab === "UPLOAD"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Carregar Ficheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab("PRESETS")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      photoTab === "PRESETS"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Fotos Sugeridas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab("URL")}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      photoTab === "URL"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Link URL
                  </button>
                </div>

                {/* TAB 1: FILE UPLOAD */}
                {photoTab === "UPLOAD" && (
                  <div>
                    {isUploadingPhoto ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center text-xs font-bold text-emerald-900">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                          <span>A carregar para Firebase Storage... ({uploadProgress}%)</span>
                        </div>
                        <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-700 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white hover:bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer text-xs font-bold text-emerald-800 transition-all">
                        <CloudUpload className="w-4 h-4 text-emerald-600" />
                        <span>Upload p/ Firebase Storage (Até 10MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    <span className="text-[10px] text-slate-500 block text-center mt-1">
                      Suporta JPG, PNG ou WEBP. Armazenado com segurança no Firebase.
                    </span>
                  </div>
                )}

                {/* TAB 2: PRESET AVATARS */}
                {photoTab === "PRESETS" && (
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {PRESET_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(avatar.url)}
                        className={`p-0.5 rounded-full overflow-hidden border-2 transition-all ${
                          photoUrl === avatar.url
                            ? "border-amber-500 scale-110 shadow-md ring-2 ring-amber-300"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                        title={avatar.label}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.label}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* TAB 3: CUSTOM URL */}
                {photoTab === "URL" && (
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/minha-foto.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 bg-emerald-800 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-900 transition-all"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VERIFICATION & BADGE SECTION (Exempt for Admins) */}
          {currentUser.role === "ADMIN" ? (
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-black text-amber-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Conta de Administrador do Sistema</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Como Administrador do sistema AgroMoz, a sua conta possui permissões totais de gestão e fiscalização. Não é necessária a submissão de B.I ou verificação de idade.
              </p>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                currentUser.isVerifiedFarmer
                  ? "bg-emerald-50 border-emerald-200/90"
                  : currentUser.verificationStatus === "Recusado"
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-slate-900">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      currentUser.isVerifiedFarmer
                        ? "text-emerald-700"
                        : currentUser.verificationStatus === "Recusado"
                        ? "text-red-700"
                        : "text-amber-700"
                    }`}
                  />
                  Badge & Verificação de Identidade (B.I)
                </span>

                {currentUser.isVerifiedFarmer ? (
                  <VerifiedFarmerBadge isVerified={true} status="Aprovado" size="sm" />
                ) : currentUser.verificationStatus === "Recusado" ? (
                  <VerifiedFarmerBadge isVerified={false} status="Recusado" showIfNotVerified={true} size="sm" />
                ) : (
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                    {currentUser.verificationStatus === "Pendente" ? "Verificação Pendente" : "Não Verificado"}
                  </span>
                )}
              </div>

              {currentUser.isVerifiedFarmer ? (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <BadgeCheck className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Aprovado: Agricultor Verificado (Check Verde ✓)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Idade confirmada pelo sistema: <strong>{currentUser.detectedAge || 25} Anos</strong> (Maior de 18 Anos). O badge com check verde está visível em todas as suas publicações.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="text-[11px] font-extrabold text-emerald-700 hover:underline pt-1 block cursor-pointer"
                  >
                    Ver Documentos B.I Submetidos
                  </button>
                </div>
              ) : currentUser.verificationStatus === "Recusado" ? (
                <div className="p-3 bg-white rounded-xl border border-red-200 text-xs text-red-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-950">
                    <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                    <span>Verificação Recusada (Não Aprovado - Vermelho)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {currentUser.rejectionReason ||
                      "A verificação do seu B.I foi recusada. O documento submetido indicou idade inferior a 18 anos ou documentação incompatível."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Submeter Novo B.I para Reavaliação (18+)</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Para obter o <strong>Badge de Agricultor Verificado (Check Verde ✓)</strong> no seu perfil, submeta fotos do seu B.I (Frente e Verso). Apenas maiores de 18 anos são aceites.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <BadgeCheck className="w-4 h-4 text-amber-300" />
                    <span>Submeter B.I para Validação de Idade (18+)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BASIC INFO FIELDS */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telemóvel / M-Pesa
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Província
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      const prov = MOZAMBIQUE_PROVINCES.find((p) => p.name === e.target.value);
                      if (prov && prov.districts.length > 0) {
                        setDistrict(prov.districts[0].name);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {MOZAMBIQUE_PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedProvinceData && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Distrito
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">Selecione o Distrito</option>
                  {selectedProvinceData.districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentUser.role === "FARMER" && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome da Machamba / Quinta
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Machamba Agro Cossa"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Apresentação / Bio
              </label>
              <textarea
                rows={2}
                placeholder="Uma breve descrição sobre a sua produção ou atividade..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>

        {/* Farmer B.I Verification Modal */}
        <FarmerVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
        />
      </div>
    </div>
  );
};
