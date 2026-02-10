import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Felix Dube | FPGA / ASIC Verification Engineer",
  description:
    "Professional website of Felix Dube, FPGA/ASIC Verification Engineer specializing in SystemVerilog/UVM and mission-critical digital systems.",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/#contact", label: "Contact" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-slate-950 text-slate-100 antialiased`}>
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 py-4 backdrop-blur">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-sm font-semibold tracking-wide text-sky-400">
                FELIX DUBE
              </Link>
              <ul className="flex gap-5 text-sm text-slate-300">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-sky-400 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <main className="flex-1 py-12">{children}</main>

          <footer className="border-t border-slate-800 py-6 text-sm text-slate-400">
            © {new Date().getFullYear()} Felix Dube
          </footer>
        </div>
      </body>
    </html>
  );
}
