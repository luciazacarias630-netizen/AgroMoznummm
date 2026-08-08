import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueLocations";
import { Order, Machamba } from "../types";

export interface RouteCoordinates {
  driver: { lat: number; lng: number };
  machamba: { lat: number; lng: number };
  buyer: { lat: number; lng: number };
}

// Default fallback coordinates in Mozambique
const DEFAULT_DRIVER_COORDS = { lat: -25.8605, lng: 32.6102 }; // Matola/Maputo Driver Base
const DEFAULT_MACHAMBA_COORDS = { lat: -25.7333, lng: 32.6833 }; // Marracuene Machamba
const DEFAULT_BUYER_COORDS = { lat: -25.9655, lng: 32.5832 }; // Maputo City Center

/**
 * Searches MOZAMBIQUE_PROVINCES for latitude & longitude based on province name and district name.
 */
export function lookupCoordinatesByProvinceDistrict(
  provinceName?: string,
  districtName?: string
): { lat: number; lng: number } | null {
  if (!provinceName) return null;

  const provClean = provinceName.trim().toLowerCase();
  const prov = MOZAMBIQUE_PROVINCES.find(
    (p) => p.name.toLowerCase() === provClean || provClean.includes(p.name.toLowerCase())
  );

  if (prov) {
    if (districtName) {
      const distClean = districtName.trim().toLowerCase();
      const dist = prov.districts.find(
        (d) => d.name.toLowerCase() === distClean || distClean.includes(d.name.toLowerCase())
      );
      if (dist) {
        return { lat: dist.lat, lng: dist.lng };
      }
    }
    return { lat: prov.lat, lng: prov.lng };
  }

  return null;
}

/**
 * Resolves the 3-stop unified route coordinates for an order:
 * 1. Driver current location (Point 0)
 * 2. Farmer Machamba location (Point 1 - Pickup)
 * 3. Buyer Domicile location (Point 2 - Delivery)
 */
export function resolveOrderRouteCoordinates(
  order: Order,
  machambas: Machamba[] = []
): RouteCoordinates {
  // 1. Resolve Driver Location
  const driverLoc = order.driverCurrentLocation || DEFAULT_DRIVER_COORDS;

  // 2. Resolve Machamba (Farmer Pickup) Location
  let machambaLoc: { lat: number; lng: number } | null = null;

  // First try finding matching Machamba from context
  const foundMachamba = machambas.find(
    (m) =>
      (m.farmerId && m.farmerId === order.farmerId) ||
      (m.farmerName && m.farmerName.toLowerCase() === order.farmerName.toLowerCase())
  );

  if (foundMachamba && foundMachamba.lat && foundMachamba.lng) {
    machambaLoc = { lat: foundMachamba.lat, lng: foundMachamba.lng };
  } else {
    // Lookup by farmer province / district or order details
    machambaLoc = lookupCoordinatesByProvinceDistrict(
      order.buyerProvince, // Fallback search
      order.buyerDistrict
    );
  }

  // If still missing, check standard default machamba with slight jitter based on farmer name string
  if (!machambaLoc || (machambaLoc.lat === 0 && machambaLoc.lng === 0)) {
    const jitter = (order.farmerName.length % 5) * 0.015;
    machambaLoc = {
      lat: DEFAULT_MACHAMBA_COORDS.lat - jitter,
      lng: DEFAULT_MACHAMBA_COORDS.lng + jitter,
    };
  }

  // 3. Resolve Buyer (Delivery) Location
  let buyerLoc: { lat: number; lng: number } | null = null;

  if (order.buyerLocation && order.buyerLocation.lat && order.buyerLocation.lng) {
    buyerLoc = order.buyerLocation;
  } else if (order.destinoEntrega && order.destinoEntrega.lat && order.destinoEntrega.lng) {
    buyerLoc = { lat: order.destinoEntrega.lat, lng: order.destinoEntrega.lng };
  } else {
    buyerLoc = lookupCoordinatesByProvinceDistrict(
      order.buyerProvince,
      order.buyerDistrict
    );
  }

  if (!buyerLoc || (buyerLoc.lat === 0 && buyerLoc.lng === 0)) {
    const jitter = (order.buyerName.length % 5) * 0.012;
    buyerLoc = {
      lat: DEFAULT_BUYER_COORDS.lat + jitter,
      lng: DEFAULT_BUYER_COORDS.lng - jitter,
    };
  }

  return {
    driver: driverLoc,
    machamba: machambaLoc,
    buyer: buyerLoc,
  };
}

/**
 * Calculates distance in KM between two lat/lng points using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
