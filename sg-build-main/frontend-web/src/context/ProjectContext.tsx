'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const API_BASE = 'http://localhost:14725';

const STORAGE_KEY = 'selectedProjectId';

export const PROJECT_FILTERED_CATEGORIES = ['procurement', 'subcontract', 'material', 'equipment', 'engineering', 'finance', 'safety', 'quality'];

export function useProjectFilter(categoryKey: string) {
  const { matchesProject } = useProject();
  const enabled = PROJECT_FILTERED_CATEGORIES.includes(categoryKey);
  return useCallback(
    (item: any) => !enabled || matchesProject(item),
    [enabled, matchesProject],
  );
}

export function useCurrentProject(categoryKey: string) {
  const { selectedProject } = useProject();
  const enabled = PROJECT_FILTERED_CATEGORIES.includes(categoryKey);
  return enabled ? selectedProject : null;
}

export interface ProjectItem {
  id: string;
  name: string;
  code?: string;
  status?: string;
  customer?: string;
  [key: string]: any;
}

interface ProjectContextType {
  projects: ProjectItem[];
  loading: boolean;
  selectedId: string;
  selectedProject: ProjectItem | null;
  setSelectedId: (id: string) => void;
  matchesProject: (item: any) => boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  loading: true,
  selectedId: '',
  selectedProject: null,
  setSelectedId: () => {},
  matchesProject: () => true,
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSelectedId(saved);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE}/collections/projectArchives`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  const matchesProject = useCallback(
    (item: any) => {
      if (!selectedProject) return true;
      if (!item) return false;
      if (item.projectId) return item.projectId === selectedProject.id;
      const p = item.project;
      if (!p) return true;
      const name = selectedProject.name;
      if (p === name) return true;
      if (p.includes(name) && name.length >= 4) return true;
      if (name.includes(p) && p.length >= 4) return true;
      return false;
    },
    [selectedProject],
  );

  return (
    <ProjectContext.Provider value={{ projects, loading, selectedId, selectedProject, setSelectedId: select, matchesProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}