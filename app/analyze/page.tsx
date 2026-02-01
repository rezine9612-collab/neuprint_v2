"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initHomeIntake } from "@/lib/client/intake";

export default function AnalyzePage() {
  const router = useRouter();

  useEffect(() => {
    // html scope 적용 (report와 충돌 방지)
    document.documentElement.classList.add("npHome-scope");

    // ============================
    // 1) Intake UX (lib 사용)
    // ============================
    const cleanupIntake = initHomeIntake({
      onSubmit: async (text: string) => {
        if (!text.trim()) return;

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const data = await res.json().catch(() => ({}));

        if (data?.id) {
          router.push(`/report?id=${encodeURIComponent(data.id)}`);
        } else {
          sessionStorage.setItem("np_report_json", JSON.stringify(data));
          router.push("/report");
        }
      },
    });

    // ============================
    // 2) 원본 enter/typewriter 로직 그대로 이식
    // ============================

    if (!document.documentElement.classList.contains("npHome-scope")) return;

    const ENTER_DUR = 500;
    const STEP_GAP = 200;
    const TW_CHAR_GAP = 10;
    const TW_FADE_DUR = 500;

    const TITLE_1 = "Cognitive structure,";
    const TITLE_2 = "referenced as infrastructure rather than output.";
    const SUBTEXT =
      "A stable reference layer for reasoning structure, designed for comparability beyond\u00A0outputs.";

    const brandLogo = document.getElementById("brandLogo");
    const brandline = document.getElementById("brandline");
    const heroSubtitle = document.getElementById("heroSubtitle");
    const sampleRow = document.getElementById("sampleRow");
    const footer = document.getElementById("footer");

    const titleLine1 = document.getElementById("titleLine1");
    const titleLine2 = document.getElementById("titleLine2");
    const intakeBox = document.getElementById("intakeBox");
    const cta = document.getElementById("ctaBtn");

    function setEnterDur(el: HTMLElement | null) {
      if (!el) return;
      el.style.setProperty("--enterDur", ENTER_DUR + "ms");
    }

    function enterY(el: HTMLElement | null, delay: number) {
      if (!el) return;
      setEnterDur(el);
      setTimeout(() => {
        el.classList.add("isIn");
      }, delay);
    }

    function buildTypeSpans(target: HTMLElement | null, text: string) {
      if (!target) return [] as HTMLElement[];
      target.innerHTML = "";
      const chars = Array.from(text);
      chars.forEach((ch) => {
        const span = document.createElement("span");
        span.className = "npHome-twChar";
        span.style.setProperty("--twFadeDur", TW_FADE_DUR + "ms");
        span.textContent = ch === " " ? "\u00A0" : ch;
        target.appendChild(span);
      });
      return Array.from(target.querySelectorAll(".npHome-twChar")) as HTMLElement[];
    }

    function typeIn(spans: HTMLElement[], start: number) {
      spans.forEach((sp, i) => {
        setTimeout(() => {
          sp.classList.add("isOn");
        }, start + i * TW_CHAR_GAP);
      });
      return start + spans.length * TW_CHAR_GAP;
    }

    if (heroSubtitle) heroSubtitle.textContent = SUBTEXT;

    const t1Spans = buildTypeSpans(titleLine1, TITLE_1);
    const t2Spans = buildTypeSpans(titleLine2, TITLE_2);

    let t = 80;

    enterY(brandLogo, t);
    t += STEP_GAP;

    enterY(brandline, t);
    t += STEP_GAP + 40;

    t = typeIn(t1Spans, t);
    t = typeIn(t2Spans, t + 30);

    enterY(heroSubtitle, t + 200);
    enterY(intakeBox, t + 400);
    enterY(sampleRow, t + 600);
    enterY(cta, t + 800);
    enterY(footer, t + 1000);

    return () => {
      cleanupIntake?.();
      document.documentElement.classList.remove("npHome-scope");
    };
  }, [router]);

  return (
    <>
      {/* =============================
          HOME 전용 CSS (원본 그대로)
          globals.css에는 넣지 않음
         ============================= */}
      <style jsx global>{`
        /* =============================
           HOME PAGE (Analyze) styles
           - scoped to html.npHome-scope to avoid collisions
           ============================= */
        html.npHome-scope {
          --bg: #ffffff;
          --text: #0b0f14;
          --muted: rgba(11, 15, 20, 0.62);
          --border: rgba(11, 15, 20, 0.12);
          --soft: rgba(11, 15, 20, 0.06);
          --focus: rgba(7, 77, 129, 0.35);
          --accent: #074d81;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }

        html.npHome-scope body {
          background: var(--bg);
          color: var(--text);
        }

        html.npHome-scope .page {
          min-height: 100vh;
        }

        html.npHome-scope .main {
          padding: 32px 18px 42px;
        }

        html.npHome-scope .container {
          max-width: var(--containerMax, 1120px);
          margin: 0 auto;
        }

        html.npHome-scope .hero {
          padding-top: 16px;
        }

        html.npHome-scope .brand {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-start;
        }

        html.npHome-scope .brandLogo {
          width: min(72vw, 760px);
          height: auto;
          display: block;
        }

        html.npHome-scope .brandline {
          font-size: 14px;
          letter-spacing: 0.2px;
          color: var(--muted);
        }

        html.npHome-scope #heroTitle {
          margin: 18px 0 10px;
          font-size: clamp(28px, 4.1vw, 44px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          font-weight: 720;
        }

        html.npHome-scope .subtitle {
          margin: 0 0 18px;
          max-width: 70ch;
          font-size: 15px;
          line-height: 1.55;
          color: var(--muted);
        }

        html.npHome-scope .intakeWrap {
          margin-top: 10px;
          max-width: 520px;
        }

        html.npHome-scope .intakeBox {
          border: 1px solid var(--border);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 26px rgba(11, 15, 20, 0.06);
          overflow: hidden;
        }

        html.npHome-scope .intakeText {
          width: 100%;
          min-height: 86px;
          resize: vertical;
          border: 0;
          outline: none;
          padding: 12px 12px;
          font: inherit;
          font-size: 14px;
          line-height: 1.45;
          color: var(--text);
          background: transparent;
        }

        html.npHome-scope .intakeText::placeholder {
          color: rgba(11, 15, 20, 0.45);
        }

        html.npHome-scope .intakeText:focus {
          box-shadow: inset 0 0 0 2px var(--focus);
        }

        html.npHome-scope .sampleRow {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        html.npHome-scope .sampleBtn {
          appearance: none;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
        }

        html.npHome-scope .sampleBtn:hover {
          background: rgba(7, 77, 129, 0.06);
          border-color: rgba(7, 77, 129, 0.25);
        }

        html.npHome-scope .cta {
          margin-top: 12px;
          appearance: none;
          border: 1px solid rgba(7, 77, 129, 0.38);
          background: rgba(7, 77, 129, 0.08);
          color: #05304f;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 30px rgba(7, 77, 129, 0.08);
        }

        html.npHome-scope .cta:hover {
          background: rgba(7, 77, 129, 0.12);
        }

        html.npHome-scope .cta:active {
          transform: translateY(1px);
        }

        html.npHome-scope .footer {
          margin-top: 12px;
          font-size: 12px;
          color: rgba(11, 15, 20, 0.55);
        }

        @media (max-width: 520px) {
          html.npHome-scope .main {
            padding: 24px 14px 32px;
          }
          html.npHome-scope .brandLogo {
            width: min(86vw, 640px);
          }
          html.npHome-scope #heroTitle {
            font-size: clamp(26px, 7vw, 38px);
          }
        }

        html.npHome-scope .npHome-enterY {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity var(--enterDur, 520ms) ease,
            transform var(--enterDur, 520ms) ease;
        }
        html.npHome-scope .npHome-enterY.isIn {
          opacity: 1;
          transform: translateY(0);
        }

        html.npHome-scope .npHome-twChar {
          opacity: 0;
          transition: opacity var(--twFadeDur, 500ms) ease;
        }
        html.npHome-scope .npHome-twChar.isOn {
          opacity: 1;
        }
      `}</style>

      {/* =============================
          원본 HTML 구조 그대로 유지
         ============================= */}
      <div className="page">
        <main className="main">
          <div className="container">
            <section className="hero">
              <div className="brand">
                <img
                  id="brandLogo"
                  className="brandLogo npHome-enterY"
                  src="/assets/neuprint_logo.svg"
                  alt="NeuPrint Logo"
                />
                <div id="brandline" className="brandline npHome-enterY">
                  NeuPrint Cognitive Forensics Engine v1.1
                </div>
              </div>

              <h1 id="heroTitle">
                <span id="titleLine1" className="npHome-typeLine"></span>
                <br />
                <span id="titleLine2" className="npHome-typeLine"></span>
              </h1>

              <p id="heroSubtitle" className="subtitle npHome-enterY"></p>

              <div className="intakeWrap">
                <div id="intakeBox" className="intakeBox npHome-enterY">
                  <textarea
                    id="intakeText"
                    className="intakeText"
                    placeholder="Paste text to establish a cognitive reference."
                  ></textarea>
                </div>

                <div id="sampleRow" className="sampleRow npHome-enterY">
                  <button className="sampleBtn" data-sample="sample1">
                    Sample 1
                  </button>
                  <button className="sampleBtn" data-sample="sample2">
                    Sample 2
                  </button>
                </div>

                <button id="ctaBtn" className="cta npHome-enterY">
                  Generate reference
                </button>

                <footer id="footer" className="footer npHome-enterY">
                  Copyright © 2026 Neuprint. All rights reserved.
                </footer>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
