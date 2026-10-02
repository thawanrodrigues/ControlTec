import { storage } from './storage';

const getApiUrl = () => {
  // 1. Variável de ambiente definida explicitamente → usa ela
  //    ATENÇÃO: não deve terminar com /api (o método request() já adiciona /api)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }

  // 2. No browser (PWA) → usa a mesma origem da página
  //    O Nginx faz proxy de /api/ → backend, então não precisa incluir /api aqui
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    const portPart = port ? `:${port}` : '';
    // Em desenvolvimento local → aponta direto para a porta do backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:4000`;
    }
    // Em produção → usa a origem pura (sem /api)
    return `${protocol}//${hostname}${portPart}`;
  }

  // 3. Fallback para dev nativo (Expo Go)
  return 'http://localhost:4000';
};

const API_URL = getApiUrl();

class ApiService {
  private token: string | null = null;
  private adminToken: string | null = null;
  private userRole: string | null = null;

  async init() {
    this.token = await storage.getItem('token');
    this.adminToken = await storage.getItem('adminToken');
    this.userRole = await storage.getItem('userRole');
  }

  async setToken(token: string) {
    this.token = token;
    await storage.setItem('token', token);
  }

  async setUserRole(role: string) {
    this.userRole = role;
    await storage.setItem('userRole', role);
  }

  getUserRole() {
    return this.userRole;
  }

  async clearToken() {
    this.token = null;
    this.userRole = null;
    await storage.removeItem('token');
    await storage.removeItem('userRole');
  }

  async setAdminToken(token: string) {
    this.adminToken = token;
    await storage.setItem('adminToken', token);
  }

  async clearAdminToken() {
    this.adminToken = null;
    await storage.removeItem('adminToken');
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${API_URL}/api${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    let tokenToUse = path.startsWith('/admin') ? this.adminToken : this.token;
    if (tokenToUse === 'undefined' || tokenToUse === 'null') {
      tokenToUse = null;
    }

    // Não envia cabeçalho de autorização para rotas públicas de autenticação
    const isPublicAuthPath = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path === '/health';
    if (tokenToUse && !isPublicAuthPath) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    console.log(`[API] Request: ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[API] Response Status: ${response.status} for ${path}`);

      if (!response.ok) {
        let errorMsg = 'Erro desconhecido';
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch (e) {
          // Se não for JSON, pode ser HTML de erro do proxy/nginx
          errorMsg = `Erro no servidor (HTTP ${response.status})`;
        }
        
        console.error(`[API] Error Response:`, errorMsg);

        // Se o token expirou ou foi invalidado (401/403) e não estamos tentando fazer login/registro
        if ((response.status === 401 || response.status === 403) && !isPublicAuthPath) {
          console.log('[API] Token expirado ou inválido. Limpando dados de acesso...');
          await this.clearToken();
          await this.clearAdminToken();
          try {
            const { router } = require('expo-router');
            router.replace('/');
          } catch (err) {
            console.log('[API] Não foi possível redirecionar automaticamente:', err);
          }
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log(`[API] Data received for ${path}`);
      return data;
    } catch (error: any) {
      console.error(`[API] Fetch Error for ${path}:`, error.message);
      if (error.name === 'AbortError') {
        throw new Error('O servidor demorou muito para responder. Tente novamente.');
      }
      if (
        error.message === 'Network request failed' || 
        error.message === 'Failed to fetch' || 
        error.message.includes('fetch') || 
        error.message.includes('Network')
      ) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor está online e sua conexão de internet.');
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

  // Company
  async getProfile() {
    return this.request('/users/me');
  }

  async getCompany() {
    return this.request('/users/company');
  }

  async updateCompany(data: any) {
    return this.request('/users/company', {
      method: 'PUT',
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

  async finishOrder(id: string) {
    return this.request(`/orders/${id}/finish`, {
      method: 'POST'
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

  // Visitas Fixas
  async getFixedVisits() {
    return this.getAll('fixed-visits');
  }

  async createFixedVisit(data: any) {
    return this.create('fixed-visits', data);
  }

  async updateFixedVisit(id: string, data: any) {
    return this.update('fixed-visits', id, data);
  }

  async deleteFixedVisit(id: string) {
    return this.remove('fixed-visits', id);
  }

  // Admin Methods
  async adminLogin(password: string) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password }),
    });
  }

  async getAdminCompanies() {
    return this.request('/admin/companies');
  }

  async toggleBlockCompany(id: string) {
    return this.request(`/admin/companies/${id}/toggle-block`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
