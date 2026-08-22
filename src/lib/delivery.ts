export const FREE_DELIVERY_THRESHOLD_USD = 50;

export const DELIVERY_FEES = {
  express_beirut: 3,
  standard: 2,
  diaspora_air: 25,
} as const;

export function deliveryFeeUSD(speed: keyof typeof DELIVERY_FEES | string, subtotalUSD: number): number {
  if (speed === 'diaspora_air') return DELIVERY_FEES.diaspora_air;
  return subtotalUSD >= FREE_DELIVERY_THRESHOLD_USD ? 0 : (DELIVERY_FEES[speed as keyof typeof DELIVERY_FEES] ?? 2);
}
