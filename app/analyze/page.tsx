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
