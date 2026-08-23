'use client';

import { useSettings } from '@/context/SettingsContext';
import { CAT_TITLE, FEAT_TITLE, FIELD_LABEL, UI, DASH, LAYOUT, LOGIN } from './dicts';

export type Lang = 'zh' | 'en';

function pick(dict: Record<string, { zh: string; en: string }> | undefined, key: string, lang: Lang): string | undefined {
  return dict?.[key]?.[lang];
}

// 供 Server Component 等非 hook 场景使用
export function useT() {
  const { language } = useSettings();
  const lang: Lang = language;

  const t = (key: string): string =>
    pick(UI, key, lang) ?? pick(DASH, key, lang) ?? pick(LAYOUT, key, lang) ?? pick(LOGIN, key, lang) ?? key;

  const tCat = (key: string): string => pick(CAT_TITLE, key, lang) ?? key;
  const tFeat = (catKey: string, featKey: string): string =>
    pick(FEAT_TITLE, `${catKey}/${featKey}`, lang) ?? pick(FEAT_TITLE, featKey, lang) ?? featKey;
  const tField = (fieldKey: string, fallback: string): string => pick(FIELD_LABEL, fieldKey, lang) ?? fallback;

  return { lang, t, tCat, tFeat, tField };
}

export type TFunction = ReturnType<typeof useT>;