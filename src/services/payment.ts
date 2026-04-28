import api from './api';
import type { BaseResponse } from '../types/common';
import type { PaymentResponse, AddPaymentRequest } from '../types/payment';

export const paymentService = {
  add: (data: AddPaymentRequest) =>
    api.post<BaseResponse<PaymentResponse>>('/Payments', data),

  getByInvoiceId: (invoiceId: number) =>
    api.get<BaseResponse<PaymentResponse[]>>(`/Payments/invoice/${invoiceId}`),
};
