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
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Zap,
      label: 'Extra hoy',
      value: extraHours !== null && extraHours > 0 ? `+${extraHours.toFixed(1)}h` : '—',
      sub:
        extraHours !== null && extraHours > 0
          ? 'Por encima del estándar'
          : 'Dentro del estándar',
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: Banknote,
      label: 'Viático hoy',
      value: hasViatico ? `C$${viaticoRate.toFixed(0)}` : '—',
      sub: hasViatico ? '¡Aplica!' : 'No aplica',
      color: 'bg-green-500/10 text-green-600',
    },
    {
      icon: CalendarDays,
      label: 'Total período',
      value: periodTotalHours !== undefined ? `${periodTotalHours.toFixed(1)}h` : '—',
      sub: 'Período activo',
      color: 'bg-purple-500/10 text-purple-600',
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
      color: 'bg-red-500/10 text-red-600',
      fullWidth: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className={kpi.fullWidth ? 'col-span-2' : ''}>
          <CardContent className="p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0 ${kpi.color}`}
              >
                <kpi.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">{kpi.value}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
              {kpi.sub}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
