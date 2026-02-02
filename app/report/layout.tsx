import type { ReactNode } from "react";
import Script from "next/script";
import "./report.v3.css";

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script id="np-report-scope" strategy="beforeInteractive">
        {`document.documentElement.classList.add('npReport-scope');`}
      </Script>
      {children}
    </>
  );
}
