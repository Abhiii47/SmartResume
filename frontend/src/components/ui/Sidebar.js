import React from 'react';

export const HomeIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
export const ChartIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
export const EditIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
export const HistoryIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
export const UserIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
export const MagicIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);

const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: HomeIcon },
    { id: 'analysis', label: 'SCORE_ANALYSIS', icon: ChartIcon },
    { id: 'tools', label: 'AI_TOOLS', icon: MagicIcon },
    { id: 'builder', label: 'BUILDER', icon: EditIcon },
    { id: 'history', label: 'HISTORY', icon: HistoryIcon },
    { id: 'profile', label: 'PROFILE', icon: UserIcon },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
    return (
        <aside className="w-64 flex flex-col z-20 border-r-2 border-foreground bg-background">
            <div className="p-6 flex items-center space-x-3 border-b-2 border-foreground bg-primary text-primary-foreground cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="w-10 h-10 border-2 border-primary-foreground flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="font-mono">
                    <span className="text-lg font-black block leading-none">SmartResume</span>
                    <span className="text-[9px] font-bold opacity-70 tracking-[0.3em]">SYSTEM_v2.0</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto font-mono">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-2">NAVIGATION</div>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-4 px-4 py-3 border-2 transition-all group relative ${activeTab === item.id
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-transparent hover:border-foreground/20 text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        <span className="text-xs font-bold tracking-tighter">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t-2 border-foreground bg-muted/30">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-4 px-4 py-3 border-2 border-transparent hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all group"
                >
                    <div className="w-8 h-8 border-2 border-current flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <span className="font-black text-xs uppercase font-mono">LOG_OUT</span>
                </button>
            </div>
        </aside>
    );
}
