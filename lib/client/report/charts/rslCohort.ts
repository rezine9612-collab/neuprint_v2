/* lib/client/report/charts/rslCohort.ts
   IMPORTANT:
   - Extracted from report.page_v3.html original inline script.
   - Keep logic, labels, thresholds, and option values identical to the source.
   - Requires Chart.js to be loaded via CDN on the report page.
*/

import { THEME, CHART_ANIM_MS, baseChartOptions, mountChartDeferred, animateChartData } from "./chartCore";

export type AnyReport = Record<string, any>;

export type RslCohortMountOptions = {
  animate: boolean;
};

/* ================================
   Color helpers (from original HTML)
================================ */

function _parseColorToRgb(color: any) {
  if (!color) return null;
  const c = String(color).trim();

  let m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim());
    const r = parseFloat(parts[0]);
    const g = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    if ([r, g, b].every(Number.isFinite)) return { r, g, b };
  }

  m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    const n = parseInt(hex, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return { r, g, b };
  }
  return null;
}

function _rgba(color: any, alpha: any, fallbackRgb: any) {
  const a = Math.max(0, Math.min(1, Number(alpha)));
  const fb =
    fallbackRgb && String(fallbackRgb).trim()
      ? String(fallbackRgb).trim()
      : "249,123,23";
  const rgb = _parseColorToRgb(color);
  if (rgb) {
    return (
      "rgba(" +
      Math.round(rgb.r) +
      "," +
      Math.round(rgb.g) +
      "," +
      Math.round(rgb.b) +
      "," +
      a.toFixed(3) +
      ")"
    );
  }
  return "rgba(" + fb + "," + a.toFixed(3) + ")";
}

/* ================================
   Public mount (extracted block)
================================ */

export function mountRslCohort(r: AnyReport, _opts: RslCohortMountOptions) {
  mountChartDeferred(
    "chartRslBars",
    (animate) => ({
      type: "line",
      data: {
        datasets: (() => {
          const curvePts =
            r?.rsl?.charts?.cohort_positioning?.curve_points &&
            Array.isArray(r.rsl.charts.cohort_positioning.curve_points)
              ? r.rsl.charts.cohort_positioning.curve_points
              : [
                  { x: 0.0, y: 2 },
                  { x: 0.5, y: 6 },
                  { x: 1.0, y: 14 },
                  { x: 1.5, y: 26 },
                  { x: 2.0, y: 30 },
                  { x: 2.5, y: 45 },
                  { x: 3.0, y: 58 },
                  { x: 3.5, y: 42 },
                  { x: 4.0, y: 22 },
                  { x: 4.5, y: 10 },
                  { x: 5.0, y: 4 },
                ];

          const fri = Math.max(0, Math.min(5, Number(r?.rsl?.fri ?? 0)));

          const yAtX = (x: any) => {
            if (!curvePts.length) return 0;
            if (x <= curvePts[0].x) return Number((curvePts[0] as any).y ?? 0);
            for (let i = 1; i < curvePts.length; i++) {
              const a: any = curvePts[i - 1],
                b: any = curvePts[i];
              if (x <= b.x) {
                const t = (x - a.x) / (b.x - a.x || 1);
                return a.y + (b.y - a.y) * t;
              }
            }
            return Number((curvePts[curvePts.length - 1] as any).y ?? 0);
          };

          const curPt = { x: fri, y: yAtX(fri) };

          const baseCurve = animate ? curvePts : curvePts.map((p: any) => ({ x: p.x, y: 0 }));

          return [
            {
              label: "Cohort distribution",
              data: baseCurve,
              parsing: false,
              borderColor: THEME.accentD || "rgba(250,187,5,0.95)",
              backgroundColor: _rgba(THEME.accentD || "#fabb05", 0.1, "250,187,5"),
              fill: true,
              tension: 0.45,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 0,
            },

            {
              label: "Current",
              data: [curPt],
              parsing: false,
              showLine: false,
              pointRadius: 0 /* revealed after delay */,
              pointHoverRadius: 6,
              pointBackgroundColor: THEME.accentD || "#fabb05",
              pointBorderColor: "#fabb05",
              pointBorderWidth: 0,
            },
          ];
        })(),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
        animation: animate ? { duration: CHART_ANIM_MS, delay: 0 } : { duration: 0 },
        layout: { padding: { top: 10, right: 14, bottom: 12, left: 14 } },

        interaction: { mode: "nearest", intersect: true },

        scales: {
          x: {
            type: "linear",
            min: 0,
            max: 5,
            grid: { color: "rgba(226,232,240,0.55)" },
            ticks: {
              stepSize: 1,
              color: THEME.text || "#0f172a",
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(226,232,240,0.55)" },
            ticks: {
              stepSize: 20,
              callback: (v: any) => `${v}%`,
              color: THEME.text || "#0f172a",
            },
          },
        },
        elements: {
          line: { borderJoinStyle: "round" },
        },
        plugins: {
          ...baseChartOptions(animate).plugins,

          pulseCurrentPoint: {
            datasetIndex: 1,
            rings: 4,
            maxR: 52,
            periodMs: 2500,
            startDelayMs: 0,
            fadeInMs: 420,
            maxAlpha: 0.26,
            lineWidth: 2,
          },
          legend: {
            display: true,
            position: "bottom",
            align: "center",
            labels: {
              filter: (item: any) => item.datasetIndex === 1,
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 8,
              boxHeight: 8,
              padding: 10,
              font: { size: 11, weight: "500" },
              color: THEME.muted || "#0F172A",
            },
          },
          tooltip: {
            enabled: true,
            displayColors: false,
            filter: (ctx: any) => ctx.datasetIndex === 1,
            callbacks: {
              title: () => "",
              label: (ctx: any) => {
                const x = Number(ctx.parsed?.x ?? 0);
                const p = Number(r?.rsl?.percentile ?? r?.rsl?.percentile_0to1 ?? 0);
                const top = Math.max(0, Math.min(100, Math.round((1 - p) * 100)));
                const topTxt = `Top ${top}%`;
                return [`● Current · ${topTxt}`, `FRI · ${x.toFixed(2)} / 5`];
              },
            },
          },
        },
      },
    }),
    () => {
      animateChartData("chartRslBars", (c: any) => {
        if (!c) return;

        const curvePts =
          r?.rsl?.charts?.cohort_positioning?.curve_points &&
          Array.isArray(r.rsl.charts.cohort_positioning.curve_points)
            ? r.rsl.charts.cohort_positioning.curve_points
            : c.data?.datasets?.[0]?.data || [];

        const fri = Math.max(0, Math.min(5, Number(r?.rsl?.fri ?? 0)));

        const yAtX = (x: any) => {
          if (!curvePts.length) return 0;
          if (x <= curvePts[0].x) return Number((curvePts[0] as any).y ?? 0);
          for (let i = 1; i < curvePts.length; i++) {
            const a: any = curvePts[i - 1],
              b: any = curvePts[i];
            if (x <= b.x) {
              const t = (x - a.x) / (b.x - a.x || 1);
              return a.y + (b.y - a.y) * t;
            }
          }
          return Number((curvePts[curvePts.length - 1] as any).y ?? 0);
        };

        const curPt = { x: fri, y: yAtX(fri) };

        if (c.data?.datasets?.[0]) c.data.datasets[0].data = curvePts;
        if (c.data?.datasets?.[1]) {
          c.data.datasets[1].data = [curPt];
          c.data.datasets[1].pointRadius = 6;
        }

        try {
          if (c && c.data && c.data.datasets && c.data.datasets[1]) {
            c.data.datasets[1].pointRadius = 0;
            (c as any).$currentRevealTimer && clearTimeout((c as any).$currentRevealTimer);
            (c as any).$currentRevealTimer = setTimeout(() => {
              try {
                c.data.datasets[1].pointRadius = 6;
                c.update();
              } catch (_e) {}
            }, 1000);
          }
        } catch (_e) {}
      });
    },
  );

  void _opts;
}
