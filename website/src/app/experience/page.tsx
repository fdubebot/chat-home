const roles = [
  {
    title: "FPGA Verification Engineer",
    company: "Private Hedge Fund",
    date: "May 2022 – Present",
    location: "Montreal, QC",
    bullets: [
      "FPGA verification in a high-performance financial systems environment",
      "Focused on reliability, correctness, and scalable verification workflows",
    ],
  },
  {
    title: "ASIC/FPGA Verification Engineer",
    company: "MDA",
    date: "Jan 2018 – Apr 2022",
    location: "Greater Montreal",
    bullets: [
      "Led a team of 6 engineers verifying the central electronic unit of a SAR imaging satellite",
      "Built verification environments in SystemVerilog using UVM methodology",
      "Projects: platform avionics unit, software-defined modem, data relay system, motor controller",
      "Protocols: AMBA (AHB/APB), CAN, SpaceWire, MIL-STD-1553, SPI, Flash",
    ],
  },
  {
    title: "EEDP Intern",
    company: "GE",
    date: "May 2017 – Dec 2017",
    location: "Montreal",
    bullets: ["Embedded software development"],
  },
  {
    title: 'Research Assistant, "Shared Reality Lab"',
    company: "McGill University",
    date: "May 2016 – Aug 2016",
    location: "Greater Montreal",
    bullets: [
      "Embedded software/hardware development (C)",
      "Web application development (JavaScript)",
      "Human-computer interaction research",
    ],
  },
];

export default function ExperiencePage() {
  return (
    <div className="space-y-8">
      <h1 className="section-title">Experience</h1>
      <div className="space-y-5">
        {roles.map((role) => (
          <article key={`${role.company}-${role.date}`} className="card">
            <h2 className="text-xl font-semibold text-white">{role.title}</h2>
            <p className="mt-1 text-slate-300">{role.company} · {role.date} · {role.location}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
              {role.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
