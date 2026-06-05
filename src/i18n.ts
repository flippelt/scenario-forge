import { useStore } from './model/store'
import type { Locale } from './model/store'

export type { Locale }

// Lightweight i18n: translations live inline at the call site as t('PT', 'EN'),
// so nothing can drift out of a separate key catalog and every string is
// obviously bilingual. `useT` binds to the editor's current locale (store);
// `tt` is the non-hook variant for data/helpers that already hold the locale.
export type T = (pt: string, en: string) => string

export function useT(): T {
  const locale = useStore((s) => s.locale)
  return (pt, en) => (locale === 'en' ? en : pt)
}

export const tt = (locale: Locale, pt: string, en: string): string =>
  locale === 'en' ? en : pt
