import { storage } from './storage';

const getApiUrl = () => {
  // EXPO_PUBLIC_API_URL should be the BASE domain only, e.g. https://2.24.108.68.nip.io
  // The request() method below adds /api prefix automatically
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Auto-detect production: same origin, backend lives at /api/
    return window.location.origin;
  }
  
  return 'http://localhost:4000';
};

const API_URL = getApiUrl();

class ApiService {
  private token: string | null = null;

  async init() {
    this.token = await storage.getItem('token');
  }

  async setToken(token: string) {
    this.token = token;
    await storage.setItem('token', token);
  }

  async clearToken() {
    this.token = null;
    await storage.removeItem('token');
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${API_URL}/api${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`[API] Request: ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`[API] Response Status: ${response.status} for ${path}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error(`[API] Error Response:`, error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API] Data received for ${path}`);
      return data;
    } catch (error: any) {
      console.error(`[API] Fetch Error for ${path}:`, error.message);
      if (error.message === 'Network request failed') {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; companyName: string; cnpj: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // CRUD genérico
  async getAll(resource: string) {
    return this.request(`/${resource}`);
  }

  async create(resource: string, data: any) {
    return this.request(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(resource: string, id: string, data: any) {
    return this.request(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async remove(resource: string, id: string) {
    return this.request(`/${resource}/${id}`, {
      method: 'DELETE',
    });
  }

  // Específicos
  async getFinanceSummary() {
    return this.request('/finance/summary');
  }

  async getScheduleByDate(date: string) {
    return this.request(`/schedules/date/${date}`);
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiService();
