import React from 'react';

export const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const EditIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export const HistoryIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const ToolsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const menuItems = [
  { id: 'dashboard', label: 'Dashboard',      icon: HomeIcon,    desc: 'Upload & analyze' },
  { id: 'analysis',  label: 'Score Analysis', icon: ChartIcon,   desc: 'View your results' },
  { id: 'tools',     label: 'System Tools',   icon: ToolsIcon,   desc: 'Cover letter & prep' },
  { id: 'history',   label: 'History',        icon: HistoryIcon, desc: 'Past analyses' },
  { id: 'profile',   label: 'Profile',        icon: UserIcon,    desc: 'Your account' },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside style={{ width: '260px', minWidth: '260px' }} className="flex flex-col h-full border-r-2 border-border bg-card">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-6 border-b-2 border-border cursor-pointer group"
        onClick={() => setActiveTab('dashboard')}
      >
        <div className="w-10 h-10 border-2 border-primary flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
          <svg className="w-6 h-6 text-primary group-hover:text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-black text-foreground block leading-tight uppercase tracking-tight">SmartResume</span>
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">SYS.CONNECTED</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] px-3 pb-3">
          [ NAVIGATION_MENU ]
        </p>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider transition-all border-2 ${
              activeTab === item.id 
                ? 'bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_rgba(255,102,0,0.3)]' 
                : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground'
            }`}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-primary-foreground' : ''}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-2 border-border bg-background/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider text-destructive border-2 border-transparent hover:border-destructive/30 hover:bg-destructive/5 transition-all"
        >
          <LogoutIcon className="w-4 h-4 shrink-0" />
          <span>[ LOG_OUT ]</span>
        </button>
      </div>
    </aside>
  );
}
