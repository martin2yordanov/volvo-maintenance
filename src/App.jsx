import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser, SignIn, SignUp, UserButton } from '@clerk/clerk-react'
import { DEFAULTS, CAT_ORDER, CAT_ICON, calcNextDue, STATUS_ORDER, defaultCmp, importanceBadge } from './lib/data'
import MainTable from './components/MainTable.jsx'
import NeedsAttention from './components/NeedsAttention.jsx'
import ThisYear from './components/ThisYear.jsx'
import Expenses from './components/Expenses.jsx'
import ItemModal from './components/ItemModal.jsx'
import Toast from './components/Toast.jsx'
import StatsRow from './components/StatsRow.jsx'
import CarSetup from './components/CarSetup.jsx'
import CarLogo from './components/CarLogo.jsx'
import ServiceLog from './components/ServiceLog.jsx'
import ServiceLogModal from './components/ServiceLogModal.jsx'
import PrintReport from './components/PrintReport.jsx'
import DocumentVault from './components/DocumentVault.jsx'
import DocumentModal from './components/DocumentModal.jsx'
import ShareView from './components/ShareView.jsx'
import CarGarage from './components/CarGarage.jsx'
import EmailReminderToggle from './components/EmailReminderToggle.jsx'

const KMY = 15000

// ─── Local persistence (per Clerk user) ──────────────────────────────────────
const STORE_PREFIX = 'vm_data_'   // localStorage key prefix, namespaced per user id

// Default first-run payload (v2 garage shape) seeded with the built-in Volvo data
function seedPayload() {
  return {
    version: 2,
    garage: [{
      id: 1,
      carInfo: { make: 'Volvo', model: 'V70', year: 2003 },
      maintenance: JSON.parse(JSON.stringify(DEFAULTS)),
      expenses: [],
      serviceLog: [],
      documents: [],
      odo: null,
    }],
    activeCarId: 1,
    emailReminders: { enabled: false, email: '' },
  }
}

// Decode a share payload from the URL hash (#share=<base64 utf-8 json>)
function readShareFromHash() {
  const m = (window.location.hash || '').match(/share=([^&]+)/)
  if (!m) return null
  try {
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))))
  } catch {
    return null
  }
}

export default function App() {
  const shareData = readShareFromHash()

  // ─── Clerk auth ───────────────────────────────────────────────────────────
  const { isLoaded, isSignedIn, user } = useUser()
  const userId = user?.id ?? null

  // ─── State ──────────────────────────────────────────────────────────────────
  const [items, setItems]         = useState([])
  const [odo, setOdo]             = useState(null)
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'main')
  const [theme, setTheme]         = useState(() => localStorage.getItem('theme') || 'light')
  const [themeOpen, setThemeOpen] = useState(false)
  const [urgentBannerDismissed, setUrgentBannerDismissed] = useState(() => !!sessionStorage.getItem('bannerDismissed'))
  const [returnBanner, setReturnBanner] = useState(false)
  const [sortState, setSortState] = useState({ col: null, dir: 1 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [toast, setToast]         = useState({ msg: '', on: false })
  const [loading, setLoading]     = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | saving | saved | error | local
  const [statusFilter, setStatusFilter] = useState(null) // null | 'red' | 'warn' | 'ok' | 'unk'
  const [grouped, setGrouped]     = useState(true)  // true = category view, false = sorted view
  const [showHidden, setShowHidden] = useState(false)
  const [showReplaced, setShowReplaced] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [manualExpenses, setManualExpenses] = useState([])
  const [serviceLog, setServiceLog]             = useState([])
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editServiceEntry, setEditServiceEntry] = useState(null)
  const [documents, setDocuments]         = useState([])
  const [docModalOpen, setDocModalOpen]   = useState(false)
  const [editDoc, setEditDoc]             = useState(null)
  const [carInfo, setCarInfo]       = useState(null)  // { make, model, year }
  const [showSetup, setShowSetup]   = useState(false)
  const [showGarage, setShowGarage]   = useState(false)
  const [authMode, setAuthMode]       = useState('signIn') // signIn | signUp
  const [activeCarId, setActiveCarId] = useState(1)
  const [emailReminders, setEmailReminders] = useState({ enabled: false, email: '' })
  const saveTimerRef   = useRef(null)
  const toastTimerRef  = useRef(null)
  const impRef         = useRef(null)
  const metaOverflowRef   = useRef(false)  // true once Clerk metadata mirror exceeds its size cap
  const manualExpensesRef = useRef([])     // keeps expenses current for debounced saves
  const serviceLogRef     = useRef([])     // keeps service log current for debounced saves
  const documentsRef      = useRef([])     // keeps documents current for debounced saves
  const garageRef         = useRef([])     // full multi-car array

  // ─── Auth: load the signed-in user's data once Clerk is ready ──────────────
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      setLoading(false)
      return
    }
    loadFromStore(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId])

  // ─── Load active car data into state ────────────────────────────────────
  function loadCarIntoState(car, dbOdo) {
    if (car.carInfo)      setCarInfo(car.carInfo)
    if (car.maintenance?.length > 0) {
      setItems(car.maintenance)
    } else if (!car.carInfo) {
      setShowSetup(true)
      return
    }
    setOdo(car.odo ?? dbOdo ?? null)
    manualExpensesRef.current = car.expenses  || []
    setManualExpenses(car.expenses || [])
    serviceLogRef.current     = car.serviceLog || []
    setServiceLog(car.serviceLog || [])
    documentsRef.current      = car.documents  || []
    setDocuments(car.documents || [])
  }

  // ─── Load the user's data from local storage / Clerk metadata ─────────────
  async function loadFromStore(uid) {
    setLoading(true)
    try {
      let raw = null

      // 1. localStorage — primary store (no practical size limit)
      const local = localStorage.getItem(STORE_PREFIX + uid)
      if (local) {
        try { raw = JSON.parse(local) } catch { /* corrupt — fall through */ }
      }

      // 2. Clerk unsafeMetadata — cross-device fallback when this browser is empty
      if (!raw && user?.unsafeMetadata?.maintenance) {
        raw = user.unsafeMetadata.maintenance
      }

      // 3. First run for this user — seed with the default Volvo dataset and save it
      if (!raw) {
        raw = seedPayload()
        persist(uid, raw)
      }

      hydrate(raw)
    } catch (err) {
      console.error('Load error:', err)
      showToast('Грешка при зареждане. Работи офлайн.')
      setItems(JSON.parse(JSON.stringify(DEFAULTS)))
    } finally {
      setLoading(false)
    }
  }

  // Turn a stored v2 payload into live component state
  function hydrate(raw) {
    let garage, activeId
    if (raw && raw.version === 2 && Array.isArray(raw.garage)) {
      garage   = raw.garage
      activeId = raw.activeCarId || raw.garage[0]?.id || 1
    } else {
      // Defensive: wrap any legacy / unexpected shape into a single-car garage
      const maintenanceRaw = Array.isArray(raw) ? raw : (raw?.maintenance || [])
      garage = [{
        id:          1,
        carInfo:     (raw && raw.carInfo) || { make: 'Volvo', model: 'V70', year: 2003 },
        maintenance: maintenanceRaw.length ? maintenanceRaw : JSON.parse(JSON.stringify(DEFAULTS)),
        expenses:    raw?.expenses   || [],
        serviceLog:  raw?.serviceLog || [],
        documents:   raw?.documents  || [],
        odo:         raw?.odo ?? null,
      }]
      activeId = 1
    }

    garageRef.current = garage
    setActiveCarId(activeId)
    setEmailReminders((raw && raw.emailReminders) || { enabled: false, email: '' })

    const activeCar = garage.find(c => c.id === activeId) || garage[0]
    if (activeCar) loadCarIntoState(activeCar, activeCar.odo)
    else setShowSetup(true)
  }

  // ─── Persist: localStorage (durable) + best-effort Clerk mirror ───────────
  function persist(uid, payload) {
    if (!uid) return
    try {
      localStorage.setItem(STORE_PREFIX + uid, JSON.stringify(payload))
    } catch (e) {
      console.error('[persist] localStorage write failed:', e)
    }

    // Mirror to Clerk so the data follows the account across devices.
    // Clerk caps total user metadata at ~8 KB — once we overflow, stop trying
    // and keep localStorage as the source of truth (shown as "local only").
    if (!user || metaOverflowRef.current) {
      setSyncStatus('local')
      setTimeout(() => setSyncStatus('idle'), 1500)
      return
    }
    user.update({ unsafeMetadata: { ...user.unsafeMetadata, maintenance: payload } })
      .then(() => {
        setSyncStatus('saved')
        setTimeout(() => setSyncStatus('idle'), 1500)
      })
      .catch(() => {
        // Almost always the size cap — degrade gracefully to local-only.
        metaOverflowRef.current = true
        setSyncStatus('local')
        setTimeout(() => setSyncStatus('idle'), 1500)
      })
  }

  // ─── Save the active car + garage into the store ──────────────────────────
  async function saveToDb(uid, itemsToSave, odoToSave, expensesToSave, carInfoToSave) {
    if (!uid) return
    setSyncStatus('saving')

    // Update the active car's slot in garageRef
    const updatedCar = {
      id:         activeCarId,
      carInfo:    carInfoToSave ?? carInfo,
      maintenance: itemsToSave,
      expenses:   expensesToSave ?? manualExpensesRef.current,
      serviceLog: serviceLogRef.current,
      documents:  documentsRef.current,
      odo:        odoToSave,
    }
    const updatedGarage = garageRef.current.map(c => c.id === activeCarId ? updatedCar : c)
    if (!updatedGarage.find(c => c.id === activeCarId)) updatedGarage.push(updatedCar)
    garageRef.current = updatedGarage

    const itemsPayload = {
      version:        2,
      garage:         updatedGarage,
      activeCarId:    activeCarId,
      emailReminders: emailReminders,
    }
    persist(uid, itemsPayload)
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

  function updateExpenseField(entry, field, value) {
    const trimmed = typeof value === 'string' ? value.trim() : value
    if (field !== 'eur' && !trimmed) return
    const parsed = field === 'eur' ? parseFloat(trimmed) : trimmed
    if (field === 'eur' && (isNaN(parsed) || parsed < 0)) return
    let updated
    if (entry.manual) {
      updated = manualExpensesRef.current.map(e => {
        if (e.id !== entry.id) return e
        const patch = { [field]: parsed }
        if (field === 'date') patch.year = parseInt(parsed.split('-')[0])
        return { ...e, ...patch }
      })
    } else {
      const key = `_${field}`
      const hasOverride = manualExpensesRef.current.some(e => e.id === entry.id && key in e)
      if (hasOverride) {
        updated = manualExpensesRef.current.map(e =>
          (e.id === entry.id && key in e) ? { ...e, [key]: parsed } : e
        )
      } else {
        updated = [...manualExpensesRef.current, { id: entry.id, [key]: parsed }]
      }
    }
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

  // ─── Service Log CRUD ────────────────────────────────────────────────────
  function addServiceEntry(data) {
    const entry = { ...data, id: Date.now() }
    const updated = [entry, ...serviceLogRef.current]
    serviceLogRef.current = updated
    setServiceLog(updated)
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('✓ Записът е добавен')
  }

  function updateServiceEntry(data) {
    const updated = serviceLogRef.current.map(e => e.id === editServiceEntry.id ? { ...e, ...data } : e)
    serviceLogRef.current = updated
    setServiceLog(updated)
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('Записът е обновен')
  }

  function deleteServiceEntry(id) {
    if (!confirm('Изтрий този запис?')) return
    const updated = serviceLogRef.current.filter(e => e.id !== id)
    serviceLogRef.current = updated
    setServiceLog(updated)
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('Записът е изтрит')
  }

  function doReset() {
    if (!confirm('Връщане към началните данни. Продължи?')) return
    const defaults = JSON.parse(JSON.stringify(DEFAULTS))
    setSortState({ col: null, dir: 1 })
    updateItems(defaults)
    setOdo(null)
    showToast('Данните са нулирани')
  }

  // ─── Document Vault CRUD ─────────────────────────────────────────────────
  function addDoc(data) {
    const doc = { ...data, id: Date.now() }
    const updated = [...documentsRef.current, doc]
    documentsRef.current = updated
    setDocuments(updated)
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('✓ Документът е добавен')
  }

  function updateDoc(data) {
    const updated = documentsRef.current.map(d => d.id === editDoc.id ? { ...d, ...data } : d)
    documentsRef.current = updated
    setDocuments(updated)
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('Документът е обновен')
  }

  function deleteDoc(id) {
    if (!confirm('Изтрий този документ?')) return
    const updated = documentsRef.current.filter(d => d.id !== id)
    documentsRef.current = updated
    setDocuments(updated)
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('Документът е изтрит')
  }

  // ─── Share Link ──────────────────────────────────────────────────────────
  // The full snapshot is encoded into the URL hash, so a shared link works
  // without any backend — the recipient's browser decodes it locally.
  async function generateShareLink() {
    const payload = {
      carInfo,
      odo,
      maintenance: items,
      serviceLog: serviceLogRef.current,
    }
    try {
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))))
      const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`
      await navigator.clipboard.writeText(url)
      showToast('✓ Линкът е копиран в клипборда!')
    } catch (err) {
      showToast('⚠️ Грешка при генериране на линк')
    }
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

  const overdueCount = items.filter(i => !i.replaced && calcNextDue(i, odo).status === 'red').length

  // ─── Document title reflects urgency ─────────────────────────────────────
  useEffect(() => {
    const name = carInfo ? `${carInfo.make} ${carInfo.model}` : 'Сервизна книжка'
    document.title = urgentCount > 0 ? `(${urgentCount}) ${name}` : name
  }, [urgentCount, carInfo])

  // ─── Theme ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? '' : theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const THEMES = [
    { id: 'light',        label: 'Light',        swatch: '#f5f5f7', border: '#c7c7cc' },
    { id: 'dark',         label: 'Dark',          swatch: '#2c2c2e', border: '#48484a' },
    { id: 'dark-yellow',  label: 'Dark Gold',      swatch: '#231e0f', border: '#d4af37' },
    { id: 'purple-white', label: 'Purple White',  swatch: '#f8f4ff', border: '#7c3aed' },
    { id: 'grey',         label: 'Grey',          swatch: '#e0e0e6', border: '#86868b' },
  ]

  function switchTheme(id) {
    setTheme(id)
    setThemeOpen(false)
  }

  // ─── Persist active tab ───────────────────────────────────────────────────
  function switchTab(id) {
    setActiveTab(id)
    localStorage.setItem('activeTab', id)
  }

  // ─── Return-user banner ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading || items.length === 0) return
    const last = localStorage.getItem('lastVisit')
    const now  = Date.now()
    localStorage.setItem('lastVisit', now)
    if (last && now - parseInt(last) > 7 * 24 * 60 * 60 * 1000 && urgentCount > 0) {
      setReturnBanner(true)
    }
  }, [loading, items.length])

  // ─── Sync status label ────────────────────────────────────────────────────
  const syncLabel = syncStatus === 'saving' ? '⟳ Запазване...'
    : syncStatus === 'saved' ? '✓ Запазено (синх.)'
    : syncStatus === 'local' ? '✓ Запазено (локално)'
    : syncStatus === 'error' ? '⚠ Грешка'
    : ''

  // ─── Garage CRUD ─────────────────────────────────────────────────────────
  function switchCar(id) {
    const car = garageRef.current.find(c => c.id === id)
    if (!car) return
    // Save current state into garageRef before switching
    const current = {
      id:         activeCarId,
      carInfo,
      maintenance: items,
      expenses:   manualExpensesRef.current,
      serviceLog: serviceLogRef.current,
      documents:  documentsRef.current,
      odo,
    }
    garageRef.current = garageRef.current.map(c => c.id === activeCarId ? current : c)
    setActiveCarId(id)
    loadCarIntoState(car, null)
    setShowGarage(false)
    showToast(`Switched to ${car.carInfo?.make || 'car'}`)
  }

  function addCarToGarage() {
    setShowGarage(false)
    setShowSetup(true)
  }

  function handleCarGeneratedMulti(newItems, newCarInfo) {
    const newId = Date.now()
    const newCar = {
      id:         newId,
      carInfo:    newCarInfo,
      maintenance: newItems,
      expenses:   [],
      serviceLog: [],
      documents:  [],
      odo:        null,
    }
    garageRef.current = [...garageRef.current, newCar]
    setActiveCarId(newId)
    setCarInfo(newCarInfo)
    setItems(newItems)
    setOdo(null)
    manualExpensesRef.current = []
    setManualExpenses([])
    serviceLogRef.current = []
    setServiceLog([])
    documentsRef.current = []
    setDocuments([])
    setShowSetup(false)
    saveToDb(userId, newItems, null, [], newCarInfo)
    showToast(`✓ ${newCarInfo.make} ${newCarInfo.model} добавен`)
  }

  function deleteCarFromGarage(id) {
    if (garageRef.current.length <= 1) { showToast('Не може да изтриеш последния автомобил'); return }
    if (!confirm('Изтрий този автомобил и всички негови данни?')) return
    const updated = garageRef.current.filter(c => c.id !== id)
    garageRef.current = updated
    if (id === activeCarId) {
      const first = updated[0]
      setActiveCarId(first.id)
      loadCarIntoState(first, null)
    }
    saveToDb(userId, items, odo, manualExpensesRef.current, carInfo)
    showToast('Автомобилът е изтрит')
  }

  function saveEmailReminders(prefs) {
    setEmailReminders(prefs)
    const payload = {
      version:        2,
      garage:         garageRef.current,
      activeCarId,
      emailReminders: prefs,
    }
    persist(userId, payload)
    showToast('✓ Настройките са запазени')
  }

  function handleCarGenerated(newItems, newCarInfo) {
    if (garageRef.current.length > 0 && garageRef.current.some(c => c.id !== activeCarId || c.carInfo)) {
      handleCarGeneratedMulti(newItems, newCarInfo)
    } else {
      setCarInfo(newCarInfo)
      setItems(newItems)
      setShowSetup(false)
      saveToDb(userId, newItems, odo, manualExpensesRef.current, newCarInfo)
      showToast(`✓ Генерирана таблица за ${newCarInfo.make} ${newCarInfo.model}`)
    }
  }

  // ─── Share view (public, no login required) ────────────────────────────────
  if (shareData) {
    return <ShareView data={shareData} />
  }

  // ─── Wait for Clerk to initialise ───────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Зареждане…</span>
      </div>
    )
  }

  // ─── Sign-in gate ───────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="auth-screen">
        <div className="auth-intro">
          <h1>🔧 Сервизна книжка</h1>
          <p>
            {authMode === 'signIn'
              ? 'Влез в профила си, за да видиш и управляваш поддръжката на автомобила си.'
              : 'Създай профил, за да започнеш да следиш поддръжката на автомобила си.'}
          </p>
        </div>
        {authMode === 'signIn'
          ? <SignIn routing="hash" />
          : <SignUp routing="hash" />}
        <button
          className="btn btn-ghost btn-sm auth-toggle"
          onClick={() => setAuthMode(m => m === 'signIn' ? 'signUp' : 'signIn')}
        >
          {authMode === 'signIn' ? 'Нямаш профил? Регистрирай се' : 'Вече имаш профил? Влез'}
        </button>
      </div>
    )
  }

  // ─── Loading the user's data ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Зареждане на данните…</span>
      </div>
    )
  }

  // ─── First-run setup screen ───────────────────────────────────────────────
  if (showSetup && !carInfo) {
    return <CarSetup onGenerated={handleCarGenerated} existingCarInfo={null} />
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="hdr">
        <div className="hdr-top">
          <div className="car-id">
            <div className="vlogo car-initial">
              <CarLogo make={carInfo?.make} />
            </div>
            <div>
              <h1>
                {carInfo ? `${carInfo.make} ${carInfo.model} · ${carInfo.year}` : 'Моят автомобил'}
              </h1>
              <span className="car-setup-link" onClick={() => setShowSetup(true)}>Смени автомобил</span>
            </div>
          </div>
          <div className="hdr-btns">
            <button className="print-btn" onClick={() => window.print()}>🖨 Продажба</button>
            <button className="print-btn" onClick={generateShareLink}>🔗 Сподели</button>
            <button className="btn btn-ghost" onClick={() => { setEditItem(null); setModalOpen(true) }}>＋ Добави</button>
            <button className="btn btn-ghost" onClick={doExport}>↑ Експорт</button>
            <button className="btn btn-ghost" onClick={() => impRef.current?.click()}>↓ Импорт</button>
            <button className="btn btn-red"   onClick={doReset}>⟳ Нулиране</button>
            <input ref={impRef} type="file" id="imp" accept=".json" onChange={doImport} />
            {syncStatus !== 'idle' && (
              <span className={`sync-dot sync-dot-${syncStatus}`} title={syncLabel}/>
            )}

            <EmailReminderToggle
              enabled={emailReminders.enabled}
              email={emailReminders.email}
              onSave={saveEmailReminders}
            />

            {/* ── Theme switcher ── */}
            <div className="theme-switcher">
              <button className="theme-btn" onClick={() => setThemeOpen(o => !o)} title="Смени тема">
                🎨 {THEMES.find(t => t.id === theme)?.label}
              </button>
              {themeOpen && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:299 }} onClick={() => setThemeOpen(false)} />
                  <div className="theme-menu">
                    {THEMES.map(t => (
                      <div
                        key={t.id}
                        className={`theme-opt${theme === t.id ? ' active' : ''}`}
                        onClick={() => switchTheme(t.id)}
                      >
                        <span className="theme-swatch" style={{ background: t.swatch, borderColor: t.border }} />
                        {t.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Account ── */}
            <div className="sync-divider" />
            {user?.primaryEmailAddress && (
              <span className="sync-info" title="Влязъл си с този имейл">☁ {user.primaryEmailAddress.emailAddress}</span>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="tabs">
            {[
              { id: 'main', label: '📋 Всички' },
              { id: 'attn', label: '⚠️ Нужно внимание', badge: urgentCount },
              { id: 'year', label: '📅 Тази Година' },
              { id: 'exp',  label: '💸 Разходи' },
              { id: 'slog', label: '🔧 Сервиз' },
              { id: 'docs', label: '📄 Документи' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab${activeTab === tab.id ? ' on' : ''}`}
                onClick={() => switchTab(tab.id)}
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

        {/* Return-user banner */}
        {returnBanner && (
          <div className="retention-banner retention-banner-warn">
            <span>👋 Добре дошъл обратно! Имаш <strong>{urgentCount}</strong> позиц{urgentCount === 1 ? 'ия' : 'ии'}, които изискват внимание.</span>
            <div className="retention-banner-actions">
              <button className="btn btn-pri btn-sm" onClick={() => { switchTab('attn'); setReturnBanner(false) }}>Виж</button>
              <button className="retention-banner-close" onClick={() => setReturnBanner(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Overdue banner — shown on main tab when items are overdue */}
        {!urgentBannerDismissed && overdueCount > 0 && activeTab === 'main' && (
          <div className="retention-banner retention-banner-red">
            <span>🔴 <strong>{overdueCount}</strong> позиц{overdueCount === 1 ? 'ия е просрочена' : 'ии са просрочени'} — необходимо е спешно обслужване.</span>
            <div className="retention-banner-actions">
              <button className="btn btn-sm" style={{background:'#fff',color:'var(--red)'}} onClick={() => switchTab('attn')}>Виж</button>
              <button className="retention-banner-close" onClick={() => { setUrgentBannerDismissed(true); sessionStorage.setItem('bannerDismissed','1') }}>✕</button>
            </div>
          </div>
        )}

        {/* Document expiry banners */}
        {documents.filter(d => {
          if (!d.expiryDate) return false
          const days = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000)
          return days <= 30
        }).map(d => {
          const days = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000)
          const cls  = days <= 0 ? 'retention-banner-red' : days <= 7 ? 'retention-banner-red' : 'retention-banner-warn'
          const msg  = days <= 0
            ? `📋 "${d.name}" е изтекъл преди ${Math.abs(days)} дни!`
            : `📋 "${d.name}" изтича след ${days} дн.`
          return (
            <div key={d.id} className={`retention-banner ${cls}`}>
              <span>{msg}</span>
              <button className="retention-banner-close" onClick={() => switchTab('docs')}>Виж →</button>
            </div>
          )
        })}

        {activeTab === 'main' && (
          <>
            <StatsRow
              items={items}
              odo={odo}
              activeFilter={statusFilter}
              onFilter={s => setStatusFilter(f => f === s ? null : s)}
              onOdoChange={updateOdo}
            />
            <MainTable
              grouped={grouped}
              items={sortedItems().filter(i => {
                const q = searchQuery.trim().toLowerCase()
                if (q) {
                  const hit = i.name?.toLowerCase().includes(q) ||
                              i.note?.toLowerCase().includes(q) ||
                              i.cat?.toLowerCase().includes(q)
                  if (!hit) return false
                  // searching overrides the hidden filter — show matching hidden items
                } else {
                  if (i.hidden && !showHidden) return false
                }
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
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />
          </>
        )}

        {activeTab === 'attn' && (
          <NeedsAttention items={items} odo={odo} onMark={markReplaced} />
        )}

        {activeTab === 'year' && (
          <ThisYear items={items} odo={odo} />
        )}

        {activeTab === 'exp' && (
          <Expenses items={items} manualExpenses={manualExpenses} onAddExpense={addExpense} onDeleteExpense={deleteExpense} onUpdateField={updateExpenseField} />
        )}

        {activeTab === 'slog' && (
          <>
            <ServiceLog
              entries={serviceLog}
              onAdd={() => { setEditServiceEntry(null); setServiceModalOpen(true) }}
              onEdit={entry => { setEditServiceEntry(entry); setServiceModalOpen(true) }}
              onDelete={deleteServiceEntry}
            />
          </>
        )}

        {activeTab === 'docs' && (
          <DocumentVault
            docs={documents}
            onAdd={() => { setEditDoc(null); setDocModalOpen(true) }}
            onEdit={doc => { setEditDoc(doc); setDocModalOpen(true) }}
            onDelete={deleteDoc}
          />
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

      {/* ── Service Log Modal ──────────────────────────────────────────────── */}
      {serviceModalOpen && (
        <ServiceLogModal
          entry={editServiceEntry}
          onSave={data => {
            if (editServiceEntry) updateServiceEntry(data)
            else addServiceEntry(data)
            setServiceModalOpen(false)
            setEditServiceEntry(null)
          }}
          onClose={() => { setServiceModalOpen(false); setEditServiceEntry(null) }}
        />
      )}

      {/* ── Document Modal ─────────────────────────────────────────────────── */}
      {docModalOpen && (
        <DocumentModal
          doc={editDoc}
          onSave={data => {
            if (editDoc) updateDoc(data)
            else addDoc(data)
            setDocModalOpen(false)
            setEditDoc(null)
          }}
          onClose={() => { setDocModalOpen(false); setEditDoc(null) }}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <Toast msg={toast.msg} on={toast.on} />

      {/* ── Change car modal ───────────────────────────────────────────────── */}
      {showSetup && carInfo && (
        <CarSetup
          onGenerated={handleCarGenerated}
          existingCarInfo={carInfo}
          onClose={() => setShowSetup(false)}
        />
      )}

      {/* ── Print Report ───────────────────────────────────────────────────── */}
      <PrintReport
        carInfo={carInfo}
        odo={odo}
        items={items}
        serviceLog={serviceLog}
        manualExpenses={manualExpenses}
        calcNextDue={calcNextDue}
        CAT_ORDER={CAT_ORDER}
      />
    </>
  )
}
