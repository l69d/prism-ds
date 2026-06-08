import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Prism — Data Science, Made Visual",
    template: "%s · Prism",
  },
  description:
    "A holistic, visual place to learn data science — from your first EDA to deploying models in production. Every concept in a Basic and an Advanced depth, with interactive visualizations.",
  keywords: [
    "data science", "machine learning", "statistics", "deep learning",
    "interactive", "visualizations", "EDA", "MLOps", "learn",
  ],
  metadataBase: new URL("https://prism-ds.vercel.app"),
  openGraph: {
    title: "Prism — Data Science, Made Visual",
    description:
      "Learn all of data science, intuitively — interactive visualizations, Basic & Advanced depth, EDA to production.",
    type: "website",
  },
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('prism-theme');
    var dark = t ? t === 'dark' : true;
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) { document.documentElement.classList.add('dark'); }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
