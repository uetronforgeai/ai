/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Terminal, Shield, BookOpen, Cpu, MessageSquare, LogIn, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  logoText: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ currentTab, setCurrentTab, logoText, isLoggedIn, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => setCurrentTab('home')}
          className="flex items-center space-x-2 text-left focus:outline-none"
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Cpu className="h-5 w-5 text-teal-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white sm:inline-block">
              {logoText}
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-teal-400 border border-teal-500/20">
                UET LAHORE
              </span>
              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-500/20">
                BS AI
              </span>
            </div>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex space-x-1">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'home'
                ? 'bg-slate-900 text-teal-400 border border-teal-500/10'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
            id="nav-home"
          >
            <Sparkles className="h-4 w-4" />
            <span>Collective</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('prototypes')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'prototypes'
                ? 'bg-slate-900 text-teal-400 border border-teal-500/10'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
            id="nav-prototypes"
          >
            <Cpu className="h-4 w-4" />
            <span>AI Prototypes</span>
          </button>

          <button
            onClick={() => setCurrentTab('research')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'research'
                ? 'bg-slate-900 text-teal-400 border border-teal-500/10'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
            id="nav-research"
          >
            <BookOpen className="h-4 w-4" />
            <span>Research</span>
          </button>
        </nav>

        {/* Call to Action & Dashboard Auth */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center space-x-1.5 rounded-lg border px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : isLoggedIn
                ? 'border-teal-500/30 bg-teal-500/5 text-teal-400 hover:bg-teal-500/10'
                : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
            id="nav-admin"
          >
            {isLoggedIn ? (
              <>
                <Shield className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                <span>Admin Login</span>
              </>
            )}
          </button>
          
          {isLoggedIn && (
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              id="nav-logout"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav indicator bar */}
      <div className="flex md:hidden border-t border-slate-900 bg-slate-950/95 justify-around py-2 px-1">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentTab === 'home' ? 'text-teal-400' : 'text-slate-500'
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 mb-1" />
          Collective
        </button>
        <button
          onClick={() => setCurrentTab('prototypes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentTab === 'prototypes' ? 'text-teal-400' : 'text-slate-500'
          }`}
        >
          <Cpu className="h-4.5 w-4.5 mb-1" />
          Prototypes
        </button>
        <button
          onClick={() => setCurrentTab('research')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            currentTab === 'research' ? 'text-teal-400' : 'text-slate-500'
          }`}
        >
          <BookOpen className="h-4.5 w-4.5 mb-1" />
          Research
        </button>
      </div>
    </header>
  );
}
