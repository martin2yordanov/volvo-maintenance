import { CAT_ORDER, CAT_ICON, calcNextDue, importanceBadge } from '../lib/data'

function esc(s) {
  if (!s) return ''
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function StatusBadge({ status }) {
  const cfg = {
    red:  { cls: 'b-red',  label: 'Просрочено', dot: true },
    warn: { cls: 'b-warn', label: 'Предстои',   dot: true },
    unk:  { cls: 'b-unk',  label: 'Без данни',  dot: false },
    ok:   { cls: 'b-ok',   label: 'Добре',      dot: false },
  }
  const { cls, label, dot } = cfg[status] || cfg.ok
  return (
    <span className={`badge ${cls}`}>
      {dot && <span className="bdot" />}
      {label}
    </span>
  )
}

function ImportanceBadge({ n }) {
  const { color, text } = importanceBadge(n)
  return (
    <span style={{ fontFamily:'var(--fm)', fontSize:'.85rem', fontWeight:800, color }}>
      {text}
    </span>
  )
}

function SortTh({ col, label, currentSort, grouped, onSort, center }) {
  const isActive = col === 'name' ? grouped : currentSort.col === col
  const cls = ['sortable', center && 'c', isActive && (currentSort.dir === 1 ? 'sort-asc' : 'sort-desc')]
    .filter(Boolean).join(' ')
  return (
    <th className={cls} onClick={() => onSort(col)}>{label}</th>
  )
}

export default function MainTable({ items, odo, grouped, sortState, onSort, onMark, onUpd, onEdit, onDel, onAdd, showHidden, hiddenCount, onHide, onToggleHidden, showReplaced, replacedCount, onToggleReplaced, searchQuery, onSearch }) {
  const showCatHeaders = grouped

  const rows = []
  let lastCat = null

  items.forEach(item => {
    // Category separator
    if (showCatHeaders && item.cat !== lastCat) {
      lastCat = item.cat
      rows.push(
        <tr key={`cat-${item.cat}`} className="cat-sep">
          <td colSpan={11}>
            {CAT_ICON[item.cat] || '📁'} {item.cat || 'Друго'}
          </td>
        </tr>
      )
    }

    const c = calcNextDue(item, odo)

    let nextDue = null
    if (c.ds !== '—') nextDue = <>{c.ds}{c.ks !== '—' && <><br/><span style={{color:'var(--txt3)'}}>{c.ks}</span></>}</>
    else if (c.ks !== '—') nextDue = <span style={{color:'var(--txt3)'}}>{c.ks}</span>
    else nextDue = <span style={{color:'var(--txt3)'}}>—</span>

    const rowClass = [item.replaced ? 'dim' : '', item.hidden ? 'row-hidden' : ''].filter(Boolean).join(' ')

    rows.push(
      <tr key={item.id} className={rowClass || undefined}>
        <td>
          <div className="iname">{item.name}</div>
          {item.note && <div className="isub">{item.note}</div>}
        </td>
        <td className="c">
          <span className="ival">{item.intervalKm ? item.intervalKm.toLocaleString('bg') : '—'}</span>
        </td>
        <td className="c">
          <span className="ival">{item.intervalYr || '—'}</span>
        </td>
        <td className="c">
          <ImportanceBadge n={item.importance} />
        </td>
        <td>
          <input
            type="month"
            className="ecell"
            defaultValue={item.lastDate || ''}
            key={`${item.id}-date`}
            onBlur={e => onUpd(item.id, 'lastDate', e.target.value || null)}
          />
        </td>
        <td>
          <input
            type="number"
            className="ecell"
            defaultValue={item.lastKm || ''}
            key={`${item.id}-km`}
            placeholder="—"
            style={{ minWidth: '80px' }}
            onBlur={e => onUpd(item.id, 'lastKm', e.target.value ? parseInt(e.target.value) : null)}
          />
        </td>
        <td>
          <div className="ndue">{nextDue}</div>
        </td>
        <td className="c">
          <StatusBadge status={c.status} />
        </td>
        <td>
          <div className="cost-cell">
            <span className="cost-sym">€</span>
            <input
              type="number"
              className="ecell"
              defaultValue={item.cost || ''}
              key={`${item.id}-cost`}
              placeholder="—"
              style={{ minWidth: '60px' }}
              onBlur={e => onUpd(item.id, 'cost', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
        </td>
        <td className="c">
          <button
            className={`chk${item.replaced ? ' on' : ''}`}
            onClick={() => onMark(item.id)}
            title="Отбележи като сменено"
          >
            ✓
          </button>
        </td>
        <td className="c">
          <div className="ract">
            <button className="ibtn" onClick={() => onEdit(item)} title="Редактирай">✎</button>
            <button
              className={`ibtn${item.hidden ? ' hide-on' : ''}`}
              onClick={() => onHide(item.id)}
              title={item.hidden ? 'Покажи' : 'Скрий'}
            >
              {item.hidden ? '⊙' : '⊘'}
            </button>
            <button className="ibtn del" onClick={() => onDel(item.id)} title="Изтрий">✕</button>
          </div>
        </td>
      </tr>
    )
  })

  return (
    <div className="tbl-wrap">
      <div className="hidden-bar">
        <div className="hidden-bar-left">
          {replacedCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onToggleReplaced}>
              {showReplaced ? `✓ Скрий одобрените (${replacedCount})` : `✓ Покажи одобрени (${replacedCount})`}
            </button>
          )}
          {hiddenCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onToggleHidden}>
              {showHidden ? `⊙ Скрий скритите (${hiddenCount})` : `⊘ Покажи скрити (${hiddenCount})`}
            </button>
          )}
        </div>
        <div className="tbl-search">
          <span className="tbl-search-icon">🔍</span>
          <input
            type="text"
            className="tbl-search-inp"
            placeholder="Търсене…"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
          {searchQuery && (
            <button className="tbl-search-clear" onClick={() => onSearch('')} title="Изчисти">✕</button>
          )}
        </div>
      </div>
      <div className="tbl-scroll">
        <table>
          <thead>
            <tr>
              <SortTh col="name"       label="Позиция"               currentSort={sortState} grouped={grouped} onSort={onSort} />
              <SortTh col="intervalKm" label="км"                     currentSort={sortState} grouped={grouped} onSort={onSort} center />
              <SortTh col="intervalYr" label="год."                   currentSort={sortState} grouped={grouped} onSort={onSort} center />
              <SortTh col="importance" label="Важност"                currentSort={sortState} grouped={grouped} onSort={onSort} center />
              <SortTh col="lastDate"   label="Последна смяна (дата)"  currentSort={sortState} grouped={grouped} onSort={onSort} />
              <SortTh col="lastKm"     label="Последна смяна (км)"    currentSort={sortState} grouped={grouped} onSort={onSort} />
              <SortTh col="nextDue"    label="Следваща смяна"         currentSort={sortState} grouped={grouped} onSort={onSort} />
              <SortTh col="status"     label="Статус"                 currentSort={sortState} grouped={grouped} onSort={onSort} center />
              <SortTh col="cost"       label="Цена (€)"               currentSort={sortState} grouped={grouped} onSort={onSort} center />
              <th className="c">✓</th>
              <th className="c">—</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      <button className="add-btn" onClick={onAdd}>＋ Добави нова позиция</button>
      <div className="src">
        ℹ Интервалите са базирани на официалното сервизно ръководство Volvo и препоръките на производителя за D5 двигатели.
      </div>
    </div>
  )
}
