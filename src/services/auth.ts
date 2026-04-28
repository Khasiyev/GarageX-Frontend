import api from './api';
import type { BaseResponse } from '../types/common';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth';

export const authService = {
  login: async (data: LoginRequest) => {
    const res = await api.post<BaseResponse<AuthResponse>>('/Auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest) => {
    const res = await api.post<BaseResponse<string>>('/Auth/register', data);
    return res.data;
  },

  refresh: async (data: RefreshTokenRequest) => {
    const res = await api.post<BaseResponse<AuthResponse>>('/Auth/refresh', data);
    return res.data;
  },

  logout: async (data: RefreshTokenRequest) => {
    const res = await api.post<BaseResponse<string>>('/Auth/logout', data);
    return res.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const res = await api.post<BaseResponse<string>>('/Auth/forgot-password', data);
    return res.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const res = await api.post<BaseResponse<string>>('/Auth/reset-password', data);
    return res.data;
  },

  // 🔥 ƏSAS FIX BURADIR
  confirmEmail: async (userId: string, token: string) => {
    const res = await api.get<BaseResponse<string>>('/Auth/confirm-email', {
      params: { userId, token },
    });
    return res.data;
  },
};