/* lib/client/report/charts/chartCore.ts
   IMPORTANT:
   - Extracted from report.page_v3.html original inline script.
   - This file only owns:
     1) theme tokens -> JS
     2) Chart defaults
     3) Chart registry (chartsById)
     4) Deferred mount / one-time animate via IntersectionObserver
     5) Base chart options helpers

   - Do NOT change timings, thresholds, rootMargin, or logic unless you also change the original HTML.
*/

export type AnyChart = any; // Chart.js instance (runtime)
export type AnyChartConfig = any;

export const NP_DEBUG = false;

/* ================================
   Mobile detection + delay (top)
================================ */
export const IS_MOBILE = window.matchMedia("(max-width: 680px)").matches;
export const MOBILE_CHART_START_DELAY = 10;

/* =========================================================
   Theme tokens to JS (from CSS)
========================================================= */
export const css = getComputedStyle(document.documentElement);

export const THEME = {
  text: css.getPropertyValue("--text").trim(),
  accentA: css.getPropertyValue("--accentA").trim(),
  accentB: css.getPropertyValue("--accentB").trim(),
  accentC: css.getPropertyValue("--accentC").trim(),
  accentD: css.getPropertyValue("--accentD").trim(),
  accentE: css.getPropertyValue("--accentE").trim(),
  pillB: css.getPropertyValue("--pillB").trim(),
  pillD: css.getPropertyValue("--pillD").trim(),
  pillN: css.getPropertyValue("--pillN").trim(),
};

export const CHART_ANIM_MS =
  parseInt(css.getPropertyValue("--chartAnimDuration"), 10) || 1400;
export const CHART_DELAY_MS =
  parseInt(css.getPropertyValue("--chartAnimDelay"), 10) || 180;

/* =========================================================
   Chart defaults (only if Chart exists)
========================================================= */
if ((window as any).Chart) {
  const Chart = (window as any).Chart;
  Chart.defaults.font.family =
    '"Barlow", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.color = THEME.text || "#0f172a";
}

/* =========================================================
   Charts setup (registry + deferred animation)
========================================================= */
export const chartsById: Record<string, AnyChart> = Object.create(null);
export const chartAnimators: Record<string, (() => void) | null> =
  Object.create(null);
export const chartAnimatedOnce: Record<string, boolean> = Object.create(null);

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function onChartEnter(entries: IntersectionObserverEntry[]) {
  entries.forEach((ent) => {
    if (!ent.isIntersecting) return;
    const canvas = ent.target as HTMLCanvasElement;
    const id = canvas && (canvas as any).id;
    if (!id) return;
    if (chartAnimatedOnce[id]) return;

    chartAnimatedOnce[id] = true;
    chartIO && chartIO.unobserve(canvas);

    const fn = chartAnimators[id];
    if (typeof fn === "function") {
      setTimeout(
        () => fn(),
        (IS_MOBILE ? MOBILE_CHART_START_DELAY : 0) + CHART_DELAY_MS,
      );
    }
  });
}

export const chartIO: IntersectionObserver | null =
  "IntersectionObserver" in window
    ? new IntersectionObserver(onChartEnter, {
        root: null,
        threshold: 0.18,
        rootMargin: "120px 0px",
      })
    : null;

/* =========================================================
   Safe chart create/destroy (from HTML)
========================================================= */
export function safeChart(id: string, config: AnyChartConfig): AnyChart | null {
  const el = $(id) as any;
  const Chart = (window as any).Chart;
  if (!el || !Chart) return null;

  if (chartsById[id]) {
    try {
      chartsById[id].destroy();
    } catch (_e) {}
    delete chartsById[id];
  }
  const c = new Chart(el, config);
  chartsById[id] = c;
  return c;
}

/* =========================================================
   Base options (from HTML)
========================================================= */
export function baseChartOptions(animate: boolean) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate ? { duration: CHART_ANIM_MS } : { duration: 0 },
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(15,23,42,0.92)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {},
  };
}

/* =========================================================
   Deferred mount pattern (from HTML)
   - mountChartDeferred(canvasId, buildConfig(animate))
   - stores animator for one-time real-data injection
========================================================= */
export function mountChartDeferred(
  id: string,
  build: (animate: boolean) => AnyChartConfig,
  animator?: (chart: AnyChart) => void,
) {
  const canvas = $(id) as any;
  if (!canvas) return;

  // Create as "static" first (no animation) if animator exists.
  const hasAnimator = typeof animator === "function";
  const initialAnimate = !hasAnimator;

  const cfg = build(initialAnimate);
  const c = safeChart(id, cfg);
  if (!c) return;

  if (hasAnimator) {
    chartAnimators[id] = () => {
      animateChartData(id, (chart: AnyChart) => {
        animator(chart);
      });
    };

    if (chartIO) {
      chartIO.observe(canvas);
    } else {
      // Fallback: run immediately
      setTimeout(
        () => (chartAnimators[id] ? chartAnimators[id]!() : void 0),
        (IS_MOBILE ? MOBILE_CHART_START_DELAY : 0) + CHART_DELAY_MS,
      );
    }
  }
}

/* =========================================================
   Animate helper (from HTML)
========================================================= */
export function animateChartData(
  id: string,
  applyRealData: (chart: AnyChart) => void,
) {
  const c = chartsById[id];
  if (!c) return;
  applyRealData(c);
  c.options.animation = { duration: CHART_ANIM_MS, delay: 0 };
  c.update();
}

/* =========================================================
   Optional: cleanup (useful for Hot Reload / page transitions)
========================================================= */
export function destroyAllCharts() {
  Object.keys(chartsById).forEach((id) => {
    try {
      chartsById[id].destroy();
    } catch (_e) {}
    delete chartsById[id];
  });

  Object.keys(chartAnimators).forEach((id) => delete chartAnimators[id]);
  Object.keys(chartAnimatedOnce).forEach((id) => delete chartAnimatedOnce[id]);
}
