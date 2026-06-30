'use client'

import { useController, type Control } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { type ProfileFormData } from '../schemas'

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
] as const

interface Props {
  control: Control<ProfileFormData>
}

export function WorkingDaysSelector({ control }: Props) {
  const { field } = useController({
    control,
    name: 'working_days',
  })

  const selectedDays: number[] = field.value ?? [1, 2, 3, 4, 5]

  const toggleDay = (day: number) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort()
    field.onChange(updated)
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium mb-2">Días laborables</legend>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DAYS.map((day) => (
          <div key={day.value} className="flex items-center gap-2">
            <Input
              type="checkbox"
              id={`day-${day.value}`}
              checked={selectedDays.includes(day.value)}
              onChange={() => toggleDay(day.value)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
              {day.label}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
