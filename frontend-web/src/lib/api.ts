export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    return (window as any).__API_BASE__ || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
};

export const API_BASE = getApiBase();