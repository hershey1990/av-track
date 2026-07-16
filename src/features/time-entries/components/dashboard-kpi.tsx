'use client'

import { useMemo } from 'react'
import { Clock, Zap, Banknote, CalendarDays, Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTodayEntries } from '@/features/time-entries/hooks/use-entries'
import { calcHours, calcExtraHours, calcViatico, getStandardHours } from '@/lib/calculations'
import type { EmploymentType } from '@/types'

interface Props {
  userId: string
  profileType: EmploymentType
  viaticoRate: number
  periodTotalHours?: number
  periodTotalExtraHours?: number
}

export function DashboardKpiCards({ userId, profileType, viaticoRate, periodTotalHours, periodTotalExtraHours }: Props) {
  const { data: todayEntries = [] } = useTodayEntries(userId)

  const todayHours = useMemo(() => {
    if (todayEntries.length === 0) return null
    return todayEntries.reduce((sum, entry) => sum + calcHours(entry.start_time, entry.end_time), 0)
  }, [todayEntries])

  const extraHours = useMemo(() => {
    if (todayHours === null) return null
    return calcExtraHours(todayHours, getStandardHours(profileType))
  }, [todayHours, profileType])

  const hasViatico = useMemo(() => {
    if (todayHours === null) return null
    return calcViatico(todayHours)
  }, [todayHours])

  const kpis = [
    {
      icon: Clock,
      label: 'Horas hoy',
      value: todayHours !== null ? `${todayHours.toFixed(1)}h` : '—',
      sub: `${getStandardHours(profileType)}h estándar`,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Zap,
      label: 'Extra hoy',
      value: extraHours !== null && extraHours > 0 ? `+${extraHours.toFixed(1)}h` : '—',
      sub:
        extraHours !== null && extraHours > 0
          ? 'Por encima del estándar'
          : 'Dentro del estándar',
      color: 'bg-brand-gold/15 text-amber-700',
    },
    {
      icon: Banknote,
      label: 'Viático hoy',
      value: hasViatico ? `C$${viaticoRate.toFixed(0)}` : '—',
      sub: hasViatico ? '¡Aplica!' : 'No aplica',
      color: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      icon: CalendarDays,
      label: 'Total período',
      value: periodTotalHours !== undefined ? `${periodTotalHours.toFixed(1)}h` : '—',
      sub: 'Período activo',
      color: 'bg-slate-500/10 text-slate-700',
    },
    {
      icon: Timer,
      label: 'Extras período',
      value: periodTotalExtraHours !== undefined && periodTotalExtraHours > 0
        ? `+${periodTotalExtraHours.toFixed(1)}h`
        : '—',
      sub: periodTotalExtraHours !== undefined && periodTotalExtraHours > 0
        ? 'Total horas extra'
        : 'Sin horas extra',
      color: 'bg-rose-500/10 text-rose-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </span>
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${kpi.color}`}
              >
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight">
              {kpi.value}
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              {kpi.sub}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
