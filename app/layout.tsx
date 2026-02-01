import "../styles/globals.css";

export const metadata = {
  title: "NeuPrint MVP",
  description: "NeuPrint MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="npHome-scope npReport-scope">
      <body>{children}</body>
    </html>
  );
}
