"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initHomeIntake } from "@/lib/client/intake";

export default function AnalyzePage() {
  const router = useRouter();

  useEffect(() => {
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
    };
  }, [router]);

  return (
    <>
      {/* =============================
          HOME 전용 CSS (원본 그대로)
          globals.css에는 넣지 않음
         ============================= */}
      <style jsx global>{`
        /*
          NOTE
          - 현재 ZIP에는 app.page_v3.html의 전체 CSS가 포함되어 있지 않습니다.
          - 아래 스타일은 "애니메이션/레이아웃 최소 동작"을 위한 베이스입니다.
          - 원본 CSS를 받으면 이 블록을 원본 그대로로 교체하세요.
        */

        /* base layout (minimal) */
        #npHomeRoot {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }
        #npHomeRoot .container {
          max-width: 1120px;
          padding: 60px 28px;
          margin: 0 auto;
        }
        #npHomeRoot .brandLogo {
          width: min(680px, 92vw);
          height: auto;
          display: block;
        }
        #npHomeRoot .brandline {
          margin-top: 12px;
          font-size: 14px;
          color: #334155;
        }
        #npHomeRoot #heroTitle {
          margin-top: 22px;
          font-size: 44px;
          line-height: 1.12;
          letter-spacing: -0.02em;
        }
        #npHomeRoot .subtitle {
          margin-top: 14px;
          max-width: 780px;
          font-size: 16px;
          line-height: 1.55;
          color: #475569;
        }
        #npHomeRoot .intakeWrap {
          margin-top: 18px;
        }
        #npHomeRoot .intakeBox {
          width: 340px;
        }
        #npHomeRoot .intakeText {
          width: 100%;
          min-height: 64px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          resize: vertical;
        }
        #npHomeRoot .sampleRow {
          margin-top: 10px;
          display: flex;
          gap: 8px;
        }
        #npHomeRoot .sampleBtn {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
        }
        #npHomeRoot .cta {
          margin-top: 10px;
          padding: 8px 12px;
          border: 1px solid #0f172a;
          border-radius: 10px;
          background: #0f172a;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
        }
        #npHomeRoot .footer {
          margin-top: 10px;
          font-size: 12px;
          color: #64748b;
        }

        /* enter animation */
        #npHomeRoot .npHome-enterY {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity var(--enterDur, 520ms) ease,
            transform var(--enterDur, 520ms) ease;
        }
        #npHomeRoot .npHome-enterY.isIn {
          opacity: 1;
          transform: translateY(0);
        }

        #npHomeRoot .npHome-twChar {
          opacity: 0;
          transition: opacity var(--twFadeDur, 500ms) ease;
        }
        #npHomeRoot .npHome-twChar.isOn {
          opacity: 1;
        }
      `}</style>

      {/* =============================
          원본 HTML 구조 그대로 유지
         ============================= */}
      <div id="npHomeRoot" className="page">
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
