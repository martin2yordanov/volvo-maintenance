import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { DEFAULTS, CAT_ORDER, CAT_ICON, calcNextDue, STATUS_ORDER, defaultCmp, importanceBadge } from './lib/data'
import MainTable from './components/MainTable.jsx'
import NeedsAttention from './components/NeedsAttention.jsx'
import ThisYear from './components/ThisYear.jsx'
import Forecast from './components/Forecast.jsx'
import Expenses from './components/Expenses.jsx'
import ItemModal from './components/ItemModal.jsx'
import Toast from './components/Toast.jsx'
import StatsRow from './components/StatsRow.jsx'
import { KNOWN_COSTS } from './lib/expenses'

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
  const [statusFilter, setStatusFilter] = useState(null) // null | 'red' | 'warn' | 'ok' | 'unk'
  const [grouped, setGrouped]     = useState(true)  // true = category view, false = sorted view
  const [showHidden, setShowHidden] = useState(false)
  const [showReplaced, setShowReplaced] = useState(false)
  const [manualExpenses, setManualExpenses] = useState([])
  // ─── Cross-device sync state ─────────────────────────────────────────────
  const [isAnon, setIsAnon]           = useState(true)
  const [userEmail, setUserEmail]     = useState(null)
  const [syncBarOpen, setSyncBarOpen] = useState(false)
  const [syncEmail, setSyncEmail]     = useState('')
  const [syncSent, setSyncSent]       = useState(false)
  const [syncBusy, setSyncBusy]       = useState(false)
  const saveTimerRef   = useRef(null)
  const toastTimerRef  = useRef(null)
  const impRef         = useRef(null)
  const initDoneRef    = useRef(false)
  const userIdRef         = useRef(null)   // tracks current uid for stale-closure checks
  const isLoadingRef      = useRef(false)  // prevents concurrent loadData calls
  const manualExpensesRef = useRef([])     // keeps expenses current for debounced saves

  // ─── Auth: anonymous sign-in + cross-device sync listener ──────────────────
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        userIdRef.current = session.user.id
        setUserId(session.user.id)
        setIsAnon(session.user.is_anonymous ?? !session.user.email)
        setUserEmail(session.user.email ?? null)
        await loadData(session.user.id)
      } else {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Auth error:', error)
          setItems(JSON.parse(JSON.stringify(DEFAULTS)))
          setLoading(false)
          return
        }
        userIdRef.current = data.user.id
        setUserId(data.user.id)
        setIsAnon(true)
        await loadData(data.user.id)
      }
      initDoneRef.current = true
    }

    initAuth()

    // Listen for auth changes that happen AFTER the initial load:
    // - User confirms magic-link email  → SIGNED_IN (new device) or USER_UPDATED (same device upgrade)
    // - User signs out                  → SIGNED_OUT
    // NOTE: Supabase also fires SIGNED_IN / TOKEN_REFRESHED when the tab regains focus
    //       and the JWT is silently refreshed. We must ignore those to avoid a reload loop.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initDoneRef.current) return // ignore events fired during initAuth

        // Token refresh on tab focus — same user, no data change needed
        if (event === 'TOKEN_REFRESHED') return
        if (event === 'SIGNED_IN' && session?.user?.id === userIdRef.current) return

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          userIdRef.current = session.user.id
          setUserId(session.user.id)
          setIsAnon(session.user.is_anonymous ?? !session.user.email)
          setUserEmail(session.user.email ?? null)
          setSyncSent(false)
          setSyncBarOpen(false)
          await loadData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          userIdRef.current = null
          setUserEmail(null)
          setIsAnon(true)
          const { data } = await supabase.auth.signInAnonymously()
          if (data?.user) {
            userIdRef.current = data.user.id
            setUserId(data.user.id)
            await loadData(data.user.id)
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ─── Load data from Supabase ─────────────────────────────────────────────
  async function loadData(uid) {
    if (isLoadingRef.current) return // prevent concurrent / overlapping fetches
    isLoadingRef.current = true
    setLoading(true)

    // Safety net: if the fetch never resolves (e.g. token mid-refresh), unblock after 10 s
    const timeoutId = setTimeout(() => {
      if (isLoadingRef.current) {
        console.error('[loadData] timeout — unblocking loading state')
        isLoadingRef.current = false
        setLoading(false)
        showToast('Грешка: таймаут при зареждане. Работи офлайн.')
        setItems(prev => prev.length ? prev : JSON.parse(JSON.stringify(DEFAULTS)))
      }
    }, 10000)

    try {
      const { data, error } = await supabase
        .from('maintenance_data')
        .select('items, odometer, expenses')
        .eq('user_id', uid)
        .maybeSingle()

      if (error) throw error

      if (data && Array.isArray(data.items) && data.items.length > 0) {
        // Migrate: ensure every item has cat, importance, and known costs
        const migrated = data.items.map(item => ({
          ...item,
          cat: item.cat || 'General',
          importance: item.importance || 5,
          cost: item.cost ?? KNOWN_COSTS[item.id] ?? null,
          lastDate: item.lastDate ? item.lastDate.slice(0, 7) : null,
        }))
        setItems(migrated)
        setOdo(data.odometer || null)
        const savedExpenses = data.expenses || []
        manualExpensesRef.current = savedExpenses
        setManualExpenses(savedExpenses)
      } else {
        // First time: seed with defaults, then save to DB
        const defaults = JSON.parse(JSON.stringify(DEFAULTS))
        setItems(defaults)
        setOdo(null)
        await saveToDb(uid, defaults, null, [])
      }
    } catch (err) {
      console.error('Load error:', err)
      showToast('Грешка при зареждане. Работи офлайн.')
      setItems(JSON.parse(JSON.stringify(DEFAULTS)))
    } finally {
      clearTimeout(timeoutId)
      isLoadingRef.current = false
      setLoading(false)
    }
  }

  // ─── Save to Supabase ────────────────────────────────────────────────────
  async function saveToDb(uid, itemsToSave, odoToSave, expensesToSave) {
    if (!uid) return
    setSyncStatus('saving')
    try {
      const { error } = await supabase
        .from('maintenance_data')
        .upsert(
          { user_id: uid, items: itemsToSave, odometer: odoToSave, expenses: expensesToSave ?? manualExpensesRef.current },
          { onConflict: 'user_id' }
        )
      if (error) throw error
      console.log('[saveToDb] success — odo saved:', odoToSave)
      setSyncStatus('saved')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (err) {
      console.error('[saveToDb] error:', err)
      setSyncStatus('error')
      showToast('⚠️ Грешка при запазване в облака')
    }
  }

  // Debounced save — uid passed explicitly so the timeout closure never goes stale
  function scheduleSave(uid, newItems, newOdo) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToDb(uid, newItems, newOdo)
    }, 800)
  }

  // Manual save — useCallback guarantees userId/items/odo are always current
  const doSave = useCallback(() => {
    clearTimeout(saveTimerRef.current)
    saveToDb(userId, items, odo)
  }, [userId, items, odo])

  // ─── Item mutations ──────────────────────────────────────────────────────
  function updateItems(newItems) {
    setItems(newItems)
    scheduleSave(userId, newItems, odo)
  }

  function updateOdo(val) {
    setOdo(val)
    scheduleSave(userId, items, val)
  }

  function markReplaced(id) {
    const newItems = items.map(item => {
      if (item.id !== id) return item
      const replaced = !item.replaced
      return {
        ...item,
        replaced,
        lastDate: replaced ? (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` })() : item.lastDate,
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

  function hideItem(id) {
    const item = items.find(i => i.id === id)
    const newItems = items.map(i =>
      i.id === id ? { ...i, hidden: !i.hidden } : i
    )
    showToast(item?.hidden ? `${item?.name} — показано` : `${item?.name} — скрито`)
    updateItems(newItems)
  }

  function addExpense(exp) {
    const updated = [...manualExpensesRef.current, exp]
    manualExpensesRef.current = updated
    setManualExpenses(updated)
    saveToDb(userId, items, odo, updated)
  }

  function deleteExpense(entry) {
    if (entry.manual) {
      // User-added entry — remove from array
      const updated = manualExpensesRef.current.filter(e => e.id !== entry.id)
      manualExpensesRef.current = updated
      setManualExpenses(updated)
      saveToDb(userId, items, odo, updated)
    } else if (typeof entry.id === 'string' && entry.id.startsWith('item-')) {
      // Derived from a maintenance item — clear its cost
      const itemId = parseInt(entry.id.replace('item-', ''))
      updField(itemId, 'cost', null)
    } else {
      // Static historical entry — store tombstone so it stays hidden
      const updated = [...manualExpensesRef.current, { id: entry.id, _deleted: true }]
      manualExpensesRef.current = updated
      setManualExpenses(updated)
      saveToDb(userId, items, odo, updated)
    }
  }

  function doReset() {
    if (!confirm('Връщане към началните данни. Продължи?')) return
    const defaults = JSON.parse(JSON.stringify(DEFAULTS))
    setSortState({ col: null, dir: 1 })
    updateItems(defaults)
    setOdo(null)
    showToast('Данните са нулирани')
  }

  // ─── Cross-device sync ───────────────────────────────────────────────────
  async function sendSync() {
    const email = syncEmail.trim()
    if (!email) return
    setSyncBusy(true)
    try {
      if (isAnon) {
        // Upgrade anonymous account to email account in-place.
        // The user_id stays the same, so all data is preserved.
        const { error } = await supabase.auth.updateUser({ email })
        if (error) throw error
      } else {
        // Sign in on a new device using an existing email account.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        })
        if (error) throw error
      }
      setSyncSent(true)
    } catch (err) {
      showToast('⚠️ ' + (err.message || 'Грешка при синхронизация'))
    } finally {
      setSyncBusy(false)
    }
  }

  async function doSignOut() {
    await supabase.auth.signOut()
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
    if (col === 'name') {
      // "Позиция" always resets to the default grouped-by-category view
      setGrouped(true)
      setSortState({ col: null, dir: 1 })
      return
    }
    setGrouped(false)
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
      case 'cost':       return item.cost || 0
      default:           return 0
    }
  }

  const sortedItems = useCallback(() => {
    const copy = [...items]
    if (grouped) {
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
  }, [items, grouped, sortState, odo])

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
            <div className="vlogo">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                  <circle cx="23" cy="27" r="16" stroke="white" strokeWidth="2.2"/>
                  <text x="23" y="31" textAnchor="middle" fill="white" fontSize="7" fontWeight="800" fontFamily="'Syne',Arial,sans-serif" letterSpacing="1">VOLVO</text>
                  <line x1="35" y1="14" x2="43" y2="6" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  <polyline points="38,6 43,6 43,11" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
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

            {/* ── Cross-device sync ── */}
            <div className="sync-divider" />
            {userEmail ? (
              <>
                <span className="sync-info" title="Данните са свързани с този имейл">☁ {userEmail}</span>
                <button className="btn btn-ghost btn-sm" onClick={doSignOut}>Изход</button>
              </>
            ) : syncBarOpen ? (
              syncSent ? (
                <>
                  <span className="sync-info">📧 Провери имейла си за линк</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSyncBarOpen(false); setSyncSent(false) }}>✕</button>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    className="sync-input"
                    value={syncEmail}
                    onChange={e => setSyncEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendSync()}
                    placeholder="your@email.com"
                    autoFocus
                  />
                  <button className="btn btn-pri btn-sm" onClick={sendSync} disabled={syncBusy}>
                    {syncBusy ? '...' : 'Изпрати'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSyncBarOpen(false)}>✕</button>
                </>
              )
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setSyncBarOpen(true)} title="Синхронизирай данните си между устройства">
                ☁ Синхрон
              </button>
            )}
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
          <button
            className={`btn btn-sync${syncStatus === 'saving' ? ' syncing' : ''}`}
            onClick={doSave}
            disabled={syncStatus === 'saving'}
          >
            {syncStatus === 'saving' ? '⟳ Запазване...' : syncStatus === 'saved' ? '✓ Запазено' : '💾 Запази'}
          </button>
        </div>

        <div className="tabs">
          {[
            { id: 'main', label: '📋 Всички' },
            { id: 'attn', label: '⚠️ Нужно внимание', badge: urgentCount },
            { id: 'year', label: '📅 Тази Година' },
            { id: 'fore', label: '🔮 5-Год. Прогноза' },
            { id: 'exp',  label: '💸 Разходи' },
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
            <StatsRow
              items={items}
              odo={odo}
              activeFilter={statusFilter}
              onFilter={s => setStatusFilter(f => f === s ? null : s)}
            />
            <MainTable
              grouped={grouped}
              items={sortedItems().filter(i => {
                if (i.hidden && !showHidden) return false
                if (i.replaced && !showReplaced) return false
                if (!statusFilter) return true
                if (i.replaced) return statusFilter === 'ok'
                return calcNextDue(i, odo).status === statusFilter
              })}
              odo={odo}
              sortState={sortState}
              onSort={setSort}
              onMark={markReplaced}
              onUpd={updField}
              onEdit={item => { setEditItem(item); setModalOpen(true) }}
              onDel={deleteItem}
              onAdd={() => { setEditItem(null); setModalOpen(true) }}
              showHidden={showHidden}
              hiddenCount={items.filter(i => i.hidden).length}
              onHide={hideItem}
              onToggleHidden={() => setShowHidden(s => !s)}
              showReplaced={showReplaced}
              replacedCount={items.filter(i => i.replaced).length}
              onToggleReplaced={() => setShowReplaced(s => !s)}
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

        {activeTab === 'exp' && (
          <Expenses items={items} manualExpenses={manualExpenses} onAddExpense={addExpense} onDeleteExpense={deleteExpense} onUpdItem={updField} />
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
