import { calcNextDue, defaultCmp } from '../lib/data'

export default function ThisYear({ items, odo }) {
  const yr = new Date().getFullYear()
  const yEnd  = new Date(yr, 11, 31).getTime()
  const nowMs = new Date().setHours(0,0,0,0)

  const relevant = items.filter(i => {
    if (i.replaced) return false
    const c = calcNextDue(i, odo)
    if (c.status === 'red') return true
    if (c.nextMs && c.nextMs >= nowMs && c.nextMs <= yEnd) return true
    const dLeft = Math.ceil((yEnd - nowMs) / 86400000)
    if (c.dKm !== null && c.dKm >= 0 && c.dKm <= dLeft) return true
    return false
  })

  relevant.sort((a, b) => defaultCmp(a, b, odo))

  if (!relevant.length) {
    return <div className="empty">🎉 Няма планирани смени за {yr}!</div>
  }

  return (
    <>
      <div className="sec-ttl">
        Предстоящи смени — <span style={{ color:'var(--acc)', marginLeft:'.3rem' }}>{yr}</span>
      </div>
      <div className="fitems">
        {relevant.map(item => {
          const c = calcNextDue(item, odo)
          const bc = c.status === 'red' ? 'b-red' : c.status === 'warn' ? 'b-warn' : 'b-ok'
          const bt = c.status === 'red' ? 'Просрочено' : c.status === 'warn' ? 'Предстои' : 'Добре'
          const parts = [c.ds !== '—' ? c.ds : '', c.ks !== '—' ? c.ks : ''].filter(Boolean).join(' · ')

          return (
            <div key={item.id} className="fitem">
              <div>
                <div className="fname">{item.name}</div>
                <div style={{ fontSize:'.63rem', color:'var(--txt3)', fontFamily:'var(--fm)' }}>{item.cat}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexWrap:'wrap' }}>
                {parts && <div className="fdue">{parts}</div>}
                <span className={`badge ${bc}`}>{bt}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
