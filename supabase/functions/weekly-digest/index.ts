import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Allow cron triggers (no auth) and manual calls with service key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get all users who have opted in to email reminders and have an email
  const { data: users, error } = await supabase
    .from('maintenance_data')
    .select('user_id, items')
    .not('items->emailReminders', 'is', null)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  let sent = 0
  for (const row of users || []) {
    const payload = row.items
    if (!payload?.emailReminders?.enabled) continue
    const email = payload.emailReminders.email
    if (!email) continue

    const garage = payload.garage || []
    const allOverdue: string[] = []

    for (const car of garage) {
      const carName = car.carInfo ? `${car.carInfo.make} ${car.carInfo.model}` : 'Автомобил'
      const odo     = car.odo || 0
      const now     = new Date()

      for (const item of (car.maintenance || [])) {
        if (item.replaced) continue
        let overdue = false

        if (item.intervalYr && item.lastDate) {
          const last    = new Date(item.lastDate)
          const nextYr  = new Date(last)
          nextYr.setFullYear(nextYr.getFullYear() + item.intervalYr)
          if (nextYr < now) overdue = true
        } else if (item.intervalYr && !item.lastDate) {
          overdue = true
        }

        if (item.intervalKm && item.lastKm != null && odo > 0) {
          if (odo - item.lastKm >= item.intervalKm) overdue = true
        }

        if (overdue) allOverdue.push(`• ${carName}: ${item.name}`)
      }
    }

    if (allOverdue.length === 0) continue

    const body = `Здравей!\n\nИмаш ${allOverdue.length} просрочени позиции за обслужване:\n\n${allOverdue.join('\n')}\n\nОтвори сервизната книжка и запиши кога е направено.\n\n— Сервизна книжка`

    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Сервизна книжка <reminders@volvo-v70.vercel.app>',
        to:      [email],
        subject: `(${allOverdue.length}) Просрочена поддръжка — Сервизна книжка`,
        text:    body,
      }),
    })
    sent++
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})
