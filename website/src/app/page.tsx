import Image from "next/image";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="card overflow-hidden">
        <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
          <Image
            src="/felix.jpg"
            alt="Felix Dube"
            width={220}
            height={280}
            className="h-auto w-full rounded-xl object-cover"
            priority
          />

          <div className="space-y-4">
            <p className="pill">FPGA / ASIC Verification Engineer</p>
            <h1 className="text-4xl font-bold tracking-tight text-white">Felix Dube</h1>
            <p className="text-slate-200">
              I work in FPGA/ASIC verification with a focus on robust, high-performance digital
              systems. My toolbox includes SystemVerilog, UVM, cocotb, and pyuvm.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="card mt-6">
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <ul className="mt-3 space-y-2 text-slate-300">
          <li>
            LinkedIn: <a className="text-sky-400 hover:text-sky-300" href="https://www.linkedin.com/in/felixdube/en/" target="_blank" rel="noreferrer">linkedin.com/in/felixdube</a>
          </li>
          <li>
            GitHub: <a className="text-sky-400 hover:text-sky-300" href="https://github.com/felixdube" target="_blank" rel="noreferrer">github.com/felixdube</a>
          </li>
          <li>
            Instagram: <a className="text-sky-400 hover:text-sky-300" href="https://www.instagram.com/astrocat.lechat/" target="_blank" rel="noreferrer">@astrocat.lechat</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
