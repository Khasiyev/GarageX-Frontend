import api from './api';
import type { BaseResponse } from '../types/common';
import type {
  CustomerResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '../types/customer';

export const customerService = {
  getAll: () =>
    api.get<BaseResponse<CustomerResponse[]>>('/Customers'),

  getById: (id: number) =>
    api.get<BaseResponse<CustomerResponse>>(`/Customers/${id}`),

  create: (data: CreateCustomerRequest) =>
    api.post<BaseResponse<CustomerResponse>>('/Customers', data),

  update: (id: number, data: UpdateCustomerRequest) =>
    api.put<BaseResponse<CustomerResponse>>(`/Customers/${id}`, data),

  delete: (id: number) =>
    api.delete<BaseResponse>(`/Customers/${id}`),
};
