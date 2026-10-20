import type { Guitar } from '../types';

export function lineQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return quantity;
}

/** Insured amount for one line: high figure, else low, else the first number in the text. */
export function insuranceUnit(item: Pick<Guitar, 'insuranceHigh' | 'insuranceLow' | 'insuranceValue'>): number | null {
  if (item.insuranceHigh !== null && item.insuranceHigh !== undefined) return item.insuranceHigh;
  if (item.insuranceLow !== null && item.insuranceLow !== undefined) return item.insuranceLow;
  const match = item.insuranceValue.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

export interface CollectionTotals {
  count: number;
  insuranceValue: number;
  forSaleListValue: number;
}

export function collectionTotals(items: readonly Guitar[]): CollectionTotals {
  let insuranceValue = 0;
  let forSaleListValue = 0;
  for (const item of items) {
    const qty = lineQuantity(item.quantity);
    const insured = insuranceUnit(item);
    if (insured !== null) insuranceValue += insured * qty;
    if (item.status === 'for_sale' && item.listPrice !== null) {
      forSaleListValue += item.listPrice * qty;
    }
  }
  return {
    count: items.length,
    insuranceValue,
    forSaleListValue,
  };
}
