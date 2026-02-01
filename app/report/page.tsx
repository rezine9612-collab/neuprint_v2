"use client";

import { useEffect, useMemo } from "react";
import { hydrateReportPage } from "@/lib/client/report/hydrate";

/**
 * Source of truth: report.page_v3.html (DOM ids/classes must match).
 * - CSS is scoped to html.npReport-scope to avoid collisions with other pages.
 * - Chart.js is loaded via the original CDN version.
 */
export default function ReportPage() {
  const reportHtml = useMemo(
    () => ({
      __html: "\n<div id=\"npReportRoot\">\n\n    <!-- Header -->\n    <header class=\"topbar\" id=\"topbar\">\n      <div class=\"container\">\n        <div class=\"headerTopRow\">\n          <div class=\"headerLeft\">\n            <div class=\"brand\">\n              <img alt=\"NeuPrint\" class=\"brandLogo\" src=\"/assets/logo.svg\" />\n            </div>\n          </div>\n\n          <div class=\"headerRight\">\n            <div class=\"metaRow\">\n              <div class=\"metaItem\">\n                <div class=\"metaLabel\">Report ID</div>\n                <div class=\"metaValue\" id=\"metaReportId\">NP-2026-0001</div>\n              </div>\n              <div class=\"metaItem\">\n                <div class=\"metaLabel\">Generated</div>\n                <div class=\"metaValue\" id=\"metaGeneratedAt\">2026-02-01</div>\n              </div>\n              <div class=\"metaItem\">\n                <div class=\"metaLabel\">Version</div>\n                <div class=\"metaValue\" id=\"metaVersion\">v1.0</div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"hero\">\n          <div class=\"heroLeft\">\n            <h1 class=\"heroTitle\" id=\"heroTitle\">NeuPrint Report</h1>\n            <p class=\"heroDesc\" id=\"heroDesc\">\n              Structural reference for human reasoning under AI-assisted conditions.\n            </p>\n\n            <div class=\"heroChips\" id=\"heroChips\">\n              <div class=\"chip\" id=\"chipRsl\">\n                <div class=\"chipK\">RSL Level</div>\n                <div class=\"chipV\" id=\"chipRslV\">L4 Integrated</div>\n              </div>\n              <div class=\"chip\" id=\"chipFri\">\n                <div class=\"chipK\">FRI</div>\n                <div class=\"chipV\" id=\"chipFriV\">3.72</div>\n              </div>\n              <div class=\"chip\" id=\"chipControl\">\n                <div class=\"chipK\">Control</div>\n                <div class=\"chipV\" id=\"chipControlV\">Human</div>\n              </div>\n              <div class=\"chip\" id=\"chipRoleFit\">\n                <div class=\"chipK\">Role Fit</div>\n                <div class=\"chipV\" id=\"chipRoleFitV\">Strategy·Analysis·Policy</div>\n              </div>\n            </div>\n          </div>\n\n          <div class=\"heroRight\">\n            <div class=\"signatureWrap\">\n              <canvas height=\"200\" id=\"signatureCanvas\" width=\"320\"></canvas>\n              <div class=\"signatureCaption\" id=\"signatureCaption\">Signature Fingerprint</div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </header>\n\n    <!-- Main -->\n    <main class=\"main\">\n      <div class=\"container\">\n\n        <!-- Section: Reasoning Structure (RSL/ARC) -->\n        <section class=\"section\" id=\"sectionRsl\">\n          <div class=\"sectionHead\">\n            <h2 class=\"sectionTitle\" id=\"rslTitle\">Reasoning Structure (ARC)</h2>\n            <p class=\"sectionLead\" id=\"rslLead\">This section shows how your thinking was organized in this writing, and what you can improve next.</p>\n          </div>\n\n          <div class=\"grid2\">\n            <div class=\"panel\">\n              <div class=\"panelHead\">\n                <div class=\"panelTitle\">RSL Radar</div>\n              </div>\n              <div class=\"panelBody\">\n                <canvas id=\"chartRslRadar\"></canvas>\n              </div>\n            </div>\n\n            <div class=\"panel\">\n              <div class=\"panelHead\">\n                <div class=\"panelTitle\">Cohort Positioning</div>\n              </div>\n              <div class=\"panelBody\">\n                <canvas id=\"chartRslBars\"></canvas>\n              </div>\n            </div>\n          </div>\n        </section>\n\n        <!-- Section: CFF -->\n        <section class=\"section\" id=\"sectionCff\">\n          <div class=\"sectionHead\">\n            <h2 class=\"sectionTitle\" id=\"cffTitle\">Cognitive Fingerprint Framework (CFF)</h2>\n            <p class=\"sectionLead\" id=\"cffLead\">Describes structural characteristics of reasoning formation and revision behavior observed in the task, based on the CFF indicator set.</p>\n          </div>\n\n          <div class=\"grid2\">\n            <div class=\"panel\">\n              <div class=\"panelHead\">\n                <div class=\"panelTitle\">CFF Radar</div>\n              </div>\n              <div class=\"panelBody\">\n                <canvas id=\"chartCffRadar\"></canvas>\n              </div>\n            </div>\n\n            <div class=\"panel\">\n              <div class=\"panelHead\">\n                <div class=\"panelTitle\">CFF Indicators</div>\n              </div>\n              <div class=\"panelBody\">\n                <table class=\"tbl\">\n                  <thead>\n                    <tr>\n                      <th>Code</th>\n                      <th>Score</th>\n                      <th>Indicator</th>\n                    </tr>\n                  </thead>\n                  <tbody id=\"cffTableBody\"></tbody>\n                </table>\n              </div>\n            </div>\n          </div>\n\n          <div class=\"panel\" style=\"margin-top:14px\">\n            <div class=\"panelHead\">\n              <div class=\"panelTitle\">Observed Reasoning Patterns</div>\n            </div>\n            <div class=\"panelBody\">\n              <div class=\"patterns\">\n                <div class=\"patternCard\">\n                  <div class=\"patternName\" id=\"patternPrimaryName\">Reflective Explorer</div>\n                  <div class=\"patternDesc\" id=\"patternPrimaryDesc\"></div>\n                </div>\n                <div class=\"patternCard\">\n                  <div class=\"patternName\" id=\"patternSecondaryName\">Evidence Weaver</div>\n                  <div class=\"patternDesc\" id=\"patternSecondaryDesc\"></div>\n                </div>\n              </div>\n            </div>\n          </div>\n        </section>\n\n        <!-- Section: Agency -->\n        <section class=\"section\" id=\"sectionAgency\">\n          <div class=\"sectionHead\">\n            <h2 class=\"sectionTitle\" id=\"agencyTitle\">Reasoning Control (Structural Agency)</h2>\n            <p class=\"sectionLead\" id=\"agencyLead\">Evaluates individual control over reasoning decisions versus automated continuation, as defined by structural agency at decision boundaries in NeuPrint.</p>\n          </div>\n\n          <div class=\"grid2\">\n            <div class=\"panel\">\n              <div class=\"panelHead\">\n                <div class=\"panelTitle\">Control Distribution</div>\n              </div>\n              <div class=\"panelBody\">\n                <canvas id=\"chartAgency\"></canvas>\n              </div>\n            </div>\n\n            <div class=\"panel\">\n              <div class=\"panelHead\">\n                <div class=\"panelTitle\">Observed Structural Signals</div>\n              </div>\n              <div class=\"panelBody\">\n                <ul class=\"bullets\" id=\"agencySignals\"></ul>\n              </div>\n            </div>\n          </div>\n        </section>\n\n        <!-- Section: Role Fit -->\n        <section class=\"section\" id=\"sectionRoleFit\">\n          <div class=\"sectionHead\">\n            <h2 class=\"sectionTitle\" id=\"roleFitTitle\">Role Fit Signals</h2>\n            <p class=\"sectionLead\" id=\"roleFitLead\">Explores alignment between observed reasoning patterns and role-specific cognitive demands.</p>\n          </div>\n\n          <div class=\"panel\">\n            <div class=\"panelHead\">\n              <div class=\"panelTitle\">Cognitive Style Summary</div>\n            </div>\n            <div class=\"panelBody\">\n              <div class=\"roleFitSummary\" id=\"roleFitSummary\"></div>\n              <div class=\"roleFitTracks\" id=\"roleFitTracks\"></div>\n              <div class=\"roleFitWhy\" id=\"roleFitWhy\"></div>\n            </div>\n          </div>\n        </section>\n\n        <!-- Error / Debug -->\n        <div class=\"debug\" id=\"reportError\"></div>\n\n        <textarea id=\"dev-report-json\" style=\"display:none\">\n{\n  \"ui\": {\n    \"hero\": {\n      \"title\": \"NeuPrint Report\",\n      \"description\": \"Structural reference for human reasoning under AI-assisted conditions.\",\n      \"chips\": {\n        \"rsl\": \"L4 Integrated\",\n        \"fri\": 3.72,\n        \"control\": \"Human\",\n        \"role_fit\": \"Strategy·Analysis·Policy\"\n      }\n    }\n  }\n}\n        </textarea>\n\n      </div>\n    </main>\n\n</div>"
    }),
    []
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("npReport-scope");

    let cancelled = false;

    const loadChartJs = () =>
      new Promise<void>((resolve, reject) => {
        // original CDN (keep)
        const SRC =
          "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

        // already loaded
        if ((window as any).Chart) return resolve();

        // already requested
        const existing = document.querySelector(
          `script[data-np-chartjs="1"]`
        ) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Chart.js failed to load")),
            { once: true }
          );
          return;
        }

        const s = document.createElement("script");
        s.src = SRC;
        s.async = true;
        s.defer = true;
        s.dataset.npChartjs = "1";
        s.addEventListener("load", () => resolve(), { once: true });
        s.addEventListener(
          "error",
          () => reject(new Error("Chart.js failed to load")),
          { once: true }
        );
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadChartJs();
        if (cancelled) return;

        // Hydrate DOM using the extracted original script logic.
        hydrateReportPage();
      } catch {
        // If Chart.js fails, hydration will still fill text/table; charts will stay empty.
        hydrateReportPage({ charts: { enabled: false } });
      }
    })();

    return () => {
      cancelled = true;
      root.classList.remove("npReport-scope");
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        /* =========================================================
   Design Tokens
========================================================= */

        html.npReport-scope {
          --containerMax: 1120px;
          --sidePad: 27px;

          --radius: 16px;

          --logoW: 220px;
          --logoW-m: 190px;

          --bg: #ffffff;
          --panel: #ffffff;
          --text: #0f172a;
          --muted: #0f172a;
          --border: #e2e8f0;
          --soft: #f8fafc;
        }

        /* NOTE:
           여기 아래는 report.page_v3.html의 <style> 내용을 그대로 붙여야 한다.
           현재 코드 블록에는 길이 때문에 일부만 예시로 들어가 있다.
           너가 업로드한 report.page_v3.html의 style 블록 전체를 이 위치에 그대로 넣어라.
        */
      `}</style>

      <div dangerouslySetInnerHTML={reportHtml} />
    </>
  );
}
