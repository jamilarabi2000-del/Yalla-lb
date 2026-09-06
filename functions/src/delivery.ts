export const FREE_DELIVERY_THRESHOLD_USD = 50;

export const DELIVERY_FEES = {
  express_beirut: 3,
  standard: 2,
  diaspora_air: 28,
} as const;

export function computeDelivery(speed: string = 'standard', governorate?: string, netSubtotalUSD: number = 0): number {
  const isDiaspora = governorate === 'diaspora_global' || speed === 'diaspora_air' || speed === 'diaspora_global';
  if (isDiaspora) {
    return DELIVERY_FEES.diaspora_air;
  }

  // Free delivery threshold for all domestic Lebanese governorates
  if (netSubtotalUSD >= FREE_DELIVERY_THRESHOLD_USD) {
    return 0;
  }

  if (speed === 'express_beirut') {
    return DELIVERY_FEES.express_beirut;
  }

  return DELIVERY_FEES.standard;
}
