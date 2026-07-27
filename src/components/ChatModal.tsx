import React, { useState } from "react";
import { useAgro } from "../context/AgroContext";
import {
  X,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  MessageCircle,
  Phone,
} from "lucide-react";

interface ChatModalProps {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  partnerId,
  partnerName,
  onClose,
}) => {
  const { chats, currentUser, users, sendMessage } = useAgro();

  const [textInput, setTextInput] = useState("");
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [showImgInput, setShowImgInput] = useState(false);

  const partnerUser = users.find((u) => u.id === partnerId);

  // Filter messages between currentUser and partnerId
  const conversation = chats.filter(
    (m) =>
      (m.senderId === currentUser?.id && m.receiverId === partnerId) ||
      (m.senderId === partnerId && m.receiverId === currentUser?.id)
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !imgUrlInput.trim()) return;

    sendMessage(partnerId, textInput, imgUrlInput || undefined);
    setTextInput("");
    setImgUrlInput("");
    setShowImgInput(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-lg w-full h-[540px] rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  partnerUser?.photoUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                }
                alt={partnerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-300"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-emerald-800 ${
                  partnerUser?.online ? "bg-emerald-400" : "bg-slate-400"
                }`}
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{partnerName}</h3>
              <p className="text-[11px] text-emerald-200">
                {partnerUser?.online ? "🟢 Online agora" : "⚪ Offline"} — AgroMoz Chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {partnerUser?.phone && (
              <a
                href={`tel:${partnerUser.phone}`}
                className="p-2 text-white hover:bg-emerald-700 rounded-xl transition-all"
                title="Ligar para o agricultor"
              >
                <Phone className="w-4 h-4 text-amber-300" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message History Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {conversation.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Inicie a conversa com {partnerName}. Pergunte sobre a disponibilidade, preços e entrega!
            </div>
          ) : (
            conversation.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                      isMe
                        ? "bg-emerald-700 text-white rounded-tr-none shadow-xs"
                        : "bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Anexo de Chat"
                        className="w-full h-36 object-cover rounded-xl mb-1 border border-black/10"
                      />
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <div
                      className={`text-[9px] flex items-center justify-end gap-1 ${
                        isMe ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMe && (
                        <span>
                          {msg.status === "Visualizada" ? (
                            <CheckCheck className="w-3 h-3 text-amber-300" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Image URL Input Drawer */}
        {showImgInput && (
          <div className="p-2 bg-slate-100 border-t border-slate-200 flex gap-2 text-xs">
            <input
              type="url"
              placeholder="Cole o URL da imagem do produto..."
              value={imgUrlInput}
              onChange={(e) => setImgUrlInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none"
            />
            <button
              onClick={() => setShowImgInput(false)}
              className="px-2 py-1 text-slate-500 font-bold"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImgInput(!showImgInput)}
            className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-all"
            title="Anexar Imagem do Produto"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder="Escreva a sua mensagem..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />

          <button
            type="submit"
            className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-md transition-all"
          >
            <Send className="w-4 h-4 text-amber-300" />
          </button>
        </form>
      </div>
    </div>
  );
};
