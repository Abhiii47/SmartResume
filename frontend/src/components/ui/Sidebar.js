import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HomeIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
export const ChartIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
export const EditIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
export const HistoryIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
export const UserIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
export const MagicIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'analysis', label: 'Score Analysis', icon: ChartIcon },
    { id: 'tools', label: 'AI Career Tools', icon: MagicIcon },
    { id: 'builder', label: 'Resume Builder', icon: EditIcon },
    { id: 'history', label: 'Score History', icon: HistoryIcon },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
    const navigate = useNavigate();

    return (
export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
    const navigate = useNavigate();

    return (
        <aside className="w-64 glass-panel flex flex-col z-20 shadow-2xl border-r border-border bg-card/70">
            <div className="p-7 flex items-center space-x-3 border-b border-border/50 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-500">
                    <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <span className="text-xl font-display font-bold text-foreground leading-tight block tracking-tight">SmartResume</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Premium AI</span>
                </div>
            </div>

            <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-4 opacity-50">Navigation</div>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative ${activeTab === item.id
                            ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors duration-300`} />
                        <span className="font-semibold text-sm tracking-tight">{item.label}</span>
                        {activeTab === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(var(--accent),0.8)]"></div>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-5 border-t border-border/50">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
                >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-destructive/20 transition-colors duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm tracking-tight">Log Out</span>
                </button>
            </div>
        </aside>
    );
}
        </aside>
    );
}
