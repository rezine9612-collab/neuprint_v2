/* lib/client/report/charts/agency.ts
   IMPORTANT:
   - Extracted from report.page_v3.html original inline script.
   - Keep logic, labels, thresholds, and option values identical to the source.
   - Requires Chart.js to be loaded via CDN on the report page.
*/

import {
  THEME,
  CHART_ANIM_MS,
  baseChartOptions,
  mountChartDeferred,
  animateChartData,
} from "./chartCore";

export type AnyReport = Record<string, any>;

export type AgencyMountOptions = {
  animate: boolean;
};

/* ================================
   Helpers (from original HTML)
================================ */

function clamp01(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pctTripletFromMix(mix: any) {
  // Use preserved percent ints when provided so the chart matches UI expectations exactly.
  if (mix && mix._pct) {
    const h = Math.max(0, Math.min(100, Number(mix._pct.human ?? 0)));
    const y = Math.max(0, Math.min(100, Number(mix._pct.hybrid ?? 0)));
    const a = Math.max(0, Math.min(100, Number(mix._pct.ai ?? 0)));
    const s = h + y + a;
    if (s === 100) return [h, y, a];
  }
  // Otherwise, round and then adjust so the sum is exactly 100.
  const raw = [
    clamp01(mix?.human ?? 0) * 100,
    clamp01(mix?.hybrid ?? 0) * 100,
    clamp01(mix?.ai ?? 0) * 100,
  ];
  const base = raw.map((v) => Math.floor(v));
  let rem = 100 - (base[0] + base[1] + base[2]);
  const frac = raw
    .map((v, i) => ({ i, f: v - base[i] }))
    .sort((a, b) => b.f - a.f);
  for (let k = 0; k < frac.length && rem > 0; k++) {
    base[frac[k].i] += 1;
    rem -= 1;
  }
  // Final safety
  const s2 = base[0] + base[1] + base[2];
  if (s2 !== 100) {
    base[0] += 100 - s2;
  }
  return base;
}

function getMixFromReport(r: any) {
  // Returns 0..1 ratios.
  // Accepts 0..1, 0..100, or strings like "82%".
  // Also preserves percent-int inputs (82) so the UI can match them exactly.

  function parse01(v: any) {
    if (v == null) return null;
    if (typeof v === "string") {
      const s = v.trim().replace("%", "");
      if (!s) return null;
      const n = Number(s);
      if (!Number.isFinite(n)) return null;
      return clamp01(n > 1 ? n / 100 : n);
    }
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return clamp01(n > 1 ? n / 100 : n);
  }

  function normTriplet(h: any, y: any, a: any) {
    const hh = clamp01(h);
    const yy = clamp01(y);
    const aa = clamp01(a);
    const s = hh + yy + aa;
    if (s <= 0) return { human: 0, hybrid: 0, ai: 0 };
    return { human: hh / s, hybrid: yy / s, ai: aa / s };
  }

  try {
    // 1) Prefer explicit distribution percent ints (UI-facing) when available.
    const d = r && r.agency && r.agency.distribution ? r.agency.distribution : null;
    if (d && (d.human_pct != null || d.hybrid_pct != null || d.ai_pct != null)) {
      // If only Hybrid/AI are provided (common in some backends), derive Human as the residual.
      // This prevents accidental pickup of unrelated confidence fields.
      // NOTE: Next.js typecheck is strict about Math.min/Math.max taking only numbers.
      // Use NaN as the "missing" sentinel instead of null so TS stays happy.
      const yp0 = d.hybrid_pct == null ? Number.NaN : Number(d.hybrid_pct);
      const ap0 = d.ai_pct == null ? Number.NaN : Number(d.ai_pct);
      let hp0 = d.human_pct == null ? Number.NaN : Number(d.human_pct);

      const yp = Math.max(0, Math.min(100, Number.isFinite(yp0) ? yp0 : 0));
      const ap = Math.max(0, Math.min(100, Number.isFinite(ap0) ? ap0 : 0));
      if (!Number.isFinite(hp0) && (d.hybrid_pct != null || d.ai_pct != null)) {
        hp0 = 100 - yp - ap;
      }
      const hp = Math.max(0, Math.min(100, Number.isFinite(hp0) ? hp0 : 0));
      const out: any = normTriplet(hp / 100, yp / 100, ap / 100);
      out._pct = { human: Math.round(hp), hybrid: Math.round(yp), ai: Math.round(ap) };
      return out;
    }

    // 2) mix_ratio object (0..1 or 0..100)
    const mix = r && r.ai && r.ai.mix_ratio ? r.ai.mix_ratio : null;
    if (mix && (mix.human != null || mix.hybrid != null || mix.ai != null)) {
      const y = parse01(mix.hybrid ?? 0) ?? 0;
      const a = parse01(mix.ai ?? 0) ?? 0;
      let h = parse01(mix.human);

      // If Human is missing, derive it as residual.
      if (h == null && (mix.hybrid != null || mix.ai != null)) {
        h = clamp01(1 - y - a);
      }

      // If the three don't look like a valid triplet (e.g., Human accidentally stored as confidence),
      // prefer residual so Hybrid/AI remain exact.
      if (h != null && y + a > 0) {
        const s = h + y + a;
        if (s > 1.001) {
          h = clamp01(1 - y - a);
        }
      }
      return normTriplet(h ?? 0, y, a);
    }

    // 3) Alternative schema support (optional)
    const alt =
      r && r.reasoning_control && r.reasoning_control.distribution
        ? r.reasoning_control.distribution
        : null;
    if (alt && (alt.human != null || alt.hybrid != null || alt.ai != null)) {
      const h = parse01(alt.human ?? 0) ?? 0;
      const y = parse01(alt.hybrid ?? 0) ?? 0;
      const a = parse01(alt.ai ?? 0) ?? 0;
      return normTriplet(h, y, a);
    }

    return { human: 0, hybrid: 0, ai: 0 };
  } catch (_e) {
    return { human: 0, hybrid: 0, ai: 0 };
  }
}

/* ================================
   Fixed dataset shapes (from HTML)
================================ */

const BAR_FIXED_HORIZONTAL = {
  barThickness: 14,
  maxBarThickness: 14,
  categoryPercentage: 0.8,
  barPercentage: 0.9,
  borderWidth: 0,
  borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 4, bottomRight: 4 },
  borderSkipped: false,
};

const DONUT_FIXED = {
  cutout: "62%",
  radius: "92%",
  borderWidth: 0,
  hoverOffset: 0,
};

function doughnutOptions(animate: boolean) {
  const base = baseChartOptions(animate);
  return {
    ...base,
    rotation: -90,
    circumference: 360,
    animation: animate
      ? { duration: CHART_ANIM_MS, delay: 0, animateRotate: true, animateScale: false }
      : { duration: 0 },
    plugins: { ...base.plugins, legend: { ...base.plugins.legend, position: "bottom" } },
  };
}

const DONUT_SPIN_ANIM = {
  circumference: { duration: CHART_ANIM_MS, from: 0 },
  rotation: { duration: CHART_ANIM_MS, from: -450 },
};
// NOTE: DONUT_SPIN_ANIM is preserved from the source even if not referenced elsewhere.
void DONUT_SPIN_ANIM;

/* ================================
   Public mount (from HTML blocks)
================================ */

export function mountAgency(r: AnyReport, opts: AgencyMountOptions) {
  // Keep these locals aligned with the source script.
  const mix = getMixFromReport(r);
  const decision = String(r.ai?.final_classification ?? r.ai?.determination ?? "Human");

  /* =========================================================
     chartMixAgency -> Reasoning Control Distribution
     NOTE: center label should show HUMAN SHARE (not confidence).
  ========================================================= */

  mountChartDeferred(
    "chartMixAgency",
    (animate) => ({
      type: "doughnut",
      data: {
        labels: ["Human", "Hybrid", "AI"],
        datasets: [
          {
            data: [0, 0, 0],
            ...DONUT_FIXED,
            backgroundColor: [THEME.accentA, THEME.accentC, THEME.accentD],
          },
        ],
      },
      options: {
        ...doughnutOptions(animate),
        plugins: {
          ...doughnutOptions(animate).plugins,
          // Top: determination label (e.g., Human)
          // Bottom: Human share from mix_ratio/distribution (e.g., 82%)
          centerText: { top: decision, bottom: pctTripletFromMix(mix)[0] + "%" },
        },
      },
    }),
    () =>
      animateChartData("chartMixAgency", (c: any) => {
        const mix2 = getMixFromReport(r);
        const decision2 = String(r.ai?.final_classification ?? r.ai?.determination ?? "Human");
        c.data.datasets[0].data = pctTripletFromMix(mix2);
        // Keep center label aligned to the chart's Human portion.
        c.options.plugins.centerText = {
          top: decision2,
          bottom: pctTripletFromMix(mix2)[0] + "%",
        };
      }),
  );

  /* =========================================================
     2-2) Structural Control Signals (Agency Indicators)
     - Keeps the page resilient: prevents ReferenceError when rendering charts.
  ========================================================= */

  const contribKeys = [
    "structural_variance",
    "human_rhythm_index",
    "transition_flow",
    "revision_depth",
  ];
  const contribLabels = [
    "Structural variance",
    "Human rhythm index",
    "Transition flow integrity",
    "Revision depth signal",
  ];
  const contribSrc = r && r.ai && r.ai.signal_contributions ? r.ai.signal_contributions : {};
  const contribVals = contribKeys.map((k) => clamp01(Number(contribSrc[k] ?? 0)));

  mountChartDeferred(
    "chartAuthSignals",
    (animate) => ({
      type: "bar",
      data: {
        labels: contribLabels,
        datasets: [
          {
            label: "contribution (0 to 1)",
            data: contribLabels.map(() => 0),
            ...BAR_FIXED_HORIZONTAL,
            backgroundColor: THEME.accentB,
          },
        ],
      },
      options: {
        ...baseChartOptions(animate),
        indexAxis: "y",
        animation: animate
          ? {
              duration: CHART_ANIM_MS,
              delay: (ctx: any) => (ctx.type === "data" ? 140 + ctx.dataIndex * 90 : 0),
            }
          : { duration: 0 },
        plugins: {
          ...baseChartOptions(animate).plugins,
          barValueLabels: { format: "float2", textColor: THEME.text || "#0f172a" },
        },
        scales: {
          x: { min: 0, max: 0.4, grid: { color: "rgba(148,163,184,.22)" } },
          y: {
            grid: { display: false },
          },
        },
      },
    }),
    () =>
      animateChartData("chartAuthSignals", (c: any) => {
        c.data.datasets[0].data = contribVals.slice();
      }),
  );

  void opts;
}
