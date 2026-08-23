'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'zh' | 'en';

interface SettingsContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  cycleLanguage: () => void;
  isDark: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>('zh');
  const [isDark, setIsDark] = useState(false);

  // 初始化：从 localStorage 读取设置
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    const savedLang = localStorage.getItem('language') as Language;
    if (savedTheme) setThemeState(savedTheme);
    if (savedLang) setLanguageState(savedLang);
  }, []);

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else if (theme === 'light') {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      // system
      setIsDark(systemDark);
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDark(e.matches);
        const root = document.documentElement;
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // 应用语言
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    localStorage.setItem('language', language);
  }, [language]);

  // 循环切换主题：light -> dark -> system -> light
  const cycleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  // 循环切换语言：zh -> en -> zh
  const cycleLanguage = () => {
    setLanguageState((prev) => prev === 'zh' ? 'en' : 'zh');
  };

  return (
    <SettingsContext.Provider value={{
      theme, setTheme: setThemeState, cycleTheme,
      language, setLanguage: setLanguageState, cycleLanguage,
      isDark,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
