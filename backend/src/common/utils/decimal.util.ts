export interface LineItemCalculationInput {
  quantity: number | string;
  unitPrice: number | string;
  discountRate?: number | string; // percentage 0-100
  taxRate?: number | string; // percentage 0-100
}

export interface InvoiceTotalsCalculationInput {
  items: LineItemCalculationInput[];
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number | string;
  shippingAmount?: number | string;
  paidAmount?: number | string;
}

export function toFixed2(val: number | string): number {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateLineItem(item: LineItemCalculationInput) {
  const qty = Math.max(0, parseFloat(String(item.quantity || 0)) || 0);
  const price = Math.max(0, parseFloat(String(item.unitPrice || 0)) || 0);
  const discountRate = Math.max(0, Math.min(100, parseFloat(String(item.discountRate || 0)) || 0));
  const taxRate = Math.max(0, parseFloat(String(item.taxRate || 0)) || 0);

  const rawBase = qty * price;
  const itemDiscount = rawBase * (discountRate / 100);
  const afterDiscount = Math.max(0, rawBase - itemDiscount);
  const itemTax = afterDiscount * (taxRate / 100);
  const lineTotal = toFixed2(afterDiscount + itemTax);

  return {
    quantity: toFixed2(qty),
    unitPrice: toFixed2(price),
    discountRate: toFixed2(discountRate),
    taxRate: toFixed2(taxRate),
    discountAmount: toFixed2(itemDiscount),
    taxAmount: toFixed2(itemTax),
    baseAmount: toFixed2(rawBase),
    lineTotal,
  };
}

export function calculateInvoiceTotals(input: InvoiceTotalsCalculationInput) {
  let subtotal = 0;
  let totalItemTax = 0;
  let totalItemDiscount = 0;

  const calculatedItems = (input.items || []).map((item) => {
    const calc = calculateLineItem(item);
    subtotal += calc.baseAmount;
    totalItemTax += calc.taxAmount;
    totalItemDiscount += calc.discountAmount;
    return calc;
  });

  subtotal = toFixed2(subtotal);

  // Invoice-level discount
  let invoiceDiscount = 0;
  const discVal = Math.max(0, parseFloat(String(input.discountValue || 0)) || 0);
  if (input.discountType === 'FIXED') {
    invoiceDiscount = Math.min(subtotal, discVal);
  } else {
    // PERCENTAGE
    const pct = Math.min(100, discVal);
    invoiceDiscount = subtotal * (pct / 100);
  }
  invoiceDiscount = toFixed2(invoiceDiscount);

  const shipping = toFixed2(Math.max(0, parseFloat(String(input.shippingAmount || 0)) || 0));
  const taxAmount = toFixed2(totalItemTax);

  // Grand total = subtotal - invoiceDiscount - totalItemDiscount + taxAmount + shipping
  // Note: if line items already subtracted item discounts:
  const taxableBase = Math.max(0, subtotal - invoiceDiscount - totalItemDiscount);
  const grandTotal = toFixed2(taxableBase + taxAmount + shipping);

  const paid = toFixed2(Math.max(0, parseFloat(String(input.paidAmount || 0)) || 0));
  const outstandingBalance = toFixed2(Math.max(0, grandTotal - paid));

  return {
    subtotal,
    itemDiscountAmount: toFixed2(totalItemDiscount),
    discountAmount: invoiceDiscount,
    taxAmount,
    shippingAmount: shipping,
    totalAmount: grandTotal,
    paidAmount: paid,
    outstandingBalance,
    calculatedItems,
  };
}

