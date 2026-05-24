import { useState, useEffect } from 'react'

const TYPE_OPTIONS = [
  { value: 'gtp',          label: '🔍 ГТП' },
  { value: 'go',           label: '🛡️ ГО' },
  { value: 'vignette',     label: '🏷️ Винетка' },
  { value: 'registration', label: '📋 Регистрация' },
  { value: 'other',        label: '📄 Друго' },
]

const EMPTY = {
  type:       'gtp',
  name:       '',
  expiryDate: '',
  notes:      '',
}

export default function DocumentModal({ doc, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (doc) {
      setForm({
        type:       doc.type       || 'gtp',
        name:       doc.name       || '',
        expiryDate: doc.expiryDate || '',
        notes:      doc.notes      || '',
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [doc])

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSave() {
    if (!form.name.trim()) { alert('Въведи наименование.'); return }
    onSave({
      type:       form.type,
      name:       form.name.trim(),
      expiryDate: form.expiryDate || null,
      notes:      form.notes.trim(),
    })
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="mover on" onClick={handleOverlay}>
      <div className="modal">
        <h2>{doc ? 'Редактирай документ' : 'Добави документ'}</h2>

        <div className="fg">
          <label>Тип</label>
          <select
            className="fi"
            value={form.type}
            onChange={e => set('type', e.target.value)}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="fg">
          <label>Наименование</label>
          <input
            className="fi"
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="напр. ДЗИ 2025"
            autoFocus
          />
        </div>

        <div className="fg">
          <label>Дата на изтичане</label>
          <input
            className="fi"
            type="date"
            value={form.expiryDate}
            onChange={e => set('expiryDate', e.target.value)}
          />
        </div>

        <div className="fg">
          <label>Бележки</label>
          <textarea
            className="fi"
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Допълнителна информация (незадължително)"
          />
        </div>

        <div className="mact">
          <button className="btn btn-ghost" onClick={onClose}>Отказ</button>
          <button className="btn btn-pri"   onClick={handleSave}>Запази</button>
        </div>
      </div>
    </div>
  )
}
