import React, { useState, useEffect, useRef } from "react";
import { useAgro } from "../context/AgroContext";
import {
  X,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  MessageCircle,
  Phone,
  Package,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { MensagemConversa, Conversa } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface ChatModalProps {
  partnerId?: string;
  partnerName?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  conversaId?: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  partnerId,
  partnerName,
  productId,
  productName,
  productImage,
  conversaId: initialConversaId,
  onClose,
}) => {
  const {
    currentUser,
    users,
    products,
    conversas,
    iniciarOuObterConversa,
    enviarMensagemConversa,
    marcarMensagensComoLidas,
    mensagensConversa,
  } = useAgro();

  const [activeConversaId, setActiveConversaId] = useState<string | null>(initialConversaId || null);
  const [messages, setMessages] = useState<MensagemConversa[]>([]);
  const [textInput, setTextInput] = useState("");
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [showImgInput, setShowImgInput] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations for the current user
  const userConversas = conversas.filter((c) =>
    c.participantes?.includes(currentUser?.id || "")
  );

  // Automatically start or locate conversation on mount if productId & partnerId provided
  useEffect(() => {
    let isMounted = true;
    if (productId && partnerId && !activeConversaId) {
      iniciarOuObterConversa(
        productId,
        partnerId,
        productName || "Produto Agrícola",
        productImage
      )
        .then((conv) => {
          if (isMounted && conv) {
            setActiveConversaId(conv.id);
          }
        })
        .catch((err) => console.error("Erro ao iniciar conversa:", err));
    } else if (partnerId && !activeConversaId) {
      // Find latest conversation with partner or create generic product conversation
      const existing = userConversas.find((c) => c.participantes?.includes(partnerId));
      if (existing) {
        setActiveConversaId(existing.id);
      } else {
        iniciarOuObterConversa(
          `prod-generic-${partnerId}`,
          partnerId,
          "Consulta Geral de Produtos",
          ""
        )
          .then((conv) => {
            if (isMounted && conv) {
              setActiveConversaId(conv.id);
            }
          })
          .catch((err) => console.error("Erro ao iniciar conversa:", err));
      }
    } else if (!activeConversaId && userConversas.length > 0) {
      setActiveConversaId(userConversas[0].id);
    }
    return () => {
      isMounted = false;
    };
  }, [productId, partnerId]);

  const activeConversa = conversas.find((c) => c.id === activeConversaId);

  // Find partner details
  const targetPartnerId =
    activeConversa?.participantes?.find((p) => p !== currentUser?.id) ||
    partnerId ||
    "";
  const partnerUser = users.find((u) => u.id === targetPartnerId);
  const currentPartnerName = partnerUser?.name || partnerName || activeConversa?.vendedorId || "Agricultor / Vendedor";

  // Find linked product details if available
  const currentProduct = products.find((p) => p.id === activeConversa?.produtoId);

  // Real-time Firestore sync for subcollection /conversas/{activeConversaId}/mensagens
  useEffect(() => {
    if (!activeConversaId) return;

    let unsub: (() => void) | undefined;
    if (db) {
      try {
        const msgsRef = collection(db, "conversas", activeConversaId, "mensagens");
        unsub = onSnapshot(
          msgsRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const list: MensagemConversa[] = [];
              snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...(docSnap.data() as MensagemConversa) });
              });
              list.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
              setMessages(list);
            } else {
              // Fallback to local state if Firestore subcollection snapshot empty
              const localMsgs = mensagensConversa.filter((m) => m.conversaId === activeConversaId);
              setMessages(localMsgs);
            }
          },
          (err) => {
            console.log("Subcollection mensagens sync error:", err);
            const localMsgs = mensagensConversa.filter((m) => m.conversaId === activeConversaId);
            setMessages(localMsgs);
          }
        );
      } catch (e) {
        console.error("Firestore messages listener setup failed:", e);
      }
    } else {
      const localMsgs = mensagensConversa.filter((m) => m.conversaId === activeConversaId);
      setMessages(localMsgs);
    }

    marcarMensagensComoLidas(activeConversaId);

    return () => {
      if (unsub) unsub();
    };
  }, [activeConversaId, mensagensConversa]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !imgUrlInput.trim()) return;

    if (!activeConversaId) {
      if (productId && partnerId) {
        const conv = await iniciarOuObterConversa(
          productId,
          partnerId,
          productName || "Produto",
          productImage
        );
        setActiveConversaId(conv.id);
        await enviarMensagemConversa(conv.id, textInput, imgUrlInput || undefined);
      }
    } else {
      await enviarMensagemConversa(activeConversaId, textInput, imgUrlInput || undefined);
    }

    setTextInput("");
    setImgUrlInput("");
    setShowImgInput(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-lg w-full h-[580px] sm:h-[620px] rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden relative">
        {/* Main Header */}
        <div className="p-3.5 sm:p-4 bg-emerald-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            {showConversationsList ? (
              <button
                onClick={() => setShowConversationsList(false)}
                className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-all"
                title="Voltar ao Chat"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowConversationsList(true)}
                className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-all relative"
                title="Ver todas as conversas"
              >
                <MessageCircle className="w-5 h-5" />
                {userConversas.some((c) => (c.naoLidas?.[currentUser?.id || ""] || 0) > 0) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-emerald-800" />
                )}
              </button>
            )}

            <div className="relative">
              <img
                src={
                  partnerUser?.photoUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                }
                alt={currentPartnerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-300"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-emerald-800 ${
                  partnerUser?.online ? "bg-emerald-400" : "bg-slate-400"
                }`}
              />
            </div>

            <div className="leading-tight">
              <h3 className="font-bold text-sm text-white truncate max-w-[170px] sm:max-w-[220px]">
                {currentPartnerName}
              </h3>
              <p className="text-[10.5px] text-emerald-200 flex items-center gap-1">
                <span>{partnerUser?.online ? "🟢 Online" : "⚪ Offline"}</span>
                <span>•</span>
                <span className="text-amber-300 font-medium">AgroMoz Direct</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {partnerUser?.phone && (
              <a
                href={`tel:${partnerUser.phone}`}
                className="p-2 text-white hover:bg-emerald-700 rounded-xl transition-all"
                title="Ligar para o utilizador"
              >
                <Phone className="w-4 h-4 text-amber-300" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Context Bar (Origin of Conversation) */}
        {activeConversa && (
          <div className="bg-emerald-50/90 border-b border-emerald-100 px-3.5 py-2 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              {activeConversa.produtoImagem || currentProduct?.images[0] ? (
                <img
                  src={activeConversa.produtoImagem || currentProduct?.images[0]}
                  alt={activeConversa.produtoNome}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-200 shrink-0"
                />
              ) : (
                <Package className="w-5 h-5 text-emerald-700 shrink-0" />
              )}
              <div className="truncate">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Produto em Negociação
                </span>
                <span className="font-black text-slate-900 truncate block text-xs">
                  {activeConversa.produtoNome}
                </span>
              </div>
            </div>

            {currentProduct && (
              <span className="text-xs font-black text-emerald-800 bg-white px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                {currentProduct.pricePerUnit.toLocaleString("pt-MZ")} MTn
              </span>
            )}
          </div>
        )}

        {/* Drawer for switching conversations */}
        {showConversationsList ? (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              As suas conversas ativas
            </h4>
            {userConversas.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhuma conversa iniciada ainda.
              </div>
            ) : (
              userConversas.map((c) => {
                const unread = currentUser ? c.naoLidas?.[currentUser.id] || 0 : 0;
                const isSelected = c.id === activeConversaId;
                const otherParticipantId = c.participantes?.find((p) => p !== currentUser?.id);
                const otherUser = users.find((u) => u.id === otherParticipantId);

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConversaId(c.id);
                      setShowConversationsList(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-300 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="relative shrink-0">
                        <img
                          src={
                            otherUser?.photoUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                          }
                          alt={otherUser?.name || "User"}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-300"
                        />
                        {otherUser?.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {otherUser?.name || c.produtoNome}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-bold truncate">
                          📦 {c.produtoNome}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.ultimaMensagem}
                        </p>
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-full shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Active Chat Messages Container */
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs px-4 space-y-2">
                <MessageCircle className="w-10 h-10 mx-auto opacity-40 text-emerald-600" />
                <p className="font-bold text-slate-700">Inicie a negociação com {currentPartnerName}</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Pergunte sobre stock disponível, prazos de entrega e condições de compra no AgroMoz.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.remetenteId === currentUser?.id;
                const timeFormatted = new Date(msg.criadoEm).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[82%] p-3 rounded-2xl text-xs space-y-1 ${
                        isMe
                          ? "bg-emerald-700 text-white rounded-tr-none shadow-2xs"
                          : "bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-2xs"
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Anexo de Chat"
                          className="w-full h-40 object-cover rounded-xl mb-1.5 border border-black/10"
                        />
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                      <div
                        className={`text-[9px] flex items-center justify-end gap-1 ${
                          isMe ? "text-emerald-200" : "text-slate-400"
                        }`}
                      >
                        <span>{timeFormatted}</span>
                        {isMe && (
                          <span>
                            {msg.lida ? (
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
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Image Attachment Input Bar */}
        {showImgInput && !showConversationsList && (
          <div className="p-2 bg-slate-100 border-t border-slate-200 flex gap-2 text-xs">
            <input
              type="url"
              placeholder="Cole o link/URL da imagem do produto..."
              value={imgUrlInput}
              onChange={(e) => setImgUrlInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none"
            />
            <button
              onClick={() => setShowImgInput(false)}
              className="px-2 py-1 text-slate-500 font-bold hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Input Form */}
        {!showConversationsList && (
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowImgInput(!showImgInput)}
              className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-all shrink-0"
              title="Anexar Imagem"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder={`Escreva para ${currentPartnerName}...`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />

            <button
              type="submit"
              disabled={!textInput.trim() && !imgUrlInput.trim()}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 text-amber-300" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
