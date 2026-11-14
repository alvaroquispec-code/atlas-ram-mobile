import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useRef } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import IsolateCard from '../../components/IsolateCard'
import LoadingState from '../../components/LoadingState'
import { useAuth } from '../../hooks/useAuth'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useShake } from '../../hooks/useShake'
import { useToast } from '../../hooks/useToast'
import { isolateService } from '../../services/isolateService'
import { colors, radius, spacing } from '../../utils/theme'

const PAGE_SIZE = 20

export default function IsolatesScreen() {
  const { hasRole } = useAuth()
  const { showToast } = useToast()
  const fetchPage = useCallback((page: number, signal: AbortSignal) => isolateService.list(page, PAGE_SIZE, signal), [])
  const list = usePaginatedList(fetchPage)
  const canCreate = hasRole('LAB_TECHNICIAN', 'ADMIN')

  // El acelerómetro solo escucha mientras esta pestaña está visible.
  const isFocused = useRef(false)
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true
      return () => {
        isFocused.current = false
      }
    }, []),
  )
  const { isAvailable: canShake } = useShake(() => {
    if (!isFocused.current) return
    list.refresh()
    showToast('Lista actualizada', 'info')
  })

  const openDetail = useCallback((id: number) => router.push(`/isolates/${id}`), [])

  if (list.isLoading) return <LoadingState label="Cargando aislamientos…" />
  if (list.error && list.items.length === 0) return <ErrorState message={list.error.message} onRetry={list.retry} />

  return (
    <View style={styles.flex}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <IsolateCard isolate={item} onPress={openDetail} />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <Text style={styles.summary}>
            {list.total} aislamientos · {canShake ? 'agita el teléfono o desliza hacia abajo para actualizar' : 'desliza hacia abajo para actualizar'}
          </Text>
        }
        ListEmptyComponent={<EmptyState title="Aún no hay aislamientos" message="Cuando el laboratorio registre muestras, aparecerán aquí." />}
        ListFooterComponent={
          list.isLoadingMore ? (
            <ActivityIndicator style={styles.footer} color={colors.brand} />
          ) : list.error ? (
            <Pressable onPress={list.retry} style={styles.footer}>
              <Text style={styles.retry}>{list.error.message} Toca para reintentar.</Text>
            </Pressable>
          ) : list.isLast && list.items.length > 0 ? (
            <Text style={[styles.summary, styles.footer]}>No hay más resultados</Text>
          ) : undefined
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} colors={[colors.brand]} />}
      />

      {canCreate && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nuevo aislamiento"
          onPress={() => router.push('/isolates/new')}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 96 },
  summary: { color: colors.muted, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
  footer: { paddingVertical: spacing.lg },
  retry: { color: colors.danger, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
})