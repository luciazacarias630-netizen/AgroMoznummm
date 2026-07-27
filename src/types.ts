export type UserRole = "FARMER" | "BUYER" | "DRIVER" | "ADMIN";

export type StockStatus = "Disponibile" | "Pouca quantidade" | "Esgotado";

export type DeliveryStatus =
  | "Pedido recebido"
  | "Preparando encomenda"
  | "Entregador a caminho"
  | "Entregue"
  | "Cancelado";

export type PaymentMethod = "M-Pesa" | "e-Mola";

export type TransactionStatus = "Pendente" | "Pago" | "Cancelado" | "Reembolsado";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  password?: string;
  photoUrl: string;
  province: string;
  district: string;
  address?: string;
  localidade?: string;
  online: boolean;
  lastSeen?: string;
  rating?: number;
  totalRatings?: number;
  isApproved: boolean; // For drivers / admins
  membershipFeePaid?: boolean; // For Farmers (50 MT)
  membershipFeeStatus?: "Pendente" | "Aprovado" | "Rejeitado";

  // Farmer specific fields
  farmName?: string;
  farmArea?: string; // e.g. "2 Hectares"
  cropsGrown?: string[];
  bio?: string;

  // Driver specific fields
  vehicleType?: "Motorizada" | "Carrinha" | "Camioneta" | "Bicicleta";
  licensePlate?: string;

  // FCM Push Notification settings
  fcmToken?: string;
  pushEnabled?: boolean;
}

export interface Machamba {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  name: string;
  province: string;
  district: string;
  localidade: string;
  areaSize: string;
  productionTypes: string[];
  images: string[];
  lat: number;
  lng: number;
  status: "Ativa" | "Pendente" | "Inativa";
  farmerOnline: boolean;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerPhoto: string;
  farmerOnline: boolean;
  farmerRating: number;
  name: string;
  category: "Cereais" | "Hortaliças" | "Frutas" | "Tubérculos" | "Leguminosas" | "Animais/Aves" | "Outros";
  description: string;
  pricePerUnit: number; // Final price shown to consumer in MZN / MT (basePrice + agroMozMargin)
  basePricePerUnit?: number; // Base price set by farmer e.g. 300 MT
  agroMozMargin?: number; // 3% AgroMoz platform margin e.g. 9 MT
  termsAccepted?: boolean;
  unit: string; // kg, saco (50kg), caixa, ton, duzia, etc.
  availableQuantity: number;
  status: StockStatus;
  images: string[];
  province: string;
  district: string;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerProvince: string;
  buyerDistrict: string;
  buyerLocation?: { lat: number; lng: number };

  farmerId: string;
  farmerName: string;
  farmerPhone: string;

  driverId?: string;
  driverName?: string;
  driverPhone?: string;

  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unit: string;
  subtotal: number; // Raw product sale total e.g. 4000 MT
  platformFee: number; // AgroMoz 5% commission e.g. 200 MT
  farmerNetAmount: number; // Net release to farmer e.g. 3800 MT
  totalAmount: number; // subtotal + deliveryFee
  deliveryFee: number;

  paymentMethod: PaymentMethod;
  paymentStatus: TransactionStatus;
  escrowStatus: "Pendente" | "Liberado" | "Cancelado" | "Reembolsado";
  paymentTxId?: string;
  releasedAt?: string;
  refundReason?: string;

  deliveryStatus: DeliveryStatus;
  deliveryAddressReference?: string;
  driverCurrentLocation?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  status: "Enviada" | "Recebida" | "Visualizada";
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "ENTRADA" | "SAÍDA";
  title: string;
  amount: number;
  feeAmount?: number;
  escrowOrderId?: string;
  method: PaymentMethod;
  status: TransactionStatus;
  reference: string;
  timestamp: string;
}

export interface PlantDiagnosisResult {
  plantName: string;
  diseaseName: string;
  confidenceScore: number;
  symptoms: string[];
  causes: string;
  organicTreatment: string;
  chemicalTreatment?: string;
  preventiveMeasures: string[];
  summary: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Target user or "ALL"
  title: string;
  message: string;
  type: "ORDER" | "MESSAGE" | "SYSTEM";
  category?: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA";
  targetRole?: "FARMER" | "BUYER" | "DRIVER" | "ADMIN" | "ALL";
  relatedId?: string; // orderId or senderId
  read: boolean;
  createdAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface WeatherInfo {
  province: string;
  temp: number;
  condition: string;
  humidity: number;
  rainChance: number;
  icon: string;
}
