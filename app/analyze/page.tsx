"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function AnalyzePage() {
  const router = useRouter();

  useEffect(() => {
    // CSS in analyze.page_v3.html is scoped under: html.npHome-scope ...
    const root = document.documentElement;
    root.classList.add("npHome-scope");

    const textarea = document.getElementById("intakeText") as HTMLTextAreaElement | null;
    const intakeBox = document.getElementById("intakeBox") as HTMLElement | null;
    const cta = document.getElementById("ctaBtn") as HTMLButtonElement | null;
    const sampleBtns = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".sampleBtn")
    );

    let sampleSelected = false;
    const timeouts: number[] = [];

    function setActiveSample(btn: HTMLButtonElement | null) {
      sampleBtns.forEach((b) => b.classList.remove("isActive"));
      if (btn) btn.classList.add("isActive");
    }

    function clearSampleActive() {
      setActiveSample(null);
      sampleSelected = false;
    }

    function syncStates() {
      if (!textarea || !intakeBox || !cta) return;
      const hasValue = textarea.value.trim().length > 0;
      cta.classList.toggle("isHot", hasValue);
      intakeBox.classList.toggle("isFilled", hasValue);
    }

    function onUserEdit() {
      if (sampleSelected) clearSampleActive();
      syncStates();
    }

    if (textarea) textarea.addEventListener("input", onUserEdit);

    // Flicker guard: keep textarea focus while clicking chips.
    function snapIntakeVisualUpdate() {
      if (!intakeBox) return;
      const prevTransition = intakeBox.style.transition;
      intakeBox.style.transition = "none";
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      intakeBox.offsetHeight;
      requestAnimationFrame(() => {
        intakeBox.style.transition = prevTransition;
      });
    }

    // Sample buttons (original behavior)
    sampleBtns.forEach((btn) => {
      const onMouseDown = (e: Event) => {
        e.preventDefault();
      };
      const onTouchStart = (e: Event) => {
        e.preventDefault();
      };
      const onClick = () => {
        if (!textarea) return;

        const isAlreadyActive = btn.classList.contains("isActive");

        // toggle off
        if (isAlreadyActive) {
          snapIntakeVisualUpdate();
          textarea.value = "";
          textarea.blur();
          clearSampleActive();
          syncStates();
          return;
        }

        const t = btn.getAttribute("data-sample") || "";

        snapIntakeVisualUpdate();

        textarea.value = t;
        syncStates();

        requestAnimationFrame(() => {
          try {
            textarea.focus({ preventScroll: true });
          } catch {
            textarea.focus();
          }
        });

        setActiveSample(btn);
        sampleSelected = true;
      };

      btn.addEventListener("mousedown", onMouseDown);
      btn.addEventListener("touchstart", onTouchStart, { passive: false });
      btn.addEventListener("click", onClick);

      (btn as any).__np_cleanup = () => {
        btn.removeEventListener("mousedown", onMouseDown);
        btn.removeEventListener("touchstart", onTouchStart);
        btn.removeEventListener("click", onClick);
      };
    });

    // CTA: submit to server, then go to /report
    const onCtaClick = async () => {
      if (!textarea) return;
      const v = textarea.value.trim();
      if (!v) {
        alert("Please enter text.");
        textarea.focus();
        return;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: v }),
      });

      const data = await res.json().catch(() => ({}));

      if (data?.id) {
        router.push(`/report?id=${encodeURIComponent(data.id)}`);
      } else {
        sessionStorage.setItem("np_report_json", JSON.stringify(data));
        router.push("/report");
      }
    };

    if (cta) cta.addEventListener("click", onCtaClick);

    syncStates();

    // =========================================================
    // Entrance + typewriter (original timing logic)
    // =========================================================
    const ENTER_DUR = 500;
    const STEP_GAP = 200;
    const TW_CHAR_GAP = 10;
    const TW_FADE_DUR = 500;

    const TITLE_PRE_GAP = 100;
    const TITLE_POST_GAP = 200;

    const brandLogo = document.getElementById("brandLogo") as HTMLElement | null;
    const brandline = document.getElementById("brandline") as HTMLElement | null;
    const heroSubtitle = document.getElementById("heroSubtitle") as HTMLElement | null;
    const sampleRow = document.getElementById("sampleRow") as HTMLElement | null;
    const footer = document.getElementById("footer") as HTMLElement | null;

    const titleLine1 = document.getElementById("titleLine1") as HTMLElement | null;
    const titleLine2 = document.getElementById("titleLine2") as HTMLElement | null;

    const TITLE_1 = "Cognitive structure,";
    const TITLE_2 = "referenced as infrastructure rather than output.";
    const SUBTEXT =
      "A stable reference layer for reasoning structure, designed for comparability beyond\u00A0outputs.";

    function setEnterDur(el: HTMLElement | null) {
      if (!el) return;
      el.style.setProperty("--enterDur", ENTER_DUR + "ms");
    }

    function enterY(el: HTMLElement | null, delayMs: number) {
      if (!el) return;
      setEnterDur(el);
      const id = window.setTimeout(() => {
        el.classList.add("isIn");
      }, delayMs);
      timeouts.push(id);
    }

    function buildTypeSpans(targetEl: HTMLElement | null, text: string) {
      if (!targetEl) return [] as HTMLElement[];
      targetEl.innerHTML = "";
      const chars = Array.from(text);
      chars.forEach((ch) => {
        const s = document.createElement("span");
        s.className = "npHome-twChar";
        s.style.setProperty("--twFadeDur", TW_FADE_DUR + "ms");
        s.textContent = ch === " " ? "\u00A0" : ch;
        targetEl.appendChild(s);
      });
      return Array.from(
        targetEl.querySelectorAll(".npHome-twChar")
      ) as HTMLElement[];
    }

    function typeIn(spans: HTMLElement[], startDelay: number) {
      spans.forEach((sp, i) => {
        const id = window.setTimeout(() => {
          sp.classList.add("isOn");
        }, startDelay + i * TW_CHAR_GAP);
        timeouts.push(id);
      });
      return startDelay + spans.length * TW_CHAR_GAP;
    }

    [brandLogo, brandline, heroSubtitle, intakeBox, sampleRow, cta, footer].forEach(
      (el) => {
        if (!el) return;
        el.classList.add("npHome-enterY");
      }
    );

    const t1Spans = buildTypeSpans(titleLine1, TITLE_1);
    const t2Spans = buildTypeSpans(titleLine2, TITLE_2);

    if (heroSubtitle) heroSubtitle.textContent = SUBTEXT;

    let t = 80;

    enterY(brandLogo, t);
    t += STEP_GAP;

    enterY(brandline, t);
    t += STEP_GAP + 40;

    t += TITLE_PRE_GAP;

    t = typeIn(t1Spans, t);
    t += 30;
    t = typeIn(t2Spans, t);

    t += TITLE_POST_GAP;

    enterY(heroSubtitle, t);
    t += STEP_GAP;

    enterY(intakeBox, t);
    t += STEP_GAP;

    enterY(sampleRow, t);
    t += STEP_GAP;

    enterY(cta, t);
    t += STEP_GAP;

    enterY(footer, t);

    return () => {
      if (textarea) textarea.removeEventListener("input", onUserEdit);
      if (cta) cta.removeEventListener("click", onCtaClick);

      sampleBtns.forEach((btn) => {
        const fn = (btn as any).__np_cleanup;
        if (typeof fn === "function") fn();
        delete (btn as any).__np_cleanup;
      });

      timeouts.forEach((id) => window.clearTimeout(id));
      root.classList.remove("npHome-scope");
    };
  }, [router]);

  return (
    <>
      <Script id="npHome-scope" strategy="beforeInteractive">{`document.documentElement.classList.add('npHome-scope');`}</Script>
<div className="page">
        <main className="main">
          <div className="container">
            <section className="hero" aria-label="Neuprint main entry">
              <div className="brand">
                <img
                  className="brandLogo npHome-enterY"
                  id="brandLogo"
                  src="/assets/neuprint_logo.svg"
                  alt="NeuPrint Logo"
                />

                <div className="brandline npHome-enterY" id="brandline">
                  <span>NeuPrint Cognitive Forensics Engine v1.1</span>
                </div>
              </div>

              <h1 id="heroTitle">
                <span className="npHome-typeLine" id="titleLine1"></span>
                <br />
                <span className="npHome-typeLine" id="titleLine2"></span>
              </h1>

              <p className="subtitle npHome-enterY" id="heroSubtitle"></p>

              <div className="intakeWrap">
                <div className="intakeBox npHome-enterY" id="intakeBox">
                  <textarea
                    id="intakeText"
                    className="intakeText"
                    placeholder="Paste text to establish a cognitive reference."
                    aria-label="Text intake"
                  ></textarea>

                  <div className="intakeTools" aria-label="Input tools (placeholders)">
                    <button
                      className="iconBtn"
                      type="button"
                      aria-label="Attach file (placeholder)"
                      title="Attach file (placeholder)"
                    >
                      <span className="material-symbols--attach-file-rounded" aria-hidden="true"></span>
                    </button>

                    <button
                      className="iconBtn"
                      type="button"
                      aria-label="Voice record (placeholder)"
                      title="Voice record (placeholder)"
                    >
                      <span className="material-symbols--mic" aria-hidden="true"></span>
                    </button>

                    <button
                      className="iconBtn"
                      type="button"
                      aria-label="Image search (placeholder)"
                      title="Image search (placeholder)"
                    >
                      <span className="material-symbols--center-focus-weak-outline" aria-hidden="true"></span>
                    </button>
                  </div>
                </div>

                <div className="sampleRow npHome-enterY" id="sampleRow" aria-label="Sample quick inserts">
                  <button className="sampleBtn" type="button" data-sample="sample1 입니다.">
                    Sample 1
                  </button>
                  <button className="sampleBtn" type="button" data-sample="sample2 입니다.">
                    Sample 2
                  </button>
                  <button className="sampleBtn" type="button" data-sample="sample3 입니다.">
                    Sample 3
                  </button>
                  <button className="sampleBtn" type="button" data-sample="sample4 입니다.">
                    Sample 4
                  </button>
                  <button className="sampleBtn" type="button" data-sample="sample5 입니다.">
                    Sample 5
                  </button>
                </div>

                <button className="cta npHome-enterY" id="ctaBtn" type="button" aria-label="Generate reference">
                  Generate reference
                  <span className="material-symbols-outlined ctaArrow" aria-hidden="true">
                    arrow_right_alt
                  </span>
                </button>

                <footer className="footer npHome-enterY" id="footer" role="contentinfo" aria-label="Footer">
                  Copyright © 2026 Neuprint. All rights reserved. U.S. entity in formation.
                </footer>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
