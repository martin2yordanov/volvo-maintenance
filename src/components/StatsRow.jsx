import { calcNextDue } from '../lib/data'

export default function StatsRow({ items, odo }) {
  let ok = 0, warn = 0, red = 0, unk = 0
  items.forEach(i => {
    if (i.replaced) return
    const s = calcNextDue(i, odo).status
    if      (s === 'ok')   ok++
    else if (s === 'warn') warn++
    else if (s === 'red')  red++
    else                   unk++
  })

  return (
    <div className="stats">
      <div className="scard s-red">
        <div className="sval">{red}</div>
        <div className="slbl">Просрочени</div>
      </div>
      <div className="scard s-warn">
        <div className="sval">{warn}</div>
        <div className="slbl">Предстоящи</div>
      </div>
      <div className="scard s-ok">
        <div className="sval">{ok}</div>
        <div className="slbl">В ред</div>
      </div>
      <div className="scard" style={{ borderColor: 'var(--bord2)' }}>
        <div className="sval" style={{ color: 'var(--txt3)' }}>{unk}</div>
        <div className="slbl">Без история</div>
      </div>
      <div className="scard s-acc">
        <div className="sval">{odo ? odo.toLocaleString('bg') : '—'}</div>
        <div className="slbl">Текущ км</div>
      </div>
    </div>
  )
}
