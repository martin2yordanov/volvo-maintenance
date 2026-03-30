// ─── DEFAULT MAINTENANCE ITEMS ───────────────────────────────────────────────
export const DEFAULTS = [
  {id:1,importance:9,cat:"Двигател",name:"Моторно масло + маслен филтър",note:"5W-30 ACEA C3/B4 — Castrol Edge, Mobil 1 ESP",intervalKm:10000,intervalYr:1,lastDate:"2025-07-01",lastKm:null,replaced:false},
  {id:2,importance:10,cat:"Двигател",name:"Ремък ГРМ + ролки + водна помпа",note:"КРИТИЧНО! Скъсването унищожава двигателя. Цял комплект.",intervalKm:100000,intervalYr:5,lastDate:"2020-11-01",lastKm:null,replaced:false},
  {id:3,importance:8,cat:"Двигател",name:"Пистов ремък (серпентина)",note:"Сменяй заедно с обтяжната ролка",intervalKm:60000,intervalYr:4,lastDate:null,lastKm:null,replaced:false},
  {id:4,importance:6,cat:"Двигател",name:"Въздушен филтър",note:"OEM: Volvo 30636333. По-кратък при запрашена среда.",intervalKm:20000,intervalYr:2,lastDate:null,lastKm:null,replaced:false},
  {id:5,importance:9,cat:"Двигател",name:"Горивен филтър",note:"КРИТИЧНО за ТНВД! Мръсният филтър унищожава помпата.",intervalKm:20000,intervalYr:2,lastDate:null,lastKm:null,replaced:false},
  {id:6,importance:7,cat:"Двигател",name:"EGR клапан — почистване",note:"Типичен проблем при D5! Засоряването → грапав ход, черен дим.",intervalKm:80000,intervalYr:4,lastDate:null,lastKm:null,replaced:false},
  {id:7,importance:6,cat:"Двигател",name:"Накалителни свещи (glow plugs)",note:"При трудно стартиране в студено — признак за износване.",intervalKm:80000,intervalYr:4,lastDate:null,lastKm:null,replaced:false},
  {id:8,importance:7,cat:"Двигател",name:"Маслен радиатор — уплътнения",note:"Характерна слабост на D5244T. Провери за теч!",intervalKm:null,intervalYr:5,lastDate:null,lastKm:null,replaced:false},
  {id:9,importance:7,cat:"Охлаждане",name:"Охлаждаща течност (антифриз)",note:"G11 синя/зелена или OAT G12+. НЕ смесвай типове!",intervalKm:null,intervalYr:3,lastDate:"2020-11-01",lastKm:null,replaced:false},
  {id:10,importance:6,cat:"Охлаждане",name:"Термостат",note:"Смени при проблеми с температурата или заедно с ГРМ.",intervalKm:150000,intervalYr:8,lastDate:null,lastKm:null,replaced:false},
  {id:11,importance:5,cat:"Охлаждане",name:"Маркучи на охладителната система",note:"Провери за мекост и пукнатини при всяко масло.",intervalKm:null,intervalYr:6,lastDate:null,lastKm:null,replaced:false},
  {id:12,importance:8,cat:"Трансмисия",name:"Масло за авт. скоростна кутия (АТФ)",note:"AW55-51/55 — Dexron VI или Esso LT71141",intervalKm:60000,intervalYr:5,lastDate:"2026-01-28",lastKm:450000,replaced:false},
  {id:13,importance:7,cat:"Трансмисия",name:"Трансмисионен маслен филтър (АТФ)",note:"Сменяй заедно с АТФ маслото (вътре в маслената вана)",intervalKm:60000,intervalYr:5,lastDate:"2026-01-28",lastKm:450000,replaced:false},
  {id:14,importance:6,cat:"Трансмисия",name:"Масло за предния диференциал",note:"Провери при всяка смяна на трансмисионно масло.",intervalKm:60000,intervalYr:5,lastDate:null,lastKm:null,replaced:false},
  {id:15,importance:10,cat:"Спирачна система",name:"Спирачна течност",note:"DOT 4 — хигроскопична, сменя се задължително по дата!",intervalKm:null,intervalYr:2,lastDate:null,lastKm:null,replaced:false},
  {id:16,importance:10,cat:"Спирачна система",name:"Предни спирачни накладки",note:"Мин. 3 мм. Провери при всяко масло. Препоръчани: Textar.",intervalKm:40000,intervalYr:3,lastDate:null,lastKm:null,replaced:false},
  {id:17,importance:9,cat:"Спирачна система",name:"Задни спирачни накладки",note:"По-дълго издържат от предните.",intervalKm:60000,intervalYr:4,lastDate:null,lastKm:null,replaced:false},
  {id:18,importance:8,cat:"Спирачна система",name:"Предни спирачни дискове",note:"Мин. дебелина 28 мм (нови 30 мм). Смени заедно с накладките.",intervalKm:80000,intervalYr:5,lastDate:null,lastKm:null,replaced:false},
  {id:19,importance:6,cat:"Окачване",name:"Предни стабилизаторни втулки",note:'Типична слабост на V70. "Клоп-клоп" при завиване = износени.',intervalKm:60000,intervalYr:4,lastDate:null,lastKm:null,replaced:false},
  {id:20,importance:7,cat:"Окачване",name:"Предни носещи рамена (тампони)",note:"Износените дестабилизират кормилото. Провери при масло.",intervalKm:80000,intervalYr:5,lastDate:null,lastKm:null,replaced:false},
  {id:21,importance:7,cat:"Окачване",name:"Амортисьори (4 бр.)",note:"При теч, бумтеж или повишено кланяне = износени.",intervalKm:100000,intervalYr:6,lastDate:null,lastKm:null,replaced:false},
  {id:22,importance:4,cat:"Филтри и течности",name:"Филтър за купе (поленов)",note:"Мръсният вони и намалява ефективността на климатика.",intervalKm:15000,intervalYr:1,lastDate:null,lastKm:null,replaced:false},
  {id:23,importance:5,cat:"Филтри и течности",name:"Течност за кормилно усилване (ХЗУ)",note:"Pentosin CHF 11S или CHF 202. Провери за теч от маркучи.",intervalKm:null,intervalYr:4,lastDate:null,lastKm:null,replaced:false},
  {id:24,importance:7,cat:"Електрика",name:"Акумулатор",note:"70–80 Ah, 680–720 CCA. Препоръчан AGM или EFB.",intervalKm:null,intervalYr:4,lastDate:"2024-01-01",lastKm:null,replaced:false},
  {id:25,importance:9,cat:"Гуми и колела",name:"Гуми",note:"Смени при протектор под 3 мм или след 5 год. независимо от износването.",intervalKm:40000,intervalYr:5,lastDate:"2022-08-01",lastKm:null,replaced:false},
  {id:26,importance:5,cat:"Гуми и колела",name:"Баланс и геометрия на колелата",note:"При всяка сезонна смяна или при вибрации.",intervalKm:20000,intervalYr:1,lastDate:null,lastKm:null,replaced:false},
  {id:27,importance:7,cat:"Гуми и колела",name:"Гумени спирачни маркучи",note:"Втвърдяват се с времето. Провери за пукнатини. Опасно!",intervalKm:null,intervalYr:6,lastDate:null,lastKm:null,replaced:false}
]

export const CAT_ORDER = [
  "Двигател","Охлаждане","Трансмисия","Спирачна система",
  "Окачване","Филтри и течности","Електрика","Гуми и колела"
]

export const CAT_ICON = {
  "Двигател":"🔧","Охлаждане":"❄️","Трансмисия":"⚙️",
  "Спирачна система":"🛑","Окачване":"🔩","Филтри и течности":"🧴",
  "Електрика":"⚡","Гуми и колела":"🚗"
}

const KMY = 15000 // assumed annual km

// ─── CORE CALCULATION ─────────────────────────────────────────────────────────
export function calcNextDue(item, odo) {
  const now = new Date(); now.setHours(0,0,0,0)
  const nowMs = now.getTime()
  const KPD = KMY / 365

  let nextMs = null
  if (item.lastDate && item.intervalYr) {
    const d = new Date(item.lastDate)
    d.setFullYear(d.getFullYear() + Math.floor(item.intervalYr))
    const rem = item.intervalYr % 1
    if (rem) d.setMonth(d.getMonth() + Math.round(rem * 12))
    nextMs = d.getTime()
  }

  const nextKm = (item.lastKm && item.intervalKm) ? item.lastKm + item.intervalKm : null

  const dDate = nextMs !== null ? Math.round((nextMs - nowMs) / 86400000) : null
  const dKm   = (nextKm !== null && odo !== null) ? Math.round((nextKm - odo) / KPD) : null

  let score
  if      (dDate !== null && dKm !== null) score = Math.min(dDate, dKm)
  else if (dDate !== null)                 score = dDate
  else if (dKm   !== null)                 score = dKm
  else                                     score = 99999

  const leway = item.intervalYr ? Math.round(item.intervalYr * 365 * 0.1) : 30
  let status
  if (!item.lastDate && !item.lastKm) status = 'unk'
  else if (score < 0)                 status = 'red'
  else if (score <= leway)            status = 'warn'
  else                                status = 'ok'

  const fmt = ms => { const d = new Date(ms); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}` }
  const ds = nextMs  ? fmt(nextMs) : '—'
  const ks = nextKm  ? nextKm.toLocaleString('bg') + ' км' : '—'

  return { ds, ks, score, status, nextMs, nextKm, dDate, dKm }
}

export const STATUS_ORDER = { red: 0, warn: 1, unk: 2, ok: 3 }

export function defaultCmp(a, b, odo) {
  if (a.replaced !== b.replaced) return a.replaced ? 1 : -1
  const ca = calcNextDue(a, odo)
  const cb = calcNextDue(b, odo)
  const so = STATUS_ORDER[ca.status] - STATUS_ORDER[cb.status]
  return so !== 0 ? so : ca.score - cb.score
}

export function importanceBadge(n) {
  n = n || 5
  const color = n >= 10 ? '#ef4444' : n >= 8 ? '#f97316' : n >= 6 ? '#f59e0b' : n >= 4 ? '#22c55e' : '#8b90a8'
  return { color, text: `${n}/10` }
}
