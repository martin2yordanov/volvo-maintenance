import { useState } from 'react'
import { CAT_ORDER, CAT_ICON, calcNextDue, defaultCmp, importanceBadge } from '../lib/data'

export default function NeedsAttention({ items, odo, onMark }) {
  const [collapsed, setCollapsed] = useState({})

  const urgent = items.filter(i => {
    if (i.replaced) return false
    const s = calcNextDue(i, odo).status
    return s === 'red' || s === 'warn'
  })

  if (!urgent.length) {
    return <div className="empty">✅ Всичко е наред — няма просрочени или предстоящи смени!</div>
  }

  // Group by category
  const grouped = {}
  CAT_ORDER.forEach(c => { grouped[c] = [] })
  urgent.forEach(item => {
    const c = item.cat || 'General'
    if (!grouped[c]) grouped[c] = []
    grouped[c].push(item)
  })

  const allCats = CAT_ORDER.concat(
    Object.keys(grouped).filter(c => CAT_ORDER.indexOf(c) < 0)
  )

  function toggle(cat) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div>
      {allCats.map(cat => {
        const group = grouped[cat]
        if (!group?.length) return null
        group.sort((a, b) => defaultCmp(a, b, odo))
        const isCollapsed = !!collapsed[cat]
        const icon = CAT_ICON[cat] || '📁'

        return (
          <div className="attn-group" key={cat}>
            <div className="attn-group-hdr" onClick={() => toggle(cat)}>
              <span className="attn-group-hdr-icon">{icon}</span>
              <span className="attn-group-hdr-title">{cat}</span>
              <span className="attn-group-hdr-count">
                {group.length} позиц{group.length === 1 ? 'ия' : 'ии'}
              </span>
              <span className={`attn-group-hdr-arrow${isCollapsed ? '' : ' open'}`}>▶</span>
            </div>

            <div className={`attn-group-body${isCollapsed ? ' collapsed' : ''}`}>
              {group.map(item => {
                const c = calcNextDue(item, odo)
                const isRed = c.status === 'red'
                const { color: impColor, text: impText } = importanceBadge(item.importance)

                const daysLabel = c.score < 0
                  ? `Просрочено с ${Math.abs(c.score)} дни`
                  : `След ${c.score} дни`

                const metaParts = []
                if (c.ds !== '—') metaParts.push(`📅 ${c.ds}`)
                if (c.ks !== '—') metaParts.push(`🛣 ${c.ks}`)
                if (item.intervalKm) metaParts.push(`↻ ${item.intervalKm.toLocaleString('bg')} км`)
                if (item.intervalYr) metaParts.push(`↻ ${item.intervalYr} год.`)

                return (
                  <div key={item.id} className={`attn-item ${isRed ? 'is-red' : 'is-warn'}`}>
                    <div className="attn-item-left">
                      <div className="attn-item-name">{item.name}</div>
                      {item.note && <div className="attn-item-note">{item.note}</div>}
                      <div className="attn-item-meta">
                        {metaParts.map((p, i) => (
                          <span key={i} className="attn-meta-pill">{p}</span>
                        ))}
                        <span className="attn-meta-pill" style={{ color: impColor, fontWeight: 800 }}>
                          ⚡ {impText}
                        </span>
                      </div>
                    </div>
                    <div className="attn-item-right">
                      <span className={`badge ${isRed ? 'b-red' : 'b-warn'}`}>
                        <span className="bdot" />
                        {isRed ? 'Просрочено' : 'Предстои'}
                      </span>
                      <span style={{ fontFamily:'var(--fm)', fontSize:'.65rem', color:'var(--txt3)' }}>
                        {daysLabel}
                      </span>
                      <button
                        className={`chk${item.replaced ? ' on' : ''}`}
                        onClick={() => onMark(item.id)}
                        title="Отбележи като сменено"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
