export default function ContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title">Contact</h1>
      <p className="max-w-3xl text-slate-300">
        If you’d like to discuss FPGA/ASIC verification, engineering leadership, or collaboration
        opportunities, I’d be glad to connect.
      </p>
      <div className="card text-slate-300">
        <ul className="space-y-2">
          <li>
            LinkedIn: <a className="text-sky-400 hover:text-sky-300" href="https://www.linkedin.com/in/felixdube/en/" target="_blank" rel="noreferrer">linkedin.com/in/felixdube</a>
          </li>
          <li>
            GitHub: <a className="text-sky-400 hover:text-sky-300" href="https://github.com/felixdube" target="_blank" rel="noreferrer">github.com/felixdube</a>
          </li>
          <li>
            Instagram: <a className="text-sky-400 hover:text-sky-300" href="https://www.instagram.com/astrocat.lechat/" target="_blank" rel="noreferrer">@astrocat.lechat</a>
          </li>
          <li>Email: add your preferred address</li>
        </ul>
      </div>
    </div>
  );
}
