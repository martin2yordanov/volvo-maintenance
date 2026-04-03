import { EXPENSES, fmtExpDate, fmtMoney } from '../lib/expenses'

// Group expenses by year and compute totals
const byYear = {}
EXPENSES.forEach(e => {
  if (!byYear[e.year]) byYear[e.year] = []
  byYear[e.year].push(e)
})
const years = Object.keys(byYear).map(Number).sort((a, b) => a - b)

const grandBgn = EXPENSES.reduce((s, e) => s + e.bgn, 0)
const grandEur = EXPENSES.reduce((s, e) => s + e.eur, 0)

export default function Expenses() {
  return (
    <div className="exp-wrap">
      {years.map(year => {
        const items = byYear[year]
        const totalBgn = items.reduce((s, e) => s + e.bgn, 0)
        const totalEur = items.reduce((s, e) => s + e.eur, 0)

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
                    {items.map(e => (
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
