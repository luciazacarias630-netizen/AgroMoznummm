import { db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export interface CrashReport {
  id: string;
  timestamp: string;
  severity: "fatal" | "error" | "warning" | "info";
  context: string; // e.g., 'AUTH_LOGIN', 'AUTH_REGISTER', 'PRODUCT_PUBLISH', 'ORDER_CREATE'
  errorMessage: string;
  errorStack?: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    online: boolean;
  };
  customKeys: Record<string, any>;
  resolved: boolean;
}

class CrashlyticsService {
  private userId: string | null = null;
  private userRole: string | null = null;
  private userEmail: string | null = null;
  private customKeys: Record<string, any> = {};
  private isInitialized = false;

  constructor() {
    this.initGlobalListeners();
  }

  /**
   * Initialize global error listeners for unhandled exceptions and promise rejections
   */
  private initGlobalListeners() {
    if (typeof window === "undefined" || this.isInitialized) return;
    this.isInitialized = true;

    // Unhandled JS Errors
    window.addEventListener("error", (event) => {
      this.recordError(
        event.error || event.message,
        "fatal",
        "GLOBAL_UNHANDLED_ERROR",
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });

    // Unhandled Promise Rejections
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const reasonStr = String(reason?.message || reason || "");

      // Ignore benign browser, dev server, network, or audio gesture rejections
      if (
        !reason ||
        reasonStr.includes("WebSocket") ||
        reasonStr.includes("ResizeObserver") ||
        reasonStr.includes("user gesture") ||
        reasonStr.includes("not allowed to play") ||
        reasonStr.includes("Canceled") ||
        reasonStr.includes("cancelled") ||
        reasonStr.includes("aborted")
      ) {
        return;
      }

      const message =
        reason instanceof Error ? reason.message : String(reason || "Unhandled Promise Rejection");
      const stack = reason instanceof Error ? reason.stack : undefined;

      this.recordError(
        message,
        "error",
        "UNHANDLED_PROMISE_REJECTION",
        { stack }
      );
    });

    console.log("🛡️ Firebase Crashlytics Service initialized for AgroMoz");
  }

  /**
   * Set user identification for crash context
   */
  public setUserIdentifier(userId: string | null, role?: string, email?: string) {
    this.userId = userId;
    this.userRole = role || null;
    this.userEmail = email || null;
  }

  /**
   * Set custom key-value metadata to attach to subsequent crash logs
   */
  public setCustomKey(key: string, value: any) {
    this.customKeys[key] = value;
  }

  /**
   * Clear all custom keys
   */
  public clearCustomKeys() {
    this.customKeys = {};
  }

  /**
   * Get device and environment metrics
   */
  private getDeviceInfo() {
    if (typeof window === "undefined") {
      return {
        userAgent: "Server/Unknown",
        platform: "Unknown",
        language: "pt-MZ",
        screenResolution: "N/A",
        online: true,
      };
    }

    return {
      userAgent: navigator.userAgent || "Unknown",
      platform: navigator.platform || "Unknown",
      language: navigator.language || "pt-MZ",
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
    };
  }

  /**
   * Core error reporting function - logs locally and sends to Firestore real-time crash database
   */
  public async recordError(
    error: Error | string | any,
    severity: "fatal" | "error" | "warning" | "info" = "error",
    context: string = "GENERAL_ERROR",
    extraData: Record<string, any> = {}
  ): Promise<CrashReport> {
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message || error?.toString() || "Unknown Error";

    const errorStack = error instanceof Error ? error.stack : extraData?.stack;

    const crashId = `crash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const crashReport: CrashReport = {
      id: crashId,
      timestamp: new Date().toISOString(),
      severity,
      context,
      errorMessage,
      errorStack,
      userId: this.userId || undefined,
      userRole: this.userRole || undefined,
      userEmail: this.userEmail || undefined,
      deviceInfo: this.getDeviceInfo(),
      customKeys: {
        ...this.customKeys,
        ...extraData,
      },
      resolved: false,
    };

    // Print styled log to developer console
    if (severity === "fatal" || severity === "error") {
      console.error(
        `🚨 [Crashlytics - ${severity.toUpperCase()}] [${context}]`,
        errorMessage,
        crashReport
      );
    } else {
      console.warn(
        `🚨 [Crashlytics - ${severity.toUpperCase()}] [${context}]`,
        errorMessage,
        crashReport
      );
    }

    // Save real-time crash report to Firestore if connected
    if (db) {
      try {
        await setDoc(doc(db, "crash_reports", crashId), crashReport);
      } catch (firestoreErr) {
        console.warn("Could not push crash report to Firestore:", firestoreErr);
      }
    }

    return crashReport;
  }

  /**
   * Helper specifically for Authentication errors (Login, Register, Password Reset, Profile Update)
   */
  public logAuthError(
    error: any,
    action: "login" | "register" | "logout" | "update_profile" | "token_verify",
    metadata: Record<string, any> = {}
  ) {
    return this.recordError(
      error,
      "warning",
      `AUTH_${action.toUpperCase()}`,
      {
        feature: "AUTHENTICATION",
        action,
        ...metadata,
      }
    );
  }

  /**
   * Helper specifically for Product Publishing & Inventory Management errors
   */
  public logProductError(
    error: any,
    action: "publish" | "update" | "delete" | "image_upload" | "price_calc",
    metadata: Record<string, any> = {}
  ) {
    return this.recordError(
      error,
      "error",
      `PRODUCT_${action.toUpperCase()}`,
      {
        feature: "MARKETPLACE_PRODUCTS",
        action,
        ...metadata,
      }
    );
  }

  /**
   * Helper specifically for Order & M-Pesa / E-Mola Payment Processing errors
   */
  public logOrderError(
    error: any,
    action: "create" | "payment" | "status_update",
    metadata: Record<string, any> = {}
  ) {
    return this.recordError(
      error,
      "fatal",
      `ORDER_${action.toUpperCase()}`,
      {
        feature: "ORDERS_PAYMENTS",
        action,
        ...metadata,
      }
    );
  }
}

export const crashlytics = new CrashlyticsService();
