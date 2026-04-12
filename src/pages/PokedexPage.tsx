import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Pokemon, Filters } from '../types/pokemon'
import { filterPokemon } from '../utils/pokemon'
import { FilterBar } from '../components/FilterBar'
import { PokemonCard } from '../components/PokemonCard'
import { PokemonModal } from '../components/PokemonModal'
import { PokemonListRow, ListHeader } from '../components/PokemonListRow'
import allPokemonData from '../data/pokemon.json'

const ALL_POKEMON = allPokemonData as Pokemon[]

const DEFAULT_FILTERS: Filters = {
  search: '',
  generation: 0,
  type: '',
  tier: '',
}

const PAGE_SIZE = 60

export function PokedexPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<Pokemon | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const loaderRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => filterPokemon(ALL_POKEMON, filters), [filters])
  const displayed = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page])

  useEffect(() => { setPage(1) }, [filters])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayed.length < filtered.length) {
        setPage(p => p + 1)
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [displayed.length, filtered.length])

  const handleFilterChange = useCallback((partial: Partial<Filters>) => {
    setFilters(f => ({ ...f, ...partial }))
  }, [])

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  return (
    <>
      <FilterBar
        filters={filters}
        total={ALL_POKEMON.length}
        filtered={filtered.length}
        onChange={handleFilterChange}
        onReset={handleReset}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      <main style={{ padding: viewMode === 'grid' ? '24px' : '0 0 24px 0' }}>
        {filtered.length === 0 ? (
          <EmptyState onReset={handleReset} />
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            {displayed.map(p => (
              <PokemonCard key={p.id} pokemon={p} onClick={setSelected} />
            ))}
          </div>
        ) : (
          <div>
            <ListHeader />
            {displayed.map(p => (
              <PokemonListRow key={p.id} pokemon={p} onClick={setSelected} />
            ))}
          </div>
        )}

        <div ref={loaderRef} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {displayed.length < filtered.length && (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              加载中... ({displayed.length}/{filtered.length})
            </span>
          )}
        </div>
      </main>

      {selected && (
        <PokemonModal pokemon={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '40vh', gap: '16px', color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: '64px' }}>🔍</div>
      <div style={{ fontSize: '18px', fontWeight: 600 }}>没有找到匹配的宝可梦</div>
      <div style={{ fontSize: '14px' }}>No Pokémon found</div>
      <button onClick={onReset} style={{
        background: 'var(--accent)', color: '#fff',
        padding: '10px 24px', borderRadius: '8px',
        fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '8px',
      }}>清除筛选</button>
    </div>
  )
}
