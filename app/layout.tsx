import "../styles/globals.css";

export const metadata = {
  title: "NeuPrint MVP",
  description: "NeuPrint MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=arrow_right_alt"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
