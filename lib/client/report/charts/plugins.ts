/* lib/client/report/charts/plugins.ts
   IMPORTANT:
   - Extracted from report.page_v3.html original inline script.
   - Keep logic, labels, thresholds, and option values identical to the source.
   - Requires Chart.js to be loaded via CDN on the report page.
*/

import { THEME } from "./chartCore";

/* ================================
   Small utils (from original HTML)
================================ */

function fmt2(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function max2(a: number, b: number) {
  return a > b ? a : b;
}
function intceil(x: number) {
  return Math.ceil(x);
}

function drawLabelBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  opt: any
) {
  const padX = opt && opt.padX != null ? opt.padX : 6;
  const padY = opt && opt.padY != null ? opt.padY : 3;
  const radius = opt && opt.radius != null ? opt.radius : 6;
  const font = opt && opt.font ? opt.font : "500 11px Barlow, system-ui, sans-serif";
  const textColor = opt && opt.textColor ? opt.textColor : "#0f172a";
  const bg = opt && opt.bg ? opt.bg : "#ffffff";
  const stroke = opt && opt.stroke ? opt.stroke : "rgba(226,232,240,.95)";
  const centerX = !!(opt && opt.centerX);

  ctx.save();
  ctx.font = font;
  ctx.textBaseline = "middle";

  const m = ctx.measureText(text);
  const w = Math.ceil(m.width + padX * 2);
  const h = Math.ceil(12 + padY * 2);

  const rx = centerX ? Math.round(x - w / 2) : x;

  roundRectPath(ctx, rx, y, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--_sigToneC")
    .trim();
  ctx.lineWidth = 1;
  /* ctx.stroke(); */

  ctx.fillStyle = textColor;
  ctx.fillText(text, rx + padX, y + h / 2);

  ctx.restore();
  return { w, h };
}

function drawLabelDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  opt: any
) {
  const font = opt && opt.font ? opt.font : "600 10px Barlow, system-ui, sans-serif";
  const textColor = opt && opt.textColor ? opt.textColor : "#0f172a";
  const bg = opt && opt.bg ? opt.bg : "#ffffff";
  const stroke = opt && opt.stroke ? opt.stroke : "rgba(226,232,240,.95)";
  const minR = opt && opt.minR != null ? opt.minR : 12;
  const pad = opt && opt.pad != null ? opt.pad : 6;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const m = ctx.measureText(text);
  const r = max2(minR, intceil(m.width / 2) + pad);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();

  const tok = getComputedStyle(document.documentElement)
    .getPropertyValue("--_sigToneC")
    .trim();
  ctx.strokeStyle = tok || stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.fillText(text, cx, cy + 0.5);

  ctx.restore();
  return r;
}

/* =========================================================
   2-1) Donut center text plugin
========================================================= */
export const centerTextPlugin = {
  id: "centerTextPlugin",
  afterDraw(chart: any) {
    const opts =
      (chart.options && chart.options.plugins && chart.options.plugins.centerText) || null;
    if (!opts) return;

    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data.length) return;

    const arc = meta.data[0];
    const x = arc.x;
    const y = arc.y;

    const top = String(opts.top || "");
    const bottom = String(opts.bottom || "");
    const yOffset = Number(opts.yOffset || 0);

    const topFont = opts.topFont || "500 14px Barlow, system-ui, sans-serif";
    const bottomFont = opts.bottomFont || "500 14px Barlow, system-ui, sans-serif";

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = THEME.text || "#0f172a";
    ctx.font = topFont;
    ctx.fillText(top, x, y - 8 + yOffset);

    ctx.font = bottomFont;
    ctx.fillText(bottom, x, y + 12 + yOffset);

    ctx.restore();
  },
};

/* =========================================================
   2-2) Bar value labels
========================================================= */
export const barValueLabelsPlugin = {
  id: "barValueLabelsPlugin",
  afterDatasetsDraw(chart: any) {
    const opts =
      (chart.options && chart.options.plugins && chart.options.plugins.barValueLabels) || null;
    if (!opts) return;

    const ctx = chart.ctx;
    const indexAxis = (chart.options && chart.options.indexAxis) || "x";
    const fmt = opts.format || "float2";
    const color = opts.textColor || THEME.text || "#0f172a";

    const dsIndex = opts.datasetIndex != null ? opts.datasetIndex : 0;
    const meta = chart.getDatasetMeta(dsIndex);
    if (!meta || meta.hidden) return;

    const data = chart.data.datasets[dsIndex].data || [];
    ctx.save();

    for (let i = 0; i < meta.data.length; i++) {
      const el = meta.data[i];
      const v = data[i];
      if (v == null) continue;

      let text = "";
      if (fmt === "pct") {
        text = Math.round(Number(v)) + "%";
      } else if (fmt === "float1") {
        text = Number(v).toFixed(1);
      } else if (fmt === "float2") {
        text = Number(v).toFixed(2);
      } else {
        text = String(v);
      }

      if (indexAxis === "y") {
        const x = el.x + 8;
        const y = el.y - 10;
        drawLabelBox(ctx, x, y, text, {
          textColor: color,
          bg: "#fff",
          stroke: "rgba(226,232,240,.95)",
          radius: 6,
        });
      } else {
        const x = el.x;
        const y = el.y - 24;
        drawLabelBox(ctx, x, y, text, {
          textColor: color,
          bg: "#fff",
          stroke: "rgba(226,232,240,.95)",
          radius: 6,
          centerX: true,
        });
      }
    }

    ctx.restore();
  },
};

/* =========================================================
   2-3) Radar value labels
========================================================= */
export const radarValueLabelsPlugin = {
  id: "radarValueLabelsPlugin",
  afterDatasetsDraw(chart: any) {
    const opts =
      (chart.options && chart.options.plugins && chart.options.plugins.radarValueLabels) || null;
    if (!opts) return;

    const dsIndex = opts.datasetIndex != null ? opts.datasetIndex : 0;
    const meta = chart.getDatasetMeta(dsIndex);
    if (!meta || meta.hidden) return;

    const scale = chart.scales && chart.scales.r;
    if (!scale) return;

    const labels = chart.data.labels || [];
    const values = chart.data.datasets[dsIndex].data || [];

    const ctx = chart.ctx;
    ctx.save();
    ctx.font = "500 10px Barlow, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxV = typeof scale.max === "number" ? scale.max : 1;

    const outV = maxV * Number(opts.outFactor || 1.15);
    const extraPx = Number(opts.extraPx || 10);

    for (let i = 0; i < labels.length; i++) {
      const v = Number(values[i] ?? 0);
      const txt = fmt2(v);

      const pt = scale.getPointPositionForValue(i, outV);

      const cx = scale.xCenter;
      const cy = scale.yCenter;
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      const ox = pt.x + (dx / len) * extraPx;
      const oy = pt.y + (dy / len) * extraPx;

      drawLabelDot(ctx, ox, oy - 2, txt, {
        font: "600 10px Barlow, system-ui, sans-serif",
        textColor: THEME.text || "#0f172a",
        bg: "#fff",
        stroke: "rgba(226,232,240,.95)",
        minR: 12,
        pad: 6,
      });
    }

    ctx.restore();
  },
};

/* =========================================================
   2-4) Pulsing ring animation for Structural Position Map
========================================================= */

/* Color helpers for pulse rings (supports hex/rgba) */
function _parseColorToRgb(color: any) {
  if (!color) return null;
  const c = String(color).trim();

  let m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(",").map((s: string) => s.trim());
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
        .map((ch: string) => ch + ch)
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
    fallbackRgb && String(fallbackRgb).trim() ? String(fallbackRgb).trim() : "249,123,23";
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

export const pulseCurrentPointPlugin = {
  id: "pulseCurrentPointPlugin",
  afterDatasetsDraw(chart: any) {
    const opts =
      (chart.options && chart.options.plugins && chart.options.plugins.pulseCurrentPoint) || null;
    if (!opts) return;

    const dsIndex = opts.datasetIndex != null ? opts.datasetIndex : 3;
    const meta = chart.getDatasetMeta(dsIndex);
    if (!meta || meta.hidden || !meta.data || !meta.data.length) return;

    const point = meta.data[0];
    if (!point) return;

    const pr = point.getProps ? point.getProps(["radius", "x", "y"], false) : null;

    const px = pr && Number.isFinite(pr.x) ? pr.x : point.x;
    const py = pr && Number.isFinite(pr.y) ? pr.y : point.y;
    const curRadius =
      pr && Number.isFinite(pr.radius) ? pr.radius : (point.options?.radius ?? 0);

    if (curRadius < 0.5) {
      return;
    }

    const ctx = chart.ctx;
    const now = performance.now();

    if (!chart.$pulse) {
      chart.$pulse = { start: now, raf: null, started: false };
    }

    const startDelayMs = Number(opts.startDelayMs || 0);

    if (!chart.$pulse.startedAt) {
      chart.$pulse.startedAt = now;
      chart.$pulse.start = now;
      chart.$pulse.started = false;
    }

    if (!chart.$pulse.started) {
      if (now - chart.$pulse.startedAt < startDelayMs) {
        return;
      }
      chart.$pulse.started = true;
      chart.$pulse.start = now;
    }

    const delayMs = Number(opts.delayMs ?? 0);
    const fadeInMs = Number(opts.fadeInMs ?? 450);
    const period = Number(opts.periodMs || 1200);

    const elapsed = now - chart.$pulse.start;
    if (elapsed < delayMs) return;

    const t2 = elapsed - delayMs;
    const base = (t2 % period) / period;

    const rings = Number(opts.rings ?? 4);
    const baseR = 0;
    const maxR = Math.max(Number(opts.maxR || 52), curRadius + 18);

    const smoothAlpha = (p: number) => Math.sin(Math.PI * p);
    const smoothGrow = (p: number) => 1 - Math.cos((Math.PI / 2) * p);

    const globalFade = Math.max(0, Math.min(1, t2 / fadeInMs));

    for (let j = 0; j < rings; j++) {
      const phase = (base + j / rings) % 1;

      const r = baseR + (maxR - baseR) * smoothGrow(phase);
      const aMax = Number(opts.maxAlpha ?? 0.22);
      const a = aMax * smoothAlpha(phase) * globalFade;

      if (a < 0.003) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.strokeStyle = _rgba(opts.color || THEME.accentE || "#f59e0b", a, "249,123,23");
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    if (!chart.$pulse.raf) {
      const tick = () => {
        if (chart && chart.ctx) {
          try {
            chart.draw();
          } catch (_e) {}
        }
        chart.$pulse.raf = requestAnimationFrame(tick);
      };
      chart.$pulse.raf = requestAnimationFrame(tick);
    }
  },
  beforeDestroy(chart: any) {
    if (chart && chart.$pulse && chart.$pulse.raf) {
      cancelAnimationFrame(chart.$pulse.raf);
      chart.$pulse.raf = null;
    }
  },
};

/* =========================================================
   Register (from original HTML)
========================================================= */
export function registerNeuPrintChartPlugins() {
  const w = window as any;
  if (w.Chart) {
    const Chart = w.Chart;
    Chart.register(
      centerTextPlugin,
      barValueLabelsPlugin,
      radarValueLabelsPlugin,
      pulseCurrentPointPlugin
    );
  }
}
