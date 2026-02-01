/* lib/client/report/hydrate.ts
   Report 페이지( /report )에서 실행되는 "hydration(화면 채우기)" 엔트리.

   역할:
   1) report JSON을 가져온다 (window.REPORT, dev json block, localStorage 등)
   2) UI 텍스트/숫자 DOM을 채운다
   3) 차트 초기화 및 실제 데이터 주입을 트리거한다
   4) signatureCanvas(서명 지문) 렌더링 트리거(선택)

   주의:
   - 이 파일은 브라우저 전용이다.
   - 서버 로직, 계산 로직은 여기 넣지 않는다.
*/

import { $, setText, setHTML, safeNumber, fmt2, clamp01 } from "../dom";
import { prefersReducedMotion } from "../motion";
import { readReportFromIntakeFallback } from "../intake";

// (다음 파일들에서 구현/연결될 예정)
// - ui.ts: report JSON -> DOM 텍스트 매핑을 모아두는 레이어
// - charts/*: Chart.js 렌더링 모듈
import { renderReportUI } from "./ui";
import { initChartRuntime } from "./charts/chartCore";
import { mountCffRadar } from "./charts/cffRadar";
import { mountRslCohort } from "./charts/rslCohort";
import { mountRslRadar } from "./charts/rslRadar";
import { mountAgency } from "./charts/agency";

// signature canvas는 현재 html 내부에 구현된 코드가 크므로,
// 여기서는 "있으면 그린다" 수준으로만 인터페이스를 정의하고,
// 실제 드로잉 구현은 추후 motion.ts 또는 별도 signature 모듈로 분리 권장.
type SignatureDrawMode = "static" | "animated";

export type HydrateOptions = {
  prefer?: "window" | "devblock" | "storage";
  signature?: {
    enabled: boolean;
    mode?: SignatureDrawMode;
  };
  charts?: {
    enabled: boolean;
    animate?: boolean;
  };
};

const DEFAULT_OPTS: HydrateOptions = {
  prefer: "window",
  signature: { enabled: true, mode: "animated" },
  charts: { enabled: true, animate: true },
};

type AnyReport = Record<string, any>;

/** report.page_v3.html의 dev json block(예: <script id="dev-report-json" type="application/json">)을 읽는다 */
function readDevReportJsonBlock(): AnyReport | null {
  const el = document.getElementById("dev-report-json");
  if (!el) return null;
  const txt = (el.textContent || "").trim();
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

/** report 데이터를 얻는 우선순위:
    1) window.REPORT
    2) dev json block
    3) intake/localStorage fallback (analyze -> report 이동 플로우)
*/
export function getReportData(prefer: HydrateOptions["prefer"] = "window"): AnyReport | null {
  const w = window as unknown as { REPORT?: AnyReport };

  const fromWindow = () => (w.REPORT && typeof w.REPORT === "object" ? w.REPORT : null);
  const fromDev = () => readDevReportJsonBlock();
  const fromStorage = () => readReportFromIntakeFallback();

  if (prefer === "window") return fromWindow() || fromDev() || fromStorage();
  if (prefer === "devblock") return fromDev() || fromWindow() || fromStorage();
  return fromStorage() || fromWindow() || fromDev();
}

/** CFF Indicator table: report.page_v3.html에서 쓰는 id cffTableBody 기준으로 렌더링 :contentReference[oaicite:3]{index=3} */
function renderCffIndicatorTable(r: AnyReport) {
  const body = $("cffTableBody");
  if (!body) return;

  body.innerHTML = "";

  const names: Record<string, string> = {
    AAS: "Argument Architecture Style",
    CTF: "Cognitive Transition Flow",
    RMD: "Reasoning Momentum Delta",
    RDX: "Revision Depth Index",
    EDS: "Evidence Diversity Score",
    IFD: "Intent Friction Delta",
    "KPF-Sim": "Keystroke Pattern Fingerprint Similarity",
    "TPS-H": "Thought Pattern Similarity (History-based)",
  };

  const order = ["AAS", "CTF", "RMD", "RDX", "EDS", "IFD", "KPF-Sim", "TPS-H"];
  const ind = (r?.cff?.indicators && typeof r.cff.indicators === "object") ? r.cff.indicators : {};

  const getVal = (code: string): unknown => {
    if (code === "KPF-Sim") {
      return ind["KPF-Sim"] ?? ind.KPF_SIM ?? ind.KPFSim ?? ind.kpf_sim ?? ind.kpfSim ?? null;
    }
    if (code === "TPS-H") {
      return ind["TPS-H"] ?? ind.TPS_H ?? ind.TPSH ?? ind.tps_h ?? ind.tpsH ?? null;
    }
    return ind[code] ?? null;
  };

  const fmtScore = (code: string, raw: unknown): string => {
    if (raw == null) return "N/A";
    if (typeof raw === "number") {
      if (code === "TPS-H" && raw > 1) return String(Math.round(raw));
      return fmt2(raw);
    }
    return String(raw);
  };

  // "Status" 컬럼은 HTML에서 제거될 수 있으니, 헤더 기준으로 유연하게 처리한다.
  // 헤더(th)가 3개면 Code / Score / Indicator
  // 헤더(th)가 4개면 Code / Score / Indicator / Status
  const table = body.closest("table");
  const thCount =
    table?.querySelectorAll("thead th")?.length != null
      ? Number(table.querySelectorAll("thead th").length)
      : 0;
  const hasStatusColumn = thCount >= 4;

  order.forEach((code) => {
    const raw = getVal(code);
    const isNA = raw == null;

    const tr = document.createElement("tr");

    const tdCode = document.createElement("td");
    tdCode.className = "code";
    tdCode.textContent = code;

    const tdScore = document.createElement("td");
    tdScore.textContent = fmtScore(code, raw);

    const tdName = document.createElement("td");
    tdName.textContent = names[code] || code;

    tr.appendChild(tdCode);
    tr.appendChild(tdScore);
    tr.appendChild(tdName);

    if (hasStatusColumn) {
      const tdStatus = document.createElement("td");
      tdStatus.textContent = isNA ? "Excluded" : "Active";
      tr.appendChild(tdStatus);
    }

    body.appendChild(tr);
  });
}

/** CFF 패턴 텍스트(Primary/Secondary/Confidence/Meaning) 채우기 :contentReference[oaicite:4]{index=4} */
function renderCffPatterns(r: AnyReport) {
  const op = r?.cff?.observed_patterns || r?.cff?.observedPatterns || {};
  const p1 = op.primary_pattern || op.primary || op.primary_label || "";
  const p2 = op.secondary_pattern || op.secondary || op.secondary_label || "";
  const conf = op.type_confidence == null ? "" : fmt2(Number(op.type_confidence));

  setText("cffPrimary", String(p1));
  setText("cffPrimary2", String(p1));
  setText("cffSecondary", String(p2));
  setText("cffSecondary2", String(p2));
  setText("cffTypeConfidence", String(conf));
  setText("cffTypeConfidence2", String(conf));
  setText("cffPatternMeaning", String(op.explanation || op.meaning || ""));

  const sigNote = r?.cff?.signature_fingerprint?.description || "";
  setText("signatureNote", String(sigNote));
}

/** RSL(ARC) 패널 텍스트는 HTML 구조가 계속 바뀔 수 있으니, ui.ts에서 통합 매핑을 권장 */
function renderRslBasic(r: AnyReport) {
  // 최소 안전 처리. 실제 id는 report HTML에서 확정되는 대로 ui.ts로 옮기는 게 정석.
  const overallLevel = r?.rsl?.overall_level ?? r?.rsl?.level ?? "";
  const overallLabel = r?.rsl?.overall_label ?? r?.rsl?.label ?? "";
  const levelText = String(`${overallLevel} ${overallLabel}`).trim();

  // 예시로 id 하나만 잡아둔다. 실제 report.html의 id에 맞춰 ui.ts로 이관 권장.
  if ($("rslLevel")) setText("rslLevel", levelText);

  const fri = safeNumber(r?.rsl?.fri, 0);
  const stability = safeNumber(r?.rsl?.stability_index, 0);
  if ($("rslFRI")) setText("rslFRI", fmt2(fri));
  if ($("rslStability")) setText("rslStability", fmt2(stability));
}

/** signatureCanvas가 있으면 표시만 보장.
    실제 드로잉은 추후 signature 모듈로 분리 추천. :contentReference[oaicite:5]{index=5} */
function maybeDrawSignature(r: AnyReport, mode: SignatureDrawMode) {
  const canvas = $("signatureCanvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  // Reduced motion이면 애니메이션을 강제로 끈다.
  const reduced = prefersReducedMotion();
  const effectiveMode: SignatureDrawMode = reduced ? "static" : mode;

  // 지금 단계에서는 "훅만 제공"한다.
  // report.page_v3.html에 있던 거대한 구현을 그대로 옮기려면
  // signature 전용 모듈(예: lib/client/report/signature.ts)로 분리하는 게 안전하다.
  // 여기서는 최소 동작(빈 캔버스 방지)만 처리한다.
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  // HiDPI 대응
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // placeholder stroke
  ctx.strokeStyle = "#0f172a";
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.62);
  ctx.bezierCurveTo(w * 0.24, h * 0.18, w * 0.54, h * 0.88, w * 0.88, h * 0.36);
  ctx.stroke();

  // mode는 추후 signature 모듈에서 애니메이션으로 구현
  void effectiveMode;
  void r;
}

/** 차트 전체 마운트: chart id 기반 deferred mount 패턴을 chartCore에서 구현할 예정 :contentReference[oaicite:6]{index=6} */
function mountCharts(r: AnyReport, animate: boolean) {
  // chartCore는 공통 Chart.js 인스턴스 보관, IO(IntersectionObserver) 등 담당
  // NOTE: must be initialized at runtime (browser only) to avoid SSR window/document access.
  initChartRuntime();

  // 각 차트별 모듈에서 해당 id의 canvas가 있을 때만 mount하도록 작성한다.
  mountAgency(r, { animate });
  mountCffRadar(r, { animate });
  mountRslCohort(r, { animate });
  mountRslRadar(r, { animate });
}

/** 외부에서 호출할 메인 함수 */
export function hydrateReportPage(opts: HydrateOptions = DEFAULT_OPTS) {
  const merged: HydrateOptions = {
    ...DEFAULT_OPTS,
    ...opts,
    signature: { ...DEFAULT_OPTS.signature, ...(opts.signature || {}) },
    charts: { ...DEFAULT_OPTS.charts, ...(opts.charts || {}) },
  };

  const r = getReportData(merged.prefer);
  if (!r) {
    // report가 없으면 최소 문구만
    setText("reportError", "No report data found.");
    return;
  }

  // 1) UI 텍스트 전반 매핑 (섹션 리드, hero, 설명 문구 등은 ui.ts에서 담당)
  renderReportUI(r);

  // 2) 핵심 표/패턴
  renderCffPatterns(r);
  renderCffIndicatorTable(r);

  // 3) RSL 최소
  renderRslBasic(r);

  // 4) 차트
  if (merged.charts?.enabled) {
    const animate = Boolean(merged.charts.animate) && !prefersReducedMotion();
    mountCharts(r, animate);
  }

  // 5) signature
  if (merged.signature?.enabled) {
    const mode = merged.signature.mode || "animated";
    maybeDrawSignature(r, mode);
  }
}
