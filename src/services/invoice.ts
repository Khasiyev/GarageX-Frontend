import api from './api';
import type { BaseResponse } from '../types/common';
import type { InvoiceResponse, CreateInvoiceRequest } from '../types/invoice';

export const invoiceService = {
  create: (data: CreateInvoiceRequest) =>
    api.post<BaseResponse<InvoiceResponse>>('/Invoices', data),

  getById: (id: number) =>
    api.get<BaseResponse<InvoiceResponse>>(`/Invoices/${id}`),

  getByJobOrderId: (jobOrderId: number) =>
    api.get<BaseResponse<InvoiceResponse>>(`/Invoices/job-order/${jobOrderId}`),
};
