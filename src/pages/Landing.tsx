import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Users, BookOpen, TrendingUp, Briefcase, Facebook, Twitter, Linkedin, Github } from "lucide-react";

const Landing = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header - Always visible on mobile */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-blue-600">OmniQuery</div>
          <nav className="hidden md:flex gap-6">
            <a href="#" className="text-gray-700 hover:text-blue-600 text-sm transition-colors">Publications</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 text-sm transition-colors">People</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 text-sm transition-colors">Topics</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 text-sm transition-colors">Jobs</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 text-sm transition-colors">For Institutions</a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-700" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
            <Link to="/signup">Join for free</Link>
          </Button>
        </div>
      </header>

      {/* Mobile Menu - Always visible, condensed */}
      <div className="md:hidden px-2 py-2 bg-white border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-3 whitespace-nowrap">
          <a href="#" className="text-gray-700 hover:text-blue-600 text-xs transition-colors px-2 py-1">Publications</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 text-xs transition-colors px-2 py-1">People</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 text-xs transition-colors px-2 py-1">Topics</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 text-xs transition-colors px-2 py-1">Jobs</a>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero Search Section */}
        <section className="text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Advance human understanding</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Search millions of publications, connect with researchers, and collaborate on groundbreaking projects across all disciplines.
          </p>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-10">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search research, researchers, topics, institutions..."
                  className="w-full px-5 py-4 pl-12 text-base md:text-lg border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 rounded-full transition-all"
                size="lg"
              >
                Search
              </Button>
            </div>
          </form>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="font-semibold">Trending:</span>
            <a href="#" className="hover:text-blue-600 transition-colors">COVID-19</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Machine Learning</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Climate Change</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Quantum Computing</a>
          </div>
        </section>

        {/* Featured Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
            <BookOpen className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Discover Research</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Explore millions of publications and findings from researchers worldwide.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
            <Users className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Find Researchers</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Connect with experts in your field and expand your professional network.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
            <TrendingUp className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Topic Pages</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Dive deep into specific research areas with curated insights and trends.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
            <Briefcase className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Job Opportunities</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Discover career opportunities with leading research institutions.</p>
          </div>
        </section>

        {/* Research Results Placeholder */}
        {searchQuery && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Search Results for "{searchQuery}"</h2>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-700 cursor-pointer">Impact of AI on Education</h3>
                    <p className="text-gray-600 text-sm mb-2">Authors: John Doe, Jane Smith • Published: 2025</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">This comprehensive study examines the transformative impact of artificial intelligence on educational systems, highlighting both opportunities and challenges in modern pedagogy and student outcomes.</p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">42</span> Reads
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">18</span> Citations
                  </span>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50">
                    Read Full Paper
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50">
                    Save
                  </Button>
                </div>
                {/* Graphviz Diagram Placeholder - PDF Ready */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs overflow-x-auto">
                  <strong className="block text-gray-800 mb-2">📊 Graphviz DOT Diagram (PDF Export Compatible - B&amp;W):</strong>
                  <pre className="text-gray-700">{`digraph G {
  rankdir=LR;
  node [shape=box, style="filled,rounded", fillcolor=white, color=black];
  edge [color=black];
  
  AI_Tools [label="AI Tools"];
  Teaching [label="Teaching\nMethods"];
  Outcomes [label="Learning\nOutcomes"];
  
  AI_Tools -> Teaching [label="enhances"];
  Teaching -> Outcomes [label="improves"];
}`}</pre>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic text-gray-600">✓ PDF Export: Black-and-white compatible. Diagram preserved in print.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-700 cursor-pointer">Machine Learning in Healthcare</h3>
                    <p className="text-gray-600 text-sm mb-2">Authors: Sarah Johnson, Michael Chen • Published: 2026</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">An in-depth exploration of machine learning applications in clinical diagnostics, treatment planning, and patient outcome prediction.</p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">156</span> Reads
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">42</span> Citations
                  </span>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50">
                    Read Full Paper
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trending Topics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Trending Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {["Artificial Intelligence", "Climate Science", "Biotechnology", "Quantum Computing", "Renewable Energy", "Neuroscience", "CRISPR Genetics", "Blockchain", "COVID-19 Research", "Materials Science"].map((topic) => (
              <div 
                key={topic} 
                className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
              >
                <h4 className="font-semibold text-sm text-gray-900 leading-tight">{topic}</h4>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-4 py-12 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">OmniQuery</h5>
              <p className="text-sm text-gray-600 leading-relaxed">Advancing research through collaboration, innovation, and global knowledge sharing.</p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h6 className="font-semibold text-gray-900 mb-4">Research</h6>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Publications</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Projects</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Data Sets</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Conferences</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold text-gray-900 mb-4">Community</h6>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">People</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Institutions</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Groups</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Events</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold text-gray-900 mb-4">Support</h6>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Feedback</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold text-gray-900 mb-4">Legal</h6>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Copyright© 2026</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
              <p>© 2026 OmniQuery. All rights reserved. Advancing human research together.</p>
              <p className="mt-4 md:mt-0">Made with research, innovation, and collaboration</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
