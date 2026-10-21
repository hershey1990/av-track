'use client'

import { Moon, PartyPopper, Sun } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PolicyConfig } from '@/types'

interface Props {
  /** Política de recargos del país (puede ser null si no está configurada). */
  policy: PolicyConfig | null
  /** Cantidad de feriados del año visible. */
  holidayCount: number
}

/**
 * Recorta una hora de Postgres ("19:00:00") a "19:00".
 */
function shortTime(value: string): string {
  return value.slice(0, 5)
}

/**
 * Explica la regla de pago de los feriados y los demás recargos legales.
 *
 * La regla vive en `policy_config.holiday_surcharge_pct`: con 100% las horas
 * trabajadas en un feriado se pagan al doble (8h trabajadas → 8h extra).
 */
export function HolidayPolicyNote({ policy, holidayCount }: Props) {
  const holidayPct = policy?.holiday_surcharge_pct ?? 0
  const nightPct = policy?.night_surcharge_pct ?? 0
  const sundayPct = policy?.sunday_surcharge_pct ?? 0

  const rules = [
    {
      icon: PartyPopper,
      label: 'Horas en feriado',
      value: holidayPct > 0 ? `+${holidayPct}%` : 'Sin recargo',
      hint:
        holidayPct >= 100
          ? 'Se pagan al doble'
          : holidayPct > 0
            ? `Se pagan ×${(100 + holidayPct) / 100}`
            : 'No hay recargo configurado',
    },
    {
      icon: Sun,
      label: 'Horas dominicales',
      value: sundayPct > 0 ? `+${sundayPct}%` : 'Sin recargo',
      hint:
        sundayPct >= 100
          ? 'Se pagan al doble'
          : sundayPct > 0
            ? `Se pagan ×${(100 + sundayPct) / 100}`
            : 'No hay recargo configurado',
    },
    {
      icon: Moon,
      label: 'Horas nocturnas',
      value: nightPct > 0 ? `+${nightPct}%` : 'Sin recargo',
      hint:
        nightPct > 0
          ? policy
            ? `De ${shortTime(policy.night_start)} a ${shortTime(policy.night_end)}`
            : 'Turno nocturno'
          : 'No hay recargo configurado',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Regla de pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Las horas trabajadas en un feriado se pagan al doble:{' '}
          <span className="font-medium text-foreground">
            {holidayPct >= 100
              ? '8 horas trabajadas = 16 horas pagadas'
              : `${holidayPct}% de recargo sobre las horas trabajadas`}
          </span>
          . El recargo de feriado prevalece sobre el dominical cuando el
          festivo cae en domingo.
        </p>

        <div className="grid gap-px overflow-hidden rounded-lg bg-border ring-1 ring-foreground/8 sm:grid-cols-3">
          {rules.map((rule) => (
            <div key={rule.label} className="bg-card p-4">
              <div className="flex items-center gap-1.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <rule.icon className="h-3.5 w-3.5" />
                {rule.label}
              </div>
              <div className="text-xl font-semibold tabular-nums">
                {rule.value}
              </div>
              <div className="text-xs leading-tight text-muted-foreground">
                {rule.hint}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {holidayCount === 1
            ? '1 feriado registrado para este año.'
            : `${holidayCount} feriados registrados para este año.`}{' '}
          Los feriados móviles (Jueves Santo y Viernes Santo) dependen del
          calendario lunar, por eso los carga el administrador cada año.
        </p>
      </CardContent>
    </Card>
  )
}
