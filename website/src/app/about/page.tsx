export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">About</h1>
      <p className="max-w-3xl text-slate-300">
        I’m an ASIC/FPGA Verification Engineer based in Montreal, focused on building robust
        verification environments for complex digital systems.
      </p>
      <p className="max-w-3xl text-slate-300">
        My core expertise is in SystemVerilog and UVM, with experience spanning aerospace and
        finance. At MDA, I led a team of six engineers responsible for verifying the central
        electronic unit of a SAR imaging satellite across avionics, software-defined modem, data
        relay, and motor control domains.
      </p>
      <p className="max-w-3xl text-slate-300">
        Since 2022, I’ve worked as an FPGA Verification Engineer in a private hedge fund
        environment, where correctness, reliability, and performance are critical.
      </p>
      <div className="card">
        <h2 className="text-lg font-semibold text-white">Core Expertise</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
          <li>SystemVerilog / UVM / cocotb / pyuvm</li>
          <li>FPGA / ASIC verification</li>
          <li>Verification planning and team leadership</li>
          <li>AMBA (AHB/APB), CAN, SpaceWire, MIL-STD-1553, SPI, Flash</li>
        </ul>
      </div>
    </div>
  );
}
