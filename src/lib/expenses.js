const R = 1.95583
const c = bgn => Math.round(bgn / R * 100) / 100

const MONTHS = ['Яну','Фев','Мар','Апр','Май','Юни','Юли','Авг','Сеп','Окт','Ное','Дек']
export const fmtExpDate = str => {
  const [y, m] = str.split('-')
  return `${MONTHS[+m - 1]} ${y}`
}
export const fmtMoney = n => Number(n).toFixed(2)

// ─── All historical repair / maintenance expenses ────────────────────────────
export const EXPENSES = [
  // ── Май 2020 ──
  { id:1,  date:'2020-05', year:2020, description:'Предни дискове',        bgn:240,                         eur:c(240)  },
  { id:2,  date:'2020-05', year:2020, description:'Накладки',               bgn:90,                          eur:c(90)   },
  { id:3,  date:'2020-05', year:2020, description:'Маркучи',                bgn:40,                          eur:c(40)   },
  { id:4,  date:'2020-05', year:2020, description:'Тампони',                bgn:150,                         eur:c(150)  },
  { id:5,  date:'2020-05', year:2020, description:'Работа',                 bgn:140,                         eur:c(140)  },
  { id:6,  date:'2020-05', year:2020, description:'Втулки',                 bgn:115,                         eur:c(115)  },
  // ── Ноември 2020 ──
  { id:7,  date:'2020-11', year:2020, description:'Рейка',                  bgn:270,                         eur:c(270)  },
  { id:8,  date:'2020-11', year:2020, description:'Ангренаж с водна помпа', bgn:230,                         eur:c(230)  },
  { id:9,  date:'2020-11', year:2020, description:'Опора и лагер',          bgn:110,                         eur:c(110)  },
  { id:10, date:'2020-11', year:2020, description:'Накрайници',             bgn:75,                          eur:c(75)   },
  { id:11, date:'2020-11', year:2020, description:'Антифриз',               bgn:25,                          eur:c(25)   },
  { id:12, date:'2020-11', year:2020, description:'Работа',                 bgn:130,                         eur:c(130)  },
  // ── 2022 ──
  { id:13, date:'2022-07', year:2022, description:'Ремонт',                 bgn:400,                         eur:c(400)  },
  { id:14, date:'2022-08', year:2022, description:'Ремонт',                 bgn:600,                         eur:c(600)  },
  // ── 2023 ──
  { id:15, date:'2023-02', year:2023, description:'Ремонт',                 bgn:200,                         eur:c(200)  },
  { id:16, date:'2023-05', year:2023, description:'Ремонт',                 bgn:200,                         eur:c(200)  },
  // ── 2024 ──
  { id:17, date:'2024-01', year:2024, description:'Ремонт',                 bgn:220,                         eur:c(220)  },
  { id:18, date:'2024-06', year:2024, description:'Предни гуми',            bgn:380,                         eur:c(380)  },
  // ── 2025 ──
  { id:19, date:'2025-07', year:2025, description:'Нов радиатор',           bgn:600,                         eur:c(600)  },
  // ── 2026 — already in EUR ──
  { id:20, date:'2026-01', year:2026, description:'Ремонт',                 bgn:Math.round(420*R*100)/100,   eur:420     },
]

// ─── Known costs for existing maintenance items (EUR) ────────────────────────
// Keyed by DEFAULTS item id — used to pre-populate the cost field on first load
export const KNOWN_COSTS = {
  2:  c(230),   // Ремък ГРМ + ролки + водна помпа  ← Ангренаж с водна помпа
  9:  c(25),    // Охлаждаща течност (антифриз)      ← Антифриз
  16: c(90),    // Предни спирачни накладки           ← Накладки
  18: c(240),   // Предни спирачни дискове            ← Предни дискове
  19: c(115),   // Предни стабилизаторни втулки       ← Втулки
  20: c(150),   // Предни носещи рамена (тампони)     ← Тампони
  25: c(380),   // Гуми                               ← Предни гуми (юни 2024)
  27: c(40),    // Гумени спирачни маркучи             ← Маркучи
}
