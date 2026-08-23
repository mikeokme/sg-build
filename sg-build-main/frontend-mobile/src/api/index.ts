import axios from 'axios';

const API_BASE = 'http://192.168.1.100:3000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = globalThis.__token__ || '';
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response?.status === 401) {
      globalThis.__token__ = '';
      globalThis.__user__ = null;
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
};

export const projectApi = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const approvalApi = {
  list: () => api.get('/approvals'),
  get: (id: string) => api.get(`/approvals/${id}`),
  create: (data: any) => api.post('/approvals', data),
  approve: (id: string, data: any) => api.put(`/approvals/${id}/approve`, data),
  reject: (id: string, data: any) => api.put(`/approvals/${id}/reject`, data),
};

export const orgApi = {
  departments: () => api.get('/organizations/departments'),
  branches: () => api.get('/organizations/branches'),
  mgmtDepts: () => api.get('/organizations/mgmt-depts'),
  numberedCos: () => api.get('/organizations/numbered-cos'),
  createDept: (data: any) => api.post('/organizations/departments', data),
  createBranch: (data: any) => api.post('/organizations/branches', data),
  createMgmt: (data: any) => api.post('/organizations/mgmt-depts', data),
  createNumbered: (data: any) => api.post('/organizations/numbered-cos', data),
};

export const materialApi = {
  list: () => api.get('/materials'),
  create: (data: any) => api.post('/materials', data),
  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

export const equipmentApi = {
  list: () => api.get('/equipments'),
  create: (data: any) => api.post('/equipments', data),
  update: (id: string, data: any) => api.put(`/equipments/${id}`, data),
  delete: (id: string) => api.delete(`/equipments/${id}`),
};

export const safetyApi = {
  list: () => api.get('/safety-inspections'),
  create: (data: any) => api.post('/safety-inspections', data),
  update: (id: string, data: any) => api.put(`/safety-inspections/${id}`, data),
};

export const siteApi = {
  list: () => api.get('/site-records'),
  create: (data: any) => api.post('/site-records', data),
};

export default api;
