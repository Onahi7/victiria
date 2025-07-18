import { useState, useCallback } from 'react'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const request = useCallback(async (
    url: string,
    options?: RequestInit,
    callbacks?: UseApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      const result: ApiResponse<T> = await response.json()

      if (result.success) {
        setData(result.data || null)
        callbacks?.onSuccess?.(result.data)
      } else {
        setError(result.error || 'An error occurred')
        callbacks?.onError?.(result.error || 'An error occurred')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      callbacks?.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const get = useCallback((url: string, callbacks?: UseApiOptions) => {
    return request(url, { method: 'GET' }, callbacks)
  }, [request])

  const post = useCallback((url: string, body: any, callbacks?: UseApiOptions) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }, callbacks)
  }, [request])

  const put = useCallback((url: string, body: any, callbacks?: UseApiOptions) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, callbacks)
  }, [request])

  const del = useCallback((url: string, callbacks?: UseApiOptions) => {
    return request(url, { method: 'DELETE' }, callbacks)
  }, [request])

  return {
    loading,
    error,
    data,
    request,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null),
    clearData: () => setData(null),
  }
}
