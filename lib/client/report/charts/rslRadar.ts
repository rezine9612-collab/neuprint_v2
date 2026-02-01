/* lib/client/report/charts/rslRadar.ts
   IMPORTANT:
   - Extracted from report.page_v3.html original inline script.
   - Keep logic, labels, thresholds, and option values identical to the source.
   - Requires Chart.js to be loaded via CDN on the report page.
*/

import { THEME, baseChartOptions, mountChartDeferred, animateChartData } from "./chartCore";

export type AnyReport = Record<string, any>;

export type RslRadarMountOptions = {
  animate: boolean;
};

export function mountRslRadar(r: AnyReport, _opts: RslRadarMountOptions) {
  const arcDims = Array.isArray(r.rsl?.dimensions) ? r.rsl.dimensions : [];
  const arcLabels = arcDims.map((d: any) => String(d.code || "").trim()).filter(Boolean);
  const arcVals = arcDims.map((d: any) => Number(d.score ?? 0));

  mountChartDeferred(
    "chartRslRadar",
    (animate) => ({
      type: "radar",
      data: {
        labels: arcLabels,
        datasets: [
          {
            label: "RSL profile",
            data: arcLabels.map(() => 0),
            fill: true,
            backgroundColor: THEME.pillB,
            borderColor: THEME.accentB,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 3,
            pointBackgroundColor: THEME.accentB,
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
            max: 6,
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
      animateChartData("chartRslRadar", (c: any) => {
        c.data.datasets[0].data = arcVals.slice();
        c.options.plugins.radarValueLabels = false;
      }),
  );
}
