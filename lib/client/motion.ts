/* lib/client/motion.ts
   Lightweight, browser-only motion helpers.

   Purpose:
   - Run small "enter" animations by toggling CSS classes
   - Typewriter effect for short text blocks (optional)
   - Respect prefers-reduced-motion

   Design:
   - No external dependencies
   - Works with existing CSS that uses classes like:
     - .npHome-enterY (home)
     - .npFadeIn, .npEnter etc (if you add them)
*/

import { isBrowser, qsa, addClass, removeClass } from "./dom";

export type MotionOptions = {
  /** If true, motion is disabled when user prefers reduced motion (default true) */
  respectReducedMotion?: boolean;

  /** Default stagger step (ms) for batch enter animations */
  staggerMs?: number;
};

export function prefersReducedMotion(): boolean {
  if (!isBrowser()) return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function shouldReduce(opts?: MotionOptions): boolean {
  const respect = opts?.respectReducedMotion !== false;
  return respect ? prefersReducedMotion() : false;
}

/** Add a class after a small delay, optionally staggered */
export function runEnter(
  el: Element,
  enterClass: string,
  delayMs = 0,
  opts?: MotionOptions
): void {
  if (!isBrowser()) return;

  const reduce = shouldReduce(opts);
  if (reduce) {
    // If reduced motion, just ensure the enter class is present (or do nothing).
    addClass(el, enterClass);
    return;
  }

  window.setTimeout(() => addClass(el, enterClass), Math.max(0, delayMs));
}

/**
 * Batch enter: select elements and toggle class with stagger.
 * Example:
 *   runBatchEnter(".npHome-enterY", "isIn", 0, { staggerMs: 50 })
 */
export function runBatchEnter(
  selector: string,
  enterClass: string,
  baseDelayMs = 0,
  opts?: MotionOptions
): void {
  if (!isBrowser()) return;

  const els = qsa(selector);
  const stagger = opts?.staggerMs ?? 60;

  els.forEach((el, idx) => {
    runEnter(el, enterClass, baseDelayMs + idx * stagger, opts);
  });
}

/** Remove enter class so you can re-run (useful for demos) */
export function resetEnter(
  selector: string,
  enterClass: string
): void {
  if (!isBrowser()) return;
  qsa(selector).forEach((el) => removeClass(el, enterClass));
}

/** Typewriter effect (for short single-line or small blocks) */
export type TypewriterOptions = {
  /** Total duration per character (ms). Default 18 */
  msPerChar?: number;
  /** Delay before start (ms). Default 0 */
  delayMs?: number;
  /** Cursor char (default "▍"), set "" to disable */
  cursor?: string;
  /** If true, keep cursor at end when finished. Default false */
  keepCursor?: boolean;
};

export function typewriter(
  el: HTMLElement,
  fullText: string,
  options: TypewriterOptions = {}
): () => void {
  if (!isBrowser()) return () => {};

  const reduce = prefersReducedMotion();
  const msPerChar = options.msPerChar ?? 18;
  const delayMs = options.delayMs ?? 0;
  const cursor = options.cursor ?? "▍";
  const keepCursor = options.keepCursor ?? false;

  let cancelled = false;
  let rafId: number | null = null;
  let startTime: number | null = null;

  if (reduce) {
    el.textContent = fullText;
    return () => {};
  }

  const base = fullText ?? "";
  const total = base.length;

  function step(ts: number) {
    if (cancelled) return;
    if (startTime === null) startTime = ts;

    const elapsed = ts - startTime;
    const count = Math.min(total, Math.floor(elapsed / msPerChar));

    const shown = base.slice(0, count);
    el.textContent = cursor ? shown + cursor : shown;

    if (count < total) {
      rafId = requestAnimationFrame(step);
    } else {
      el.textContent = keepCursor && cursor ? base + cursor : base;
    }
  }

  const timer = window.setTimeout(() => {
    if (cancelled) return;
    rafId = requestAnimationFrame(step);
  }, Math.max(0, delayMs));

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

/**
 * Progressive reveal for multiple elements.
 * Intended for report sections coming into view.
 */
export type RevealOptions = {
  selector: string;
  enterClass: string; // class to add when revealed
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean; // default true
};

export function revealOnView(opts: RevealOptions, motion?: MotionOptions): () => void {
  if (!isBrowser()) return () => {};
  const reduce = shouldReduce(motion);

  const els = qsa<HTMLElement>(opts.selector);
  if (!els.length) return () => {};

  if (reduce) {
    els.forEach((el) => addClass(el, opts.enterClass));
    return () => {};
  }

  const once = opts.once !== false;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        addClass(entry.target, opts.enterClass);
        if (once) io.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: opts.rootMargin ?? "0px 0px -10% 0px",
      threshold: opts.threshold ?? 0.05,
    }
  );

  els.forEach((el) => io.observe(el));

  return () => io.disconnect();
}
