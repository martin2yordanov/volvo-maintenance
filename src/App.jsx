import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { DEFAULTS, CAT_ORDER, CAT_ICON, calcNextDue, STATUS_ORDER, defaultCmp, importanceBadge } from './lib/data'
import MainTable from './components/MainTable.jsx'
import NeedsAttention from './components/NeedsAttention.jsx'
import ThisYear from './components/ThisYear.jsx'
import Forecast from './components/Forecast.jsx'
import ItemModal from './components/ItemModal.jsx'
import Toast from './components/Toast.jsx'
import StatsRow from './components/StatsRow.jsx'

const KMY = 15000

export default function App() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [items, setItems]         = useState([])
  const [odo, setOdo]             = useState(null)
  const [activeTab, setActiveTab] = useState('main')
  const [sortState, setSortState] = useState({ col: null, dir: 1 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [toast, setToast]         = useState({ msg: '', on: false })
  const [loading, setLoading]     = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | saving | saved | error
  const [userId, setUserId]       = useState(null)
  const saveTimerRef              = useRef(null)
  const toastTimerRef             = useRef(null)
  const impRef                    = useRef(null)

  // ─── Auth: anonymous sign-in ─────────────────────────────────────────────
  useEffect(() => {
    async function initAuth() {
      // Check if already signed in
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        await loadData(session.user.id)
      } else {
        // Sign in anonymously — creates a persistent anonymous user
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Auth error:', error)
          // Fallback: load defaults
          setItems(JSON.parse(JSON.stringify(DEFAULTS)))
          setLoading(false)
          return
        }
        setUserId(data.user.id)
        await loadData(data.user.id)
      }
    }
    initAuth()
  }, [])

  // ─── Load data from Supabase ─────────────────────────────────────────────
  async function loadData(uid) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('maintenance_data')
        .select('items, odometer')
        .eq('user_id', uid)
        .maybeSingle()

      if (error) throw error

      if (data && Array.isArray(data.items) && data.items.length > 0) {
        // Migrate: ensure every item has cat and importance
        const migrated = data.items.map(item => ({
          ...item,
          cat: item.cat || 'General',
          importance: item.importance || 5,
        }))
        setItems(migrated)
        setOdo(data.odometer || null)
      } else {
        // First time: seed with defaults, then save to DB
        const defaults = JSON.parse(JSON.stringify(DEFAULTS))
        setItems(defaults)
        setOdo(null)
        await saveToDb(uid, defaults, null)
      }
    } catch (err) {
      console.error('Load error:', err)
      showToast('Грешка при зареждане. Работи офлайн.')
      setItems(JSON.parse(JSON.stringify(DEFAULTS)))
    } finally {
      setLoading(false)
    }
  }

  // ─── Save to Supabase (debounced) ────────────────────────────────────────
  async function saveToDb(uid, itemsToSave, odoToSave) {
    const effectiveUid = uid || userId
    if (!effectiveUid) return
    setSyncStatus('saving')
    try {
      const { error } = await supabase
        .from('maintenance_data')
        .upsert(
          { user_id: effectiveUid, items: itemsToSave, odometer: odoToSave },
          { onConflict: 'user_id' }
        )
      if (error) throw error
      setSyncStatus('saved')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (err) {
      console.error('Save error:', err)
      setSyncStatus('error')
      showToast('⚠️ Грешка при запазване в облака')
    }
  }

  // Debounced save — waits 800ms after last change before writing to DB
  function scheduleSave(newItems, newOdo) {
    clearTimeout(saveTimerRef.current)
    setSyncStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      saveToDb(userId, newItems, newOdo)
    }, 800)
  }

  // ─── Item mutations ──────────────────────────────────────────────────────
  function updateItems(newItems) {
    setItems(newItems)
    scheduleSave(newItems, odo)
  }

  function updateOdo(val) {
    setOdo(val)
    scheduleSave(items, val)
  }

  function markReplaced(id) {
    const newItems = items.map(item => {
      if (item.id !== id) return item
      const replaced = !item.replaced
      return {
        ...item,
        replaced,
        lastDate: replaced ? new Date().toISOString().split('T')[0] : item.lastDate,
        lastKm:   replaced && odo ? odo : item.lastKm,
      }
    })
    const item = items.find(i => i.id === id)
    showToast(item?.replaced === false ? `✓ ${item?.name} — сменено` : `${item?.name} — върнато`)
    updateItems(newItems)
  }

  function updField(id, field, val) {
    const newItems = items.map(item =>
      item.id === id ? { ...item, [field]: val } : item
    )
    updateItems(newItems)
  }

  function deleteItem(id) {
    if (!confirm('Изтрий тази позиция?')) return
    updateItems(items.filter(i => i.id !== id))
    showToast('Позицията е изтрита')
  }

  function saveItem(data) {
    let newItems
    if (editItem) {
      newItems = items.map(item => item.id === editItem.id ? { ...item, ...data } : item)
      showToast('Позицията е обновена')
    } else {
      newItems = [...items, { ...data, id: Date.now(), replaced: false }]
      showToast('Позицията е добавена')
    }
    updateItems(newItems)
    setModalOpen(false)
    setEditItem(null)
  }

  function doReset() {
    if (!confirm('Връщане към началните данни. Продължи?')) return
    const defaults = JSON.parse(JSON.stringify(DEFAULTS))
    setSortState({ col: null, dir: 1 })
    updateItems(defaults)
    setOdo(null)
    showToast('Данните са нулирани')
  }

  // ─── Import / Export ─────────────────────────────────────────────────────
  function doExport() {
    const blob = new Blob([JSON.stringify({ items, odo }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'volvo_maintenance.json'
    a.click()
    showToast('Данните са експортирани')
  }

  function doImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result)
        const arr = Array.isArray(d) ? d : (d?.items || null)
        if (!arr?.length) { alert('Файлът не съдържа данни.'); return }
        const newOdo = d.odo || null
        updateItems(arr)
        if (newOdo) updateOdo(newOdo)
        showToast(`✓ Импортирани ${arr.length} позиции`)
      } catch (err) {
        alert('Грешка: ' + err.message)
      }
    }
    r.readAsText(file)
    e.target.value = ''
  }

  // ─── Toast ───────────────────────────────────────────────────────────────
  function showToast(msg) {
    clearTimeout(toastTimerRef.current)
    setToast({ msg, on: true })
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, on: false })), 3000)
  }

  // ─── Sorting ─────────────────────────────────────────────────────────────
  function setSort(col) {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? prev.dir * -1 : 1
    }))
  }

  function getSortValue(item, col) {
    const c = calcNextDue(item, odo)
    switch (col) {
      case 'name':       return item.name || ''
      case 'intervalKm': return item.intervalKm || 0
      case 'intervalYr': return item.intervalYr || 0
      case 'lastDate':   return item.lastDate || ''
      case 'lastKm':     return item.lastKm || 0
      case 'nextDue':    return c.score
      case 'status':     return STATUS_ORDER[c.status]
      case 'importance': return item.importance || 0
      default:           return 0
    }
  }

  const sortedItems = useCallback(() => {
    const copy = [...items]
    if (!sortState.col) {
      return copy.sort((a, b) => {
        const ai = CAT_ORDER.indexOf(a.cat)
        const bi = CAT_ORDER.indexOf(b.cat)
        const aIdx = ai < 0 ? 99 : ai
        const bIdx = bi < 0 ? 99 : bi
        if (aIdx !== bIdx) return aIdx - bIdx
        return defaultCmp(a, b, odo)
      })
    }
    return copy.sort((a, b) => {
      const av = getSortValue(a, sortState.col)
      const bv = getSortValue(b, sortState.col)
      if (av < bv) return -1 * sortState.dir
      if (av > bv) return  1 * sortState.dir
      return 0
    })
  }, [items, sortState, odo])

  // ─── Urgent count for badge ───────────────────────────────────────────────
  const urgentCount = items.filter(i => {
    if (i.replaced) return false
    const s = calcNextDue(i, odo).status
    return s === 'red' || s === 'warn'
  }).length

  // ─── Sync status label ────────────────────────────────────────────────────
  const syncLabel = syncStatus === 'saving' ? '⟳ Запазване...'
    : syncStatus === 'saved' ? '✓ Запазено'
    : syncStatus === 'error' ? '⚠ Грешка'
    : ''
  const syncClass = syncStatus === 'saved' ? 'ok' : syncStatus === 'error' ? 'err' : 'busy'

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Зареждане от облака…</span>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="hdr">
        <div className="hdr-top">
          <div className="car-id">
            <div className="vlogo">V</div>
            <div>
              <h1>Volvo V70 &middot; 2003</h1>
              <span>D5244T &middot; 2.4D &middot; 163 к.с. &middot; Дизел</span>
            </div>
          </div>
          <div className="hdr-btns">
            <button className="btn btn-ghost" onClick={() => { setEditItem(null); setModalOpen(true) }}>＋ Добави</button>
            <button className="btn btn-ghost" onClick={doExport}>↑ Експорт</button>
            <button className="btn btn-ghost" onClick={() => impRef.current?.click()}>↓ Импорт</button>
            <button className="btn btn-red"   onClick={doReset}>⟳ Нулиране</button>
            <input ref={impRef} type="file" id="imp" accept=".json" onChange={doImport} />
          </div>
        </div>

        <div className="odo-bar">
          <span className="odo-lbl">Километраж:</span>
          <input
            type="number"
            className="odo-inp"
            placeholder="——"
            value={odo ?? ''}
            onChange={e => updateOdo(e.target.value ? parseInt(e.target.value) : null)}
          />
          <span className="odo-unit">км</span>
          {syncLabel && <span className={`sync-status ${syncClass}`}>{syncLabel}</span>}
          <span style={{fontSize:'.6rem',color:'var(--txt3)',fontFamily:'var(--fm)',marginLeft:'.3rem'}}>
            Данните се запазват автоматично в облака
          </span>
        </div>

        <div className="tabs">
          {[
            { id: 'main', label: '📋 Всички' },
            { id: 'attn', label: '⚠️ Нужно внимание', badge: urgentCount },
            { id: 'year', label: '📅 Тази Година' },
            { id: 'fore', label: '🔮 5-Год. Прогноза' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab${activeTab === tab.id ? ' on' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="attn-badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="content">

        {activeTab === 'main' && (
          <>
            <StatsRow items={items} odo={odo} />
            <MainTable
              items={sortedItems()}
              odo={odo}
              sortState={sortState}
              onSort={setSort}
              onMark={markReplaced}
              onUpd={updField}
              onEdit={item => { setEditItem(item); setModalOpen(true) }}
              onDel={deleteItem}
              onAdd={() => { setEditItem(null); setModalOpen(true) }}
            />
          </>
        )}

        {activeTab === 'attn' && (
          <NeedsAttention items={items} odo={odo} onMark={markReplaced} />
        )}

        {activeTab === 'year' && (
          <ThisYear items={items} odo={odo} />
        )}

        {activeTab === 'fore' && (
          <Forecast items={items} odo={odo} />
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <ItemModal
          item={editItem}
          onSave={saveItem}
          onClose={() => { setModalOpen(false); setEditItem(null) }}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <Toast msg={toast.msg} on={toast.on} />
    </>
  )
}
