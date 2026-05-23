export default function PrintReport({ carInfo, odo, items, serviceLog, manualExpenses, calcNextDue, CAT_ORDER }) {
  const now = new Date()
  const printDate = now.toLocaleDateString('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' })

  // Stats
  const activeItems = items.filter(i => !i.replaced)
  const overdueItems = activeItems.filter(i => calcNextDue(i, odo).status === 'red')
  const warnItems    = activeItems.filter(i => calcNextDue(i, odo).status === 'warn')

  const totalSpent = (() => {
    const fromLog = (serviceLog || []).reduce((sum, e) => sum + (parseFloat(e.costBgn) || 0), 0)
    const fromExp = (manualExpenses || [])
      .filter(e => !e._deleted && e.manual)
      .reduce((sum, e) => sum + (parseFloat(e.bgn || e.eur || 0) || 0), 0)
    return fromLog + fromExp
  })()

  // Maintenance items to display (non-replaced, sorted by category)
  const maintenanceRows = [...activeItems].sort((a, b) => {
    const ai = CAT_ORDER.indexOf(a.cat)
    const bi = CAT_ORDER.indexOf(b.cat)
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })

  function statusLabel(item) {
    const s = calcNextDue(item, odo).status
    if (s === 'red')  return { label: 'Просрочено', cls: 'pr-red' }
    if (s === 'warn') return { label: 'Внимание',   cls: 'pr-warn' }
    if (s === 'ok')   return { label: 'Ок',          cls: 'pr-ok' }
    return { label: 'Неизвестно', cls: '' }
  }

  function nextDueText(item) {
    const c = calcNextDue(item, odo)
    if (c.nextKm)   return `${c.nextKm.toLocaleString('bg-BG')} км`
    if (c.nextDate) return c.nextDate
    return '—'
  }

  // Service log sorted newest first
  const logSorted = [...(serviceLog || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const carName = carInfo ? `${carInfo.make} ${carInfo.model}` : 'Моят автомобил'
  const carInitial = (carInfo?.make || 'A')[0].toUpperCase()

  return (
    <div className="print-report">
      <div className="print-page">
        {/* Header */}
        <div className="pr-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.5rem' }}>
              <div style={{
                width: '3rem', height: '3rem', background: '#1d1d1f',
                borderRadius: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 800,
                flexShrink: 0,
              }}>
                {carInitial}
              </div>
              <div>
                <div className="pr-car-name">{carName}</div>
                <div className="pr-car-sub">
                  {carInfo?.year && `${carInfo.year} г.`}
                  {odo && ` · ${Number(odo).toLocaleString('bg-BG')} км`}
                </div>
              </div>
            </div>
          </div>
          <div className="pr-date">
            <div style={{ fontWeight: 700, marginBottom: '.25rem' }}>Технически доклад</div>
            <div>{printDate}</div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="pr-section">
          <div className="pr-section-title">Обобщение</div>
          <div className="pr-grid">
            <div className="pr-stat">
              <div className="pr-stat-val">{activeItems.length}</div>
              <div className="pr-stat-lbl">Общо позиции</div>
            </div>
            <div className="pr-stat">
              <div className="pr-stat-val" style={{ color: overdueItems.length > 0 ? '#ff3b30' : '#1d1d1f' }}>
                {overdueItems.length}
              </div>
              <div className="pr-stat-lbl">Просрочени</div>
            </div>
            <div className="pr-stat">
              <div className="pr-stat-val" style={{ color: warnItems.length > 0 ? '#ff9f0a' : '#1d1d1f' }}>
                {warnItems.length}
              </div>
              <div className="pr-stat-lbl">Нужно внимание</div>
            </div>
            <div className="pr-stat">
              <div className="pr-stat-val">{totalSpent.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="pr-stat-lbl">Общо разходи (лв.)</div>
            </div>
            <div className="pr-stat">
              <div className="pr-stat-val">{odo ? Number(odo).toLocaleString('bg-BG') : '—'}</div>
              <div className="pr-stat-lbl">Текущ пробег (км)</div>
            </div>
            <div className="pr-stat">
              <div className="pr-stat-val">{logSorted.length}</div>
              <div className="pr-stat-lbl">Сервизни записа</div>
            </div>
          </div>
        </div>

        {/* Maintenance table */}
        <div className="pr-section">
          <div className="pr-section-title">Таблица за поддръжка</div>
          <table className="pr-table">
            <thead>
              <tr>
                <th>Позиция</th>
                <th>Категория</th>
                <th>Статус</th>
                <th>Последна смяна</th>
                <th>Следваща смяна</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRows.map(item => {
                const { label, cls } = statusLabel(item)
                const lastInfo = [
                  item.lastDate && item.lastDate.slice(0, 7),
                  item.lastKm && `${Number(item.lastKm).toLocaleString('bg-BG')} км`,
                ].filter(Boolean).join(' · ') || '—'

                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong>{item.note && <div style={{ fontSize: '.68rem', color: '#6e6e73' }}>{item.note}</div>}</td>
                    <td>{item.cat || '—'}</td>
                    <td className={cls}>{label}</td>
                    <td>{lastInfo}</td>
                    <td>{nextDueText(item)}</td>
                  </tr>
                )
              })}
              {maintenanceRows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aeaeb2' }}>Няма данни</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service history page */}
      <div className="print-page">
        <div className="pr-section">
          <div className="pr-section-title">История на сервизните дейности</div>
          <table className="pr-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Км</th>
                <th>Заглавие</th>
                <th>Описание</th>
                <th>Части</th>
                <th>Цена BGN</th>
                <th>Майстор</th>
              </tr>
            </thead>
            <tbody>
              {logSorted.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.date || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.km ? Number(e.km).toLocaleString('bg-BG') : '—'}</td>
                  <td><strong>{e.title}</strong></td>
                  <td>{e.description || '—'}</td>
                  <td>{e.parts || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {e.costBgn != null && e.costBgn !== ''
                      ? Number(e.costBgn).toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '—'}
                  </td>
                  <td>{e.mechanic || '—'}</td>
                </tr>
              ))}
              {logSorted.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aeaeb2' }}>Няма сервизни записи</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signature lines */}
        <div className="pr-sign">
          <div>
            <div className="pr-sign-line">Продавач</div>
          </div>
          <div>
            <div className="pr-sign-line">Купувач</div>
          </div>
        </div>
      </div>
    </div>
  )
}
