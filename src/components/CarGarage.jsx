import CarLogo from './CarLogo.jsx'

export default function CarGarage({ garage, activeCarId, onSwitch, onAdd, onDelete, onClose }) {
  return (
    <div className="mover on" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal garage-modal" style={{ position: 'relative' }}>
        <button className="garage-modal-close" onClick={onClose} title="Затвори">✕</button>
        <h2>Моят гараж</h2>
        <div className="garage-grid">
          {garage.map(car => (
            <div
              key={car.id}
              className={`garage-car${car.id === activeCarId ? ' active' : ''}`}
              onClick={() => onSwitch(car.id)}
            >
              <div className="garage-car-initial">
                {car.carInfo ? (
                  <CarLogo make={car.carInfo.make} />
                ) : (
                  <span>?</span>
                )}
              </div>
              <div>
                <div className="garage-car-name">
                  {car.carInfo
                    ? `${car.carInfo.make} ${car.carInfo.model} · ${car.carInfo.year}`
                    : 'Непознат автомобил'}
                </div>
                {car.odo != null && (
                  <div className="garage-car-sub">{car.odo.toLocaleString()} км</div>
                )}
              </div>
              {car.id !== activeCarId && (
                <button
                  className="garage-car-del"
                  title="Изтрий"
                  onClick={e => { e.stopPropagation(); onDelete(car.id) }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onAdd}>
          ＋ Добави автомобил
        </button>
      </div>
    </div>
  )
}
