import { EXPENSES, fmtExpDate, fmtMoney } from '../lib/expenses'

const R = 1.95583

export default function Expenses({ items = [] }) {
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

  const allExpenses = [...EXPENSES, ...itemEntries]

  // Group by year
  const byYear = {}
  allExpenses.forEach(e => {
    if (!byYear[e.year]) byYear[e.year] = []
    byYear[e.year].push(e)
  })
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b)

  const grandBgn = allExpenses.reduce((s, e) => s + e.bgn, 0)
  const grandEur = allExpenses.reduce((s, e) => s + e.eur, 0)

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
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e.id}>
                        <td className="exp-date">{fmtExpDate(e.date)}</td>
                        <td className="iname">{e.description}</td>
                        <td className="exp-num">{fmtMoney(e.bgn)}</td>
                        <td className="exp-num">{fmtMoney(e.eur)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="exp-total-row">
                      <td colSpan={2}>Общо за {year}</td>
                      <td className="exp-num">{fmtMoney(totalBgn)}</td>
                      <td className="exp-num">{fmtMoney(totalEur)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )
      })}

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
