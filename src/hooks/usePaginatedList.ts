import { useCallback, useEffect, useRef, useState } from 'react'
import type { Page } from '../types/api'
import { isCancelled, toApiError, type ApiError } from '../utils/apiError'

type PageFetcher<T> = (page: number, signal: AbortSignal) => Promise<Page<T>>

/**
 * Scroll infinito sobre un endpoint paginado de Spring (content, number, last, totalElements).
 * refresh() vuelve a la página 0; loadMore() pide la siguiente si existe.
 */
export function usePaginatedList<T>(fetchPage: PageFetcher<T>) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [isLast, setIsLast] = useState(false)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  const load = useCallback(
    async (pageToLoad: number, mode: 'initial' | 'refresh' | 'more') => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      if (mode === 'refresh') setIsRefreshing(true)
      if (mode === 'more') setIsLoadingMore(true)
      setError(null)

      try {
        const result = await fetchPage(pageToLoad, controller.signal)
        setItems((current) => (pageToLoad === 0 ? result.content : [...current, ...result.content]))
        setPage(result.number)
        setIsLast(result.last)
        setTotal(result.totalElements)
      } catch (err) {
        if (!isCancelled(err)) setError(toApiError(err))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsRefreshing(false)
          setIsLoadingMore(false)
        }
      }
    },
    [fetchPage],
  )

  useEffect(() => {
    load(0, 'initial')
    return () => controllerRef.current?.abort()
  }, [load])

  const refresh = useCallback(() => load(0, 'refresh'), [load])

  const loadMore = useCallback(() => {
    if (isLast || isLoadingMore || isLoading || error) return
    load(page + 1, 'more')
  }, [isLast, isLoadingMore, isLoading, error, load, page])

  const retry = useCallback(() => load(items.length ? page + 1 : 0, items.length ? 'more' : 'initial'), [load, items.length, page])

  return { items, total, isLast, error, isLoading, isRefreshing, isLoadingMore, refresh, loadMore, retry }
}