
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de data
export function formatDate(date: Date | string, locale = 'pt-BR', options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

// Formatação de números
export function formatNumber(num: number, locale = 'pt-BR', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(num)
}

// Função para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Função para validar e transformar URLs
export function ensureHttps(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

// Função para gerar um slug a partir de um texto
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

// Função para formatar nomes
export function formatName(name: string): string {
  if (!name) return ''
  const nameParts = name.trim().split(' ')
  if (nameParts.length === 1) return nameParts[0]
  
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  
  return `${firstName} ${lastName}`
}

// Função para extrair iniciais de um nome
export function getInitials(name: string): string {
  if (!name) return ''
  
  const nameParts = name.trim().split(' ').filter(part => part.length > 0)
  if (nameParts.length === 0) return ''
  
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase()
  }
  
  const firstInitial = nameParts[0][0]
  const lastInitial = nameParts[nameParts.length - 1][0]
  
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

// Função para debounce (útil para inputs, pesquisas, etc)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Função auxiliar para verificar se estamos no modo dark
export function isDarkMode(): boolean {
  return (
    document.documentElement.classList.contains('dark') || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

// Função para gerar cores aleatórias com base em uma string (útil para avatares)
export function stringToColor(str: string): string {
  if (!str) return '#ff4400' // Cor padrão
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 60%)`
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Função para converter timestamps
export function timestampToDate(timestamp: number | string): Date {
  if (typeof timestamp === 'string') {
    return new Date(timestamp)
  }
  return new Date(timestamp)
}

// Função para obter tempo relativo (ex: "há 2 dias")
export function getRelativeTime(date: Date | string | number, locale = 'pt-BR'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  // Menos de um minuto
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }
  
  // Menos de uma hora
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute')
  }
  
  // Menos de um dia
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour')
  }
  
  // Menos de um mês
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day')
  }
  
  // Menos de um ano
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month')
  }
  
  // Mais de um ano
  const diffInYears = Math.floor(diffInMonths / 12)
  return rtf.format(-diffInYears, 'year')
}
