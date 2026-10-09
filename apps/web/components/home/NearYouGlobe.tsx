'use client';

import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';
import type { MapLocation } from '@/lib/mapLocations';

/** Yerevan, [lat, lng]. */
const YEREVAN: [number, number] = [40.1792, 44.4991];
/** cobe's `phi` that puts a longitude at the centre of the disc. */
const phiFor = (lng: number) => ((lng + 189) * Math.PI) / 180;

/**
 * Draggable dotted globe (the `cobe` WebGL library) that opens on Armenia, with a
 * gold pin on each admin-managed place cars are sourced from and a line to Yerevan. It idles with a slow spin, follows a pointer drag with
 * inertia-free direct control, and stays still under reduced motion. The static
 * map image sits underneath until the first frame is drawn.
 */
export function NearYouGlobe({ poster, locations }: { poster: string; locations: MapLocation[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const locationsKey = JSON.stringify(locations);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let phi = phiFor(YEREVAN[1]);
    let theta = ((YEREVAN[0] * Math.PI) / 180) * 0.55;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let width = 0;
    let visible = false;

    const build = () => {
      width = canvas.offsetWidth;
      if (!width) return;
      globe?.destroy();
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi,
        theta,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 9,
        baseColor: [0.25, 0.25, 0.25],
        markerColor: [1, 0.78, 0.2],
        glowColor: [0.12, 0.12, 0.12],
        markers: [
          ...locations.map((l) => ({
            location: [l.lat, l.lng] as [number, number],
            size: 0.07,
          })),
        ],
        arcs: locations.map((l) => ({ from: [l.lat, l.lng] as [number, number], to: YEREVAN })),
        arcColor: [1, 0.78, 0.2],
        arcWidth: 0.5,
        arcHeight: 0.3,
      });
      setReady(true);
    };

    const tick = () => {
      if (visible && !dragging && !reduced) phi += 0.0025;
      globe?.update({ phi, theta });
      raf = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      phi += (e.clientX - lastX) / 200;
      theta = Math.max(-0.9, Math.min(0.9, theta + (e.clientY - lastY) / 400));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
    });
    io.observe(canvas);
    build();
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(() => {
      if (canvas.offsetWidth !== width) build();
    });
    ro.observe(canvas);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      globe?.destroy();
    };
  }, [locationsKey]);

  return (
    <div className="relative aspect-[1067/647] w-full max-w-[1067px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 aspect-square h-[min(100%,647px)] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none transition-opacity duration-[1200ms]"
        style={{ opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}
