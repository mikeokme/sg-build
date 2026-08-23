export interface User {
  id: string;
  username: string;
  email: string;
  company: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'pending' | 'ongoing' | 'completed' | 'paused';
  progress: number;
  manager: string;
  startDate: string;
  endDate: string;
  budget: number;
  createdAt: string;
}

export interface Approval {
  id: string;
  type: string;
  title: string;
  applicant: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  manager: string;
  parentId?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'available' | 'in_use' | 'low';
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  status: 'available' | 'in_use' | 'maintenance';
  location: string;
  lastInspection: string;
  createdAt: string;
}

export interface SafetyInspection {
  id: string;
  project: string;
  inspector: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface SiteRecord {
  id: string;
  project: string;
  location: string;
  photo?: string;
  description: string;
  reportedBy: string;
  createdAt: string;
}
