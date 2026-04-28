export const JOB_ORDER_STATUS_LABELS: Record<number, string> = {
  1: 'Yaradılıb',
  2: 'Davam edir',
  3: 'Tamamlanıb',
  4: 'Ləğv edilib',
};

export const JOB_ORDER_STATUS_OPTIONS = [
  { value: 1, label: 'Yaradılıb' },
  { value: 2, label: 'Davam edir' },
  { value: 3, label: 'Tamamlanıb' },
  { value: 4, label: 'Ləğv edilib' },
];

export interface JobTaskDto {
  id: number;
  serviceCatalogItemId?: number;
  title: string;
  description?: string;
  laborCost: number;
}

export interface JobPartUsageDto {
  id: number;
  partId: number;
  quantity: number;
  unitPrice: number;
  partName: string;
  partNumber: string;
}

export interface JobOrderInvoiceSummaryDto {
  invoiceId: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  issuedAt: string;
}

export interface JobOrderResponse {
  id: number;
  vehicleId: number;
  complaint: string;
  notes?: string;
  status: number;
  openedAt: string;
  closedAt?: string;
  tasks: JobTaskDto[];
  partUsages: JobPartUsageDto[];
  invoice?: JobOrderInvoiceSummaryDto;
}

export interface CreateJobOrderRequest {
  vehicleId: number;
  complaint: string;
  notes?: string;
}

export interface ChangeJobOrderStatusRequest {
  jobOrderId: number;
  newStatus: number;
  note?: string;
}

export interface AddJobTaskRequest {
  jobOrderId: number;
  serviceCatalogItemId?: number;
  title: string;
  description?: string;
  laborCost: number;
}

export interface AddJobPartUsageRequest {
  jobOrderId: number;
  partId: number;
  quantity: number;
  unitPrice: number;
}
