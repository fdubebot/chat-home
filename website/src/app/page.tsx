import Link from "next/link";

const highlights = [
  "8+ years in ASIC/FPGA verification",
  "Verification lead for satellite central electronic unit",
  "Team leadership (6 engineers)",
  "SystemVerilog, UVM, cocotb, pyuvm",
  "AMBA, CAN, SpaceWire, 1553, SPI, Flash",
];

const instagramCards = [
  {
    title: "Lab & Build Moments",
    description: "Verification workflows, hardware setup, and engineering day-to-day.",
  },
  {
    title: "Projects in Progress",
    description: "Snapshots from ongoing technical work and experiments.",
  },
  {
    title: "Beyond the Desk",
    description: "A personal side of the engineer behind the work.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="card relative overflow-hidden space-y-6">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative space-y-5">
          <p className="pill">FPGA / ASIC Verification Engineer</p>
          <h1 className="text-5xl font-bold tracking-tight text-white">Felix Dube</h1>
          <p className="max-w-3xl text-lg text-slate-200">
            I design and lead verification strategies for mission-critical digital systems using
            SystemVerilog, UVM, cocotb, and pyuvm — from SAR satellite electronics to
            high-performance financial infrastructure.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-sky-400"
            >
              Contact Me
            </Link>
            <Link
              href="/experience"
              className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-200 hover:border-sky-400 hover:text-sky-300"
            >
              View Experience
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item) => (
          <div key={item} className="card text-sm text-slate-200">
            {item}
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Instagram Snapshots</h2>
          <a
            className="text-sm text-sky-400 hover:text-sky-300"
            href="https://www.instagram.com/astrocat.lechat/"
            target="_blank"
            rel="noreferrer"
          >
            View full profile →
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {instagramCards.map((card) => (
            <div key={card.title} className="card">
              <div className="mb-3 h-36 rounded-xl bg-gradient-to-br from-sky-500/30 via-indigo-500/25 to-fuchsia-500/25" />
              <h3 className="font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold text-white">Quick Links</h2>
        <ul className="mt-4 space-y-2 text-slate-300">
          <li>
            LinkedIn:{" "}
            <a
              className="text-sky-400 hover:text-sky-300"
              href="https://www.linkedin.com/in/felixdube/en/"
              target="_blank"
              rel="noreferrer"
            >
              linkedin.com/in/felixdube
            </a>
          </li>
          <li>
            GitHub:{" "}
            <a
              className="text-sky-400 hover:text-sky-300"
              href="https://github.com/felixdube"
              target="_blank"
              rel="noreferrer"
            >
              github.com/felixdube
            </a>
          </li>
          <li>
            Instagram:{" "}
            <a
              className="text-sky-400 hover:text-sky-300"
              href="https://www.instagram.com/astrocat.lechat/"
              target="_blank"
              rel="noreferrer"
            >
              @astrocat.lechat
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
