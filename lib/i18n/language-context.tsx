'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  LanguageOption
} from './translations'

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, fallback?: string) => string
  languages: LanguageOption[]
  currentLanguageInfo: LanguageOption
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'upishield_selected_language'

// Build a reverse index: maps English values to English keys so any label can be translated
const EN_VALUE_TO_KEY: Record<string, string> = {}
if (TRANSLATIONS && TRANSLATIONS.en) {
  Object.entries(TRANSLATIONS.en).forEach(([k, v]) => {
    if (typeof v === 'string') {
      EN_VALUE_TO_KEY[v.trim().toLowerCase()] = k
    }
  })
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null
      if (saved && TRANSLATIONS[saved]) {
        setLanguageState(saved)
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved
        }
      }
    } catch {
      // Fallback
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang
        window.dispatchEvent(new CustomEvent('upishield:languagechange', { detail: { language: lang } }))
      }
    } catch {
      // ignore
    }
  }

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      if (!key && !fallback) return ''
      const langDict = TRANSLATIONS[language] || TRANSLATIONS.en
      const enDict = TRANSLATIONS.en || {}

      // 1. Direct key match in active language
      if (langDict && langDict[key]) {
        return langDict[key]
      }

      // 2. Direct fallback match in active language
      if (fallback && langDict && langDict[fallback]) {
        return langDict[fallback]
      }

      // 3. Trimmed / Lowercase normalized lookup in active language
      const normKey = (key || '').trim().toLowerCase()
      if (langDict && langDict[normKey]) {
        return langDict[normKey]
      }
      if (fallback) {
        const normFallback = fallback.trim().toLowerCase()
        if (langDict && langDict[normFallback]) {
          return langDict[normFallback]
        }
      }

      // 4. English reverse lookup: check if key or fallback matches an English dictionary value
      const mappedKeyFromKey = EN_VALUE_TO_KEY[normKey]
      if (mappedKeyFromKey && langDict && langDict[mappedKeyFromKey]) {
        return langDict[mappedKeyFromKey]
      }

      if (fallback) {
        const mappedKeyFromFallback = EN_VALUE_TO_KEY[fallback.trim().toLowerCase()]
        if (mappedKeyFromFallback && langDict && langDict[mappedKeyFromFallback]) {
          return langDict[mappedKeyFromFallback]
        }
      }

      // 5. English dictionary fallback
      if (enDict[key]) return enDict[key]
      if (fallback && enDict[fallback]) return enDict[fallback]

      return fallback || key
    }
  }, [language])

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageInfo
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string, fallback?: string) => TRANSLATIONS.en[key] || fallback || key,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageInfo: SUPPORTED_LANGUAGES[0]
    }
  }
  return context
}
