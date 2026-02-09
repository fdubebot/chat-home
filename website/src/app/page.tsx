import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-400">FPGA / ASIC Verification Engineer</p>
        <h1 className="text-5xl font-bold tracking-tight text-white">Felix Dube</h1>
        <p className="max-w-3xl text-lg text-slate-300">
          I design and lead verification strategies for mission-critical digital systems using
          SystemVerilog and UVM — from SAR satellite electronics to high-performance financial
          infrastructure.
        </p>
        <div className="flex gap-4">
          <Link href="/contact" className="rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-sky-400">
            Contact Me
          </Link>
          <Link href="/experience" className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-200 hover:border-sky-400 hover:text-sky-300">
            View Experience
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "8+ years in ASIC/FPGA verification",
          "Verification lead for satellite central electronic unit",
          "Team leadership (6 engineers)",
          "AMBA, CAN, SpaceWire, 1553, SPI, Flash",
        ].map((item) => (
          <div key={item} className="card text-sm text-slate-300">
            {item}
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold text-white">Quick Links</h2>
        <ul className="mt-4 space-y-2 text-slate-300">
          <li>LinkedIn: <a className="text-sky-400 hover:text-sky-300" href="https://www.linkedin.com/in/felixdube/en/" target="_blank" rel="noreferrer">linkedin.com/in/felixdube</a></li>
          <li>GitHub: <a className="text-sky-400 hover:text-sky-300" href="https://github.com/felixdube" target="_blank" rel="noreferrer">github.com/felixdube</a></li>
          <li>Instagram: <a className="text-sky-400 hover:text-sky-300" href="https://www.instagram.com/astrocat.lechat/" target="_blank" rel="noreferrer">@astrocat.lechat</a></li>
        </ul>
      </section>
    </div>
  );
}
