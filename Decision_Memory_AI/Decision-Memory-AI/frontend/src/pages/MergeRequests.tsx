import { useState, useEffect } from 'react';
import axios from 'axios';

interface MergeRequest {
  id: number;
  project_id: number;
  mr_iid: number;
  title: string;
  description: string;
  author_username: string;
  state: string;
  decision_extracted: boolean;
}

export default function MergeRequests() {
  const [mrs, setMrs] = useState<MergeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMRs();
  }, []);

  const fetchMRs = async () => {
    try {
      const response = await axios.get('/mrs/');
      setMrs(response.data);
    } catch (error) {
      console.error("Error fetching MRs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    // In a real app, this would trigger a sync job on the backend.
    // For now, we'll just re-fetch.
    setLoading(true);
    await fetchMRs();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Merge Requests</h1>
        <button 
          onClick={handleSync}
          className="bg-[#6b4fbb] hover:bg-[#5a42a0] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          Sync Now
        </button>
      </div>
      
      <div className="bg-[#1f1e24] border border-[#302f34] rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#17161a] border-b border-[#302f34]">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">MR Details</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Decision Extracted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#302f34]">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            ) : mrs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No Merge Requests found. Trigger a webhook from GitLab to populate data.</td>
              </tr>
            ) : (
              mrs.map((mr) => (
                <tr key={mr.id} className="hover:bg-[#17161a]/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">!{mr.mr_iid} {mr.title}</div>
                    <div className="text-xs text-gray-500 mt-1">Project ID: {mr.project_id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{mr.author_username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs rounded-full border ${mr.state === 'merged' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {mr.state}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {mr.decision_extracted ? (
                      <span className="px-2 py-1 inline-flex bg-[#6b4fbb]/10 text-[#6b4fbb] text-xs rounded-full border border-[#6b4fbb]/20">Yes</span>
                    ) : (
                      <span className="px-2 py-1 inline-flex bg-gray-500/10 text-gray-400 text-xs rounded-full border border-gray-500/20">Pending Analysis</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
