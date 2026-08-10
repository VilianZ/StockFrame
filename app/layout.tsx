import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockFrame — Research Score Sheet",
  description: "Lembar riset saham terstruktur dengan data, metrik, dan interpretasi AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {/*
          THESIS: StockFrame mengubah evidence menjadi alasan yang dapat dibaca; ia menolak landing page SaaS generik dan preview dashboard sebagai identitas.
          OWN-WORLD: Black Frame / Lime Signal — frame near-black, medan lime, garis sinyal, lembar evidence, dan report yang tenang.
          STORY: Pengunjung memahami data → engine → interpretasi, lalu memilih memulai riset dengan batasan yang terlihat.
          FIRST VIEWPORT: Header minimal, headline besar di kiri, artifact evidence berlapis di kanan, dan CTA di bawah headline.
          FORM: Layered evidence narrative, posisi 1; seed key F1-black-frame-lime-signal.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  );
}
