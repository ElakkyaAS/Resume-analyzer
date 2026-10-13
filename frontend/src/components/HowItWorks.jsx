export default function HowItWorks() {
  return (
    <section id="how" className="how">
      <div className="container">
        <h2 className="how-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="num">1</div>
            <h3>Add a job description</h3>
            <p>Paste the JD you're targeting — its skills join the comparison list.</p>
          </div>
          <div className="step">
            <div className="num">2</div>
            <h3>Upload your resume</h3>
            <p>The PDF is read in your browser and sent to the analysis API.</p>
          </div>
          <div className="step">
            <div className="num">3</div>
            <h3>Get your score</h3>
            <p>See what's present, what's missing, and where to level up before you apply.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
