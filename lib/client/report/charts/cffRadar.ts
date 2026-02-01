/* lib/client/report/charts/cffRadar.ts
   IMPORTANT:
   - Extracted from report.page_v3.html original inline script.
   - Keep logic, labels, thresholds, and option values identical to the source.
   - Requires Chart.js to be loaded via CDN on the report page.
*/

import {
  THEME,
  baseChartOptions,
  mountChartDeferred,
  animateChartData,
} from "./chartCore";

export type AnyReport = Record<string, any>;

export type CffRadarMountOptions = {
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

export function mountCffRadar(r: AnyReport, _opts: CffRadarMountOptions) {
  const cffOrder = ["AAS", "CTF", "RMD", "RDX", "EDS", "IFD"];
  const cffInd = r.cff?.indicators || {};

  mountChartDeferred(
    "chartCffRadar",
    (animate) => ({
      type: "radar",
      data: {
        labels: cffOrder,
        datasets: [
          {
            label: "CFF Indicator",
            data: cffOrder.map(() => 0),
            fill: true,
            backgroundColor: _rgba(THEME.accentC, 0.14, "32,203,194"),
            borderColor: THEME.accentC,
            pointBackgroundColor: THEME.accentC,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 3,
            pointBorderWidth: 0,
          },
        ],
      },
      options: {
        ...baseChartOptions(animate),
        plugins: {
          ...baseChartOptions(animate).plugins,
          legend: { ...baseChartOptions(animate).plugins.legend, position: "bottom" },
          radarValueLabels: false,
        },
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: { display: false, backdropColor: "transparent" },
            pointLabels: {
              padding: 8,
              font: { size: 10, weight: "500" },
              color: THEME.text || "#0f172a",
            },
            grid: { color: "rgba(148,163,184,.22)" },
            angleLines: { color: "rgba(148,163,184,.22)" },
          },
        },
      },
    }),
    () =>
      animateChartData("chartCffRadar", (c: any) => {
        const vals = cffOrder.map((k) => Number(cffInd[k] ?? 0));
        c.data.datasets[0].data = vals.slice();
        c.data.labels = cffOrder.slice();
        c.options.plugins.radarValueLabels = false;
      }),
  );
}
