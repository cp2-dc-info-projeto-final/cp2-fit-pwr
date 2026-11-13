import axios, {
  type AxiosResponse,
  type AxiosError
} from 'axios';

import { removeToken } from './auth';

export interface ApiFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: ApiFieldError[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// Instância global da API.
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Adiciona automaticamente o token Bearer.
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('auth_token');

      // Não substitui um Authorization enviado especificamente
      // pela página de matrícula.
      if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Trata respostas de token inválido ou expirado.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      removeToken();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
