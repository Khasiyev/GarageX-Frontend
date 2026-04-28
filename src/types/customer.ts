export interface CustomerResponse {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phoneNumber: string;
  email?: string;
}

export interface UpdateCustomerRequest {
  fullName: string;
  phoneNumber: string;
  email?: string;
}
