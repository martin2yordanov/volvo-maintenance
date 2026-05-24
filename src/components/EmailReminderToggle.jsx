import { useState } from 'react'

export default function EmailReminderToggle({ enabled, email: initialEmail, onSave }) {
  const [open,    setOpen]    = useState(false)
  const [em,      setEm]      = useState(initialEmail || '')
  const [checked, setChecked] = useState(enabled || false)

  if (!open) return (
    <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} title="Напомняния по имейл">
      🔔 Напомняния
    </button>
  )

  return (
    <div className="email-reminder-panel">
      <label className="er-row">
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
        <span>Седмични напомняния по имейл</span>
      </label>
      {checked && (
        <input
          className="sync-input"
          type="email"
          placeholder="your@email.com"
          value={em}
          onChange={e => setEm(e.target.value)}
        />
      )}
      <div className="er-actions">
        <button className="btn btn-pri btn-sm" onClick={() => { onSave({ enabled: checked, email: em }); setOpen(false) }}>Запази</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button>
      </div>
    </div>
  )
}
