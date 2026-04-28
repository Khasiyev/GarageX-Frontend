export interface InvoiceResponse {
  id: number;
  jobOrderId: number;
  totalAmount: number;
  status: string;
  issuedAt: string;
}

export interface CreateInvoiceRequest {
  jobOrderId: number;
}
