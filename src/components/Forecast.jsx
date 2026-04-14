const KMY = 15000

export default function Forecast({ items, odo }) {
  const now = new Date()
  const yr = now.getFullYear()
  const maxYr = yr + 5
  const evts = []

  items.filter(i => !i.replaced).forEach(item => {
    if (!item.intervalYr && !item.intervalKm) return
    let pd = item.lastDate ? new Date(item.lastDate.length === 7 ? item.lastDate + '-01' : item.lastDate) : null
    let pk = item.lastKm || (odo ? odo - (item.intervalKm || 0) : null)

    for (let c = 0; c < 10; c++) {
      let ey = null, ds = '—', ks = ''
      if (pd && item.intervalYr) {
        const nd = new Date(pd)
        nd.setFullYear(nd.getFullYear() + Math.floor(item.intervalYr))
        const rem = item.intervalYr % 1
        if (rem) nd.setMonth(nd.getMonth() + Math.round(rem * 12))
        pd = nd; ey = nd.getFullYear(); ds = `${String(nd.getMonth()+1).padStart(2,'0')}.${nd.getFullYear()}`
      }
      if (pk && item.intervalKm) {
        pk += item.intervalKm
        ks = pk.toLocaleString('bg') + ' км'
        if (!ey && odo) ey = yr + Math.round((pk - odo) / KMY)
      }
      if (!ey || ey > maxYr) break
      if (ey >= yr) evts.push({ yr: ey, name: item.name, cat: item.cat, note: item.note, ds, ks })
    }
  })

  const byYr = {}
  for (let y = yr; y <= maxYr; y++) byYr[y] = []
  evts.forEach(e => { if (byYr[e.yr]) byYr[e.yr].push(e) })

  const years = []
  for (let y = yr; y <= maxYr; y++) {
    if (!byYr[y].length) continue
    const tag = y === yr
      ? <span className="ytag y-now">Тази година</span>
      : y === yr + 1
      ? <span className="ytag y-nxt">Следваща</span>
      : null

    years.push(
      <div key={y} className="fy">
        <div className="fytitle">{y} {tag}</div>
        <div className="fitems">
          {byYr[y].map((e, i) => (
            <div key={i} className="fitem">
              <div>
                <div className="fname">{e.name}</div>
                <div style={{ fontSize:'.63rem', color:'var(--txt3)', fontFamily:'var(--fm)' }}>{e.cat}</div>
              </div>
              <div className="fdue">
                {e.ds !== '—' ? e.ds : ''}{e.ds !== '—' && e.ks ? ' · ' : ''}{e.ks}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!years.length) {
    return <div className="empty">Няма данни за прогноза.</div>
  }

  return (
    <>
      <div className="sec-ttl">5-Годишна Прогноза</div>
      {years}
    </>
  )
}
