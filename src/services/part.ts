import api from './api';
import type { BaseResponse } from '../types/common';
import type { PartResponse } from '../types/part';

export interface CreatePartRequest {
  name: string;
  partNumber: string;
  unitPrice: number;
}

export const partService = {
  getAll: () =>
    api.get<BaseResponse<PartResponse[]>>('/Parts'),
  create: (data: CreatePartRequest) =>
    api.post<BaseResponse<PartResponse>>('/Parts', data),
};
