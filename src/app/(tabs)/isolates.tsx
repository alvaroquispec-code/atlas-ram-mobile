import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import ChipSelect from '../../components/ChipSelect'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import IsolateCard from '../../components/IsolateCard'
import LoadingState from '../../components/LoadingState'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { useShake } from '../../hooks/useShake'
import { useToast } from '../../hooks/useToast'
import { catalogService } from '../../services/catalogService'
import { isolateService, type IsolateSort } from '../../services/isolateService'
import type { Specimen } from '../../types/api'
import { SPECIMEN_LABELS } from '../../utils/labels'
import { colors, radius, spacing } from '../../utils/theme'

const PAGE_SIZE = 20

export default function IsolatesScreen() {
  const { hasRole } = useAuth()
  const { showToast } = useToast()
  // Filtros: los mismos que en la web, combinables. Cambiar uno vuelve a la página 0.
  const [microorganismId, setMicroorganismId] = useState('')
  const [specimen, setSpecimen] = useState('')
  const [sort, setSort] = useState<IsolateSort>('collectionDate,desc')
  const [showFilters, setShowFilters] = useState(false)
  const [goToId, setGoToId] = useState('')
  const [goToError, setGoToError] = useState<string | null>(null)
  const activeFilters = (microorganismId ? 1 : 0) + (specimen ? 1 : 0)

  const microorganisms = useFetch((signal) => catalogService.microorganisms(signal), [])
  const microorganismOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...(microorganisms.data ?? []).map((m) => ({ value: String(m.id), label: `${m.genus} ${m.species ?? ''}`.trim() })),
    ],
    [microorganisms.data],
  )
  const specimenOptions = useMemo(
    () => [{ value: '', label: 'Todas' }, ...Object.entries(SPECIMEN_LABELS).map(([value, label]) => ({ value, label }))],
    [],
  )

  const fetchPage = useCallback(
    (page: number, signal: AbortSignal) =>
      isolateService.list(
        page,
        PAGE_SIZE,
        {
          microorganismId: microorganismId ? Number(microorganismId) : null,
          specimen: (specimen || null) as Specimen | null,
          sort,
        },
        signal,
      ),
    [microorganismId, specimen, sort],
  )
  const list = usePaginatedList(fetchPage)

  const clearFilters = () => {
    setMicroorganismId('')
    setSpecimen('')
  }

  const goTo = () => {
    const id = Number(goToId.trim().replace(/^#/, ''))
    if (!Number.isInteger(id) || id <= 0) {
      setGoToError('Escribe un número de aislamiento válido')
      return
    }
    setGoToError(null)
    setGoToId('')
    router.push(`/isolates/${id}`)
  }
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
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.goToRow}>
              <TextInput
                accessibilityLabel="Ir al aislamiento por número"
                placeholder="Ir al aislamiento N.º"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                returnKeyType="go"
                value={goToId}
                onChangeText={(text) => {
                  setGoToId(text)
                  setGoToError(null)
                }}
                onSubmitEditing={goTo}
                style={[styles.input, goToError ? styles.inputError : null]}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir aislamiento" onPress={goTo} style={styles.iconButton}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                accessibilityState={{ expanded: showFilters }}
                onPress={() => setShowFilters((v) => !v)}
                style={[styles.filterButton, (showFilters || activeFilters > 0) && styles.filterButtonActive]}
              >
                <Ionicons name="options-outline" size={20} color={showFilters || activeFilters > 0 ? '#fff' : colors.brand} />
                {activeFilters > 0 && <Text style={styles.badge}>{activeFilters}</Text>}
              </Pressable>
            </View>
            {goToError && <Text style={styles.error}>{goToError}</Text>}

            {showFilters && (
              <View style={styles.filters}>
                <ChipSelect label="Microorganismo" options={microorganismOptions} value={microorganismId} onChange={setMicroorganismId} />
                <ChipSelect label="Tipo de muestra" options={specimenOptions} value={specimen} onChange={setSpecimen} />
                <ChipSelect<IsolateSort>
                  label="Orden"
                  options={[
                    { value: 'collectionDate,desc', label: 'Más recientes' },
                    { value: 'collectionDate,asc', label: 'Más antiguos' },
                  ]}
                  value={sort}
                  onChange={setSort}
                />
                {activeFilters > 0 && (
                  <Pressable onPress={clearFilters} accessibilityRole="button">
                    <Text style={styles.link}>Limpiar filtros</Text>
                  </Pressable>
                )}
              </View>
            )}

            <Text style={styles.summary}>
              {list.total} aislamientos{activeFilters > 0 ? ' con estos filtros' : ''} ·{' '}
              {canShake ? 'agita el teléfono o desliza hacia abajo para actualizar' : 'desliza hacia abajo para actualizar'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          activeFilters > 0 ? (
            <EmptyState title="Sin resultados" message="Ningún aislamiento coincide con estos filtros. Prueba quitando alguno." />
          ) : (
            <EmptyState title="Aún no hay aislamientos" message="Cuando el laboratorio registre muestras, aparecerán aquí." />
          )
        }
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
  header: { gap: spacing.md },
  goToRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  iconButton: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: colors.brand },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    overflow: 'hidden',
  },
  filters: { gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  link: { color: colors.brand, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13 },
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