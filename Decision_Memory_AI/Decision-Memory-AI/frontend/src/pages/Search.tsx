import { Search as SearchIcon, MessageSquare, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

export default function Search() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{answer: string, citations: any[]}|null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setResults(null);
    try {
      const response = await axios.post('/api/search/semantic', { query });
      setResults(response.data);
    } catch (error: any) {
      console.error("Search error:", error);
      const errorMessage = error.response?.data?.detail || "Failed to fetch response.";
      setResults({ answer: errorMessage, citations: [] });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-16 h-16 bg-[#6b4fbb]/10 rounded-2xl flex items-center justify-center mb-6">
          <SearchIcon className="w-8 h-8 text-[#6b4fbb]" />
        </div>
        <h1 className="text-3xl font-semibold text-white">Semantic Search</h1>
        <p className="text-gray-400">Ask natural language questions to query your decision memory.</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Why did we introduce Redis?"
          className="w-full bg-[#1f1e24] border border-[#302f34] text-white rounded-xl py-4 pl-12 pr-16 focus:outline-none focus:border-[#6b4fbb] focus:ring-1 focus:ring-[#6b4fbb] transition-all"
        />
        <SearchIcon className="absolute left-4 top-4 text-gray-500 w-6 h-6" />
        <button 
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-2 bottom-2 bg-[#6b4fbb] hover:bg-[#5a42a0] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-lg flex items-center justify-center transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {isSearching && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#302f34] border-t-[#6b4fbb] rounded-full animate-spin"></div>
        </div>
      )}

      {results && !isSearching && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#1f1e24] border border-[#302f34] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-[#6b4fbb] flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white">AI Response</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {results.answer}
            </p>
            
            {results.citations && results.citations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#302f34]">
                <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Citations</h4>
                <div className="flex flex-wrap gap-2">
                  {results.citations.map((citation: any) => (
                    <span key={citation.id} className="px-3 py-1.5 bg-[#302f34] hover:bg-[#6b4fbb]/20 hover:text-[#6b4fbb] cursor-pointer text-gray-300 text-sm rounded-md transition-colors border border-transparent hover:border-[#6b4fbb]/50">
                      Record #{citation.id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
