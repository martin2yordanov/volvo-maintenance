export default function ServiceLog({ entries, onAdd, onEdit, onDelete }) {
  const sorted = [...entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const total = entries.reduce((sum, e) => sum + (parseFloat(e.costBgn) || 0), 0)

  function formatDate(dateStr) {
    if (!dateStr) return { day: '—', mon: '', yr: '' }
    const d = new Date(dateStr + 'T00:00:00')
    const day = String(d.getDate()).padStart(2, '0')
    const mon = d.toLocaleString('bg-BG', { month: 'short' }).replace('.', '')
    const yr  = d.getFullYear()
    return { day, mon, yr }
  }

  return (
    <div>
      {/* Total banner */}
      <div className="slog-total">
        <span className="slog-total-label">Общо изразходвани</span>
        <span className="slog-total-amount">{total.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} лв.</span>
      </div>

      {/* Entry list */}
      {sorted.length === 0 ? (
        <div className="slog-empty">
          Все още няма записи. Добави първия сервизен запис.
        </div>
      ) : (
        <div className="slog-list">
          {sorted.map(entry => {
            const { day, mon, yr } = formatDate(entry.date)
            return (
              <div key={entry.id} className="slog-entry">
                {/* Date column */}
                <div className="slog-date-col">
                  <span className="slog-date-day">{day}</span>
                  <span className="slog-date-mon">{mon}</span>
                  <span className="slog-date-yr">{yr}</span>
                </div>

                {/* Body */}
                <div className="slog-body">
                  <div className="slog-title">{entry.title}</div>
                  {entry.description && (
                    <div className="slog-desc">{entry.description}</div>
                  )}
                  <div className="slog-meta">
                    {entry.km && (
                      <span className="slog-pill">🛣 {Number(entry.km).toLocaleString('bg-BG')} км</span>
                    )}
                    {entry.parts && (
                      <span className="slog-pill">🔩 {entry.parts}</span>
                    )}
                    {entry.mechanic && (
                      <span className="slog-pill">👤 {entry.mechanic}</span>
                    )}
                  </div>
                </div>

                {/* Right: cost + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.45rem', flexShrink: 0 }}>
                  {entry.costBgn != null && entry.costBgn !== '' && (
                    <span className="slog-cost">{Number(entry.costBgn).toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} лв.</span>
                  )}
                  <div className="slog-actions">
                    <button
                      className="ibtn"
                      title="Редактирай"
                      onClick={() => onEdit(entry)}
                    >✏️</button>
                    <button
                      className="ibtn del"
                      title="Изтрий"
                      onClick={() => onDelete(entry.id)}
                    >🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      <button className="slog-add-btn" onClick={onAdd}>
        ＋ Добави сервизен запис
      </button>
    </div>
  )
}
