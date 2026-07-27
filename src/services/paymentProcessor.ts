/**
 * AgroMoz PaymentProcessor Service
 * Automated Payment Processing for M-Pesa & e-Mola APIs in Mozambique
 * Handles C2B payment initiation, status tracking ('Pendente' -> 'Confirmado'),
 * Escrow lock holding, and automatic net amount payout (95%) to farmers upon delivery.
 */

import { PaymentMethod, Order, WalletTransaction, TransactionStatus } from "../types";

export interface MobilePaymentRequest {
  amount: number;
  phoneNumber: string;
  method: PaymentMethod; // 'M-Pesa' | 'e-Mola'
  buyerId: string;
  orderId?: string;
  referenceNote?: string;
}

export interface MobilePaymentResult {
  success: boolean;
  transactionId: string;
  reference: string;
  status: TransactionStatus; // 'Pendente' or 'Pago'
  message: string;
  operatorResponseCode: string;
  timestamp: string;
}

export class PaymentProcessor {
  /**
   * Validate Mozambique Mobile Phone Number for M-Pesa and e-Mola
   */
  public static validatePhoneNumber(phone: string, method: PaymentMethod): { valid: boolean; message?: string } {
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Check basic length (8 or 9 digits or +258 prefix)
    const normalized = cleanPhone.length === 12 && cleanPhone.startsWith("258") 
      ? cleanPhone.substring(3) 
      : cleanPhone;

    if (normalized.length !== 9) {
      return { valid: false, message: "O número deve conter 9 dígitos (ex: 841234567 ou 861234567)." };
    }

    if (method === "M-Pesa") {
      if (!normalized.startsWith("84") && !normalized.startsWith("85")) {
        return { valid: false, message: "Número M-Pesa inválido. Os prefixos Vodacom válidos são 84 ou 85." };
      }
    } else if (method === "e-Mola") {
      if (!normalized.startsWith("86") && !normalized.startsWith("87")) {
        return { valid: false, message: "Número e-Mola inválido. Os prefixos Movitel válidos são 86 ou 87." };
      }
    }

    return { valid: true };
  }

  /**
   * Initiate Automated C2B Mobile Payment via M-Pesa / e-Mola API
   * Creates a transaction record stored as 'Pendente' until order delivery or webhooks
   */
  public static async processMobilePayment(
    req: MobilePaymentRequest
  ): Promise<MobilePaymentResult> {
    const phoneCheck = this.validatePhoneNumber(req.phoneNumber, req.method);
    if (!phoneCheck.valid) {
      return {
        success: false,
        transactionId: "",
        reference: "",
        status: "Cancelado",
        message: phoneCheck.message || "Número de telefone inválido.",
        operatorResponseCode: "INS-1",
        timestamp: new Date().toISOString(),
      };
    }

    // Simulate M-Pesa API / e-Mola C2B OpenAPI STK Push Request
    const prefix = req.method === "M-Pesa" ? "MP" : "EM";
    const refCode = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `tx-${req.method.toLowerCase()}-${Date.now()}`;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: txId,
          reference: refCode,
          status: "Pendente", // Stored as 'Pendente' in DB until delivery confirmation!
          message: `Solicitação ${req.method} C2B enviada para +258 ${req.phoneNumber}. Estado: Pendente em Custódia Escrow.`,
          operatorResponseCode: "INS-0",
          timestamp: new Date().toISOString(),
        });
      }, 1000);
    });
  }

  /**
   * Automated Escrow Release on Delivery
   * Deducts AgroMoz 5% commission fee and credits 95% net amount to the farmer's wallet
   */
  public static processEscrowPayoutToFarmer(
    order: Order,
    updateTxStatus: (txId: string, status: TransactionStatus) => void
  ): { farmerPayoutAmount: number; platformCommission: number; farmerTx: WalletTransaction } {
    const platformCommission = Math.round(order.subtotal * 0.05);
    const farmerPayoutAmount = order.subtotal - platformCommission;

    if (order.paymentTxId) {
      updateTxStatus(order.paymentTxId, "Pago");
    }

    const farmerTx: WalletTransaction = {
      id: `tx-payout-${Date.now()}`,
      userId: order.farmerId,
      type: "ENTRADA",
      title: `Pagamento Libertado da Custódia: ${order.productName}`,
      amount: farmerPayoutAmount,
      feeAmount: platformCommission,
      escrowOrderId: order.id,
      method: order.paymentMethod,
      status: "Pago",
      reference: order.paymentTxId || `PAY-${order.id}`,
      timestamp: new Date().toISOString(),
    };

    return {
      farmerPayoutAmount,
      platformCommission,
      farmerTx,
    };
  }
}
