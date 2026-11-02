import { useState, useEffect } from 'react';
import axios from 'axios';

interface DecisionRecord {
  id: number;
  mr_id: number;
  decision_summary: string;
  reasoning: string;
  impact_level: string;
  confidence_score: number;
  created_at: string;
}

export default function DecisionRecords() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const response = await axios.get('/decisions/');
      setDecisions(response.data);
    } catch (error) {
      console.error("Error fetching decisions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Decision Records</h1>
      </div>
      
      {loading ? (
        <div className="text-gray-400 text-center py-8">Loading decisions...</div>
      ) : decisions.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No decisions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {decisions.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record }: { record: DecisionRecord }) {
  return (
    <div className="bg-[#1f1e24] border border-[#302f34] rounded-lg p-6 hover:border-[#6b4fbb] transition-colors cursor-pointer group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-white group-hover:text-[#6b4fbb] transition-colors line-clamp-2">{record.decision_summary}</h3>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reasoning</span>
            <p className="text-sm text-gray-300 mt-1 line-clamp-3">{record.reasoning}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#302f34] pt-4">
        <div className="flex gap-2">
          <span className={`px-2 py-1 inline-flex text-xs rounded-full border ${record.impact_level.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : record.impact_level.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
            {record.impact_level.toUpperCase()} IMPACT
          </span>
          <span className="px-2 py-1 inline-flex text-xs rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
            {record.confidence_score}% CONFIDENCE
          </span>
        </div>
        <div className="text-xs text-gray-500">
          MR #{record.mr_id}
        </div>
      </div>
    </div>
  );
}
