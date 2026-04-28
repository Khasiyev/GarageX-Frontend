export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  1: 'Nağd',
  2: 'Kart',
  3: 'Bank köçürməsi',
};

export interface PaymentResponse {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: number;
  status: string;
  paidAt: string;
}

export interface AddPaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: number;
}
