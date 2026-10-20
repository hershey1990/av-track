/** Icono emoji según el tipo de notificación. */
export function typeIcon(type: string): string {
  switch (type) {
    case 'absence_request':
    case 'absence_approved':
    case 'absence_rejected':
      return '📅'
    case 'period_approval':
    case 'period_approved':
    case 'period_rejected':
      return '📄'
    case 'shift_swap':
      return '🔄'
    default:
      return '🔔'
  }
}
