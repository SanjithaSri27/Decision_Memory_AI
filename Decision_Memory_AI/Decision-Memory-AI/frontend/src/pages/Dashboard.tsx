import { Activity, GitPullRequest, Database } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-2xl bg-gradient-to-r from-[#6b4fbb]/20 to-[#1f1e24] border border-[#6b4fbb]/30 p-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[#6b4fbb] opacity-10 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
        <h1 className="text-3xl font-bold text-white relative z-10">Project Overview</h1>
        <p className="text-gray-400 mt-2 relative z-10">Monitoring autonomous decision extractions across repositories.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active MRs Tracked" value="12" icon={GitPullRequest} />
        <StatCard title="Decisions Captured" value="48" icon={Database} />
        <StatCard title="AI Confidence Avg" value="92%" icon={Activity} />
      </div>

      <div className="mt-8 bg-[#1f1e24] border border-[#302f34] rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6b4fbb] to-transparent opacity-50"></div>
        <h2 className="text-xl font-medium text-white mb-6">Recent Decisions Timeline</h2>
        <div className="space-y-6">
          <TimelineItem 
            title="Migrate to pgvector" 
            desc="Decision to use pgvector over Pinecone to reduce infrastructure complexity."
            date="2 hours ago" 
          />
          <TimelineItem 
            title="Adopt Tailwind CSS" 
            desc="Chose Tailwind v3 for styling the dashboard to maintain ecosystem compatibility."
            date="1 day ago" 
          />
          <TimelineItem 
            title="Use FastAPI for backend" 
            desc="FastAPI selected for its async capabilities and auto-generated Swagger docs."
            date="3 days ago" 
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-[#1f1e24] border border-[#302f34] rounded-lg p-6 flex items-center gap-4">
      <div className="p-3 bg-[#302f34] rounded-md">
        <Icon className="w-6 h-6 text-[#6b4fbb]" />
      </div>
      <div>
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-2xl font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function TimelineItem({ title, desc, date }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-[#6b4fbb] mt-1.5" />
        <div className="w-0.5 h-full bg-[#302f34] mt-1" />
      </div>
      <div className="pb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-white font-medium">{title}</h3>
          <span className="text-xs text-gray-500">{date}</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}
