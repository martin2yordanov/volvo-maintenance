const TYPE_LABELS = {
  gtp:          '🔍 ГТП',
  go:           '🛡️ ГО',
  vignette:     '🏷️ Винетка',
  registration: '📋 Регистрация',
  other:        '📄 Друго',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

function ExpiryChip({ dateStr }) {
  if (!dateStr) return null
  const days = daysUntil(dateStr)
  if (days === null) return null

  if (days <= 0) {
    return (
      <span className="doc-chip doc-chip-red">
        Изтекъл {Math.abs(days)} дни назад
      </span>
    )
  }
  if (days <= 7) {
    return <span className="doc-chip doc-chip-red">Изтича след {days} дн.</span>
  }
  if (days <= 30) {
    return <span className="doc-chip doc-chip-warn">Изтича след {days} дн.</span>
  }
  return <span className="doc-chip doc-chip-ok">Изтича след {days} дн.</span>
}

export default function DocumentVault({ docs, onAdd, onEdit, onDelete }) {
  return (
    <div>
      {docs.length === 0 ? (
        <div className="doc-empty">
          Няма добавени документи. Добави застраховка, ГТП или винетка.
        </div>
      ) : (
        <div className="doc-list">
          {docs.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-icon">{TYPE_LABELS[doc.type]?.split(' ')[0] ?? '📄'}</div>
              <div className="doc-body">
                <div className="doc-name">{doc.name || TYPE_LABELS[doc.type] || 'Документ'}</div>
                <div className="doc-sub">
                  {TYPE_LABELS[doc.type]}
                  {doc.expiryDate ? ` · ${new Date(doc.expiryDate + 'T00:00:00').toLocaleDateString('bg-BG')}` : ''}
                  {doc.notes ? ` · ${doc.notes}` : ''}
                </div>
              </div>
              <ExpiryChip dateStr={doc.expiryDate} />
              <div className="doc-actions">
                <button className="ibtn" title="Редактирай" onClick={() => onEdit(doc)}>✏️</button>
                <button className="ibtn del" title="Изтрий" onClick={() => onDelete(doc.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="slog-add-btn" onClick={onAdd}>
        ＋ Добави документ
      </button>
    </div>
  )
}
