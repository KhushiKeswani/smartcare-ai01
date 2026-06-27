import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Activity, 
  Stethoscope, 
  FileText, 
  MessageSquare, 
  LogOut, 
  Sun, 
  Moon, 
  User as UserIcon,
  BadgeAlert,
  FileCheck
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode, 
  onLogout 
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'patient'] },
    { id: 'records', label: 'Medical Records', icon: FileCheck, roles: ['admin', 'doctor', 'patient'] },
    { id: 'doctors', label: 'Doctors Directory', icon: Stethoscope, roles: ['admin', 'doctor', 'patient'] },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'patient'] },
    { id: 'queue', label: 'Live Queue Tracking', icon: Activity, roles: ['admin', 'doctor', 'patient'] },
    { id: 'symptoms', label: 'AI Symptom Checker', icon: BadgeAlert, roles: ['patient', 'admin'] },
    { id: 'summarizer', label: 'AI Report Summarizer', icon: FileText, roles: ['patient', 'admin'] },
    { id: 'chatbot', label: 'AI Health Assistant', icon: MessageSquare, roles: ['patient', 'doctor', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside id="app-sidebar" className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-sans font-bold tracking-tight text-lg text-white">SmartCare AI</h1>
          <span className="text-xs text-emerald-400 font-mono tracking-wider font-semibold">CLINICAL MVP</span>
        </div>
      </div>

      {/* Menu List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-slate-500 text-xs font-mono uppercase tracking-widest px-3 mb-2">Navigation</div>
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile & Actions */}
      <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40">
          <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-full border border-emerald-500/20">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <span className="inline-block text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
              {user.role}
            </span>
          </div>
        </div>

        {/* Dark Mode and Log Out Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center p-2.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/10 border border-red-500/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </aside>
  );
}
