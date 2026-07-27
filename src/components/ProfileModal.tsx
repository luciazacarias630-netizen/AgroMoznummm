import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueLocations";
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

  if (!currentUser || !isOpen) return null;

  const [name, setName] = useState(currentUser.name || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || PRESET_AVATARS[0].url);
  const [province, setProvince] = useState(currentUser.province || "Maputo Província");
  const [district, setDistrict] = useState(currentUser.district || "");
  const [farmName, setFarmName] = useState(currentUser.farmName || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [photoTab, setPhotoTab] = useState<"UPLOAD" | "PRESETS" | "URL">("UPLOAD");
  const [customUrl, setCustomUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  // Handle local image file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem selecionada é muito grande. Por favor escolha um ficheiro até 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
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
                    <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white hover:bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer text-xs font-bold text-emerald-800 transition-all">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Escolher Imagem do Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-500 block text-center mt-1">
                      Suporta JPG, PNG ou WEBP até 5MB.
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
                        setDistrict(prov.districts[0]);
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
                    <option key={d} value={d}>
                      {d}
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
      </div>
    </div>
  );
};
