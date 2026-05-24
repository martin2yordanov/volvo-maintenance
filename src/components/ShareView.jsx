import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcNextDue, CAT_ORDER } from '../lib/data'

export default function ShareView({ token }) {
  const [data, setData]   = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('car_shares').select('data').eq('token', token).maybeSingle()
      .then(({ data: row, error: err }) => {
        if (err || !row) { setError('Линкът е невалиден или е изтекъл.'); return }
        setData(row.data)
      })
  }, [token])

  if (error) return <div className="share-error">{error}</div>
  if (!data)  return <div className="loading-screen"><div className="spinner"/><span>Зареждане…</span></div>

  const { carInfo, maintenance = [], serviceLog = [], odo } = data

  return (
    <div className="share-wrap">
      <div className="share-header">
        <div>
          <h1 className="share-car-name">{carInfo ? `${carInfo.make} ${carInfo.model}` : 'Автомобил'}</h1>
          <p className="share-car-sub">{carInfo?.year}{odo ? ` · ${odo.toLocaleString()} км` : ''}</p>
        </div>
        <div className="share-badge">Споделено за преглед</div>
      </div>

      <section className="share-section">
        <h2 className="share-section-title">Поддръжка</h2>
        <div className="share-table-wrap">
          <table className="pr-table">
            <thead>
              <tr><th>Позиция</th><th>Категория</th><th>Статус</th><th>Последна смяна</th></tr>
            </thead>
            <tbody>
              {maintenance.filter(i => !i.replaced).map(item => {
                const c = calcNextDue(item, odo)
                const cls = c.status === 'red' ? 'pr-red' : c.status === 'warn' ? 'pr-warn' : c.status === 'ok' ? 'pr-ok' : ''
                const label = c.status === 'red' ? 'Просрочено' : c.status === 'warn' ? 'Внимание' : c.status === 'ok' ? 'Добро' : 'Неизвестно'
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.cat}</td>
                    <td className={cls}>{label}</td>
                    <td>{item.lastDate || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {serviceLog.length > 0 && (
        <section className="share-section">
          <h2 className="share-section-title">Сервизна история</h2>
          <div className="share-table-wrap">
            <table className="pr-table">
              <thead><tr><th>Дата</th><th>Км</th><th>Описание</th><th>Цена</th></tr></thead>
              <tbody>
                {[...serviceLog].sort((a,b) => b.date?.localeCompare(a.date||'')||0).map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.km ? e.km.toLocaleString() : '—'}</td>
                    <td><strong>{e.title}</strong>{e.description ? <><br/><span style={{color:'#6e6e73',fontSize:'.85em'}}>{e.description}</span></> : null}</td>
                    <td>{e.costBgn ? `${e.costBgn} лв.` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="share-footer">Генерирано от Сервизна книжка · {new Date().toLocaleDateString('bg-BG')}</p>
    </div>
  )
}
