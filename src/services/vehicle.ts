import api from './api';
import type { BaseResponse } from '../types/common';
import type {
  VehicleResponse,
  CreateVehicleRequest,
  UpdateVehicleRequest,
} from '../types/vehicle';

export const vehicleService = {
  getAll: () =>
    api.get<BaseResponse<VehicleResponse[]>>('/Vehicles'),

  getById: (id: number) =>
    api.get<BaseResponse<VehicleResponse>>(`/Vehicles/${id}`),

  getByCustomerId: (customerId: number) =>
    api.get<BaseResponse<VehicleResponse[]>>(`/Vehicles/customer/${customerId}`),

  create: (data: CreateVehicleRequest) =>
    api.post<BaseResponse<VehicleResponse>>('/Vehicles', data),

  update: (id: number, data: UpdateVehicleRequest) =>
    api.put<BaseResponse<VehicleResponse>>(`/Vehicles/${id}`, data),

  delete: (id: number) =>
    api.delete<BaseResponse>(`/Vehicles/${id}`),
};
