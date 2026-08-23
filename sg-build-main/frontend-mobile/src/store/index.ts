import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  company: string;
  role: string;
}

interface AppState {
  token: string;
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: '',
      user: null,
      isLoggedIn: false,
      login: (token, user) => {
        globalThis.__token__ = token;
        globalThis.__user__ = user;
        set({ token, user, isLoggedIn: true });
      },
      logout: () => {
        globalThis.__token__ = '';
        globalThis.__user__ = null;
        set({ token: '', user: null, isLoggedIn: false });
      },
      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
    }),
    { name: 'sg-build-storage' }
  )
);
