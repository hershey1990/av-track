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
      color: 'bg-chart-2/12 text-chart-2',
    },
    {
      icon: Zap,
      label: 'Extra hoy',
      value: extraHours !== null && extraHours > 0 ? `+${extraHours.toFixed(1)}h` : '—',
      sub:
        extraHours !== null && extraHours > 0
          ? 'Por encima del estándar'
          : 'Dentro del estándar',
      color: 'bg-chart-3/15 text-chart-3',
    },
    {
      icon: Banknote,
      label: 'Viático hoy',
      value: hasViatico ? `C$${viaticoRate.toFixed(0)}` : '—',
      sub: hasViatico ? '¡Aplica!' : 'No aplica',
      color: 'bg-chart-4/12 text-chart-4',
    },
    {
      icon: CalendarDays,
      label: 'Total período',
      value: periodTotalHours !== undefined ? `${periodTotalHours.toFixed(1)}h` : '—',
      sub: 'Período activo',
      color: 'bg-chart-5/12 text-chart-5',
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
      color: 'bg-chart-1/12 text-chart-1',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} size="sm">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </span>
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${kpi.color}`}
              >
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
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
