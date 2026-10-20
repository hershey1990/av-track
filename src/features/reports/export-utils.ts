/**
 * Helpers compartidos por los exports a Excel y PDF.
 *
 * Ambos formatos necesitan exactamente las mismas conversiones de fecha,
 * minutos y carga de imágenes; mantener una sola copia evita que los
 * dos reportes se desincronicen.
 */

const SPANISH_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

/** "5 oct" a partir de un "yyyy-MM-dd". */
export function formatPeriodDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDate()
  const month = SPANISH_MONTHS[d.getMonth()]
  return `${day} ${month}`
}

/** "05/10" a partir de un "yyyy-MM-dd". */
export function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Convierte "1:30" o "Off" en minutos. */
export function extraTimeToMinutes(extraTime: string): number {
  if (extraTime === 'Off' || extraTime === '0:00') return 0
  const [h, m] = extraTime.split(':').map(Number)
  return h * 60 + m
}

/** Descarga una imagen y la devuelve como data URL (para incrustar en el PDF). */
export async function loadImageDataUrl(src: string): Promise<string> {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Unable to load image: ${src}`)
  }
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read image: ${src}`))
    reader.readAsDataURL(blob)
  })
}
