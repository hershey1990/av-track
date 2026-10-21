import {
  Timer,
  LayoutDashboard,
  FileText,
  Lightbulb,
  Folder,
  Briefcase,
  Users,
  Tag,
  CircleQuestionMark,
  ChevronDown,
  Rocket,
  Settings,
  CalendarDays,
  Repeat,
  CalendarRange,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  /** Etiqueta visible en el menú */
  label: string
  /** Icono de 16px (lucide) */
  icon: LucideIcon
  /** Ruta destino. Ausente => item deshabilitado (sin navegación). */
  to?: string
  /** Sólo visible para usuarios con role === 'admin' */
  adminOnly?: boolean
  /** El item es un desplegable con hijos */
  children?: NavItem[]
  /** Coincidencia exacta de ruta (para '/' principalmente) */
  exact?: boolean
}

export interface NavSection {
  /** Rótulo de sección en versalitas */
  title: string
  items: NavItem[]
}

/**
 * Menú lateral — clon de la estructura de toggl Track.
 *
 * Los items sin `to` son placeholders: se renderizan atenuados y sin
 * navegación (equivalente a los módulos que aún no existen en el sistema).
 *
 * Para cambiar el destino de cualquier entrada del menú, edita sólo aquí.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'TRACK',
    items: [
      { label: 'Timer', icon: Timer, to: '/', exact: true },
      { label: 'Calendario', icon: CalendarRange, to: '/calendar' },
    ],
  },
  {
    title: 'ANALYZE',
    items: [
      { label: 'Historial', icon: LayoutDashboard, to: '/history' },
      { label: 'Reportes', icon: FileText, to: '/report' },
      { label: 'Insights', icon: Lightbulb },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { label: 'Ausencias', icon: CalendarDays, to: '/absences' },
      { label: 'Cambios de turno', icon: Repeat, to: '/shift-swaps' },
      { label: 'Feriados', icon: PartyPopper, to: '/holidays' },
      { label: 'Proyectos', icon: Folder },
      { label: 'Clientes', icon: Briefcase },
      { label: 'Equipo', icon: Users },
      { label: 'Etiquetas', icon: Tag },
      { label: 'Ayuda', icon: CircleQuestionMark },
      {
        label: 'Mostrar más',
        icon: ChevronDown,
        children: [
          { label: 'Períodos', icon: Timer, to: '/admin/periods', adminOnly: true },
          { label: 'Política', icon: FileText, to: '/admin/policy', adminOnly: true },
        ],
      },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Organización', icon: Rocket, to: '/admin', adminOnly: true },
      { label: 'Configuración', icon: Settings, to: '/settings' },
    ],
  },
]
