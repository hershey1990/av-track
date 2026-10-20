'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCreateEntry } from './use-entries'
import { getNicaraguaDateTime } from '@/lib/timezone'

const STORAGE_KEY = 'bb-running-entry'

/** Registros más cortos que esto se consideran pulsaciones accidentales. */
export const MIN_TRACKED_SECONDS = 30

/** A single `time_entries` row produced by the live tracker. */
export interface TimerSegment {
  date: string
  start_time: string
  end_time: string
}

interface RunningState {
  /** Epoch ms when the tracker was started; null = stopped */
  startedAt: number | null
  /** Draft concept shown in the header input */
  concept: string
}

const EMPTY: RunningState = { startedAt: null, concept: '' }

function readState(): RunningState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    return {
      startedAt: typeof parsed?.startedAt === 'number' ? parsed.startedAt : null,
      concept: typeof parsed?.concept === 'string' ? parsed.concept : '',
    }
  } catch {
    return EMPTY
  }
}

function writeState(state: RunningState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode) — el tracker sigue en memoria */
  }
}

/** List every calendar day between two "yyyy-MM-dd" strings (inclusive). */
export function eachDate(from: string, to: string): string[] {
  const out: string[] = []
  const cursor = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (cursor.getTime() <= end.getTime()) {
    out.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

/**
 * Split a continuous run into `time_entries` rows.
 * A run that crosses midnight becomes two rows, because `calcHours` does not
 * support shifts that wrap past 24:00.
 */
export function splitSegments(start: Date, end: Date): TimerSegment[] {
  const startParts = getNicaraguaDateTime(start)
  const endParts = getNicaraguaDateTime(end)
  const days = eachDate(startParts.date, endParts.date)

  return days.map((date, index) => ({
    date,
    start_time: index === 0 ? startParts.time : '00:00',
    end_time: index === days.length - 1 ? endParts.time : '23:59',
  }))
}

/**
 * Live tracker state: a stopwatch in the header that materialises a real
 * `time_entries` row when stopped.
 *
 * The running state lives in `localStorage` (not in the database) so a
 * refresh or a crash never leaves a half-written row behind.
 */
export function useRunningTimer(userId: string | undefined) {
  const createEntry = useCreateEntry()
  const [state, setState] = useState<RunningState>(() => readState())
  const [now, setNow] = useState(() => Date.now())
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Tick the stopwatch once per second while running.
  useEffect(() => {
    if (state.startedAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [state.startedAt])

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setState(readState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = useCallback((next: RunningState) => {
    stateRef.current = next
    setState(next)
    writeState(next)
  }, [])

  const setConcept = useCallback(
    (concept: string) => {
      persist({ ...stateRef.current, concept })
    },
    [persist],
  )

  const start = useCallback(() => {
    persist({ ...stateRef.current, startedAt: Date.now() })
    setNow(Date.now())
  }, [persist])

  const elapsed =
    state.startedAt === null ? 0 : Math.max(0, Math.floor((now - state.startedAt) / 1000))

  /**
   * Stop the tracker and persist the elapsed time.
   * Returns the created segments, or null when the run was too short to
   * be worth recording.
   */
  const stop = useCallback(async (): Promise<TimerSegment[] | null> => {
    const current = stateRef.current
    if (current.startedAt === null || !userId) return null

    const startedAt = current.startedAt
    const endedAt = Date.now()

    // Pulsaciones accidentales: no merece la pena ensuciar la tabla.
    if (endedAt - startedAt < MIN_TRACKED_SECONDS * 1000) {
      persist({ ...current, startedAt: null })
      return null
    }

    const segments = splitSegments(new Date(startedAt), new Date(endedAt))
    const concept = current.concept.trim()

    // Stop the UI immediately; restore the running state if the write fails.
    persist({ ...current, startedAt: null })

    try {
      for (const segment of segments) {
        await createEntry.mutateAsync({
          userId,
          values: { ...segment, concept, notes: '' },
        })
      }
      return segments
    } catch (error) {
      persist(current)
      throw error
    }
  }, [createEntry, persist, userId])

  return {
    isRunning: state.startedAt !== null,
    elapsed,
    concept: state.concept,
    setConcept,
    start,
    stop,
    isSaving: createEntry.isPending,
  }
}
