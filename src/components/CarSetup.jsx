import { useState } from 'react'

export default function CarSetup({ onGenerated, existingCarInfo, onClose }) {
  const currentYear = new Date().getFullYear()
  const [make,  setMake]  = useState(existingCarInfo?.make  || '')
  const [model, setModel] = useState(existingCarInfo?.model || '')
  const [year,  setYear]  = useState(existingCarInfo?.year  || '')
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    const y = parseInt(year)
    if (!make.trim() || !model.trim() || !y || y < 1980 || y > currentYear) {
      setError('Попълни марка, модел и валидна година (1980–' + currentYear + ').')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ make: make.trim(), model: model.trim(), year: y }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Грешка при генериране')
      onGenerated(data.items, { make: make.trim(), model: model.trim(), year: y })
    } catch (err) {
      setError(err.message || 'Неуспешно генериране. Опитай отново.')
    } finally {
      setBusy(false)
    }
  }

  const isModal = !!existingCarInfo

  return (
    <div className={isModal ? 'mover on' : 'setup-screen'}>
      <div className="modal setup-modal">
        <h2>{isModal ? 'Смени автомобил' : 'Въведи своя автомобил'}</h2>
        <p className="setup-sub">
          {isModal
            ? 'Ще бъде генерирана нова персонализирана таблица за новия автомобил.'
            : 'Ще генерираме персонализирана сервизна таблица специално за твоя автомобил.'}
        </p>

        <div className="setup-fields">
          <div className="form-row">
            <label>Марка</label>
            <input
              type="text"
              className="fi"
              placeholder="напр. Toyota"
              value={make}
              onChange={e => setMake(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="form-row">
            <label>Модел</label>
            <input
              type="text"
              className="fi"
              placeholder="напр. Corolla"
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="form-row">
            <label>Година</label>
            <input
              type="number"
              className="fi"
              placeholder="напр. 2018"
              min="1980"
              max={currentYear}
              value={year}
              onChange={e => setYear(e.target.value)}
              disabled={busy}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
          </div>
        </div>

        {error && <p className="setup-error">{error}</p>}

        <div className="setup-actions">
          <button className="btn btn-pri" onClick={handleGenerate} disabled={busy}>
            {busy ? <><span className="spinner spinner-sm" /> Генериране…</> : '✦ Генерирай таблица'}
          </button>
          {isModal && onClose && (
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отказ</button>
          )}
        </div>

        {busy && (
          <p className="setup-hint">
            Анализираме {make} {model} {year} — обикновено отнема 10–20 секунди…
          </p>
        )}
      </div>
    </div>
  )
}
