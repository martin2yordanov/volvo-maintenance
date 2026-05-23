import { useState, useEffect } from 'react'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  title: '',
  date: today(),
  km: '',
  description: '',
  parts: '',
  costBgn: '',
  mechanic: '',
}

export default function ServiceLogModal({ entry, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (entry) {
      setForm({
        title:       entry.title       || '',
        date:        entry.date        || today(),
        km:          entry.km          ?? '',
        description: entry.description || '',
        parts:       entry.parts       || '',
        costBgn:     entry.costBgn     ?? '',
        mechanic:    entry.mechanic    || '',
      })
    } else {
      setForm({ ...EMPTY, date: today() })
    }
  }, [entry])

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSave() {
    if (!form.title.trim()) { alert('Въведи заглавие.'); return }
    onSave({
      title:       form.title.trim(),
      date:        form.date || today(),
      km:          parseInt(form.km)        || null,
      description: form.description.trim(),
      parts:       form.parts.trim(),
      costBgn:     parseFloat(form.costBgn) || null,
      mechanic:    form.mechanic.trim(),
    })
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="mover on" onClick={handleOverlay}>
      <div className="modal">
        <h2>{entry ? 'Редактирай запис' : 'Добави сервизен запис'}</h2>

        <div className="fg">
          <label>Заглавие</label>
          <input
            className="fi"
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="напр. Смяна на масло"
            autoFocus
          />
        </div>

        <div className="frow">
          <div className="fg">
            <label>Дата</label>
            <input
              className="fi"
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Пробег км</label>
            <input
              className="fi"
              type="number"
              value={form.km}
              onChange={e => set('km', e.target.value)}
              placeholder="напр. 150000"
              min="0"
            />
          </div>
        </div>

        <div className="fg">
          <label>Описание</label>
          <textarea
            className="fi"
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Подробности за извършеното"
          />
        </div>

        <div className="fg">
          <label>Части / материали</label>
          <input
            className="fi"
            type="text"
            value={form.parts}
            onChange={e => set('parts', e.target.value)}
            placeholder="напр. Маслен филтър, въздушен филтър"
          />
        </div>

        <div className="frow">
          <div className="fg">
            <label>Цена BGN</label>
            <input
              className="fi"
              type="number"
              value={form.costBgn}
              onChange={e => set('costBgn', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div className="fg">
            <label>Майстор</label>
            <input
              className="fi"
              type="text"
              value={form.mechanic}
              onChange={e => set('mechanic', e.target.value)}
              placeholder="напр. Иван Петров"
            />
          </div>
        </div>

        <div className="mact">
          <button className="btn btn-ghost" onClick={onClose}>Отказ</button>
          <button className="btn btn-pri"   onClick={handleSave}>Запази</button>
        </div>
      </div>
    </div>
  )
}
