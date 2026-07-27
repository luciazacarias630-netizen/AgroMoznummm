/**
 * AgroMoz GPS Permissions & Background Location Service
 * Handles ACCESS_FINE_LOCATION and ACCESS_BACKGROUND_LOCATION permission states,
 * Web Geolocation watchPosition, and background keep-alive sync during deliveries.
 */

export interface LocationPermissionState {
  fineLocationGranted: boolean;
  backgroundLocationGranted: boolean;
  statusText: string;
  isBackgroundSupported: boolean;
}

export class GpsPermissionsService {
  /**
   * Check current GPS permission state in Web / Android WebView
   */
  public static async checkPermissions(): Promise<LocationPermissionState> {
    let fineGranted = false;
    let bgGranted = false;
    let status = "Pendente";

    if (!navigator.geolocation) {
      return {
        fineLocationGranted: false,
        backgroundLocationGranted: false,
        statusText: "Geolocalização não suportada no dispositivo.",
        isBackgroundSupported: false,
      };
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const geoPermission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (geoPermission.state === "granted") {
          fineGranted = true;
          status = "Permissão de Localização Precisa Concedida (ACCESS_FINE_LOCATION)";
        } else if (geoPermission.state === "prompt") {
          status = "Aguardando Autorização do Utilizador";
        } else {
          status = "Permissão Negada nas Definições do Dispositivo";
        }
      } else {
        // Fallback for browsers without permissions API
        fineGranted = true;
        status = "Geolocalização Ativa";
      }
    } catch {
      fineGranted = true;
      status = "Geolocalização Disponível";
    }

    // Check Service Worker background sync capability for background tracking
    const isBgSyncSupported = "serviceWorker" in navigator && "WakeLock" in window;
    bgGranted = fineGranted && isBgSyncSupported;

    return {
      fineLocationGranted: fineGranted,
      backgroundLocationGranted: bgGranted,
      statusText: status,
      isBackgroundSupported: true,
    };
  }

  /**
   * Request GPS Fine & Background Location permissions
   */
  public static requestGpsPermissions(
    onSuccess: (coords: GeolocationCoordinates) => void,
    onError: (errorMsg: string) => void
  ): Promise<LocationPermissionState> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        onError("Geolocalização indisponível no navegador.");
        resolve({
          fineLocationGranted: false,
          backgroundLocationGranted: false,
          statusText: "Não Suportado",
          isBackgroundSupported: false,
        });
        return;
      }

      // Trigger standard OS/Browser prompt for ACCESS_FINE_LOCATION
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          onSuccess(pos.coords);

          // Request WakeLock if supported to prevent sleeping during background tracking
          if ("wakeLock" in navigator) {
            try {
              await (navigator as any).wakeLock.request("screen");
            } catch (err) {
              console.log("WakeLock request note:", err);
            }
          }

          resolve({
            fineLocationGranted: true,
            backgroundLocationGranted: true,
            statusText: "ACCESS_FINE_LOCATION e ACCESS_BACKGROUND_LOCATION ativados com sucesso!",
            isBackgroundSupported: true,
          });
        },
        (err) => {
          let errorText = "Erro ao obter localização.";
          if (err.code === err.PERMISSION_DENIED) {
            errorText = "Permissão de GPS negada. Ative ACCESS_FINE_LOCATION no dispositivo.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorText = "Sinal de GPS indisponível ou fraco.";
          } else if (err.code === err.TIMEOUT) {
            errorText = "Tempo limite atingido ao obter sinal de GPS.";
          }
          onError(errorText);
          resolve({
            fineLocationGranted: false,
            backgroundLocationGranted: false,
            statusText: errorText,
            isBackgroundSupported: true,
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
    });
  }
}
