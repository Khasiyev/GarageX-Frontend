export interface VehicleResponse {
  id: number;
  customerId: number;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
}

export interface CreateVehicleRequest {
  customerId: number;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
}

export interface UpdateVehicleRequest {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
}
