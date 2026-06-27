import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language, TranslationKeys } from './translations';
import { getAppSettings, updateAppSettings } from '../db';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('zh-CN');
  const [transl, setTransl] = useState<TranslationKeys>(translations['zh-CN']);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const settings = await getAppSettings();
      if (settings?.language) {
        const lang = settings.language as Language;
        if (translations[lang]) {
          setLanguageState(lang);
          setTransl(translations[lang]);
        }
      }
    } catch (e) {
      console.error('Failed to load language:', e);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      setLanguageState(lang);
      setTransl(translations[lang]);
      await updateAppSettings({ language: lang });
    } catch (e) {
      console.error('Failed to set language:', e);
    }
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: transl }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
