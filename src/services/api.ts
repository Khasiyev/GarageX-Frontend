import axios from 'axios';
import { getToken, getRefreshToken, setAuth, clearAuth } from '../lib/auth';
import type { BaseResponse } from '../types/common';
import type { AuthResponse } from '../types/auth';

const api = axios.create({
  baseURL: 'https://localhost:7236/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const res = await axios.post<BaseResponse<AuthResponse>>(
            'https://localhost:7236/api/Auth/refresh',
            { refreshToken }
          );

          if (res.data.success && res.data.data) {
            const d = res.data.data;
            setAuth(d.token, d.refreshToken, {
              userName: d.userName,
              email: d.email,
              fullName: d.fullName,
            });
            originalRequest.headers.Authorization = `Bearer ${d.token}`;
            return api(originalRequest);
          }
        } catch {
          clearAuth();
          window.location.href = '/login';
        }
      } else {
        clearAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
