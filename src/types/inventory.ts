export interface StockMovementResponse {
  id: number;
  partId: number;
  quantity: number;
  movementType: number;
  note?: string;
  createdAt: string;
}

export interface ReceiveStockRequest {
  partId: number;
  quantity: number;
  note?: string;
}

export interface AdjustStockRequest {
  partId: number;
  quantity: number;
  reason: string;
}

export interface IssueStockRequest {
  partId: number;
  quantity: number;
  reason: string;
}

export const MOVEMENT_TYPE_LABELS: Record<number, string> = {
  1: 'Giriş',
  2: 'Çıxış',
  3: 'Düzəliş',
};
