"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Área de scroll con barra personalizada y movimiento suave (inercia).
 *
 * - Oculta la barra nativa del navegador (`scrollbar-none`) y dibuja su propio
 *   "thumb", que aparece al hacer scroll / al pasar el ratón y se desvanece solo.
 * - Intercepta la rueda del ratón para interpolar el desplazamiento con un
 *   easing (requestAnimationFrame) en lugar del salto brusco nativo.
 * - El scroll táctil y el de las barras de desplazamiento nativas siguen
 *   funcionando: sólo se intercepta el evento `wheel`.
 */

const EASE = 0.18;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface SmoothScrollAreaProps extends React.ComponentProps<"div"> {
  /** Clases extra del viewport (el elemento que hace scroll). */
  viewportClassName?: string;
  /** Clases del thumb (la "pomo" de la barra). */
  thumbClassName?: string;
}

export function SmoothScrollArea({
  className,
  viewportClassName,
  thumbClassName,
  children,
  ...props
}: SmoothScrollAreaProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);

  const targetRef = React.useRef(0);
  const currentRef = React.useRef(0);
  const lastWrittenRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const hideTimerRef = React.useRef<number | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [hasOverflow, setHasOverflow] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const prefersReducedMotion = React.useRef(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;
    const onChange = () => {
      prefersReducedMotion.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const showThumb = React.useCallback(() => {
    setVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), 900);
  }, []);

  const syncThumb = React.useCallback(() => {
    const viewport = viewportRef.current;
    const thumb = thumbRef.current;
    const root = rootRef.current;
    if (!viewport || !thumb || !root) return;

    const { scrollHeight, clientHeight, scrollTop } = viewport;
    const overflow = scrollHeight - clientHeight;

    if (overflow <= 1) {
      setHasOverflow(false);
      return;
    }

    setHasOverflow(true);

    const trackHeight = root.clientHeight;
    const ratio = clientHeight / scrollHeight;
    const height = Math.max(28, Math.round(trackHeight * ratio));
    const travel = Math.max(0, trackHeight - height);
    const top = travel * (scrollTop / overflow);

    thumb.style.height = `${height}px`;
    thumb.style.transform = `translateY(${top}px)`;
  }, []);

  const write = React.useCallback((value: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    lastWrittenRef.current = value;
    viewport.scrollTop = value;
  }, []);

  const step = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      rafRef.current = null;
      return;
    }

    const diff = targetRef.current - currentRef.current;

    if (Math.abs(diff) < 0.4) {
      currentRef.current = targetRef.current;
      write(currentRef.current);
      rafRef.current = null;
      return;
    }

    currentRef.current += diff * EASE;
    write(currentRef.current);
    rafRef.current = requestAnimationFrame(step);
  }, [write]);

  const start = React.useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(step);
    }
  }, [step]);

  // Wheel con inercia (listener nativo no pasivo para poder hacer preventDefault)
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      const max = viewport.scrollHeight - viewport.clientHeight;
      if (max <= 0) return; // sin overflow: deja scrollear a la página
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return; // gesto horizontal

      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * viewport.clientHeight
            : event.deltaY;

      const current = targetRef.current;
      const atStart = current <= 0.5 && delta < 0;
      const atEnd = current >= max - 0.5 && delta > 0;

      // Ya estamos en el borde: el scroll continúa hacia la página (no lo bloqueamos)
      if (atStart || atEnd) return;

      event.preventDefault();

      targetRef.current = clamp(current + delta, 0, max);
      showThumb();
      syncThumb();

      if (prefersReducedMotion.current) {
        currentRef.current = targetRef.current;
        write(currentRef.current);
        rafRef.current = null;
        return;
      }

      start();
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [showThumb, syncThumb, start, write]);

  // Sincroniza el objetivo cuando el scroll viene de fuera (táctil, teclado, barras nativas)
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      const value = viewport.scrollTop;
      if (Math.abs(value - lastWrittenRef.current) > 1) {
        targetRef.current = value;
        currentRef.current = value;
      }
      showThumb();
      syncThumb();
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [showThumb, syncThumb]);

  // Recalcula el thumb cuando cambia el tamaño del contenido o del contenedor
  React.useEffect(() => {
    const viewport = viewportRef.current;
    const root = rootRef.current;
    if (!viewport || !root) return;

    const observer = new ResizeObserver(() => syncThumb());
    observer.observe(viewport);
    observer.observe(root);
    if (viewport.firstElementChild)
      observer.observe(viewport.firstElementChild);

    syncThumb();
    return () => observer.disconnect();
  }, [syncThumb]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    },
    [],
  );

  // Arrastrar el thumb
  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const thumb = thumbRef.current;
    const viewport = viewportRef.current;
    const root = rootRef.current;
    if (!thumb || !viewport || !root) return;

    event.preventDefault();
    event.stopPropagation();

    const max = viewport.scrollHeight - viewport.clientHeight;
    const travel = Math.max(1, root.clientHeight - thumb.offsetHeight);
    const startY = event.clientY;
    const startScroll = viewport.scrollTop;

    thumb.setPointerCapture(event.pointerId);
    showThumb();

    const onMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const next = clamp(startScroll + (delta / travel) * max, 0, max);
      targetRef.current = next;
      currentRef.current = next;
      write(next);
      syncThumb();
    };

    const onUp = () => {
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
    };

    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <div
        ref={viewportRef}
        className={cn(
          "scrollbar-none h-full overflow-y-auto overscroll-contain",
          viewportClassName,
        )}
      >
        {children}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-2"
      >
        <div
          ref={thumbRef}
          onPointerDown={onThumbPointerDown}
          className={cn(
            "pointer-events-auto absolute top-0 right-0.5 w-1",
            "transition-opacity duration-300 ease-out",
            visible && hasOverflow ? "opacity-100" : "opacity-0",
            hovered && hasOverflow ? "opacity-100" : "",
            thumbClassName,
          )}
        >
          <div className="size-full rounded-full bg-current/25 transition-colors duration-200 hover:bg-current/45" />
        </div>
      </div>
    </div>
  );
}
