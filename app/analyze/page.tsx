"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzePage() {
  const router = useRouter();

  useEffect(() => {
    // CSS in analyze.page_v3.html is scoped under: html.npHome-scope ...
    const root = document.documentElement;
    root.classList.add("npHome-scope");

    // Material Symbols stylesheet (arrow_right_alt)
    const MS_ID = "np-material-symbols";
    if (!document.getElementById(MS_ID)) {
      const link = document.createElement("link");
      link.id = MS_ID;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=arrow_right_alt";
      document.head.appendChild(link);
    }

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
      <style jsx global>{`

    html.npHome-scope .material-symbols-outlined{
      font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    }
  


    html.npHome-scope{
      --containerMax: 1120px;

      --bg:#ffffff;
      --text:#0b1220;
      --muted:#667085;

      --inputBorder:#E6EBF2;
      --ring:#444A59;

      --radiusLG: 14px;
      --font: "Barlow", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

      /* Logo sizing */
      --logoW: 220px;
      --logoW-m: 190px;
    }

    html.npHome-scope *{ box-sizing:border-box; }
    html.npHome-scope, html.npHome-scope body{ height:100%; }
    html.npHome-scope body{
      margin:0;
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
    }

    html.npHome-scope .page{
      min-height:100vh;
      display:flex;
      flex-direction:column;
    }

    html.npHome-scope .container{
      width:100%;
      max-width: var(--containerMax);
      margin:0 auto;
      padding: 0 20px;
    }

    html.npHome-scope .main{
      flex:1;
      display:flex;
      align-items:center;
      justify-content:center;
      padding: 44px 0 84px;
    }

    html.npHome-scope .hero{
      width: 100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      text-align:center;
      gap: 14px;
    }

    html.npHome-scope .brand{
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:10px;
      margin-bottom: 10px;
    }

    html.npHome-scope .brandLogo{
      width: var(--logoW);
      height: auto;
      display:block;
      margin-left:-6px;
    }

    html.npHome-scope .brandline{
      display:inline-flex;
      align-items:center;
      margin-top:10px;
      gap:8px;
      font-size:13px;
      color:var(--muted);
      flex-wrap:wrap;
    }

    html.npHome-scope h1{
      margin: 18px 0 0;
      font-size: 42px;
      line-height: 1.16;
      letter-spacing: -0.6px;
      font-weight: 600;
      max-width: 860px;

      /* (2) 단어 중간 줄바꿈 방지 */
      word-break: keep-all;
      overflow-wrap: normal;
      hyphens: none;
    }

    html.npHome-scope .subtitle{
      margin: 6px 0 0;
      font-size: 18px;
      line-height: 1.55;
      font-weight: 400;
      max-width: 760px;

      /* (2) 단어 중간 줄바꿈 방지 */
      word-break: keep-all;
      overflow-wrap: normal;
      hyphens: none;
    }

    html.npHome-scope /* Intake block */
    .intakeWrap{
      margin-top: 22px;
      width: 100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap: 12px;
    }

    html.npHome-scope .intakeBox{
      width: 770px;
      height: 150px;
      border: 1px solid var(--inputBorder);
      border-radius: var(--radiusLG);
      background:#fff;
      display:flex;
      flex-direction:column;
      padding: 14px 16px 12px;

      /* 바깥 링을 위한 여유 */
      box-shadow: 0 0 0 0 rgba(0,0,0,0);
      transition: box-shadow .14s ease, border-color .14s ease;
    }

    html.npHome-scope /* 포커스시 "바깥" 링 */
    .intakeBox:focus-within{
      border-color: transparent;
      box-shadow: 0 0 0 2px var(--ring);
    }

    html.npHome-scope /* 내용이 있으면 포커스 없어도 링 유지 */
    .intakeBox.isFilled{
      border-color: transparent;
      box-shadow: 0 0 0 2px var(--ring);
    }

    html.npHome-scope .intakeText{
      width:100%;
      flex: 1;
      border:0;
      outline:0;
      resize:none;
      font: 14px/1.55 var(--font);
      color: var(--text);
      padding: 0;
      margin: 0;
      background: transparent;
      overflow: auto;
    }

    html.npHome-scope .intakeText::placeholder{
      color:#000000;
      transition: opacity .12s ease;
    }

    html.npHome-scope /* Placeholder hides on focus */
    .intakeText:focus::placeholder{
      opacity: 0;
    }

    html.npHome-scope .intakeTools{
      display:flex;
      align-items:center;
      gap: 10px;
      margin-top: 10px;
      justify-content:flex-start;
    }

    html.npHome-scope .iconBtn{
      width: 28px;
      height: 28px;
      border-radius: 10px;
      border: 0;
      background: transparent;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      color:#111827;
      opacity: .50;
      cursor: default;
      padding:0;
    }

    html.npHome-scope .iconBtn:hover{ opacity: 1; }

    html.npHome-scope /* Provided icon styles */
    .material-symbols--attach-file-rounded{
      display:inline-block;
      width:24px;
      height:24px;
      --svg:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M18 15.75q0 2.6-1.825 4.425T11.75 22t-4.425-1.825T5.5 15.75V6.5q0-1.875 1.313-3.187T10 2t3.188 1.313T14.5 6.5v8.75q0 1.15-.8 1.95t-1.95.8t-1.95-.8t-.8-1.95V7q0-.425.288-.712T10 6t.713.288T11 7v8.25q0 .325.213.538t.537.212t.538-.213t.212-.537V6.5q-.025-1.05-.737-1.775T10 4t-1.775.725T7.5 6.5v9.25q-.025 1.775 1.225 3.013T11.75 20q1.75 0 2.975-1.237T16 15.75V7q0-.425.288-.712T17 6t.713.288T18 7z'/%3E%3C/svg%3E");
      background-color: currentColor;
      -webkit-mask-image: var(--svg);
      mask-image: var(--svg);
      -webkit-mask-repeat:no-repeat;
      mask-repeat:no-repeat;
      -webkit-mask-size:100% 100%;
      mask-size:100% 100%;
    }

    html.npHome-scope .material-symbols--center-focus-weak-outline{
      display:inline-block;
      width:24px;
      height:24px;
      --svg:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 16q-1.65 0-2.825-1.175T8 12t1.175-2.825T12 8t2.825 1.175T16 12t-1.175 2.825T12 16m0-2q.825 0 1.413-.587T14 12t-.587-1.412T12 10t-1.412.588T10 12t.588 1.413T12 14m-7 7q-.825 0-1.412-.587T3 19v-4h2v4h4v2zm10 0v-2h4v-4h2v4q0 .825-.587 1.413T19 21zM3 9V5q0-.825.588-1.412T5 3h4v2H5v4zm16 0V5h-4V3h4q.825 0 1.413.588T21 5v4z'/%3E%3C/svg%3E");
      background-color: currentColor;
      -webkit-mask-image: var(--svg);
      mask-image: var(--svg);
      -webkit-mask-repeat:no-repeat;
      mask-repeat:no-repeat;
      -webkit-mask-size:100% 100%;
      mask-size:100% 100%;
    }

    html.npHome-scope .material-symbols--mic{
      display:inline-block;
      width:24px;
      height:24px;
      --svg:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2t2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.538T12 16t3.538-1.463T17 11h2q0 2.625-1.7 4.6T13 17.925V21z'/%3E%3C/svg%3E");
      background-color: currentColor;
      -webkit-mask-image: var(--svg);
      mask-image: var(--svg);
      -webkit-mask-repeat:no-repeat;
      mask-repeat:no-repeat;
      -webkit-mask-size:100% 100%;
      mask-size:100% 100%;
    }

    html.npHome-scope /* Sample buttons */
    .sampleRow{
      width: 770px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      flex-wrap:wrap;
      margin-top: 4px;
    }

    html.npHome-scope .sampleBtn{
      appearance:none;
      box-sizing: border-box;
      border: 1px solid #E2E8F0;
      box-shadow: 0 0 0 1px rgba(255,255,255,0);

      background:#fff;
      font: 14px/1 var(--font);
      font-weight: 400;
      padding: 10px 14px;
      border-radius: 999px;
      cursor: pointer;

      transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease;
      user-select:none;
    }

    html.npHome-scope .sampleBtn:hover, html.npHome-scope .sampleBtn:focus-visible{
      border-color: var(--ring);
      box-shadow: 0 0 0 1px var(--ring);
      outline:none;
    }

    html.npHome-scope .sampleBtn:active, html.npHome-scope .sampleBtn.isActive{
      border-color: var(--ring);
      box-shadow: 0 0 0 1px var(--ring);
    }

    html.npHome-scope /* CTA */
    .cta{
      margin-top:50px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:10px;

      padding:12px 18px;
      min-width:210px;

      box-sizing:border-box;
      border-radius:12px;

      border:1px solid #E2E8F0;
      outline:4px solid rgba(255,255,255,0);
      outline-offset:0;

      background:#fff;
      color:#0b1220;

      font-weight:600;
      font-size:15px;
      letter-spacing:.1px;

      cursor:pointer;
      user-select:none;

      transition: border-color .14s ease, outline-color .14s ease;
    }

    html.npHome-scope .ctaArrow{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      transform:translateX(0);
      transition:transform .50s ease;
    }

    html.npHome-scope .cta:hover .ctaArrow{
      transform:translateX(6px);
    }

    html.npHome-scope .cta.isHot{
      border-color:transparent;
      outline-color: var(--ring);
    }

    html.npHome-scope .cta.isHot .ctaArrow{
      transform:translateX(6px);
    }

    html.npHome-scope /* Footer: 버튼 아래 60px */
    .footer{
      margin-top: 60px;
      padding: 0 0 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 400;
      text-align: center;
    }

    @media (max-width: 860px){
      html.npHome-scope .brandLogo{ width: var(--logoW-m); }
      html.npHome-scope h1{ font-size: 32px; }
      html.npHome-scope .intakeBox{ width: 100%; }
      html.npHome-scope .sampleRow{ width: 100%; }
      html.npHome-scope .intakeWrap{ width: 100%; }
      html.npHome-scope .subtitle{ font-size: 16px; }
    }

    html.npHome-scope /* =========================================================
       (1) Entrance motion (layout fixed: opacity/transform only)
       - 요소는 처음부터 자리(레이아웃)를 차지한 채로 투명/이동 상태만 바뀜
    ========================================================= */
    .npHome-enterY{
      opacity:0;
      transform: translateY(-10px);
      will-change: opacity, transform;
    }
    html.npHome-scope .npHome-enterY.isIn{
      opacity:1;
      transform: translateY(0);
      transition: opacity var(--enterDur, 260ms) ease, transform var(--enterDur, 260ms) ease;
    }

    html.npHome-scope /* =========================================================
       Title/SubTitle typewriter (spaces preserved)
       - span 하나씩 등장하지만 opacity만 변화, html.npHome-scope 레이아웃 변동 없음
    ========================================================= */
    .npHome-typeLine{
      display:inline;
      white-space: pre; /* 공백 폭 유지 */
    }
    html.npHome-scope .npHome-twChar{
      display:inline-block;
      opacity:0;
      will-change: opacity;
    }
    html.npHome-scope .npHome-twChar.isOn{
      opacity:1;
      transition: opacity var(--twFadeDur, 80ms) linear;
    }
  
      `}</style>

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
