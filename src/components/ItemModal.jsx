import { useState, useEffect } from 'react'

const EMPTY = {
  name: '', cat: '', intervalKm: '', intervalYr: '',
  lastDate: '', lastKm: '', note: '', importance: 5, cost: ''
}

export default function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (item) {
      setForm({
        name:       item.name       || '',
        cat:        item.cat        || '',
        intervalKm: item.intervalKm || '',
        intervalYr: item.intervalYr || '',
        lastDate:   item.lastDate   || '',
        lastKm:     item.lastKm     || '',
        note:       item.note       || '',
        importance: item.importance || 5,
        cost:       item.cost       || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [item])

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSave() {
    if (!form.name.trim()) { alert('Въведи наименование.'); return }
    onSave({
      name:       form.name.trim(),
      cat:        form.cat.trim() || 'Друго',
      note:       form.note.trim(),
      intervalKm: parseInt(form.intervalKm)    || null,
      intervalYr: parseFloat(form.intervalYr)  || null,
      lastDate:   form.lastDate                || null,
      lastKm:     parseInt(form.lastKm)        || null,
      importance: parseInt(form.importance)    || 5,
      cost:       parseFloat(form.cost)        || null,
    })
  }

  // Close on overlay click
  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="mover on" onClick={handleOverlay}>
      <div className="modal">
        <h2>{item ? 'Редактирай позиция' : 'Добави позиция'}</h2>

        <div className="fg">
          <label>Наименование</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="напр. Масло + филтри" />
        </div>

        <div className="fg">
          <label>Категория</label>
          <input type="text" value={form.cat} onChange={e => set('cat', e.target.value)}
            placeholder="напр. Двигател" />
        </div>

        <div className="frow">
          <div className="fg">
            <label>Интервал (км)</label>
            <input type="number" value={form.intervalKm} onChange={e => set('intervalKm', e.target.value)}
              placeholder="10000" />
          </div>
          <div className="fg">
            <label>Интервал (год.)</label>
            <input type="number" step="0.5" value={form.intervalYr} onChange={e => set('intervalYr', e.target.value)}
              placeholder="1" />
          </div>
        </div>

        <div className="frow">
          <div className="fg">
            <label>Последна смяна (м/г)</label>
            <input type="month" value={form.lastDate} onChange={e => set('lastDate', e.target.value)} />
          </div>
          <div className="fg">
            <label>Последна смяна (км)</label>
            <input type="number" value={form.lastKm} onChange={e => set('lastKm', e.target.value)}
              placeholder="450000" />
          </div>
        </div>

        <div className="fg">
          <label>Бележка</label>
          <input type="text" value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="незадължително" />
        </div>

        <div className="fg">
          <label>Важност (1–10) — безопасност и последствия</label>
          <input type="number" min="1" max="10" value={form.importance}
            onChange={e => set('importance', e.target.value)} placeholder="1–10" />
        </div>

        <div className="fg">
          <label>Цена на ремонта/поддръжката (€)</label>
          <input type="number" min="0" step="0.01" value={form.cost}
            onChange={e => set('cost', e.target.value)} placeholder="напр. 150.00" />
        </div>

        <div className="mact">
          <button className="btn btn-ghost" onClick={onClose}>Отказ</button>
          <button className="btn btn-pri"   onClick={handleSave}>Запази</button>
        </div>
      </div>
    </div>
  )
}
