import api from './api';
import type { BaseResponse } from '../types/common';
import type {
  JobOrderResponse,
  CreateJobOrderRequest,
  AddJobTaskRequest,
  AddJobPartUsageRequest,
} from '../types/jobOrder';

export interface GetJobOrdersQuery {
  vehicleId?: number;
  status?: number;
}

export interface JobOrderAttachment {
  id: number;
  fileName: string;
  contentType: string;
  createdAt?: string;
}

export const jobOrderService = {
  getAll: (params: GetJobOrdersQuery) =>
    api.get<BaseResponse<JobOrderResponse[]>>('/JobOrders', { params }),

  getById: (id: number) =>
    api.get<BaseResponse<JobOrderResponse>>(`/JobOrders/${id}`),

  getByVehicleId: (vehicleId: number) =>
    api.get<BaseResponse<JobOrderResponse[]>>(`/JobOrders/by-vehicle/${vehicleId}`),

  create: (data: CreateJobOrderRequest) =>
    api.post<BaseResponse<JobOrderResponse>>('/JobOrders', data),

  addTask: (jobOrderId: number, data: Omit<AddJobTaskRequest, 'jobOrderId'>) =>
  api.post<BaseResponse>(`/JobOrders/${jobOrderId}/tasks`, {
    jobOrderId,
    ...data,
  }),

  addPartUsage: (jobOrderId: number, data: Omit<AddJobPartUsageRequest, 'jobOrderId'>) =>
  api.post<BaseResponse>(`/JobOrders/${jobOrderId}/part-usages`, {
    jobOrderId,
    ...data,
  }),

  changeStatus: (jobOrderId: number, data: { newStatus: number; note?: string }) =>
  api.patch<BaseResponse>(`/JobOrders/${jobOrderId}/status`, {
    jobOrderId,
    ...data,
  }),

  // ── Attachments ────────────────────────────────────────────────────────────
  getAttachments: (jobOrderId: number) =>
    api.get<BaseResponse<JobOrderAttachment[]>>(`/JobOrders/${jobOrderId}/attachments`),

  uploadAttachment: (jobOrderId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<BaseResponse>(`/JobOrders/${jobOrderId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadMultipleAttachments: (jobOrderId: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post<BaseResponse>(`/JobOrders/${jobOrderId}/attachments/multiple`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getAttachmentDownloadUrl: (attachmentId: number) =>
    api.get<BaseResponse<string>>(`/JobOrders/attachments/${attachmentId}/download-url`),

  deleteAttachment: (attachmentId: number) =>
    api.delete<BaseResponse>(`/JobOrders/attachments/${attachmentId}`),
};
