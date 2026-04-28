import api from './api';
import type { BaseResponse } from '../types/common';
import type {
  StockMovementResponse,
  ReceiveStockRequest,
  AdjustStockRequest,
  IssueStockRequest,
} from '../types/inventory';

export const inventoryService = {
  receiveStock: (data: ReceiveStockRequest) =>
    api.post<BaseResponse>('/Inventory/receive', data),

  adjustStock: (data: AdjustStockRequest) =>
    api.post<BaseResponse>('/Inventory/adjust', data),

  issueStock: (data: IssueStockRequest) =>
    api.post<BaseResponse>('/Inventory/issue', data),

  getMovements: (partId: number) =>
    api.get<BaseResponse<StockMovementResponse[]>>(`/Inventory/parts/${partId}/movements`),
};
