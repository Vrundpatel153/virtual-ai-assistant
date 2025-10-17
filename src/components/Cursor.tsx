import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type CursorMode = "default" | "pointer" | "text";

// Heuristics to classify elements for cursor modes
function getModeFromTarget(target: Element | null): CursorMode {
  if (!target) return "default";
  const editable = target.closest('input, textarea, [contenteditable="true"]');
  if (editable) return "text";
  const pointerLike = target.closest('button, a[href], [role="button"], select, summary, .cursor-pointer');
  if (pointerLike) return "pointer"; // keep pointer on click, no grabbing circle
  return "default";
}

// Optimized custom cursor with structured visuals and rAF smoothing
export const Cursor: React.FC = () => {
  const mountedRef = useRef(false);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<SVGSVGElement | null>(null);
  const textRef = useRef<SVGSVGElement | null>(null);
  // Click sparks (3 tiny lines burst)
  const spark1Ref = useRef<HTMLDivElement | null>(null);
  const spark2Ref = useRef<HTMLDivElement | null>(null);
  const spark3Ref = useRef<HTMLDivElement | null>(null);
  const burstRef = useRef<{ active: boolean; start: number; x: number; y: number; angles: number[] }>(
    { active: false, start: 0, x: 0, y: 0, angles: [0, 2.094, 4.188] }
  );

  const targetPos = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const modeRef = useRef<CursorMode>("default");
  const downRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  // Spring-based click feedback
  const scaleRef = useRef(1);
  const scaleVelRef = useRef(0);
  const targetScaleRef = useRef(1);

  useEffect(() => {
    mountedRef.current = true;
    // Prepare transforms to scale from tip and animate smoothly on press
    if (arrowRef.current) {
      arrowRef.current.style.transformOrigin = '0 0';
    }
    if (textRef.current) {
      textRef.current.style.transformOrigin = '50% 50%';
    }
    // Prepare spark transform origins
    [spark1Ref.current, spark2Ref.current, spark3Ref.current].forEach((el) => {
      if (el) {
        el.style.transformOrigin = '0 50%';
        el.style.opacity = '0';
      }
    });

    const updateMode = (el: Element | null) => {
      const next = getModeFromTarget(el);
      if (next === modeRef.current) return;
      modeRef.current = next;
      // Toggle visibility without React re-render
      if (arrowRef.current && textRef.current) {
        arrowRef.current.style.opacity = (next === "default" || next === "pointer") ? "1" : "0";
        textRef.current.style.opacity = (next === "text") ? "1" : "0";
      }
    };

    const onMove = (e: MouseEvent) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      updateMode(e.target as Element | null);
    };
    const onDown = (e: MouseEvent) => {
      downRef.current = true;
      targetScaleRef.current = 0.94;
      // Start a spark burst at click point
      {
        const jitter = () => (Math.random() - 0.5) * 0.35; // small angle jitter in radians
        burstRef.current = {
          active: true,
          start: performance.now(),
          x: e.clientX,
          y: e.clientY,
          angles: [0 + jitter(), 2.094 + jitter(), 4.188 + jitter()],
        };
      }
      updateMode(e.target as Element | null);
    };
    const onUp = (e: MouseEvent) => {
      downRef.current = false;
      // No separate ring to reset
      targetScaleRef.current = 1;
      updateMode(e.target as Element | null);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    const tick = () => {
      if (!mountedRef.current) return;
      // Lerp toward target for smoothness
      const lerp = 0.18; // lower = smoother
      pos.current.x += (targetPos.current.x - pos.current.x) * lerp;
      pos.current.y += (targetPos.current.y - pos.current.y) * lerp;
      const x = pos.current.x;
      const y = pos.current.y;

      // Spring scale update (light underdamped for a tiny pop)
      {
        const stiffness = 0.25; // spring constant
        const damping = 0.8;    // 1 = critically damped, <1 = underdamped with overshoot
        const t = targetScaleRef.current;
        let s = scaleRef.current;
        let v = scaleVelRef.current;
        const a = (t - s) * stiffness; // acceleration toward target
        v = (v + a) * damping;
        s = s + v;
        // snap when close to avoid micro jitter
        if (Math.abs(t - s) < 0.001 && Math.abs(v) < 0.001) {
          s = t;
          v = 0;
        }
        scaleRef.current = s;
        scaleVelRef.current = v;
      }

      const s = scaleRef.current;

      // Update transforms directly (GPU-accelerated)
      if (glowRef.current) glowRef.current.style.transform = `translate3d(${x - 10}px, ${y - 10}px, 0)`;
      if (arrowRef.current) arrowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
      if (textRef.current) textRef.current.style.transform = `translate3d(${x - 8}px, ${y - 11}px, 0) scale(${s})`;

      // Animate spark burst if active
      if (burstRef.current.active) {
        const now = performance.now();
        const duration = 240; // ms
        const t = (now - burstRef.current.start) / duration;
        if (t >= 1) {
          burstRef.current.active = false;
          [spark1Ref.current, spark2Ref.current, spark3Ref.current].forEach((el) => {
            if (el) el.style.opacity = '0';
          });
        } else {
          // Ease-out cubic for distance; linear fade
          const ease = 1 - Math.pow(1 - t, 3);
          const maxR = 16;
          const dist = maxR * ease;
          const opacity = String(0.9 * (1 - t));
          const [a1, a2, a3] = burstRef.current.angles;
          const ox = burstRef.current.x;
          const oy = burstRef.current.y;
          const updateSpark = (el: HTMLDivElement | null, angle: number) => {
            if (!el) return;
            el.style.left = ox + 'px';
            el.style.top = oy + 'px';
            el.style.opacity = opacity;
            el.style.transform = `translate3d(0,0,0) rotate(${angle}rad) translateX(${dist}px) scaleX(${1 + t * 0.25})`;
          };
          updateSpark(spark1Ref.current, a1);
          updateSpark(spark2Ref.current, a2);
          updateSpark(spark3Ref.current, a3);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mousedown", onDown as any);
      window.removeEventListener("mouseup", onUp as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Render once; visibility toggled via opacity for modes
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed z-[10000] left-0 top-0">
      {/* Soft, lightweight glow (reduced blur for performance) */}
      <div
        ref={glowRef}
        className="absolute h-6 w-6 rounded-full bg-purple-500/20"
        style={{ filter: "blur(8px)", willChange: "transform" }}
      />

      {/* Structured arrow (default + pointer) */}
      <svg
        ref={arrowRef}
        width="20"
        height="28"
        viewBox="0 0 20 28"
        style={{ willChange: "transform", opacity: 1 as any, filter: "drop-shadow(0 0 6px rgba(167,139,250,0.75)) drop-shadow(0 0 14px rgba(167,139,250,0.35))" }}
      >
        <defs>
          <linearGradient id="arrowFill" x1="0" y1="0" x2="20" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" offset="0" />
            <stop stopColor="#e9d5ff" offset="1" />
          </linearGradient>
        </defs>
        {/* Base */}
        <path d="M0 0 L0 22 L6.2 17.5 L10.2 27 L14.2 25 L10.5 16 L18.5 16 Z" fill="url(#arrowFill)" />
        {/* Neon inner stroke */}
        <path d="M0.8 1 L0.8 20.8 L6.5 16.6 L10.6 25.9 L13.5 24.6 L9.5 15.4 L17.3 15 Z" fill="none" stroke="#a78bfa" strokeOpacity="0.9" strokeWidth={1.3} strokeLinejoin="round" />
        {/* Soft outer halo stroke */}
        <path d="M0.8 1 L0.8 20.8 L6.5 16.6 L10.6 25.9 L13.5 24.6 L9.5 15.4 L17.3 15 Z" fill="none" stroke="#7c3aed" strokeOpacity="0.35" strokeWidth={2.1} strokeLinejoin="round" />
      </svg>

      {/* I-beam caret for text */}
      <svg
        ref={textRef}
        width="16"
        height="22"
        viewBox="0 0 16 22"
        style={{ willChange: "transform", opacity: 0 as any, filter: "drop-shadow(0 0 6px rgba(167,139,250,0.75)) drop-shadow(0 0 14px rgba(167,139,250,0.35))" }}
      >
        {/* Neon border outline */}
        <rect x="4.2" y="-0.8" width="7.6" height="23.6" rx="1.6" fill="none" stroke="#a78bfa" strokeWidth={1.1} strokeOpacity="0.95" />
        {/* Core caret */}
        <rect x="6" y="0" width="4" height="22" rx="1.2" fill="#ffffff" />
        {/* Bars with lighter neon hue */}
        <rect x="1" y="3" width="14" height="2" rx="1" fill="#c4b5fd" />
        <rect x="1" y="17" width="14" height="2" rx="1" fill="#c4b5fd" />
      </svg>

      {/* 3-line spark burst for click feedback */}
      <div ref={spark1Ref} className="absolute" style={{ width: '10px', height: '2px', background: '#a78bfa', borderRadius: '2px', willChange: 'transform,opacity', transform: 'translate3d(0,0,0)', boxShadow: '0 0 8px rgba(167,139,250,0.9), 0 0 16px rgba(167,139,250,0.5)' }} />
      <div ref={spark2Ref} className="absolute" style={{ width: '10px', height: '2px', background: '#c084fc', borderRadius: '2px', willChange: 'transform,opacity', transform: 'translate3d(0,0,0)', boxShadow: '0 0 8px rgba(192,132,252,0.9), 0 0 16px rgba(192,132,252,0.5)' }} />
      <div ref={spark3Ref} className="absolute" style={{ width: '10px', height: '2px', background: '#8b5cf6', borderRadius: '2px', willChange: 'transform,opacity', transform: 'translate3d(0,0,0)', boxShadow: '0 0 8px rgba(139,92,246,0.9), 0 0 16px rgba(139,92,246,0.5)' }} />

      {/* No grabbing circle; clicks retain arrow for cleaner UX */}
    </div>,
    document.body
  );
};

export default Cursor;
