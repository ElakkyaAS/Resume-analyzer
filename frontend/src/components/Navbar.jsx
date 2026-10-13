export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="logo">📄 Resume<span className="grad">Analyzer</span></div>
        <nav>
          <a href="#analyze">Analyze</a>
          <a href="#how">How it works</a>
        </nav>
      </div>
    </header>
  );
}
