/* lib/client/report/ui.ts
   IMPORTANT:
   - This file is extracted from report.page_v3.html's original inline script.
   - Do NOT change ids, labels, fallback strings, or logic unless you also update the HTML source.
   - This module covers "UI text/panels/table injection" only (renderReport..renderMetadata).

   Source: /mnt/data/report.page_v3.html :contentReference[oaicite:1]{index=1}
*/

export type AnyReport = Record<string, any>;

/**
 * Render UI sections (text/panels/tables) exactly as the original HTML script does.
 * Call this after you have the REPORT object.
 */
export function renderReportUI(reportObject: AnyReport) {
  "use strict";

  const NP_DEBUG = false;

  // Original script reads from reportObject || window.report || window.DEV_REPORT
  const REPORT =
    reportObject ||
    (window as any).report ||
    (window as any).DEV_REPORT ||
    null;

  if (!REPORT) {
    NP_DEBUG &&
      console.warn(
        "[NeuPrint] No report data found. Provide window.report or DEV JSON.",
      );
    return;
  }

  // Utilities
  function $(id: string) {
    return document.getElementById(id);
  }

  function esc(v: any) {
    return String(v ?? "").replace(/[&<>"']/g, function (ch) {
      return (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any
      )[ch];
    });
  }

  function setText(id: string, value: any) {
    const el = $(id);
    if (el) el.textContent = String(value);
  }

  function clamp01(x: any) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  function pct01ToPctInt(x: any) {
    return Math.round(clamp01(x) * 100);
  }

  function pctTripletFromMix(mix: any) {
    // Use preserved percent ints when provided so the chart matches UI expectations exactly.
    if (mix && mix._pct) {
      const h = Math.max(0, Math.min(100, Number(mix._pct.human ?? 0)));
      const y = Math.max(0, Math.min(100, Number(mix._pct.hybrid ?? 0)));
      const a = Math.max(0, Math.min(100, Number(mix._pct.ai ?? 0)));
      return { human: h, hybrid: y, ai: a };
    }
    const h = pct01ToPctInt(mix?.human ?? 0);
    const y = pct01ToPctInt(mix?.hybrid ?? 0);
    const a = pct01ToPctInt(mix?.ai ?? 0);
    const s = h + y + a;
    if (s === 100) return { human: h, hybrid: y, ai: a };
    // normalize to sum 100
    const nh = Math.round((h / (s || 1)) * 100);
    const ny = Math.round((y / (s || 1)) * 100);
    const na = 100 - nh - ny;
    return { human: nh, hybrid: ny, ai: na };
  }

  function formatPct01(x: any) {
    return String(pct01ToPctInt(x)) + "%";
  }

  function fmt2(x: any) {
    const n = Number(x);
    if (!Number.isFinite(n)) return "0.00";
    return n.toFixed(2);
  }

  function getMixFromReport(r: any) {
    // Preferred path: control.distribution (already in % or 0..1)
    const dist = r?.control?.distribution || r?.control_distribution || null;
    if (dist) {
      // If already percent-int triplet exists, preserve it.
      if (
        dist.human != null &&
        dist.hybrid != null &&
        dist.ai != null &&
        (dist.human > 1 || dist.hybrid > 1 || dist.ai > 1)
      ) {
        return {
          human: clamp01(Number(dist.human) / 100),
          hybrid: clamp01(Number(dist.hybrid) / 100),
          ai: clamp01(Number(dist.ai) / 100),
          _pct: {
            human: Number(dist.human),
            hybrid: Number(dist.hybrid),
            ai: Number(dist.ai),
          },
        };
      }
      return {
        human: clamp01(dist.human ?? 0),
        hybrid: clamp01(dist.hybrid ?? 0),
        ai: clamp01(dist.ai ?? 0),
      };
    }
    // fallback
    return {
      human: clamp01(r?.human ?? 0),
      hybrid: clamp01(r?.hybrid ?? 0),
      ai: clamp01(r?.ai ?? 0),
    };
  }

  function parse01(x: any, d = 0) {
    const n = Number(x);
    if (!Number.isFinite(n)) return d;
    if (n > 1) return clamp01(n / 100);
    return clamp01(n);
  }

  function normTriplet(t: any) {
    const h = parse01(t?.human ?? 0);
    const y = parse01(t?.hybrid ?? 0);
    const a = parse01(t?.ai ?? 0);
    const s = h + y + a;
    if (s <= 0) return { human: 0, hybrid: 0, ai: 0 };
    return { human: h / s, hybrid: y / s, ai: a / s };
  }

  function getConfidenceIndex01(r: any) {
    // support multiple possible fields
    const v =
      r?.control?.type_confidence ??
      r?.control?.confidence ??
      r?.control?.typeConfidence ??
      r?.control?.type_confidence01 ??
      r?.control?.typeConfidence01 ??
      r?.control_type_confidence ??
      null;
    if (v == null) return 0;
    return parse01(v, 0);
  }

  function riskBandFromReliability(rel: any) {
    const s = String(rel ?? "").toUpperCase();
    if (s === "HIGH") return "LOW";
    if (s === "MEDIUM") return "MODERATE";
    if (s === "LOW") return "ELEVATED";
    return "";
  }

  // CSS vars access (as in original script)
  const css = getComputedStyle(document.documentElement);

  /* =========================================================
     UI Render Functions (from original HTML script)
  ========================================================= */

  function renderReport(r: any) {
    renderHero(r);
    renderHeaderPills(r);
    renderExecutiveMetrics(r);
    renderSummaryPanels(r);
    renderAuthorshipPanels(r);
    renderCffPanels(r);
    renderCffTable(r);
    renderArcPanels(r);
    renderArcTable(r);
    renderMapPanels(r);
    renderStabilityPanels(r);
    renderIdentityPanels(r);
    renderAgencySignals(r);
    renderRoleFit(r);
    renderMetadata(r);
  }

  function renderHero(r: any) {
    const meta = r.meta || {};
    const hero = r.hero || {};

    setText("heroTitle", hero.title || "");
    setText("heroDesc", hero.description || "");

    setText("verifyUrlText", meta.verify_url || meta.verifyUrl || "");
    setText(
      "verifyIdText",
      meta.verification_id || meta.assessment_id || r.assessment_id || "",
    );

    setText(
      "heroDecisionQuote",
      hero.decision_compression_quote ||
        hero.decision_quote ||
        hero.decisionQuote ||
        "Demonstrates exploratory reasoning that converts observation into cross-domain conceptual structure.",
    );

    setText(
      "heroDecisionLabel",
      hero.decision_label ||
        hero.decisionLabel ||
        hero.decision ||
        "Reflective Explorer",
    );

    const conf = hero.decision_confidence ?? hero.confidence ?? "";
    setText("heroDecisionConfidence", conf === "" ? "" : fmt2(conf));

    const note = hero.decision_note || hero.note || "";
    setText("heroDecisionNote", note);
  }

  function setPill(id: string, label: any, value: any) {
    setText(id + "Label", label ?? "");
    setText(id + "Value", value ?? "");
  }

  function bestTrackName(track: any) {
    // keep exact behavior: accept string or object name field
    if (!track) return "";
    if (typeof track === "string") return track;
    return track.name || track.track || track.label || "";
  }

  function renderHeaderPills(r: any) {
    const pills = r.header_pills || r.headerPills || {};

    setPill("pillRsl", pills.rsl_label || "RSL", pills.rsl_value || "");
    setPill("pillCff", pills.cff_label || "CFF", pills.cff_value || "");
    setPill(
      "pillControl",
      pills.control_label || "Control",
      pills.control_value || "",
    );
    setPill(
      "pillRoleFit",
      pills.rolefit_label || pills.role_fit_label || "Role Fit",
      pills.rolefit_value || pills.role_fit_value || "",
    );
  }

  function renderExecutiveMetrics(r: any) {
    const ex = r.executive || r.exec || {};
    setText("execRiskBand", ex.risk_band || ex.riskBand || "");
    setText("execReliability", ex.reliability || "");
    setText("execType", ex.type || "");
    setText("execTypeConfidence", ex.type_confidence || ex.typeConfidence || "");
  }

  function renderSummaryPanels(r: any) {
    const s = r.summary || {};
    setText("sumLine1", s.line1 || "");
    setText("sumLine2", s.line2 || "");
    setText("sumLine3", s.line3 || "");
  }

  function renderAuthorshipPanels(r: any) {
    const a = r.authorship || {};
    setText("authLabel", a.label || "");
    setText("authLead", a.lead || "");
    setText("authExplanation", a.explanation || "");
  }

  function renderCffPanels(r: any) {
    const cff = r.cff || {};
    const op = cff.observed_patterns || cff.observedPatterns || {};

    setText("cffPrimary", op.primary || op.primary_pattern || "");
    setText("cffSecondary", op.secondary || op.secondary_pattern || "");
    setText(
      "cffPatternMeaning",
      op.pattern_meaning || op.meaning || op.explanation || "",
    );

    const fd = cff.final_determination || cff.finalDetermination || {};
    setText("cffFinalLabel", fd.label || "");
    setText("cffFinalType", fd.type || "");
    setText("cffTypeConfidence", fd.type_confidence || fd.typeConfidence || "");
    setText("cffFinalLead", fd.lead || "");
    setText("cffFinalExplanation", fd.explanation || "");
  }

  function renderCffTable(r: any) {
    const cff = r.cff || {};
    const indicators = cff.indicators || {};
    const tbody = $("cffTableBody");
    if (!tbody) return;

    const rows: Array<[string, any, string]> = [];

    function getVal(code: string) {
      if (code === "KPF-Sim") {
        return (
          indicators["KPF-Sim"] ??
          indicators.KPF_SIM ??
          indicators.KPFSim ??
          indicators.kpf_sim ??
          indicators.kpfSim ??
          null
        );
      }
      if (code === "TPS-H") {
        return (
          indicators["TPS-H"] ??
          indicators.TPS_H ??
          indicators.TPSH ??
          indicators.tps_h ??
          indicators.tpsH ??
          null
        );
      }
      return indicators[code] ?? null;
    }

    function fmtScore(code: string, raw: any) {
      if (raw == null) return "N/A";
      if (typeof raw === "number") return fmt2(raw);
      return String(raw);
    }

    rows.push(["AAS", getVal("AAS"), "Argument Architecture Style"]);
    rows.push(["CTF", getVal("CTF"), "Cognitive Transition Flow"]);
    rows.push(["RMD", getVal("RMD"), "Reasoning Momentum Delta"]);
    rows.push(["RDX", getVal("RDX"), "Revision Depth Index"]);
    rows.push(["EDS", getVal("EDS"), "Evidence Diversity Score"]);
    rows.push(["IFD", getVal("IFD"), "Intent Friction Delta"]);
    rows.push(["KPF-Sim", getVal("KPF-Sim"), "Keystroke Pattern Fingerprint Similarity"]);
    rows.push(["TPS-H", getVal("TPS-H"), "Thought Pattern Similarity (History-based)"]);

    tbody.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const tdCode = document.createElement("td");
      tdCode.className = "code";
      tdCode.textContent = row[0];

      const tdScore = document.createElement("td");
      tdScore.textContent = fmtScore(row[0], row[1]);

      const tdName = document.createElement("td");
      tdName.textContent = row[2];

      tr.appendChild(tdCode);
      tr.appendChild(tdScore);
      tr.appendChild(tdName);

      tbody.appendChild(tr);
    });
  }

  function renderArcPanels(r: any) {
    const arc = r.arc || r.rsl || {};
    setText("arcLead", arc.lead || "");
    setText("arcExplanation", arc.explanation || "");
  }

  function renderArcTable(r: any) {
    const arc = r.arc || r.rsl || {};
    const tbody = $("arcTableBody");
    if (!tbody) return;

    const dims = arc.dimensions || arc.dims || arc.items || [];
    tbody.innerHTML = "";

    dims.forEach((d: any) => {
      const tr = document.createElement("tr");

      const tdCode = document.createElement("td");
      tdCode.className = "code";
      tdCode.textContent = String(d.code ?? "");

      const tdScore = document.createElement("td");
      tdScore.textContent = String(d.score ?? "");

      const tdName = document.createElement("td");
      tdName.textContent = String(d.label ?? d.name ?? "");

      tr.appendChild(tdCode);
      tr.appendChild(tdScore);
      tr.appendChild(tdName);

      tbody.appendChild(tr);
    });
  }

  function renderMapPanels(r: any) {
    const map = r.map || r.positioning || {};
    setText("mapLead", map.lead || "");
    setText("mapExplanation", map.explanation || "");
  }

  function renderStabilityPanels(r: any) {
    const st = r.stability || {};
    setText("stabilityLead", st.lead || "");
    setText("stabilityExplanation", st.explanation || "");
  }

  function renderIdentityPanels(r: any) {
    const id = r.identity || {};
    setText("identityLead", id.lead || "");
    setText("identityExplanation", id.explanation || "");
  }

  function renderRoleFit(r: any) {
    const rf = r.role_fit || r.roleFit || {};
    setText("roleFitStyleSummary", rf.cognitive_style_summary || rf.style_summary || "");
    setText("roleFitLead", rf.lead || "");
    setText("roleFitExplanation", rf.explanation || "");

    const tracks = rf.track_scores || rf.tracks || [];
    // Expect at least 2 track lines in HTML; keep safe.
    if (tracks[0]) {
      setText("roleFitTrack1", bestTrackName(tracks[0].track || tracks[0].name || tracks[0]));
      setText("roleFitPct1", String(tracks[0].score ?? tracks[0].pct ?? ""));
    }
    if (tracks[1]) {
      setText("roleFitTrack2", bestTrackName(tracks[1].track || tracks[1].name || tracks[1]));
      setText("roleFitPct2", String(tracks[1].score ?? tracks[1].pct ?? ""));
    }
  }

  function renderAgencySignals(r: any) {
    const ctl = r.control || {};
    const pattern = ctl.pattern || ctl.control_pattern || "";
    const reliability = ctl.reliability || "";
    const risk = riskBandFromReliability(reliability);
    const conf01 = getConfidenceIndex01(r);
    const mix = normTriplet(getMixFromReport(r));
    const pct = pctTripletFromMix(mix);

    setText("controlPattern", pattern);
    setText("controlReliability", reliability);
    setText("controlRiskBand", risk);

    setText("controlTypeConfidence", formatPct01(conf01));

    // Distribution labels
    setText("distHuman", String(pct.human) + "%");
    setText("distHybrid", String(pct.hybrid) + "%");
    setText("distAI", String(pct.ai) + "%");

    // Observed signals list (if provided)
    const items = ctl.observed_signals || ctl.signals || [];
    const ul = $("controlSignalsList");
    if (ul) {
      ul.innerHTML = "";
      items.forEach((s: any) => {
        const li = document.createElement("li");
        li.textContent = String(s);
        ul.appendChild(li);
      });
    }
  }

  function renderMetadata(r: any) {
    const raw = $("rawJson");
    if (raw) raw.textContent = JSON.stringify(r, null, 2);
  }

  // Execute render
  renderReport(REPORT);
}
