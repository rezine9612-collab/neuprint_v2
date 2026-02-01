/* lib/client/intake.ts
   NeuPrint MVP, Home intake behavior.

   Source of truth: app.page_v3.html script behavior
   - textarea#intakeText input toggles:
     - button#ctaBtn .isHot
     - div#intakeBox .isFilled
   - .sampleBtn click injects data-sample into textarea
     - active sample gets .isActive
     - user manual edit clears sample active
   - CTA click validates non-empty input

   This module is browser-only. Call initHomeIntake() from a client component
   (app/page.tsx) inside useEffect().
*/

import {
  byId,
  qsa,
  requireById,
  toggleClass,
  setValue,
  getValue,
} from "./dom";

export type HomeIntakeIds = {
  intakeTextId?: string; // default: "intakeText"
  intakeBoxId?: string;  // default: "intakeBox"
  ctaBtnId?: string;     // default: "ctaBtn"
  sampleBtnSelector?: string; // default: ".sampleBtn"
  sampleRowId?: string;  // optional, default: "sampleRow"
};

export type HomeIntakeOptions = {
  ids?: HomeIntakeIds;

  /** Called when CTA is clicked with non-empty input */
  onSubmit?: (text: string) => void;

  /** Called when CTA clicked but input is empty */
  onEmpty?: () => void;

  /** If true, show alert on empty input (HTML behavior). Default: true */
  alertOnEmpty?: boolean;

  /** If true, run flicker-prevention snap around sample click. Default: true */
  preventFlicker?: boolean;
};

type Cleanup = () => void;

function snapIntakeVisualUpdate(intakeBox: HTMLElement) {
  const prev = intakeBox.style.transition;
  intakeBox.style.transition = "none";
  // force reflow
  void intakeBox.offsetHeight;
  requestAnimationFrame(() => {
    intakeBox.style.transition = prev;
  });
}

export function initHomeIntake(opts: HomeIntakeOptions = {}): Cleanup {
  const ids = opts.ids ?? {};
  const intakeTextId = ids.intakeTextId ?? "intakeText";
  const intakeBoxId = ids.intakeBoxId ?? "intakeBox";
  const ctaBtnId = ids.ctaBtnId ?? "ctaBtn";
  const sampleBtnSelector = ids.sampleBtnSelector ?? ".sampleBtn";

  const alertOnEmpty = opts.alertOnEmpty !== false;
  const preventFlicker = opts.preventFlicker !== false;

  const textarea = byId<HTMLTextAreaElement>(intakeTextId);
  const intakeBox = byId<HTMLElement>(intakeBoxId);
  const cta = byId<HTMLButtonElement>(ctaBtnId);

  // If not on the home page, do nothing safely
  if (!textarea || !intakeBox || !cta) {
    return () => {};
  }

  const sampleBtns = qsa<HTMLButtonElement>(sampleBtnSelector);

  let sampleSelected = false;

  function setActiveSample(btn: HTMLButtonElement | null) {
    sampleBtns.forEach((b) => b.classList.remove("isActive"));
    if (btn) btn.classList.add("isActive");
  }

  function clearSampleActive() {
    setActiveSample(null);
    sampleSelected = false;
  }

  function syncStates() {
    const hasValue = getValue(textarea).trim().length > 0;
    toggleClass(cta, "isHot", hasValue);
    toggleClass(intakeBox, "isFilled", hasValue);
  }

  function onUserEdit() {
    if (sampleSelected) clearSampleActive();
    syncStates();
  }

  function onTextareaInput() {
    onUserEdit();
  }

  textarea.addEventListener("input", onTextareaInput);

  // Sample buttons behavior (based on app.page_v3.html)
  const sampleCleanup: Array<() => void> = [];

  sampleBtns.forEach((btn) => {
    // Prevent focus stealing from textarea, avoids :focus-within flicker
    const onMouseDown = (e: MouseEvent) => e.preventDefault();
    const onTouchStart = (e: TouchEvent) => e.preventDefault();

    btn.addEventListener("mousedown", onMouseDown);
    btn.addEventListener("touchstart", onTouchStart, { passive: false });

    const onClick = () => {
      const isAlreadyActive = btn.classList.contains("isActive");

      if (preventFlicker) snapIntakeVisualUpdate(intakeBox);

      // Toggle off when clicking the same sample again
      if (isAlreadyActive) {
        setValue(textarea, "");
        textarea.blur();
        clearSampleActive();
        syncStates();
        return;
      }

      const t = btn.getAttribute("data-sample") ?? "";

      // Inject text, sync states, then focus next frame
      setValue(textarea, t);
      syncStates();

      requestAnimationFrame(() => {
        try {
          textarea.focus({ preventScroll: true } as any);
        } catch {
          textarea.focus();
        }
      });

      setActiveSample(btn);
      sampleSelected = true;
    };

    btn.addEventListener("click", onClick);

    sampleCleanup.push(() => {
      btn.removeEventListener("mousedown", onMouseDown);
      btn.removeEventListener("touchstart", onTouchStart as any);
      btn.removeEventListener("click", onClick);
    });
  });

  // CTA behavior
  const onCtaClick = () => {
    const v = getValue(textarea).trim();
    if (!v) {
      if (opts.onEmpty) opts.onEmpty();
      if (alertOnEmpty) {
        alert("Please enter text.");
      }
      textarea.focus();
      return;
    }
    if (opts.onSubmit) opts.onSubmit(v);
  };

  cta.addEventListener("click", onCtaClick);

  // Initial sync
  syncStates();

  // Cleanup
  return () => {
    textarea.removeEventListener("input", onTextareaInput);
    cta.removeEventListener("click", onCtaClick);
    sampleCleanup.forEach((fn) => fn());
  };
}

/** Convenience: simple default submit that navigates to /analyze with sessionStorage */
export function defaultSubmitToAnalyze(text: string) {
  if (typeof window === "undefined") return;
  // You can change this key later, but keep stable within MVP
  window.sessionStorage.setItem("neuprint.intakeText", text);
  window.location.href = "/analyze";
}

/** Read intake text from sessionStorage (used by analyze/page.tsx) */
export function readIntakeFromSession(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem("neuprint.intakeText") ?? "";
}
