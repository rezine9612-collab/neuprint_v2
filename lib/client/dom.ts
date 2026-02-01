/* lib/client/dom.ts
   Browser-only DOM utilities for NeuPrint MVP.

   Goals:
   - Safe element lookup by id/selector
   - Text/HTML injection helpers
   - Class and attribute helpers
   - Minimal formatting helpers for UI hydration

   This module is intentionally framework-agnostic.
   Use it from lib/client/intake.ts and lib/client/report/hydrate.ts.
*/

export type Nullable<T> = T | null | undefined;

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** Throws with a clear message if element is missing */
export function requireEl<T extends Element>(el: Nullable<T>, name: string): T {
  if (!el) throw new Error(`[dom] Missing element: ${name}`);
  return el;
}

export function byId<T extends HTMLElement = HTMLElement>(
  id: string
): T | null {
  if (!isBrowser()) return null;
  return document.getElementById(id) as T | null;
}

export function requireById<T extends HTMLElement = HTMLElement>(id: string): T {
  return requireEl(byId<T>(id), `#${id}`);
}

export function qs<T extends Element = Element>(
  selector: string,
  root?: ParentNode
): T | null {
  if (!isBrowser()) return null;
  const r = root ?? document;
  return r.querySelector(selector) as T | null;
}

export function qsa<T extends Element = Element>(
  selector: string,
  root?: ParentNode
): T[] {
  if (!isBrowser()) return [];
  const r = root ?? document;
  return Array.from(r.querySelectorAll(selector)) as T[];
}

// Shorthand query helpers used by the original HTML scripts.
// NOTE: "$" is *not* jQuery. It's an alias for qs().
// - $(selector, root?) -> Element | null
// - $$(selector, root?) -> Element[]
export const $ = qs;
export const $$ = qsa;

// Convenience formatters used across UI scripts.
export function fmt2(value: unknown, fallback = ""): string {
  return formatFixed(value, 2, fallback);
}

export function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

export function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document | Window,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions
): void {
  el.addEventListener(type, handler as EventListener, options);
}

export function off<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document | Window,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: EventListenerOptions
): void {
  el.removeEventListener(type, handler as EventListener, options);
}

export function once<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document | Window,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void
): void {
  const wrapped = (ev: Event) => {
    off(el, type, wrapped as any);
    handler(ev as any);
  };
  on(el, type, wrapped as any);
}

export function addClass(el: Nullable<Element>, cls: string): void {
  if (!el) return;
  el.classList.add(cls);
}

export function removeClass(el: Nullable<Element>, cls: string): void {
  if (!el) return;
  el.classList.remove(cls);
}

export function toggleClass(
  el: Nullable<Element>,
  cls: string,
  onState: boolean
): void {
  if (!el) return;
  if (onState) el.classList.add(cls);
  else el.classList.remove(cls);
}

export function hasClass(el: Nullable<Element>, cls: string): boolean {
  if (!el) return false;
  return el.classList.contains(cls);
}

export function setText(el: Nullable<Element>, text: Nullable<string>): void {
  if (!el) return;
  el.textContent = text ?? "";
}

export function setHTML(el: Nullable<Element>, html: Nullable<string>): void {
  if (!el) return;
  (el as HTMLElement).innerHTML = html ?? "";
}

export function setValue(
  el: Nullable<HTMLInputElement | HTMLTextAreaElement>,
  value: Nullable<string>
): void {
  if (!el) return;
  el.value = value ?? "";
}

export function getValue(
  el: Nullable<HTMLInputElement | HTMLTextAreaElement>
): string {
  return el?.value ?? "";
}

export function setAttr(
  el: Nullable<Element>,
  name: string,
  value: Nullable<string>
): void {
  if (!el) return;
  if (value === null || value === undefined) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

export function setAriaHidden(el: Nullable<Element>, hidden: boolean): void {
  setAttr(el, "aria-hidden", hidden ? "true" : "false");
}

export function show(el: Nullable<HTMLElement>, displayValue = "block"): void {
  if (!el) return;
  el.style.display = displayValue;
}

export function hide(el: Nullable<HTMLElement>): void {
  if (!el) return;
  el.style.display = "none";
}

export function setStyle(
  el: Nullable<HTMLElement>,
  style: Partial<CSSStyleDeclaration>
): void {
  if (!el) return;
  Object.assign(el.style, style);
}

/** Number helpers */
export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function safeNumber(value: unknown, fallback = 0): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function formatFixed(
  value: unknown,
  digits = 2,
  fallback = ""
): string {
  const n = safeNumber(value, NaN);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(digits);
}

export function formatPercent01(
  value01: unknown,
  digits = 0,
  fallback = "N/A"
): string {
  const n = safeNumber(value01, NaN);
  if (!Number.isFinite(n)) return fallback;
  const pct = clamp(n, 0, 1) * 100;
  return `${pct.toFixed(digits)}%`;
}

/** Converts any value to a UI-friendly string, preserving N/A semantics */
export function formatMaybe(
  value: unknown,
  fallback = "N/A"
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length ? t : fallback;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  return String(value);
}

/** Canvas helpers */
export function byCanvasId(id: string): HTMLCanvasElement | null {
  const el = byId<HTMLCanvasElement>(id);
  if (!el) return null;
  if (!(el instanceof HTMLCanvasElement)) return null;
  return el;
}

export function requireCanvasById(id: string): HTMLCanvasElement {
  const el = requireById<HTMLElement>(id);
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error(`[dom] #${id} is not a canvas`);
  }
  return el;
}

/** Data attribute helper */
export function getData(el: Nullable<Element>, key: string): string | null {
  if (!el) return null;
  const v = (el as HTMLElement).dataset?.[key];
  return v ?? null;
}

export function setData(el: Nullable<Element>, key: string, value: string): void {
  if (!el) return;
  (el as HTMLElement).dataset[key] = value;
}

/** Guard: prevents hydration code from running when root is missing */
export function hasRoot(rootId: string): boolean {
  return !!byId(rootId);
}
