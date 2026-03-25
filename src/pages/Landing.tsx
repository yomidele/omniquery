import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const [searchQuery, setSearchQuery] = useState("Impact of AI on Education");
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-inter">
      {/* Header - Always visible menu */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="text-lg font-bold text-blue-600">OmniQuery</div>
        <nav className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/signup">Sign Up</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/research">Research</Link>
          </Button>
        </nav>
      </header>

      {/* Search Container - Prominent like ChatGPT/Gemini */}
      <main className="px-4 py-8 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for academic research topics..."
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        {/* Results Area */}
        {showResults && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">Impact of AI on Education</h2>
              <p><strong>Research Level:</strong> Master's</p>
              <p><strong>Depth:</strong> High</p>
              <p className="mt-4"><strong>Abstract:</strong> This Master's-level research examines the transformative impact of artificial intelligence on educational systems. Through a comprehensive analysis of empirical studies, the report evaluates AI's role in personalized learning, assessment automation, and equity challenges. Key findings indicate significant improvements in student outcomes when AI is integrated with proper pedagogical frameworks, though infrastructure disparities pose notable barriers.</p>

              <h3 className="text-lg font-semibold mt-6 mb-2">Literature Review</h3>
              <p>Recent studies (2018–2025) demonstrate AI's efficacy in adaptive learning platforms. For instance, intelligent tutoring systems have shown effect sizes of 0.4–0.5 in mathematics education. Automated grading tools achieve 85–95% accuracy compared to human evaluators, reducing instructor workload by approximately 30%.</p>

              <h3 className="text-lg font-semibold mt-6 mb-2">Methodology</h3>
              <p>A mixed-methods approach was employed, including systematic review of 48 peer-reviewed articles, meta-analysis of quantitative data, and thematic analysis of qualitative insights from educators. Data sources spanned global educational contexts, ensuring broad applicability.</p>

              <h3 className="text-lg font-semibold mt-6 mb-2">Results</h3>
              <p>Quantitative synthesis revealed an average 0.47 standard deviation improvement in learning outcomes. Qualitative data highlighted teacher concerns about algorithmic bias and the need for training. Equity analysis showed a 15% achievement gap in under-resourced schools.</p>

              <h3 className="text-lg font-semibold mt-6 mb-2">Discussion</h3>
              <p>While AI enhances personalization and efficiency, ethical considerations including data privacy and algorithmic fairness must be addressed. The high-depth analysis underscores the importance of context-specific implementation to maximize benefits and minimize risks.</p>

              <h3 className="text-lg font-semibold mt-6 mb-2">Conclusion & Recommendations</h3>
              <p>AI holds substantial potential for educational advancement, contingent on equitable access and rigorous oversight. Recommendations include mandatory AI literacy training for educators, standardized evaluation protocols, and policy frameworks for inclusive deployment.</p>

              <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded font-mono text-sm overflow-x-auto">
                <strong>Graphviz DOT Diagram (AI-Education Impact Model):</strong><br />
                digraph &#123;<br />
                &nbsp;&nbsp;rankdir=TB;<br />
                &nbsp;&nbsp;node [shape=box, style=filled, fillcolor=white, fontcolor=black];<br />
                &nbsp;&nbsp;AI_Tools [label="AI Tools\n(Adaptive Engines,\nAnalytics, NLP)"];<br />
                &nbsp;&nbsp;Processes [label="Processes\n(Personalization,\nFeedback Loops)"];<br />
                &nbsp;&nbsp;Outcomes [label="Outcomes\n(Student Achievement,\nEquity Metrics)"];<br />
                &nbsp;&nbsp;AI_Tools -&gt; Processes;<br />
                &nbsp;&nbsp;Processes -&gt; Outcomes;<br />
                &#125;
              </div>

              <p className="text-xs text-gray-500 mt-4 italic">
                PDF Export Note: This content is formatted for black-and-white printing. Diagrams use monochrome styles and are PDF-compatible. No color elements are present.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-gray-400 text-xs">
        © 2026 OmniQuery Research Agent
      </footer>
    </div>
  );
};

export default Landing;
