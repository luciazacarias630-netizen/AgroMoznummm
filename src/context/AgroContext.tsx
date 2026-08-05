import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserProfile,
  Product,
  Order,
  ChatMessage,
  WalletTransaction,
  Machamba,
  WeatherInfo,
  PaymentMethod,
  AppNotification,
  ProductReview,
  DeliveryProposal,
  Carteira,
  TransacaoCarteira,
  TipoTransacaoCarteira,
  EstadoTransacaoCarteira,
  Levantamento,
  Conversa,
  MensagemConversa,
} from "../types";
import { fcmService } from "../services/fcmService";
import { crashlytics } from "../services/crashlyticsService";
import { solicitarLevantamento, LEVANTAMENTO_MINIMO } from "../services/levantamento";
import { db } from "../firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";

const cleanForFirestore = <T,>(data: T): T => {
  if (!data || typeof data !== "object") return data;
  return JSON.parse(JSON.stringify(data));
};

interface AgroContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  users: UserProfile[];
  products: Product[];
  orders: Order[];
  reviews: ProductReview[];
  chats: ChatMessage[];
  transactions: WalletTransaction[];
  carteiras: Record<string, Carteira>;
  transacoesCarteira: TransacaoCarteira[];
  levantamentos: Levantamento[];
  userCarteira: Carteira | null;
  getCarteira: (userId: string) => Carteira;
  machambas: Machamba[];
  receiverPhone: string;
  setReceiverPhone: (phone: string) => void;

  // Real-time actions
  loginUser: (phoneOrEmail: string, pass: string, role: string) => UserProfile | null;
  registerUser: (newUser: Partial<UserProfile>) => UserProfile;
  logoutUser: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  toggleOnlineStatus: () => void;

  // Product Actions
  addProduct: (product: Partial<Product>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addProductReview: (review: { productId: string; orderId: string; rating: number; comment: string }) => ProductReview;

  // Machamba Actions
  addMachamba: (machamba: Partial<Machamba>) => Machamba;

  // Order & Payment Actions
  createOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order["deliveryStatus"]) => void;
  assignDriverToOrder: (orderId: string, driverId: string, driverName: string, driverPhone: string) => void;

  // Delivery Proposal / Bidding Actions
  proposals: DeliveryProposal[];
  submitDeliveryProposal: (transacaoId: string, valorProposto: number, mensagem?: string, tempoEstimado?: string) => DeliveryProposal;
  acceptDeliveryProposal: (transacaoId: string, propostaId: string) => void;
  rejectDeliveryProposal: (propostaId: string) => void;

  // Escrow & Payment Split Actions
  confirmDeliveryByDriver: (orderId: string) => void;
  confirmReceiptByBuyer: (orderId: string) => void;
  releaseEscrowPayment: (orderId: string, reason?: string) => void;
  refundEscrowPayment: (orderId: string, reason: string) => void;

  // Chat & Conversation Actions
  conversas: Conversa[];
  mensagensConversa: MensagemConversa[];
  sendMessage: (receiverId: string, content: string, imageUrl?: string) => void;
  iniciarOuObterConversa: (produtoId: string, vendedorId: string, produtoNome: string, produtoImagem?: string) => Promise<Conversa>;
  enviarMensagemConversa: (conversaId: string, texto: string, imageUrl?: string) => Promise<void>;
  marcarMensagensComoLidas: (conversaId: string) => Promise<void>;

  // Wallet & Admin Actions
  approveFarmerFee: (farmerId: string) => void;
  rejectFarmerFee: (farmerId: string) => void;
  verifyFarmerBiIdentity: (userId: string, approve: boolean, age?: number, reason?: string) => void;
  approveDriverAccount: (driverId: string) => void;
  withdrawWalletFunds: (amount: number, method: PaymentMethod, phoneNumber: string) => boolean;
  depositWalletFunds: (amount: number, method: PaymentMethod, phoneNumber: string, referenceNote?: string) => WalletTransaction;
  confirmPendingTransaction: (txId: string) => void;

  // Driver GPS Tracking
  updateDriverLocation: (orderId: string, location: { lat: number; lng: number }) => void;

  // Notification & FCM Push System
  notifications: string[]; // Legacy string list for backward compatibility
  appNotifications: AppNotification[];
  unreadCount: number;
  addNotification: (msg: string) => void;
  pushNotification: (notif: {
    title: string;
    message: string;
    type?: "ORDER" | "MESSAGE" | "SYSTEM";
    category?: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA";
    targetRole?: "FARMER" | "BUYER" | "DRIVER" | "ADMIN" | "ALL";
    targetUserId?: string;
    relatedId?: string;
  }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Realtime Push Toast Banner State
  activePushToast: {
    id: string;
    title: string;
    message: string;
    type: "ORDER" | "MESSAGE" | "SYSTEM";
    category?: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA";
    targetRole?: "FARMER" | "BUYER" | "DRIVER" | "ADMIN" | "ALL";
    relatedId?: string;
  } | null;
  dismissPushToast: () => void;

  // FCM & Web Push Notification Permission & State
  notificationPermission: NotificationPermission;
  fcmToken: string | null;
  isFcmSupported: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  testFcmPushNotification: (targetRole: "AGRICULTOR" | "COMPRADOR" | "TRANSPORTADOR") => void;
}

const AgroContext = createContext<AgroContextType | undefined>(undefined);

const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-admin-default",
    name: "Administrador AgroMoz",
    role: "ADMIN",
    phone: "863983206",
    email: "admin@agromoz.mz",
    password: "123",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    province: "Maputo Cidade",
    district: "Kamphumo",
    online: false,
    isApproved: true,
  },
  {
    id: "user-farmer-default",
    name: "Mateus Cossa",
    role: "FARMER",
    phone: "841112233",
    email: "mateus@agromoz.mz",
    password: "123",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    province: "Maputo Província",
    district: "Marracuene",
    localidade: "Guava",
    farmName: "Machamba de Guava",
    farmArea: "3 Hectares",
    cropsGrown: ["Tomate", "Pimento", "Alface"],
    online: false,
    isApproved: true,
    membershipFeePaid: true,
    membershipFeeStatus: "Aprovado",
  },
  {
    id: "user-buyer-default",
    name: "Lúcia Zacarias",
    role: "BUYER",
    phone: "842223344",
    email: "lucia@agromoz.mz",
    password: "123",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    province: "Maputo Cidade",
    district: "Nlhamankulu",
    address: "Av. Eduardo Mondlane, nº 1230",
    online: false,
    isApproved: true,
  },
  {
    id: "user-driver-default",
    name: "Eusebio Mabunda",
    role: "DRIVER",
    phone: "843334455",
    email: "eusebio@agromoz.mz",
    password: "123",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    province: "Maputo Província",
    district: "Matola",
    vehicleType: "Carrinha",
    licensePlate: "MMT-88-12",
    online: false,
    isApproved: true,
  },
];

const INITIAL_MACHAMBAS: Machamba[] = [];

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: "rev-sample-1",
    productId: "prod-sample-1",
    productName: "Tomate Fresco Rijo",
    orderId: "ord-sample-1",
    buyerId: "user-buyer-default",
    buyerName: "Lúcia Zacarias",
    rating: 5,
    comment: "Os tomates vieram em excelente estado, bem rijos e muito saborosos! Recomendo este agricultor.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "rev-sample-2",
    productId: "prod-sample-1",
    productName: "Tomate Fresco Rijo",
    orderId: "ord-sample-2",
    buyerId: "buyer-2",
    buyerName: "Joaquim Sitoe",
    rating: 5,
    comment: "Caixas muito bem embaladas e entregues no tempo previsto em Maputo. Nota 10!",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "rev-sample-3",
    productId: "prod-sample-2",
    productName: "Pimento Verde",
    orderId: "ord-sample-3",
    buyerId: "buyer-3",
    buyerName: "Amélia Macamo",
    rating: 4,
    comment: "Pimentos frescos e grandes de Marracuene. Ótimo atendimento no chat.",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

export const AgroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("agromoz_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (["farmer-1", "farmer-2", "buyer-1", "driver-1", "admin-1"].includes(parsed.id)) {
          localStorage.removeItem("agromoz_user");
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("agromoz_users");
    if (saved) {
      try {
        const parsed: UserProfile[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (u) => !["farmer-1", "farmer-2", "buyer-1", "driver-1", "admin-1"].includes(u.id)
        );
        const merged = [...filtered];
        INITIAL_USERS.forEach((initUser) => {
          if (!merged.some((u) => u.id === initUser.id || (u.phone && initUser.phone && u.phone.replace(/\D/g, "") === initUser.phone.replace(/\D/g, "")))) {
            merged.push(initUser);
          }
        });
        return merged.map((u) => (u.role === "ADMIN" ? { ...u, phone: "863983206" } : u));
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("agromoz_products");
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        return parsed.filter(
          (p) =>
            !["farmer-1", "farmer-2"].includes(p.farmerId) &&
            !["prod-1", "prod-2", "prod-3"].includes(p.id)
        );
      } catch (e) {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [machambas, setMachambas] = useState<Machamba[]>(() => {
    const saved = localStorage.getItem("agromoz_machambas");
    if (saved) {
      try {
        const parsed: Machamba[] = JSON.parse(saved);
        return parsed.filter(
          (m) =>
            !["farmer-1", "farmer-2"].includes(m.farmerId) &&
            !["machamba-1", "machamba-2"].includes(m.id)
        );
      } catch (e) {
        return INITIAL_MACHAMBAS;
      }
    }
    return INITIAL_MACHAMBAS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("agromoz_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [proposals, setProposals] = useState<DeliveryProposal[]>(() => {
    const saved = localStorage.getItem("agromoz_proposals");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("agromoz_proposals", JSON.stringify(proposals));
  }, [proposals]);

  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    const saved = localStorage.getItem("agromoz_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_REVIEWS;
      }
    }
    return INITIAL_REVIEWS;
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("agromoz_chats");
    return saved ? JSON.parse(saved) : [];
  });

  const [conversas, setConversas] = useState<Conversa[]>(() => {
    const saved = localStorage.getItem("agromoz_conversas");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("agromoz_conversas", JSON.stringify(conversas));
  }, [conversas]);

  const [mensagensConversa, setMensagensConversa] = useState<MensagemConversa[]>(() => {
    const saved = localStorage.getItem("agromoz_mensagens_conversa");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("agromoz_mensagens_conversa", JSON.stringify(mensagensConversa));
  }, [mensagensConversa]);

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem("agromoz_txs");
    return saved ? JSON.parse(saved) : [];
  });

  // Real-time Cloud Wallet System (/carteiras/{userId})
  const [carteiras, setCarteiras] = useState<Record<string, Carteira>>(() => {
    const saved = localStorage.getItem("agromoz_carteiras");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("agromoz_carteiras", JSON.stringify(carteiras));
  }, [carteiras]);

  // Real-time Cloud Transactions Log (/transacoes_carteira/{transacaoId})
  const [transacoesCarteira, setTransacoesCarteira] = useState<TransacaoCarteira[]>(() => {
    const saved = localStorage.getItem("agromoz_transacoes_carteira");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("agromoz_transacoes_carteira", JSON.stringify(transacoesCarteira));
  }, [transacoesCarteira]);

  // Real-time Cloud B2C Withdrawals Log (/levantamentos/{levantamentoId})
  const [levantamentos, setLevantamentos] = useState<Levantamento[]>(() => {
    const saved = localStorage.getItem("agromoz_levantamentos");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("agromoz_levantamentos", JSON.stringify(levantamentos));
  }, [levantamentos]);

  const getCarteira = (userId: string): Carteira => {
    if (carteiras[userId]) return carteiras[userId];

    // Calculate dynamically from user orders and wallet transactions if not stored yet
    const userOrders = orders.filter((o) => o.farmerId === userId);
    const pendingEscrow = userOrders
      .filter((o) => o.escrowStatus === "Pendente")
      .reduce((sum, o) => sum + (o.farmerNetAmount || Math.round(o.subtotal * 0.95)), 0);

    let calcDisponivel = 0;
    transacoesCarteira
      .filter((t) => t.userId === userId && t.estado === "concluido")
      .forEach((t) => {
        if (t.tipo === "deposito" || t.tipo === "liberacao") {
          calcDisponivel += t.valor;
        } else if (t.tipo === "levantamento") {
          calcDisponivel -= t.valor;
        }
      });

    return {
      userId,
      saldoDisponivel: Math.max(0, calcDisponivel),
      saldoRetido: pendingEscrow,
      moeda: "MZN",
      atualizadoEm: new Date().toISOString(),
    };
  };

  const userCarteira = currentUser ? getCarteira(currentUser.id) : null;

  const [receiverPhone, setReceiverPhone] = useState<string>("863983206");
  const [notifications, setNotifications] = useState<string[]>([
    "Bem-vindo à plataforma AgroMoz - Conectando a agricultura de Moçambique!",
  ]);

  // Structured app notifications state with persistent localStorage
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("agromoz_app_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: "notif-welcome",
        userId: "ALL",
        title: "🇲🇿 Bem-vindo à AgroMoz!",
        message: "A plataforma agrícola digital que conecta agricultores, compradores e transportadores em todo o país.",
        type: "SYSTEM",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Active push toast alert banner state
  const [activePushToast, setActivePushToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: "ORDER" | "MESSAGE" | "SYSTEM";
    category?: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA";
    targetRole?: "FARMER" | "BUYER" | "DRIVER" | "ADMIN" | "ALL";
    relatedId?: string;
  } | null>(null);

  // FCM Push Notification States
  const [fcmToken, setFcmToken] = useState<string | null>(() => {
    return localStorage.getItem("agromoz_fcm_token") || null;
  });
  const isFcmSupported = fcmService.checkIsSupported();

  // Browser Web Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined") {
      const savedPerm = localStorage.getItem("agromoz_notification_permission");
      if (savedPerm === "granted") return "granted";
      if ("Notification" in window) return Notification.permission;
    }
    return "default";
  });

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const res = await fcmService.requestPushPermission();

      setNotificationPermission("granted");
      if (typeof window !== "undefined") {
        localStorage.setItem("agromoz_notification_permission", "granted");
      }

      if (res.token) {
        setFcmToken(res.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("agromoz_fcm_token", res.token);
        }
      }

      if (currentUser) {
        updateUserProfile({ fcmToken: res.token || undefined, pushEnabled: true });
      }

      // Trigger instant push sound & notification
      fcmService.triggerFcmPush({
        title: "🟢 AgroMoz — Notificações do Dispositivo Ativadas!",
        body: "Alertas em tempo real ativados com sucesso para encomendas, GPS e M-Pesa.",
        category: "SISTEMA",
      });

      pushNotification({
        title: "🔔 Notificações Ativadas com Sucesso!",
        message: "O seu dispositivo foi configurado para receber notificações e avisos sonoros em tempo real.",
        type: "SYSTEM",
        category: "SISTEMA",
      });

      return true;
    } catch (err) {
      console.error("Erro ao ativar notificações:", err);
      setNotificationPermission("granted");
      if (typeof window !== "undefined") {
        localStorage.setItem("agromoz_notification_permission", "granted");
      }
      return true;
    }
  };

  const testFcmPushNotification = (targetRole: "AGRICULTOR" | "COMPRADOR" | "TRANSPORTADOR") => {
    let title = "Notificação Push FCM";
    let message = "Teste de alerta em tempo real via Firebase Cloud Messaging.";
    let category: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA" = "SISTEMA";
    let type: "ORDER" | "MESSAGE" | "SYSTEM" = "SYSTEM";
    let roleKey: "FARMER" | "BUYER" | "DRIVER" = "FARMER";

    if (targetRole === "AGRICULTOR") {
      title = "💸 M-Pesa: Novo Pagamento Entrou na Wallet!";
      message = "Recebeu 6.250 MT via M-Pesa referente à venda de hortaliças na AgroMoz. Saldo creditado e disponível para levantamento!";
      category = "PAGAMENTO";
      type = "ORDER";
      roleKey = "FARMER";
    } else if (targetRole === "COMPRADOR") {
      title = "💰 Custódia M-Pesa Confirmada!";
      message = "O pagamento do seu pedido foi verificado com sucesso pelo sistema Escrow da AgroMoz.";
      category = "PAGAMENTO";
      type = "SYSTEM";
      roleKey = "BUYER";
    } else if (targetRole === "TRANSPORTADOR") {
      title = "🚚 e-Mola: Frete Creditado na Wallet!";
      message = "Pagamento de frete de transporte no valor de 150 MT via e-Mola foi creditado na sua Carteira AgroMoz!";
      category = "PAGAMENTO";
      type = "ORDER";
      roleKey = "DRIVER";
    }

    pushNotification({
      title,
      message,
      type,
      category,
      targetRole: roleKey,
    });
  };

  useEffect(() => {
    if (currentUser) localStorage.setItem("agromoz_user", JSON.stringify(currentUser));
    else localStorage.removeItem("agromoz_user");
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("agromoz_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("agromoz_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("agromoz_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("agromoz_reviews", JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem("agromoz_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("agromoz_txs", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("agromoz_machambas", JSON.stringify(machambas));
  }, [machambas]);

  useEffect(() => {
    localStorage.setItem("agromoz_app_notifications", JSON.stringify(appNotifications));
  }, [appNotifications]);

  // Firestore Real-Time Cloud Database Sync Listeners
  useEffect(() => {
    if (!db) return;

    const unsubProds = onSnapshot(collection(db, "products"), (snapshot) => {
      if (!snapshot.empty) {
        const items: Product[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as Product));
        if (items.length > 0) setProducts(items);
      }
    }, (err) => console.log("Firestore products sync:", err));

    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      if (!snapshot.empty) {
        const items: Order[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as Order));
        if (items.length > 0) setOrders(items);
      }
    }, (err) => console.log("Firestore orders sync:", err));

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (!snapshot.empty) {
        const items: UserProfile[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as UserProfile));
        if (items.length > 0) setUsers(items);
      }
    }, (err) => console.log("Firestore users sync:", err));

    const unsubMachambas = onSnapshot(collection(db, "machambas"), (snapshot) => {
      if (!snapshot.empty) {
        const items: Machamba[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as Machamba));
        if (items.length > 0) setMachambas(items);
      }
    }, (err) => console.log("Firestore machambas sync:", err));

    const unsubCarteiras = onSnapshot(collection(db, "carteiras"), (snapshot) => {
      if (!snapshot.empty) {
        const map: Record<string, Carteira> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Carteira;
          map[docSnap.id] = data;
        });
        setCarteiras((prev) => ({ ...prev, ...map }));
      }
    }, (err) => console.log("Firestore carteiras sync:", err));

    const unsubTransCarteira = onSnapshot(collection(db, "transacoes_carteira"), (snapshot) => {
      if (!snapshot.empty) {
        const items: TransacaoCarteira[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as TransacaoCarteira));
        if (items.length > 0) setTransacoesCarteira(items);
      }
    }, (err) => console.log("Firestore transacoes_carteira sync:", err));

    const unsubLevantamentos = onSnapshot(collection(db, "levantamentos"), (snapshot) => {
      if (!snapshot.empty) {
        const items: Levantamento[] = [];
        snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...(docSnap.data() as Levantamento) }));
        if (items.length > 0) setLevantamentos(items);
      }
    }, (err) => console.log("Firestore levantamentos sync:", err));

    const unsubNotifs = onSnapshot(collection(db, "notificacoes"), (snapshot) => {
      if (!snapshot.empty) {
        const items: AppNotification[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as AppNotification));
        if (items.length > 0) {
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAppNotifications(items);
        }
      }
    }, (err) => console.log("Firestore notificacoes sync:", err));

    const unsubConversas = onSnapshot(collection(db, "conversas"), (snapshot) => {
      if (!snapshot.empty) {
        const items: Conversa[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Conversa) });
        });
        setConversas(items);
      }
    }, (err) => console.log("Firestore conversas sync:", err));

    return () => {
      unsubProds();
      unsubOrders();
      unsubUsers();
      unsubMachambas();
      unsubCarteiras();
      unsubTransCarteira();
      unsubLevantamentos();
      unsubNotifs();
      unsubConversas();
    };
  }, []);

  const syncCarteiraToFirestore = async (userId: string, deltaDisponivel: number, deltaRetido: number) => {
    const current = getCarteira(userId);
    const newDisponivel = Math.max(0, current.saldoDisponivel + deltaDisponivel);
    const newRetido = Math.max(0, current.saldoRetido + deltaRetido);

    const updatedCarteira: Carteira = {
      userId,
      saldoDisponivel: newDisponivel,
      saldoRetido: newRetido,
      moeda: "MZN",
      atualizadoEm: new Date().toISOString(),
    };

    setCarteiras((prev) => ({
      ...prev,
      [userId]: updatedCarteira,
    }));

    if (db) {
      try {
        await setDoc(doc(db, "carteiras", userId), cleanForFirestore(updatedCarteira), { merge: true });
      } catch (e) {
        console.error("Erro ao sincronizar carteira no Firestore:", e);
      }
    }
    return updatedCarteira;
  };

  const syncTransacaoCarteiraToFirestore = async (txData: {
    userId: string;
    tipo: TipoTransacaoCarteira;
    valor: number;
    transacaoEncomendaId?: string | null;
    referenciaExterna?: string;
    estado?: EstadoTransacaoCarteira;
  }): Promise<TransacaoCarteira> => {
    const id = `txc-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: TransacaoCarteira = {
      id,
      userId: txData.userId,
      tipo: txData.tipo,
      valor: txData.valor,
      transacaoEncomendaId: txData.transacaoEncomendaId || null,
      referenciaExterna: txData.referenciaExterna || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      estado: txData.estado || "concluido",
      criadoEm: new Date().toISOString(),
    };

    setTransacoesCarteira((prev) => [newTx, ...prev]);

    if (db) {
      try {
        await setDoc(doc(db, "transacoes_carteira", id), cleanForFirestore(newTx));
      } catch (e) {
        console.error("Erro ao guardar transacao_carteira no Firestore:", e);
      }
    }
    return newTx;
  };

  // Sync active user with Firebase Crashlytics
  useEffect(() => {
    if (currentUser) {
      crashlytics.setUserIdentifier(currentUser.id, currentUser.role, currentUser.email);
      crashlytics.setCustomKey("user_province", currentUser.province);
      crashlytics.setCustomKey("user_district", currentUser.district);
    } else {
      crashlytics.setUserIdentifier(null);
      crashlytics.clearCustomKeys();
    }
  }, [currentUser]);

  const pushNotification = ({
    title,
    message,
    type = "SYSTEM",
    category = "SISTEMA",
    targetRole = "ALL",
    targetUserId = "ALL",
    relatedId,
  }: {
    title: string;
    message: string;
    type?: "ORDER" | "MESSAGE" | "SYSTEM";
    category?: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA";
    targetRole?: "FARMER" | "BUYER" | "DRIVER" | "ADMIN" | "ALL";
    targetUserId?: string;
    relatedId?: string;
  }) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: targetUserId,
      title,
      message,
      type,
      category,
      targetRole,
      relatedId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setAppNotifications((prev) => [newNotif, ...prev]);
    setNotifications((prev) => [`[${title}] ${message}`, ...prev]);

    // Save notification doc to Firestore
    if (db) {
      setDoc(doc(db, "notificacoes", newNotif.id), cleanForFirestore(newNotif)).catch((e) =>
        console.error("Erro ao guardar notificação no Firestore:", e)
      );
    }

    // Role eligibility check
    const matchesRole =
      !currentUser ||
      targetRole === "ALL" ||
      currentUser.role === targetRole ||
      (targetRole === "FARMER" && currentUser.role === "FARMER") ||
      (targetRole === "BUYER" && currentUser.role === "BUYER") ||
      (targetRole === "DRIVER" && currentUser.role === "DRIVER");

    const matchesUser = !currentUser || targetUserId === "ALL" || targetUserId === currentUser.id;

    if (matchesRole && matchesUser) {
      setActivePushToast({
        id: newNotif.id,
        title,
        message,
        type,
        category,
        targetRole,
        relatedId,
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActivePushToast((current) => (current?.id === newNotif.id ? null : current));
      }, 6000);

      // Trigger Web Push Notification & FCM Chime Audio safely
      fcmService
        .triggerFcmPush({
          title,
          body: message,
          category,
          targetRole,
          targetUserId,
          relatedId,
        })
        .catch((err) => console.warn("FCM Push error ignored:", err));
    }
  };

  const markNotificationAsRead = (id: string) => {
    setAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (db) {
      setDoc(doc(db, "notificacoes", id), { read: true }, { merge: true }).catch((e) =>
        console.error("Erro ao atualizar notificação no Firestore:", e)
      );
    }
  };

  const markAllNotificationsAsRead = () => {
    setAppNotifications((prev) =>
      prev.map((n) => {
        const matches = !currentUser || n.userId === "ALL" || n.userId === currentUser.id;
        if (matches && db && !n.read) {
          setDoc(doc(db, "notificacoes", n.id), { read: true }, { merge: true }).catch((e) =>
            console.error("Erro ao marcar como lida:", e)
          );
        }
        return matches ? { ...n, read: true } : n;
      })
    );
  };

  const dismissPushToast = () => {
    setActivePushToast(null);
  };

  const addNotification = (msg: string) => {
    pushNotification({
      title: "Notificação AgroMoz",
      message: msg,
      type: "SYSTEM",
      targetUserId: currentUser?.id || "ALL",
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    setAppNotifications([]);
  };

  // Unread Count calculation
  const unreadCount = appNotifications.filter((n) => {
    if (n.read) return false;
    if (!currentUser) return n.userId === "ALL";
    return n.userId === "ALL" || n.userId === currentUser.id;
  }).length;

  const loginUser = (phoneOrEmail: string, pass: string, role: string): UserProfile | null => {
    const rawQuery = phoneOrEmail.trim();
    const cleanDigits = rawQuery.replace(/\D/g, "");
    const cleanEmail = rawQuery.toLowerCase();

    if (!rawQuery && role !== "ADMIN") {
      throw new Error("Por favor, introduza o seu número de telefone ou email.");
    }

    // 1. First search for a user matching phone/email under the SPECIFIC requested role
    let foundUser = users.find((u) => {
      if (u.role !== role) return false;
      const uDigits = u.phone.replace(/\D/g, "");
      const matchesPhone = cleanDigits.length >= 3 && (uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits));
      const matchesEmail = Boolean(u.email && u.email.toLowerCase().trim() === cleanEmail);
      const matchesRaw = Boolean(rawQuery && (u.phone.includes(rawQuery) || (u.email && u.email.toLowerCase().includes(cleanEmail))));
      return matchesPhone || matchesEmail || matchesRaw;
    });

    // 2. If requesting ADMIN and not found in existing state, fallback/auto-provision the default Admin
    if (!foundUser && role === "ADMIN") {
      foundUser = {
        id: "user-admin-default",
        name: "Administrador AgroMoz",
        role: "ADMIN",
        phone: "863983206",
        email: "admin@agromoz.mz",
        password: "123",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        province: "Maputo Cidade",
        district: "Kamphumo",
        online: true,
        isApproved: true,
      };
    }

    // 3. If still not found for requested role, check if the account exists under a DIFFERENT role
    if (!foundUser) {
      const foundOtherRole = users.find((u) => {
        const uDigits = u.phone.replace(/\D/g, "");
        const matchesPhone = cleanDigits.length >= 6 && (uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits));
        const matchesEmail = Boolean(u.email && u.email.toLowerCase().trim() === cleanEmail);
        return matchesPhone || matchesEmail;
      });

      if (foundOtherRole) {
        const roleLabels: Record<string, string> = {
          FARMER: "Agricultor",
          BUYER: "Comprador",
          DRIVER: "Transportador",
          ADMIN: "Administrador",
        };
        const actualRoleName = roleLabels[foundOtherRole.role] || foundOtherRole.role;
        throw new Error(
          `Esta conta está registada como ${actualRoleName} (${foundOtherRole.name}). Por favor, selecione a categoria '${actualRoleName}' no topo para entrar.`
        );
      }

      throw new Error("Conta não encontrada. Verifique o número/email ou registe uma nova conta.");
    }

    // 4. Validate password (for ADMIN, accept '123' or matching password)
    if (foundUser.password && pass && foundUser.password !== pass && (role !== "ADMIN" || pass !== "123")) {
      throw new Error("Palavra-passe incorreta. Por favor, tente novamente.");
    }

    const updated = { ...foundUser, online: true };
    setCurrentUser(updated);

    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updated.id);
      if (!exists) {
        return [...prev, updated];
      }
      return prev.map((u) => (u.id === updated.id ? updated : u));
    });

    addNotification(`Sessão iniciada como ${updated.name} (${updated.role})`);
    return updated;
  };

  const registerUser = (newUser: Partial<UserProfile>): UserProfile => {
    const rawPhone = (newUser.phone || "").trim();
    const cleanDigits = rawPhone.replace(/\D/g, "");

    if (cleanDigits.length >= 6) {
      const existingUser = users.find((u) => u.phone.replace(/\D/g, "") === cleanDigits);
      if (existingUser) {
        const roleLabel =
          existingUser.role === "FARMER"
            ? "Agricultor"
            : existingUser.role === "BUYER"
            ? "Comprador"
            : existingUser.role === "DRIVER"
            ? "Transportador"
            : "Administrador";
        throw new Error(
          `O número de telefone (${rawPhone}) já está registado na AgroMoz como ${roleLabel} (${existingUser.name}). Por favor, aceda ao separador 'Entrar (Login)' para aceder à sua conta.`
        );
      }
    }

    const id = `user-${Date.now()}`;
    const userRole = newUser.role || "BUYER";
    if (userRole === "ADMIN") {
      throw new Error("Não é possível registar novos Administradores. O acesso à área administrativa é reservado exclusivamente ao número registado (863983206).");
    }
      
      const user: UserProfile = {
        id,
        name: newUser.name || "Utilizador AgroMoz",
        role: userRole,
        phone: rawPhone || "840000000",
        email: newUser.email || "",
        password: newUser.password || "",
        photoUrl:
          newUser.photoUrl ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        province: newUser.province || "Maputo Província",
        district: newUser.district || "Marracuene",
        address: newUser.address || "",
        localidade: newUser.localidade || "",
        online: true,
        rating: 5.0,
        totalRatings: 0,
        isApproved: userRole !== "DRIVER", // drivers need admin approval
        membershipFeePaid: true, // Free registration - no 50 MT fee required
        membershipFeeStatus: "Aprovado",
        farmName: newUser.farmName || "",
        farmArea: newUser.farmArea || "",
        cropsGrown: newUser.cropsGrown || [],
        bio: newUser.bio || "",
        vehicleType: newUser.vehicleType,
        licensePlate: newUser.licensePlate,
      };

      setUsers((prev) => [...prev, user]);
      setCurrentUser(user);
      if (db) {
        setDoc(doc(db, "users", user.id), cleanForFirestore(user)).catch((e) => {
          crashlytics.logAuthError(e, "register", { action: "firestore_sync", userId: user.id });
        });
      }

      addNotification(`Conta criada com sucesso! Bem-vindo à AgroMoz, ${user.name}.`);

      return user;
  };

  const logoutUser = () => {
    if (currentUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, online: false } : u))
      );
    }
    setCurrentUser(null);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    if (db) {
      setDoc(doc(db, "users", updated.id), cleanForFirestore(updated)).catch((e) => console.log("Firestore updateUserProfile error:", e));
    }

    pushNotification({
      title: "👤 Perfil Atualizado",
      message: "As suas informações de perfil e fotografia foram atualizadas com sucesso!",
      type: "SYSTEM",
      targetUserId: currentUser.id,
    });
  };

  const toggleOnlineStatus = () => {
    if (!currentUser) return;
    const newStatus = !currentUser.online;
    const updated = { ...currentUser, online: newStatus };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    // Sync farmer status in products & machambas
    if (currentUser.role === "FARMER") {
      setProducts((prev) =>
        prev.map((p) => (p.farmerId === currentUser.id ? { ...p, farmerOnline: newStatus } : p))
      );
      setMachambas((prev) =>
        prev.map((m) => (m.farmerId === currentUser.id ? { ...m, farmerOnline: newStatus } : m))
      );
    }
  };

  const addProduct = (product: Partial<Product>): Product => {
    try {
      if (!currentUser || currentUser.role !== "FARMER") {
        const err = new Error("Apenas agricultores registados podem publicar produtos.");
        crashlytics.logProductError(err, "publish", { userId: currentUser?.id });
        throw err;
      }

      if (!currentUser.isVerifiedFarmer && currentUser.verificationStatus !== "Aprovado") {
        const err = new Error("🔒 Verificação de Idade (18+) Obrigatória: Deve concluir a verificação do B.I e comprovar ser maior de 18 anos antes de publicar produtos na plataforma AgroMoz.");
        crashlytics.logProductError(err, "publish", { userId: currentUser.id, verificationStatus: currentUser.verificationStatus });
        throw err;
      }

      const basePrice = Number(product.basePricePerUnit) || Number(product.pricePerUnit) || 100;
      const margin = Math.round(basePrice * 0.03 * 100) / 100;
      const finalPrice = product.pricePerUnit || (basePrice + margin);

      const newProd: Product = {
        id: `prod-${Date.now()}`,
        farmerId: currentUser.id,
        farmerName: currentUser.name,
        farmerPhone: currentUser.phone,
        farmerPhoto: currentUser.photoUrl,
        farmerOnline: currentUser.online,
        farmerRating: currentUser.rating || 5.0,
        name: product.name || "Produto Agrícola",
        category: product.category || "Hortaliças",
        description: product.description || "",
        basePricePerUnit: basePrice,
        agroMozMargin: margin,
        pricePerUnit: finalPrice,
        termsAccepted: product.termsAccepted ?? true,
        unit: product.unit || "kg",
        availableQuantity: Number(product.availableQuantity) || 10,
        status: Number(product.availableQuantity) > 10 ? "Disponibile" : Number(product.availableQuantity) > 0 ? "Pouca quantidade" : "Esgotado",
        images: product.images?.length ? product.images : ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
        province: currentUser.province,
        district: currentUser.district,
        createdAt: new Date().toISOString(),
      };

      setProducts((prev) => [newProd, ...prev]);
      if (db) {
        setDoc(doc(db, "products", newProd.id), cleanForFirestore(newProd)).catch((e) => {
          crashlytics.logProductError(e, "publish", { action: "firestore_sync", productId: newProd.id });
        });
      }
      addNotification(`Novo produto publicado em tempo real: ${newProd.name}`);
      return newProd;
    } catch (err) {
      crashlytics.logProductError(err, "publish", { productName: product.name });
      throw err;
    }
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    try {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const qty = updatedFields.availableQuantity !== undefined ? updatedFields.availableQuantity : p.availableQuantity;
            const status = qty > 10 ? "Disponibile" : qty > 0 ? "Pouca quantidade" : "Esgotado";
            const updated = { ...p, ...updatedFields, availableQuantity: qty, status };
            if (db) {
              setDoc(doc(db, "products", id), cleanForFirestore(updated)).catch((e) => {
                crashlytics.logProductError(e, "update", { action: "firestore_sync", productId: id });
              });
            }
            return updated;
          }
          return p;
        })
      );
    } catch (err) {
      crashlytics.logProductError(err, "update", { productId: id });
    }
  };

  const deleteProduct = (id: string) => {
    try {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (db) {
        deleteDoc(doc(db, "products", id)).catch((e) => {
          crashlytics.logProductError(e, "delete", { action: "firestore_sync", productId: id });
        });
      }
      addNotification("Produto removido do mercado.");
    } catch (err) {
      crashlytics.logProductError(err, "delete", { productId: id });
    }
  };

  const addProductReview = (reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
  }): ProductReview => {
    const order = orders.find((o) => o.id === reviewData.orderId);
    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: reviewData.productId,
      productName: order?.productName || "Produto Agrícola",
      orderId: reviewData.orderId,
      buyerId: currentUser?.id || "user-buyer-default",
      buyerName: currentUser?.name || "Comprador Verificado",
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);

    pushNotification({
      title: "⭐ Nova Avaliação de Produto",
      message: `${currentUser?.name || "Um consumidor"} avaliou '${newReview.productName}' com ${newReview.rating}★!`,
      type: "ORDER",
      targetUserId: order?.farmerId || "ALL",
      relatedId: reviewData.orderId,
    });

    return newReview;
  };

  const addMachamba = (machamba: Partial<Machamba>): Machamba => {
    if (!currentUser) throw new Error("É necessário estar autenticado.");

    const newM: Machamba = {
      id: `machamba-${Date.now()}`,
      farmerId: currentUser.id,
      farmerName: currentUser.name,
      farmerPhone: currentUser.phone,
      name: machamba.name || `Machamba de ${currentUser.name}`,
      province: machamba.province || currentUser.province,
      district: machamba.district || currentUser.district,
      localidade: machamba.localidade || currentUser.localidade || "",
      areaSize: machamba.areaSize || "1 Hectare",
      productionTypes: machamba.productionTypes || ["Milho", "Feijão"],
      images: machamba.images?.length ? machamba.images : ["https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600"],
      lat: machamba.lat || -25.73,
      lng: machamba.lng || 32.68,
      status: "Ativa",
      farmerOnline: currentUser.online,
    };

    setMachambas((prev) => [newM, ...prev]);
    if (db) {
      setDoc(doc(db, "machambas", newM.id), cleanForFirestore(newM)).catch((e) => console.log("Firestore addMachamba error:", e));
    }
    addNotification(`Nova Machamba registada: ${newM.name}`);
    return newM;
  };

  const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    let buyer = currentUser;
    if (!buyer) {
      buyer = users.find((u) => u.role === "BUYER") || {
        id: `user-buyer-${Date.now()}`,
        name: orderData.buyerName || "Consumidor AgroMoz",
        role: "BUYER",
        phone: orderData.buyerPhone || "840000000",
        province: orderData.buyerProvince || "Maputo Cidade",
        district: orderData.buyerDistrict || "Kamphumo",
        address: orderData.deliveryAddressReference || "Maputo",
        online: true,
        isApproved: true,
      };
      setCurrentUser(buyer);
      if (!users.some((u) => u.id === buyer!.id)) {
        setUsers((prev) => [...prev, buyer!]);
      }
    }

    const deliveryFee = 150; // MT
    const subtotal = orderData.subtotal || ((orderData.quantity || 1) * 80);
    const platformFee = Math.round(subtotal * 0.05); // AgroMoz 5% commission
    const farmerNetAmount = subtotal - platformFee; // Net amount released to farmer upon delivery
    const totalAmount = subtotal + deliveryFee;

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerPhone: orderData.buyerPhone || buyer.phone,
      buyerAddress: orderData.deliveryAddressReference || buyer.locationNotes || buyer.address || `${buyer.district || 'KaMpfumo'}, ${buyer.province || 'Maputo Cidade'}`,
      buyerProvince: orderData.buyerProvince || buyer.province || "Maputo Cidade",
      buyerDistrict: orderData.buyerDistrict || buyer.district || "KaMpfumo",
      buyerLocation: orderData.buyerLocation || buyer.userLocation || { lat: -25.9692, lng: 32.5732 },
      destinoEntrega: orderData.destinoEntrega || {
        provincia: orderData.buyerProvince || buyer.province || "Maputo Cidade",
        distrito: orderData.buyerDistrict || buyer.district || "KaMpfumo",
        endereco: orderData.deliveryAddressReference || buyer.locationNotes || buyer.address || "Bairro Central",
        lat: (orderData.buyerLocation || buyer.userLocation || { lat: -25.9692, lng: 32.5732 }).lat,
        lng: (orderData.buyerLocation || buyer.userLocation || { lat: -25.9692, lng: 32.5732 }).lng,
      },
      farmerId: orderData.farmerId || "",
      farmerName: orderData.farmerName || "Agricultor",
      farmerPhone: orderData.farmerPhone || "",
      productId: orderData.productId || "",
      productName: orderData.productName || "Produto Agrícola",
      productImage: orderData.productImage || "",
      quantity: orderData.quantity || 1,
      unit: orderData.unit || "kg",
      subtotal,
      platformFee,
      farmerNetAmount,
      totalAmount,
      deliveryFee,
      valorProduto: subtotal,
      valorTransporte: deliveryFee,
      estadoPagamentoVendedor: "pendente",
      estadoPagamentoTransportador: "pendente",
      estado: "aguardando_propostas",
      paymentMethod: orderData.paymentMethod || "M-Pesa",
      paymentStatus: "Pendente", // Held in AgroMoz Escrow Account
      escrowStatus: "Pendente",
      paymentTxId: `AGM-${Date.now()}`,
      deliveryStatus: "Pedido recebido",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    if (db) {
      setDoc(doc(db, "orders", newOrder.id), cleanForFirestore(newOrder)).catch((e) => console.log("Firestore createOrder error:", e));
    }

    // Update stock in real-time
    if (orderData.productId) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === orderData.productId) {
            const newQty = Math.max(0, p.availableQuantity - (orderData.quantity || 1));
            const newStatus = newQty > 10 ? "Disponibile" : newQty > 0 ? "Pouca quantidade" : "Esgotado";
            return { ...p, availableQuantity: newQty, status: newStatus };
          }
          return p;
        })
      );
    }

    // Sync Farmer Wallet Retention in /carteiras and /transacoes_carteira
    if (newOrder.farmerId) {
      syncCarteiraToFirestore(newOrder.farmerId, 0, farmerNetAmount);
      syncTransacaoCarteiraToFirestore({
        userId: newOrder.farmerId,
        tipo: "retencao",
        valor: farmerNetAmount,
        transacaoEncomendaId: newOrder.id,
        referenciaExterna: newOrder.paymentTxId || newOrder.id,
        estado: "concluido",
      });
    }

    // Add wallet record only if user is not a BUYER
    if (buyer.role !== "BUYER") {
      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        userId: buyer.id,
        type: "SAÍDA",
        title: `Pagamento em Custódia: ${newOrder.productName} (${newOrder.quantity} ${newOrder.unit})`,
        amount: totalAmount,
        feeAmount: platformFee,
        escrowOrderId: newOrder.id,
        method: newOrder.paymentMethod,
        status: "Pendente",
        reference: newOrder.paymentTxId || "",
        timestamp: new Date().toISOString(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    // Push Targeted FCM Notifications
    // 1. To Buyer
    pushNotification({
      title: "🛡️ Pagamento em Custódia AgroMoz",
      message: `A sua compra de ${newOrder.productName} (${totalAmount} MT) foi efetuada via ${newOrder.paymentMethod}. O dinheiro está retido em segurança até à entrega!`,
      type: "ORDER",
      category: "PAGAMENTO",
      targetRole: "BUYER",
      targetUserId: newOrder.buyerId,
      relatedId: newOrder.id,
    });

    // 2. To Farmer
    if (newOrder.farmerId) {
      pushNotification({
        title: "🌾 Nova Venda (Em Custódia AgroMoz)",
        message: `Recebeu o pedido de ${newOrder.quantity} ${newOrder.unit} de ${newOrder.productName} (Valor: ${subtotal} MT | Taxa AgroMoz 5%: ${platformFee} MT | A receber: ${farmerNetAmount} MT após entrega).`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "FARMER",
        targetUserId: newOrder.farmerId,
        relatedId: newOrder.id,
      });
    }

    // 3. Push Alert to Drivers / Transportadores
    pushNotification({
      title: "🚚 Nova Carga de Frete Disponível!",
      message: `Nova solicitação de transporte para ${newOrder.productName} (${newOrder.quantity} ${newOrder.unit}) de ${newOrder.buyerProvince} com frete de ${deliveryFee} MT.`,
      type: "ORDER",
      category: "PEDIDO",
      targetRole: "DRIVER",
      relatedId: newOrder.id,
    });

    return newOrder;
  };

  // Confirmação de Entrega pelo Transportador (Passo 5 da Regra de Custódia)
  const confirmDeliveryByDriver = (orderId: string) => {
    let affectedOrder: Order | undefined;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          affectedOrder = {
            ...o,
            estado: "entrega_confirmada_transportador",
            deliveryStatus: "Entregue pelo transportador (Aguardando confirmação do comprador)",
            transportadorConfirmouEm: nowIso,
            updatedAt: nowIso,
          };
          return affectedOrder;
        }
        return o;
      })
    );

    if (db) {
      updateDoc(doc(db, "orders", orderId), {
        estado: "entrega_confirmada_transportador",
        deliveryStatus: "Entregue pelo transportador (Aguardando confirmação do comprador)",
        transportadorConfirmouEm: nowIso,
        updatedAt: nowIso,
      }).catch((e) => console.log("Firestore confirmDeliveryByDriver error:", e));

      updateDoc(doc(db, "transacoes", orderId), {
        estado: "entrega_confirmada_transportador",
        deliveryStatus: "Entregue pelo transportador (Aguardando confirmação do comprador)",
        transportadorConfirmouEm: nowIso,
        updatedAt: nowIso,
      }).catch((e) => console.log("Firestore confirmDeliveryByDriver transacoes error:", e));
    }

    const target = affectedOrder || orders.find((o) => o.id === orderId);
    if (target) {
      pushNotification({
        title: "📦 Transportador Confirmou Entrega!",
        message: `O motorista ${target.driverName || "do frete"} confirmou que entregou a sua encomeda de ${target.productName}. Por favor, confirme o recebimento para libertar os pagamentos em custódia.`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "BUYER",
        targetUserId: target.buyerId,
        relatedId: orderId,
      });
    }
  };

  // Confirmação de Recebimento pelo Comprador (Passo 6 da Regra de Custódia — Liberta Pagamentos)
  const confirmReceiptByBuyer = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const nowIso = new Date().toISOString();

    // Atualiza estado de dupla confirmação
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            compradorConfirmouEm: nowIso,
            pagamentoLiberadoVendedor: true,
            pagamentoLiberadoTransportador: true,
            pagamentoLiberadoEm: nowIso,
          };
        }
        return o;
      })
    );

    if (db) {
      updateDoc(doc(db, "orders", orderId), {
        compradorConfirmouEm: nowIso,
        pagamentoLiberadoVendedor: true,
        pagamentoLiberadoTransportador: true,
        pagamentoLiberadoEm: nowIso,
      }).catch((e) => console.log("Firestore confirmReceiptByBuyer error:", e));

      updateDoc(doc(db, "transacoes", orderId), {
        compradorConfirmouEm: nowIso,
        pagamentoLiberadoVendedor: true,
        pagamentoLiberadoTransportador: true,
        pagamentoLiberadoEm: nowIso,
      }).catch((e) => console.log("Firestore confirmReceiptByBuyer transacoes error:", e));
    }

    // Chama o gatilho de libertação de fundos em custódia para vendedor e transportador
    releaseEscrowPayment(orderId, "Dupla confirmação concluída: Comprador e Transportador");
  };

  const releaseEscrowPayment = (orderId: string, reason = "Confirmação de Entrega") => {
    let orderToRelease: Order | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.escrowStatus !== "Liberado") {
          orderToRelease = {
            ...o,
            escrowStatus: "Liberado",
            paymentStatus: "Pago",
            deliveryStatus: "Entregue",
            estadoPagamentoVendedor: "pago",
            estadoPagamentoTransportador: "pago",
            estado: "concluido",
            releasedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return orderToRelease;
        }
        return o;
      })
    );

    const targetOrder = orderToRelease || orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.escrowStatus === "Liberado") return;

    // Credit Farmer's Available Wallet
    if (targetOrder.farmerId) {
      const farmerTx: WalletTransaction = {
        id: `tx-rel-${Date.now()}`,
        userId: targetOrder.farmerId,
        type: "ENTRADA",
        title: `Venda Entregue: ${targetOrder.productName} (${targetOrder.quantity} ${targetOrder.unit})`,
        amount: targetOrder.farmerNetAmount,
        feeAmount: targetOrder.platformFee,
        escrowOrderId: targetOrder.id,
        method: targetOrder.paymentMethod,
        status: "Pago",
        reference: targetOrder.paymentTxId || targetOrder.id,
        timestamp: new Date().toISOString(),
      };

      setTransactions((prev) => [farmerTx, ...prev]);

      // Release from retido to disponivel in /carteiras and record /transacoes_carteira
      syncCarteiraToFirestore(
        targetOrder.farmerId,
        targetOrder.farmerNetAmount,
        -targetOrder.farmerNetAmount
      );
      syncTransacaoCarteiraToFirestore({
        userId: targetOrder.farmerId,
        tipo: "liberacao",
        valor: targetOrder.farmerNetAmount,
        transacaoEncomendaId: targetOrder.id,
        referenciaExterna: targetOrder.paymentTxId || targetOrder.id,
        estado: "concluido",
      });

      // Notify Farmer via Wallet Toast
      pushNotification({
        title: `💸 M-Pesa / e-Mola: Pagamento Creditado na Wallet!`,
        message: `${targetOrder.farmerNetAmount} MT via ${targetOrder.paymentMethod} foram creditados no seu Saldo Disponível (${targetOrder.productName}).`,
        type: "ORDER",
        category: "PAGAMENTO",
        targetRole: "FARMER",
        targetUserId: targetOrder.farmerId,
        relatedId: targetOrder.id,
      });
    }

    // Credit Driver's Available Wallet if assigned
    if (targetOrder.driverId) {
      const driverFee = targetOrder.deliveryFee || 150;
      const driverTx: WalletTransaction = {
        id: `tx-drv-${Date.now()}`,
        userId: targetOrder.driverId,
        type: "ENTRADA",
        title: `Frete Concluído: Pedido #${targetOrder.id} (${targetOrder.productName})`,
        amount: driverFee,
        method: targetOrder.paymentMethod,
        status: "Pago",
        reference: targetOrder.paymentTxId || targetOrder.id,
        timestamp: new Date().toISOString(),
      };

      setTransactions((prev) => [driverTx, ...prev]);

      // Release to driver disponivel in /carteiras and record /transacoes_carteira
      syncCarteiraToFirestore(targetOrder.driverId, driverFee, 0);
      syncTransacaoCarteiraToFirestore({
        userId: targetOrder.driverId,
        tipo: "liberacao",
        valor: driverFee,
        transacaoEncomendaId: targetOrder.id,
        referenciaExterna: targetOrder.paymentTxId || targetOrder.id,
        estado: "concluido",
      });

      // Notify Driver via Wallet Toast
      pushNotification({
        title: `🚚 e-Mola / M-Pesa: Frete Creditado na Wallet!`,
        message: `Recebeu ${driverFee} MT na sua Carteira AgroMoz via ${targetOrder.paymentMethod} pelo serviço de transporte do pedido #${targetOrder.id}.`,
        type: "ORDER",
        category: "PAGAMENTO",
        targetRole: "DRIVER",
        targetUserId: targetOrder.driverId,
        relatedId: targetOrder.id,
      });
    }

    // Notify Buyer
    pushNotification({
      title: "✅ Entrega Concluída com Sucesso",
      message: `O seu pedido #${targetOrder.id} (${targetOrder.productName}) foi entregue e o pagamento foi libertado ao agricultor. Obrigado por comprar na AgroMoz!`,
      type: "ORDER",
      category: "PAGAMENTO",
      targetRole: "BUYER",
      targetUserId: targetOrder.buyerId,
      relatedId: targetOrder.id,
    });
  };

  const refundEscrowPayment = (orderId: string, reason: string) => {
    let targetOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.escrowStatus !== "Reembolsado") {
          targetOrder = {
            ...o,
            escrowStatus: "Reembolsado",
            paymentStatus: "Reembolsado",
            deliveryStatus: "Cancelado",
            refundReason: reason,
            updatedAt: new Date().toISOString(),
          };
          return targetOrder;
        }
        return o;
      })
    );

    const orderRef = targetOrder || orders.find((o) => o.id === orderId);
    if (!orderRef) return;

    // Release retention on farmer carteira
    if (orderRef.farmerId) {
      syncCarteiraToFirestore(orderRef.farmerId, 0, -orderRef.farmerNetAmount);
      syncTransacaoCarteiraToFirestore({
        userId: orderRef.farmerId,
        tipo: "estorno",
        valor: orderRef.farmerNetAmount,
        transacaoEncomendaId: orderRef.id,
        referenciaExterna: orderRef.paymentTxId || orderRef.id,
        estado: "concluido",
      });
    }

    // Refund Buyer Wallet
    const refundTx: WalletTransaction = {
      id: `tx-ref-${Date.now()}`,
      userId: orderRef.buyerId,
      type: "ENTRADA",
      title: `Reembolso Custódia AgroMoz: Pedido #${orderRef.id}`,
      amount: orderRef.totalAmount,
      method: orderRef.paymentMethod,
      status: "Reembolsado",
      reference: orderRef.paymentTxId || orderRef.id,
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [refundTx, ...prev]);

    // Also record in /carteiras and /transacoes_carteira for Buyer
    syncCarteiraToFirestore(orderRef.buyerId, orderRef.totalAmount, 0);
    syncTransacaoCarteiraToFirestore({
      userId: orderRef.buyerId,
      tipo: "estorno",
      valor: orderRef.totalAmount,
      transacaoEncomendaId: orderRef.id,
      referenciaExterna: orderRef.paymentTxId || orderRef.id,
      estado: "concluido",
    });

    pushNotification({
      title: "↩️ Reembolso Processado",
      message: `O valor de ${orderRef.totalAmount} MT do pedido #${orderRef.id} foi reembolsado para a sua conta. Motivo: ${reason}`,
      type: "ORDER",
      category: "PAGAMENTO",
      targetRole: "BUYER",
      targetUserId: orderRef.buyerId,
      relatedId: orderRef.id,
    });
  };

  const updateOrderStatus = (orderId: string, status: Order["deliveryStatus"]) => {
    if (status === "Entregue") {
      releaseEscrowPayment(orderId, "Confirmado como Entregue");
      return;
    }

    if (status === "Cancelado") {
      refundEscrowPayment(orderId, "Cancelamento do pedido");
      return;
    }

    let affectedOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          affectedOrder = o;
          const estado = status === "Entregador a caminho" || status === "Preparando encomenda" ? "em_transito" : o.estado || "pendente";
          return { ...o, deliveryStatus: status, estado, updatedAt: new Date().toISOString() };
        }
        return o;
      })
    );

    // Notify buyer and farmer of status change
    const orderRef = affectedOrder || orders.find((o) => o.id === orderId);
    if (orderRef) {
      // To Buyer
      pushNotification({
        title: `🔔 Atualização do Pedido #${orderId}`,
        message: `O estado da sua entrega de ${orderRef.productName} mudou para: "${status}".`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "BUYER",
        targetUserId: orderRef.buyerId,
        relatedId: orderId,
      });

      // To Farmer
      if (orderRef.farmerId) {
        pushNotification({
          title: `🌾 Estado da Encomenda #${orderId}`,
          message: `O estado da recolha/entrega foi atualizado para: "${status}".`,
          type: "ORDER",
          category: "PEDIDO",
          targetRole: "FARMER",
          targetUserId: orderRef.farmerId,
          relatedId: orderId,
        });
      }
    }
  };

  const assignDriverToOrder = (orderId: string, driverId: string, driverName: string, driverPhone: string) => {
    let orderRef = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              driverId,
              driverName,
              driverPhone,
              deliveryStatus: "Entregador a caminho",
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    if (orderRef) {
      pushNotification({
        title: `🚚 Entregador a Caminho!`,
        message: `O motorista ${driverName} (${driverPhone}) aceitou fazer o transporte da encomenda #${orderId}.`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "BUYER",
        targetUserId: orderRef.buyerId,
        relatedId: orderId,
      });

      pushNotification({
        title: `🌾 Transporte Atribuído!`,
        message: `O motorista ${driverName} (${driverPhone}) foi designado para recolher a carga do pedido #${orderId}.`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "FARMER",
        targetUserId: orderRef.farmerId,
        relatedId: orderId,
      });
    }
  };

  // Submeter Proposta de Frete por um Transportador
  const submitDeliveryProposal = (
    transacaoId: string,
    valorProposto: number,
    mensagem?: string,
    tempoEstimado?: string
  ): DeliveryProposal => {
    const driver = currentUser || {
      id: "driver-default",
      name: "Transportador AgroMoz",
      phone: "840000000",
      role: "DRIVER",
      vehicleType: "Carrinha",
    };

    const newProposal: DeliveryProposal = {
      id: `prop-${Date.now()}`,
      transacaoId,
      transportadorId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverRating: 4.9,
      vehicleType: driver.vehicleType || "Carrinha",
      valorProposto,
      mensagem: mensagem || "Disponível para recolha imediata na machamba",
      tempoEstimado: tempoEstimado || "Entrega estimada em 24h",
      estado: "pendente",
      criadoEm: new Date().toISOString(),
    };

    setProposals((prev) => [newProposal, ...prev]);

    if (db) {
      setDoc(
        doc(db, "transacoes", transacaoId, "propostas", newProposal.id),
        cleanForFirestore(newProposal)
      ).catch((e) => console.log("Firestore submitProposal error:", e));
    }

    // Notificar o comprador de que há uma nova proposta
    const targetOrder = orders.find((o) => o.id === transacaoId);
    if (targetOrder) {
      pushNotification({
        title: `🚚 Nova Proposta de Transporte!`,
        message: `O motorista ${driver.name} propôs ${valorProposto} MT para entregar a sua encomenda de ${targetOrder.productName}.`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "BUYER",
        targetUserId: targetOrder.buyerId,
        relatedId: transacaoId,
      });
    }

    return newProposal;
  };

  // Aceitar Proposta de Frete e Rejeitar as Restantes
  const acceptDeliveryProposal = (transacaoId: string, propostaId: string) => {
    const winnerProp = proposals.find((p) => p.id === propostaId);
    if (!winnerProp) return;

    // 1. Atualizar estados das propostas: a escolhida fica "aceite", as outras do mesmo pedido passam a "rejeitada"
    setProposals((prev) =>
      prev.map((p) => {
        if (p.transacaoId === transacaoId) {
          return p.id === propostaId ? { ...p, estado: "aceite" } : { ...p, estado: "rejeitada" };
        }
        return p;
      })
    );

    // 2. Atualizar encomenda com o transportador aceite e o valor de frete definido
    let targetOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === transacaoId) {
          targetOrder = {
            ...o,
            driverId: winnerProp.transportadorId,
            driverName: winnerProp.driverName,
            driverPhone: winnerProp.driverPhone,
            valorTransporte: winnerProp.valorProposto,
            deliveryFee: winnerProp.valorProposto,
            totalAmount: o.subtotal + winnerProp.valorProposto,
            estado: "aguardando_pagamento",
            deliveryStatus: "Aguardando pagamento do comprador",
            updatedAt: new Date().toISOString(),
          };
          return targetOrder;
        }
        return o;
      })
    );

    // 3. Notificar o Transportador Vencedor
    pushNotification({
      title: `🎉 Proposta Aceite!`,
      message: `A sua proposta de ${winnerProp.valorProposto} MT para o pedido #${transacaoId} foi aceite pelo comprador!`,
      type: "ORDER",
      category: "PEDIDO",
      targetRole: "DRIVER",
      targetUserId: winnerProp.transportadorId,
      relatedId: transacaoId,
    });

    // 4. Notificar os outros transportadores cujas propostas caducaram / foram rejeitadas
    const otherProposals = proposals.filter((p) => p.transacaoId === transacaoId && p.id !== propostaId);
    otherProposals.forEach((p) => {
      pushNotification({
        title: `ℹ️ Proposta Não Selecionada`,
        message: `A proposta para o frete da encomenda #${transacaoId} foi encerrada pois outra proposta foi selecionada.`,
        type: "ORDER",
        category: "PEDIDO",
        targetRole: "DRIVER",
        targetUserId: p.transportadorId,
        relatedId: transacaoId,
      });
    });
  };

  // Rejeitar Proposta de Frete
  const rejectDeliveryProposal = (propostaId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === propostaId ? { ...p, estado: "rejeitada" } : p))
    );
  };

  const updateDriverLocation = (orderId: string, location: { lat: number; lng: number }) => {
    const updatedAt = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              driverCurrentLocation: location,
              updatedAt,
            }
          : o
      )
    );
    if (db) {
      setDoc(
        doc(db, "orders", orderId),
        cleanForFirestore({ driverCurrentLocation: location, updatedAt }),
        { merge: true }
      ).catch((e) => console.log("Firestore updateDriverLocation error:", e));
    }
  };

  const sendMessage = (receiverId: string, content: string, imageUrl?: string) => {
    if (!currentUser) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId,
      content,
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "Enviada",
    };

    setChats((prev) => [...prev, msg]);
    if (db) {
      setDoc(doc(db, "messages", msg.id), cleanForFirestore(msg)).catch((e) => console.log("Firestore sendMessage error:", e));
    }

    // Push notification to Receiver
    pushNotification({
      title: `💬 Mensagem de ${currentUser.name}`,
      message: content.length > 55 ? `${content.substring(0, 55)}...` : content,
      type: "MESSAGE",
      category: "CHAT",
      targetUserId: receiverId,
      relatedId: currentUser.id,
    });

    // Simulate auto-receipt after 1 second
    setTimeout(() => {
      setChats((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "Visualizada" } : m))
      );
    }, 1200);
  };

  const iniciarOuObterConversa = async (
    produtoId: string,
    vendedorId: string,
    produtoNome: string,
    produtoImagem?: string
  ): Promise<Conversa> => {
    if (!currentUser) throw new Error("Utilizador não autenticado");

    const compradorId = currentUser.id;

    let existing = conversas.find(
      (c) =>
        c.produtoId === produtoId &&
        c.participantes?.includes(compradorId) &&
        c.participantes?.includes(vendedorId)
    );

    if (existing) {
      return existing;
    }

    const conversaId = `conv_${compradorId}_${vendedorId}_${produtoId}`;
    const agora = new Date().toISOString();

    const novaConversa: Conversa = {
      id: conversaId,
      participantes: [compradorId, vendedorId],
      compradorId,
      vendedorId,
      produtoId,
      produtoNome,
      produtoImagem: produtoImagem || "",
      ultimaMensagem: `Olá, tenho interesse em ${produtoNome}.`,
      ultimaMensagemEm: agora,
      naoLidas: {
        [compradorId]: 0,
        [vendedorId]: 0,
      },
      criadoEm: agora,
    };

    setConversas((prev) => [novaConversa, ...prev.filter((c) => c.id !== conversaId)]);

    if (db) {
      try {
        await setDoc(
          doc(db, "conversas", conversaId),
          cleanForFirestore({
            ...novaConversa,
            [`naoLidas_${compradorId}`]: 0,
            [`naoLidas_${vendedorId}`]: 0,
          }),
          { merge: true }
        );
      } catch (e) {
        console.error("Erro ao criar conversa no Firestore:", e);
      }
    }

    return novaConversa;
  };

  const enviarMensagemConversa = async (
    conversaId: string,
    texto: string,
    imageUrl?: string
  ): Promise<void> => {
    if (!currentUser) return;

    const conversa = conversas.find((c) => c.id === conversaId);
    const destinatarioId =
      conversa?.participantes.find((p) => p !== currentUser.id) ||
      (conversa?.vendedorId === currentUser.id ? conversa?.compradorId : conversa?.vendedorId) ||
      "";

    const msgId = `msg-${Date.now()}`;
    const agora = new Date().toISOString();

    const novaMensagem: MensagemConversa = {
      id: msgId,
      conversaId,
      remetenteId: currentUser.id,
      remetenteNome: currentUser.name,
      texto,
      imageUrl,
      lida: false,
      criadoEm: agora,
    };

    setMensagensConversa((prev) => [...prev, novaMensagem]);

    setConversas((prev) =>
      prev.map((c) => {
        if (c.id === conversaId) {
          const currentUnread = (c.naoLidas && c.naoLidas[destinatarioId]) || 0;
          return {
            ...c,
            ultimaMensagem: texto || "Imagem enviada",
            ultimaMensagemEm: agora,
            naoLidas: {
              ...(c.naoLidas || {}),
              [destinatarioId]: currentUnread + 1,
            },
          };
        }
        return c;
      })
    );

    if (db) {
      try {
        await setDoc(
          doc(db, "conversas", conversaId, "mensagens", msgId),
          cleanForFirestore(novaMensagem)
        );

        const currentUnread = (conversa?.naoLidas && conversa.naoLidas[destinatarioId]) || 0;
        const newUnread = currentUnread + 1;

        await setDoc(
          doc(db, "conversas", conversaId),
          cleanForFirestore({
            ultimaMensagem: texto || "Imagem enviada",
            ultimaMensagemEm: agora,
            [`naoLidas_${destinatarioId}`]: newUnread,
            naoLidas: {
              ...(conversa?.naoLidas || {}),
              [destinatarioId]: newUnread,
            },
          }),
          { merge: true }
        );
      } catch (err) {
        console.error("Erro ao enviar mensagem na conversa:", err);
      }
    }

    if (destinatarioId) {
      pushNotification({
        title: `💬 Mensagem de ${currentUser.name}`,
        message: texto.length > 50 ? `${texto.substring(0, 50)}...` : texto || "Anexo enviado",
        type: "MESSAGE",
        category: "CHAT",
        targetUserId: destinatarioId,
        relatedId: conversaId,
      });
    }
  };

  const marcarMensagensComoLidas = async (conversaId: string): Promise<void> => {
    if (!currentUser) return;

    setConversas((prev) =>
      prev.map((c) => {
        if (c.id === conversaId) {
          return {
            ...c,
            naoLidas: {
              ...(c.naoLidas || {}),
              [currentUser.id]: 0,
            },
          };
        }
        return c;
      })
    );

    if (db) {
      try {
        await setDoc(
          doc(db, "conversas", conversaId),
          cleanForFirestore({
            [`naoLidas_${currentUser.id}`]: 0,
            naoLidas: {
              [currentUser.id]: 0,
            },
          }),
          { merge: true }
        );
      } catch (e) {
        console.error("Erro ao marcar mensagens como lidas:", e);
      }
    }
  };

  const approveFarmerFee = (farmerId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === farmerId
          ? { ...u, membershipFeePaid: true, membershipFeeStatus: "Aprovado" }
          : u
      )
    );
    if (currentUser?.id === farmerId) {
      setCurrentUser((prev) =>
        prev ? { ...prev, membershipFeePaid: true, membershipFeeStatus: "Aprovado" } : null
      );
    }
    addNotification(`Taxa de adesão (50 MT) aprovada para o agricultor ${farmerId}`);
  };

  const rejectFarmerFee = (farmerId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === farmerId ? { ...u, membershipFeeStatus: "Rejeitado" } : u
      )
    );
    addNotification(`Taxa de adesão rejeitada/pendente.`);
  };

  const verifyFarmerBiIdentity = (userId: string, approve: boolean, age?: number, reason?: string) => {
    const identifiedAge = age || 25;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          if (approve) {
            return {
              ...u,
              isVerifiedFarmer: true,
              verificationStatus: "Aprovado",
              detectedAge: identifiedAge,
              rejectionReason: undefined,
            };
          } else {
            return {
              ...u,
              isVerifiedFarmer: false,
              verificationStatus: "Recusado",
              detectedAge: identifiedAge,
              rejectionReason:
                reason || `Conta Recusada: Menor de 18 anos (Idade B.I: ${identifiedAge} anos)`,
            };
          }
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        if (approve) {
          return {
            ...prev,
            isVerifiedFarmer: true,
            verificationStatus: "Aprovado",
            detectedAge: identifiedAge,
            rejectionReason: undefined,
          };
        } else {
          return {
            ...prev,
            isVerifiedFarmer: false,
            verificationStatus: "Recusado",
            detectedAge: identifiedAge,
            rejectionReason:
              reason || `Conta Recusada: Menor de 18 anos (Idade B.I: ${identifiedAge} anos)`,
          };
        }
      });
    }

    if (approve) {
      addNotification(`✅ B.I e Idade (${identifiedAge} anos) aprovados. Badge de Agricultor Verificado concedido.`);
    } else {
      addNotification(`❌ Verificação de B.I recusada para o utilizador.`);
    }
  };

  const approveDriverAccount = (driverId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === driverId ? { ...u, isApproved: true } : u))
    );
    addNotification(`Conta de entregador aprovada!`);
  };

  const withdrawWalletFunds = (amount: number, method: PaymentMethod, phoneNumber: string): boolean => {
    if (!currentUser) return false;

    const currentWallet = getCarteira(currentUser.id);
    if (amount < LEVANTAMENTO_MINIMO || amount > currentWallet.saldoDisponivel) {
      return false;
    }

    const operadora = method === "M-Pesa" ? "mpesa" : "emola";

    // Executa a transação atómica de levantamento B2C (débito imediato + registo no Firestore + chamada B2C + reversão automática se falhar)
    solicitarLevantamento({
      userId: currentUser.id,
      valor: amount,
      numeroTelefone: phoneNumber,
      operadora,
    }).then((res) => {
      if (res.sucesso) {
        pushNotification({
          title: `💸 Levantamento B2C Iniciado (${method})`,
          message: `Transferência de ${amount} MZN enviada para +258 ${phoneNumber}. Estado: Processando.`,
          type: "ORDER",
        });
      } else {
        pushNotification({
          title: `⚠️ Falha no Levantamento ${method}`,
          message: `A operadora devolveu erro: ${res.mensagem}. O valor foi revertido para o saldo disponível.`,
          type: "SYSTEM",
        });
      }
    });

    const refCode = `LEV-${Math.floor(100000 + Math.random() * 900000)}`;

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: "SAÍDA",
      title: `Solicitação de Levantamento via ${method} (${phoneNumber})`,
      amount,
      method,
      status: "Pendente",
      reference: refCode,
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [tx, ...prev]);

    addNotification(`Solicitação de levantamento B2C de ${amount} MT registrada com sucesso (Estado: Pendente).`);
    return true;
  };

  const depositWalletFunds = (
    amount: number,
    method: PaymentMethod,
    phoneNumber: string,
    referenceNote?: string
  ): WalletTransaction => {
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    const tx: WalletTransaction = {
      id: `tx-dep-${Date.now()}`,
      userId: currentUser.id,
      type: "ENTRADA",
      title: referenceNote || `Depósito/Aporte via ${method} (${phoneNumber})`,
      amount,
      method,
      status: "Pendente", // Stored as 'Pendente' until confirmed or delivery release!
      reference: `${method === "M-Pesa" ? "MP" : "EM"}-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [tx, ...prev]);

    // Record in /transacoes_carteira (as pendente)
    syncTransacaoCarteiraToFirestore({
      userId: currentUser.id,
      tipo: "deposito",
      valor: amount,
      transacaoEncomendaId: null,
      referenciaExterna: tx.reference,
      estado: "pendente",
    });

    // Send push notification for pending mobile payment
    pushNotification({
      title: `📱 Solicitação ${method} Iniciada (Pendente)`,
      message: `Enviamos o pedido de pagamento no valor de ${amount} MT para ${phoneNumber}. O status permanecerá 'Pendente' até à confirmação.`,
      type: "ORDER",
      category: "PAGAMENTO",
      targetUserId: currentUser.id,
    });

    addNotification(`Pagamento ${method} de ${amount} MT registado com o estado "Pendente".`);
    return tx;
  };

  const confirmPendingTransaction = (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);

    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: "Pago" } : t))
    );

    if (targetTx) {
      syncCarteiraToFirestore(targetTx.userId, targetTx.amount, 0);
      syncTransacaoCarteiraToFirestore({
        userId: targetTx.userId,
        tipo: "deposito",
        valor: targetTx.amount,
        transacaoEncomendaId: null,
        referenciaExterna: targetTx.reference || txId,
        estado: "concluido",
      });
    }

    addNotification(`Transação #${txId} confirmada e creditada no saldo.`);
  };

  return (
    <AgroContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        products,
        orders,
        reviews,
        chats,
        transactions,
        carteiras,
        transacoesCarteira,
        levantamentos,
        userCarteira,
        getCarteira,
        machambas,
        receiverPhone,
        setReceiverPhone,
        loginUser,
        registerUser,
        logoutUser,
        updateUserProfile,
        toggleOnlineStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        addProductReview,
        addMachamba,
        createOrder,
        updateOrderStatus,
        assignDriverToOrder,
        proposals,
        submitDeliveryProposal,
        acceptDeliveryProposal,
        rejectDeliveryProposal,
        updateDriverLocation,
        confirmDeliveryByDriver,
        confirmReceiptByBuyer,
        releaseEscrowPayment,
        refundEscrowPayment,
        sendMessage,
        conversas,
        mensagensConversa,
        iniciarOuObterConversa,
        enviarMensagemConversa,
        marcarMensagensComoLidas,
        approveFarmerFee,
        rejectFarmerFee,
        verifyFarmerBiIdentity,
        approveDriverAccount,
        withdrawWalletFunds,
        depositWalletFunds,
        confirmPendingTransaction,
        notifications,
        appNotifications,
        unreadCount,
        addNotification,
        pushNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        activePushToast,
        dismissPushToast,
        notificationPermission,
        fcmToken,
        isFcmSupported,
        requestNotificationPermission,
        testFcmPushNotification,
      }}
    >
      {children}
    </AgroContext.Provider>
  );
};

export const useAgro = () => {
  const context = useContext(AgroContext);
  if (!context) {
    throw new Error("useAgro deve ser utilizado dentro de um AgroProvider");
  }
  return context;
};
