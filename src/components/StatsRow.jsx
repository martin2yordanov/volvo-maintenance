import { calcNextDue } from '../lib/data'

export default function StatsRow({ items, odo, activeFilter, onFilter }) {
  let ok = 0, warn = 0, red = 0, unk = 0
  items.forEach(i => {
    if (i.replaced) return
    const s = calcNextDue(i, odo).status
    if      (s === 'ok')   ok++
    else if (s === 'warn') warn++
    else if (s === 'red')  red++
    else                   unk++
  })

  const card = (key, cls, val, lbl, style) => (
    <div
      className={`scard ${cls}${activeFilter === key ? ' scard-active' : ''}`}
      style={style}
      onClick={() => onFilter(key)}
    >
      <div className="sval">{val}</div>
      <div className="slbl">{lbl}</div>
    </div>
  )

  return (
    <div className="stats">
      {card('red',  's-red',  red,  'Просрочени')}
      {card('warn', 's-warn', warn, 'Предстоящи')}
      {card('ok',   's-ok',   ok,   'В ред')}
      {card('unk',  '',       unk,  'Без история', { borderColor: 'var(--bord2)' })}
      <div className="scard s-acc">
        <div className="sval">{odo ? odo.toLocaleString('bg') : '—'}</div>
        <div className="slbl">Текущ км</div>
      </div>
    </div>
  )
}
