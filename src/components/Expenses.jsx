import { useState } from 'react'
import { EXPENSES, fmtExpDate, fmtMoney } from '../lib/expenses'

const R = 1.95583

export default function Expenses({ items = [], manualExpenses = [], onAddExpense, onDeleteExpense, onUpdItem }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ date: '', description: '', eur: '' })

  // Dynamic entries from maintenance items that have a cost and a date set
  const itemEntries = items
    .filter(i => i.cost && i.lastDate)
    .map(i => ({
      id: `item-${i.id}`,
      date: i.lastDate,
      year: parseInt(i.lastDate.split('-')[0]),
      description: i.name,
      eur: i.cost,
      bgn: Math.round(i.cost * R * 100) / 100,
    }))

  // IDs of static entries the user has deleted (stored as tombstones)
  const deletedIds = new Set(manualExpenses.filter(e => e._deleted).map(e => e.id))
  const activeManual = manualExpenses.filter(e => e.manual)

  const allExpenses = [...EXPENSES.filter(e => !deletedIds.has(e.id)), ...itemEntries, ...activeManual]

  // Group by year
  const byYear = {}
  allExpenses.forEach(e => {
    if (!byYear[e.year]) byYear[e.year] = []
    byYear[e.year].push(e)
  })
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b)

  const grandBgn = allExpenses.reduce((s, e) => s + e.bgn, 0)
  const grandEur = allExpenses.reduce((s, e) => s + e.eur, 0)

  function openAdd() {
    const now = new Date()
    setForm({ date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, description: '', eur: '' })
    setAdding(true)
  }

  function handleAdd() {
    if (!form.description.trim() || !form.eur || !form.date) return
    const eur = parseFloat(form.eur)
    onAddExpense({
      id: Date.now(),
      date: form.date,
      year: parseInt(form.date.split('-')[0]),
      description: form.description.trim(),
      eur,
      bgn: Math.round(eur * R * 100) / 100,
      manual: true,
    })
    setAdding(false)
  }

  function handleDelete(entry) {
    if (!confirm('Изтрий този разход?')) return
    onDeleteExpense(entry)
  }

  return (
    <div className="exp-wrap">
      {years.map(year => {
        const entries = byYear[year]
        const totalBgn = entries.reduce((s, e) => s + e.bgn, 0)
        const totalEur = entries.reduce((s, e) => s + e.eur, 0)

        return (
          <div key={year} className="exp-year-block">
            {/* ── Year heading ── */}
            <div className="fytitle">
              {year}
              <span className="ytag y-now">{fmtMoney(totalEur)} €</span>
              <span className="ytag y-nxt">{fmtMoney(totalBgn)} лв</span>
            </div>

            {/* ── Year table ── */}
            <div className="tbl-wrap" style={{ marginBottom: '2rem' }}>
              <div className="tbl-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Описание</th>
                      <th className="exp-num-hdr">Стойност (лв)</th>
                      <th className="exp-num-hdr">Стойност (€)</th>
                      <th style={{ width: '2rem' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e.id} className={e.manual ? 'exp-manual' : undefined}>
                        <td className="exp-date">{fmtExpDate(e.date)}</td>
                        <td className="iname">{e.description}</td>
                        <td className="exp-num">{fmtMoney(e.bgn)}</td>
                        <td className="exp-num">{fmtMoney(e.eur)}</td>
                        <td className="c">
                          <button className="ibtn del" onClick={() => handleDelete(e)} title="Изтрий">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="exp-total-row">
                      <td colSpan={2}>Общо за {year}</td>
                      <td className="exp-num">{fmtMoney(totalBgn)}</td>
                      <td className="exp-num">{fmtMoney(totalEur)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Add expense form / button ── */}
      {adding ? (
        <div className="exp-add-form">
          <input
            type="month"
            className="ecell"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ minWidth: '130px' }}
          />
          <input
            type="text"
            className="ecell"
            placeholder="Описание"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ flex: 1, minWidth: '160px' }}
            autoFocus
          />
          <input
            type="number"
            className="ecell"
            placeholder="Сума (€)"
            min="0"
            step="0.01"
            value={form.eur}
            onChange={e => setForm(f => ({ ...f, eur: e.target.value }))}
            style={{ minWidth: '90px' }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn btn-pri btn-sm" onClick={handleAdd}>Запази</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Отказ</button>
        </div>
      ) : (
        <div className="exp-add-btn-row">
          <button className="btn btn-ghost" onClick={openAdd}>＋ Добави разход</button>
        </div>
      )}

      {/* ── Grand total ── */}
      <div className="exp-grand">
        <div className="exp-grand-label">Общо за всички години</div>
        <div className="exp-grand-vals">
          <div className="exp-grand-item">
            <span className="exp-grand-lbl">лв</span>
            <span className="exp-grand-num">{fmtMoney(grandBgn)}</span>
          </div>
          <div className="exp-grand-sep">/</div>
          <div className="exp-grand-item">
            <span className="exp-grand-lbl">€</span>
            <span className="exp-grand-num">{fmtMoney(grandEur)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
