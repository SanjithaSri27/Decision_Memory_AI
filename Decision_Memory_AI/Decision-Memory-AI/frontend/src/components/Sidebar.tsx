import { Link, useLocation } from 'react-router-dom';
import { Home, GitPullRequest, Database, Search } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/mrs', label: 'Merge Requests', icon: GitPullRequest },
    { path: '/decisions', label: 'Decision Records', icon: Database },
    { path: '/search', label: 'Semantic Search', icon: Search },
  ];

  return (
    <div className="w-64 bg-[#17161a] border-r border-[#302f34] flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-[#302f34]">
        <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#6b4fbb] flex items-center justify-center text-sm text-white">D</div>
          Decision Memory
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-[#302f34] text-white' 
                  : 'text-gray-400 hover:bg-[#302f34] hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
