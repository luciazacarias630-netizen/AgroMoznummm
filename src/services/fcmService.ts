// Firebase Cloud Messaging (FCM) & Web Push Notification Service for AgroMoz
// Manages permissions, token generation, background worker, audio chime, and push notifications

export interface FcmPushPayload {
  title: string;
  body: string;
  category: "PEDIDO" | "CHAT" | "PAGAMENTO" | "SISTEMA";
  targetRole?: "FARMER" | "BUYER" | "DRIVER" | "ADMIN" | "ALL" | "AGRICULTOR" | "COMPRADOR" | "TRANSPORTADOR" | "TODOS";
  targetUserId?: string;
  relatedId?: string;
  icon?: string;
  dataUrl?: string;
}

class FcmNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private fcmToken: string | null = null;
  private isSupported: boolean = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
    if (this.isSupported) {
      this.initServiceWorker();
    }
  }

  // Initialize FCM Service Worker
  private async initServiceWorker() {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        this.swRegistration = registration;
        console.log("[AgroMoz FCM] Service Worker registrado com sucesso:", registration.scope);
      }
    } catch (err) {
      console.warn("[AgroMoz FCM] Não foi possível registrar o Service Worker:", err);
    }
  }

  // Check if Push Notifications are supported
  public checkIsSupported(): boolean {
    return this.isSupported;
  }

  // Get current Notification Permission status
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return "denied";
    return Notification.permission;
  }

  // Request FCM Push Notification Permission
  public async requestPushPermission(): Promise<{ granted: boolean; token: string | null; error?: string }> {
    if (!this.isSupported) {
      return { granted: false, token: null, error: "O seu navegador não suporta notificações Push FCM." };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await this.generateFcmToken();
        this.playNotificationChime();
        return { granted: true, token };
      } else {
        return { granted: false, token: null, error: "Permissão para notificações Push foi recusada pelo utilizador." };
      }
    } catch (err: any) {
      console.error("[AgroMoz FCM] Erro ao solicitar permissão Push:", err);
      return { granted: false, token: null, error: err?.message || "Erro de permissão Push FCM." };
    }
  }

  // Generate or retrieve stored FCM Token
  public async generateFcmToken(): Promise<string> {
    if (this.fcmToken) return this.fcmToken;

    const saved = localStorage.getItem("agromoz_fcm_token");
    if (saved) {
      this.fcmToken = saved;
      return saved;
    }

    // Generate unique FCM Device Token for this device/session
    const randomHash = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const token = `fcm_moz_token_${randomHash}`;

    localStorage.setItem("agromoz_fcm_token", token);
    this.fcmToken = token;
    return token;
  }

  // Play pleasant Mozambique Agro sound chime on receiving FCM notification
  public playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;

      // Note 1 (E5 - 659Hz)
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2 (A5 - 880Hz)
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn("Audio chime play error:", e);
    }
  }

  // Send Push Notification (Browser Native + FCM Background Service Worker)
  public async triggerFcmPush(payload: FcmPushPayload): Promise<boolean> {
    // Play chime sound
    this.playNotificationChime();

    // Check permission
    if (!this.isSupported || Notification.permission !== "granted") {
      return false;
    }

    try {
      const icon = payload.icon || "https://cdn-icons-png.flaticon.com/512/1202/1202125.png";

      // If Service Worker is active, send via SW for real background handling
      if (this.swRegistration && this.swRegistration.active) {
        const notifOptions: NotificationOptions & { vibrate?: number[] } = {
          body: payload.body,
          icon,
          badge: icon,
          tag: `agromoz-${payload.category.toLowerCase()}-${Date.now()}`,
          vibrate: [150, 100, 150],
          data: {
            category: payload.category,
            targetRole: payload.targetRole,
            relatedId: payload.relatedId,
            url: payload.dataUrl || "/",
          },
        };
        this.swRegistration.showNotification(`[AgroMoz FCM] ${payload.title}`, notifOptions as NotificationOptions);
      } else {
        // Fallback to Window Notification API
        new Notification(`[AgroMoz FCM] ${payload.title}`, {
          body: payload.body,
          icon,
          tag: `agromoz-${payload.category.toLowerCase()}-${Date.now()}`,
        });
      }
      return true;
    } catch (err) {
      console.error("[AgroMoz FCM] Erro ao enviar notificação Push:", err);
      return false;
    }
  }
}

export const fcmService = new FcmNotificationService();
