const normaliseBase = (value) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.replace(/\/+$/, '')
}

export const API_BASE = normaliseBase(import.meta.env.VITE_API_BASE ?? '')
