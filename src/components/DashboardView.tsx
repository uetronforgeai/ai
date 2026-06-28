/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, LogIn, Save, Edit2, Plus, Trash2, Mail, Download, Inbox, Settings, Users, Cpu, BookOpen, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { PortfolioData, TeamMember, ProjectPrototype, ResearchPaper, ContactMessage } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface DashboardViewProps {
  portfolioData: PortfolioData;
  setPortfolioData: (data: PortfolioData) => void;
  token: string | null;
  setToken: (token: string | null) => void;
}

export default function DashboardView({ portfolioData, setPortfolioData, token, setToken }: DashboardViewProps) {
  // Login credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'settings' | 'team' | 'projects' | 'research' | 'inbox' | 'export'>('settings');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Local editable copies of portfolio data
  const [settingsForm, setSettingsForm] = useState(portfolioData?.settings || {
    companyName: '',
    heroTitle: '',
    heroSubtitle: '',
    aboutText: '',
    contactEmail: '',
    logoText: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
  });
  const [teamForm, setTeamForm] = useState<TeamMember[]>(portfolioData?.team || []);
  const [projectsForm, setProjectsForm] = useState<ProjectPrototype[]>(portfolioData?.projects || []);
  const [researchForm, setResearchForm] = useState<ResearchPaper[]>(portfolioData?.research || []);

  // Sync state if initial prop changes
  useEffect(() => {
    if (portfolioData) {
      setSettingsForm(portfolioData.settings || {
        companyName: '',
        heroTitle: '',
        heroSubtitle: '',
        aboutText: '',
        contactEmail: '',
        logoText: '',
        githubUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        youtubeUrl: '',
      });
      setTeamForm(portfolioData.team || []);
      setProjectsForm(portfolioData.projects || []);
      setResearchForm(portfolioData.research || []);
    }
  }, [portfolioData]);

  // Real-time message listener
  useEffect(() => {
    if (!token) return;

    const path = 'messages';
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    
    // Attach real-time Firestore snap listener as required by guidelines
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ContactMessage[] = [];
      snapshot.forEach((snapDoc) => {
        msgs.push({ id: snapDoc.id, ...snapDoc.data() } as ContactMessage);
      });
      setMessages(msgs);
    }, (error) => {
      // Required detailed JSON error tracking
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [token]);

  const fetchMessages = async () => {
    // Left as a fallback if needed
    try {
      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages fallback:', err);
    }
  };

  // Login handler using Firebase Auth with auto-signup and detailed guides
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase authenticated admin successfully:', userCredential.user.uid);
      } catch (signInErr: any) {
        // Automatically attempt to sign up admin user if missing from Firebase DB
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
          if (email === 'uetronforge.ai@gmail.com' && password === 'uet@147149153159') {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
              console.log('Created and logged in Firebase admin account successfully.');
            } catch (createErr) {
              throw signInErr; // Fall back to original sign-in error if registration fails
            }
          } else {
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('uetronforge_token', idToken);
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let customErrMsg = err.message || 'Server error connecting to authentication API.';
      if (err.code === 'auth/operation-not-allowed') {
        customErrMsg = "Email/Password authentication provider is disabled in your Firebase console. Please go to your Firebase Console -> Authentication -> Sign-in Method and enable 'Email/Password' to authenticate, then try again.";
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        customErrMsg = "Invalid email or password.";
      }
      setLoginError(customErrMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Submit Portfolio Data to Firestore and Backend API
  const handleSavePortfolio = async (updatedData: PortfolioData) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    const path = 'portfolio/data';

    try {
      // 1. Save directly to Firebase Firestore
      const docRef = doc(db, 'portfolio', 'data');
      try {
        await setDoc(docRef, updatedData);
        console.log('Portfolio state synchronized with Firestore cloud.');
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, path);
      }

      // 2. Fallback POST to local server
      try {
        await fetch('/api/portfolio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });
      } catch (apiErr) {
        console.warn('Backend local Express sync failed, but Firestore Cloud save succeeded:', apiErr);
      }

      setPortfolioData(updatedData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Portfolio save failure:', err);
      setSaveError(err.message || 'Failed to save portfolio data.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Settings Save
  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...portfolioData,
      settings: settingsForm,
    };
    handleSavePortfolio(updated);
  };

  // Team CRUD
  const handleUpdateMember = (id: string, field: keyof TeamMember, value: any) => {
    setTeamForm((prev) =>
      prev.map((member) => (member.id === id ? { ...member, [field]: value } : member))
    );
  };

  const handleUpdateMemberSkills = (id: string, skillsStr: string) => {
    const skills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
    handleUpdateMember(id, 'skills', skills);
  };

  const handleAddMember = () => {
    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: 'New Collective Member',
      role: 'AI Researcher',
      bio: 'Describe your expertise, background and academic credentials.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      skills: ['Python', 'Deep Learning'],
    };
    setTeamForm((prev) => [...prev, newMember]);
  };

  const handleDeleteMember = (id: string) => {
    setTeamForm((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveTeam = () => {
    const updated = {
      ...portfolioData,
      team: teamForm,
    };
    handleSavePortfolio(updated);
  };

  // Projects CRUD
  const handleUpdateProject = (id: string, field: keyof ProjectPrototype, value: any) => {
    setProjectsForm((prev) =>
      prev.map((project) => (project.id === id ? { ...project, [field]: value } : project))
    );
  };

  const handleUpdateProjectStack = (id: string, stackStr: string) => {
    const techStack = stackStr.split(',').map((s) => s.trim()).filter(Boolean);
    handleUpdateProject(id, 'techStack', techStack);
  };

  const handleAddProject = () => {
    const newProject: ProjectPrototype = {
      id: `proj-${Date.now()}`,
      title: 'New AI Project',
      description: 'Describe your project here, showcasing what it achieves.',
      longDescription: '',
      status: 'Completed',
      techStack: [],
      demoType: 'ai-chat',
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=500&q=80',
      githubUrl: 'https://github.com',
    };
    setProjectsForm((prev) => [...prev, newProject]);
  };

  const handleDeleteProject = (id: string) => {
    setProjectsForm((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveProjects = () => {
    const updated = {
      ...portfolioData,
      projects: projectsForm,
    };
    handleSavePortfolio(updated);
  };

  // Research CRUD
  const handleUpdatePaper = (id: string, field: keyof ResearchPaper, value: any) => {
    setResearchForm((prev) =>
      prev.map((paper) => (paper.id === id ? { ...paper, [field]: value } : paper))
    );
  };

  const handleUpdatePaperAuthors = (id: string, authStr: string) => {
    const authors = authStr.split(',').map((a) => a.trim()).filter(Boolean);
    handleUpdatePaper(id, 'authors', authors);
  };

  const handleAddPaper = () => {
    const newPaper: ResearchPaper = {
      id: `paper-${Date.now()}`,
      title: 'Optimal Deep Learning Fine-Tuning under Constraints',
      authors: ['UETronForge Collective'],
      abstract: 'Abstract summary of the research methodology and quantitative results.',
      venue: 'International Conference on Machine Learning',
      publishedYear: new Date().getFullYear(),
      paperUrl: '#',
      citationCount: 0,
    };
    setResearchForm((prev) => [...prev, newPaper]);
  };

  const handleDeletePaper = (id: string) => {
    setResearchForm((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveResearch = () => {
    const updated = {
      ...portfolioData,
      research: researchForm,
    };
    handleSavePortfolio(updated);
  };

  // Inbox management
  const handleMarkMessageRead = async (id: string) => {
    const path = `messages/${id}`;
    try {
      const docRef = doc(db, 'messages', id);
      try {
        await updateDoc(docRef, { read: true });
        console.log('Successfully marked message as read in Firestore.');
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.UPDATE, path);
      }

      // Sync to local server for fallback/logging
      try {
        await fetch(`/api/messages/${id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (apiErr) {
        console.warn('Backend message read sync failed, but cloud update succeeded:', apiErr);
      }
    } catch (err) {
      console.error('Error marking message read:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const path = `messages/${id}`;
    try {
      const docRef = doc(db, 'messages', id);
      try {
        await deleteDoc(docRef);
        console.log('Successfully deleted message from Firestore.');
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.DELETE, path);
      }

      // Sync to local server for fallback/logging
      try {
        await fetch(`/api/messages/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (apiErr) {
        console.warn('Backend message delete sync failed, but cloud deletion succeeded:', apiErr);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Export Data to JSON file download
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "portfolio.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // IF NOT LOGGED IN -> Show Secure Login Screen
  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-900 bg-slate-950/60 p-8 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Secure Control Hub</h1>
            <p className="text-xs text-slate-500 font-mono">AUTHORIZED CO-FOUNDERS ONLY</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase">Gmail Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uetronforge.ai@gmail.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-3 text-xs text-red-400 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-teal-400 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Validating session...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // IF LOGGED IN -> Show Hub Controls
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Settings className="h-6 w-6 text-teal-400 animate-spin-slow" />
            <span>UETronForge Management Hub</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Connected Session: {email}
          </p>
        </div>

        {/* Action Statuses */}
        {saveSuccess && (
          <div className="rounded-lg border border-teal-500/25 bg-teal-500/5 px-4 py-2 text-xs text-teal-400 flex items-center space-x-2 shrink-0">
            <CheckCircle className="h-4 w-4" />
            <span>Database synchronized with workspace files!</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-2 text-xs text-red-400 flex items-center space-x-2 shrink-0">
            <AlertCircle className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-900 border border-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Site Settings</span>
          </button>
          
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'team'
                ? 'bg-slate-900 border border-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Manage Team</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-slate-900 border border-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Manage Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'research'
                ? 'bg-slate-900 border border-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Manage Research</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'inbox'
                ? 'bg-slate-900 border border-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Inbox className="h-4 w-4" />
              <span>Inquiries Inbox</span>
            </div>
            {messages.filter((m) => !m.read).length > 0 && (
              <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white font-mono">
                {messages.filter((m) => !m.read).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-slate-900 border border-slate-800 text-teal-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Data Export / GitHub</span>
          </button>
        </div>

        {/* Active Panel View */}
        <div className="lg:col-span-9 bg-slate-950/40 rounded-2xl border border-slate-900 p-6 sm:p-8 space-y-6">
          
          {/* TAB 1: WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-base font-bold text-white">Global Site Configuration</h3>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 text-xs transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Syncing...' : 'Save Settings'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Collective / Company Name</label>
                  <input
                    type="text"
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Logo Text Display</label>
                  <input
                    type="text"
                    value={settingsForm.logoText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logoText: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase">Hero Display Heading</label>
                <input
                  type="text"
                  value={settingsForm.heroTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase">Hero Subtitle Introduction</label>
                <textarea
                  value={settingsForm.heroSubtitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-white focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase">About Us Segment Biography</label>
                <textarea
                  value={settingsForm.aboutText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, aboutText: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-white focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2 max-w-md">
                <label className="text-xs font-mono text-slate-400 uppercase">Contact Gateway Email</label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Social Media Links Section */}
              <div className="border-t border-slate-900 pt-6 mt-6">
                <h3 className="text-sm font-semibold text-white tracking-wider mb-4">Collective Social Media Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 uppercase">GitHub Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={settingsForm.githubUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, githubUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 uppercase">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={settingsForm.linkedinUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, linkedinUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 uppercase">Twitter/X URL</label>
                    <input
                      type="url"
                      placeholder="https://twitter.com/..."
                      value={settingsForm.twitterUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, twitterUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 uppercase">YouTube Channel URL</label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/@..."
                      value={settingsForm.youtubeUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE TEAM */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-base font-bold text-white">The Founding Pioneers roster</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddMember}
                    className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Plus className="h-3.5 w-3.5 text-teal-400" />
                    <span>Add Member</span>
                  </button>
                  <button
                    onClick={handleSaveTeam}
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-1.5 text-xs transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'Syncing...' : 'Save Roster'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {teamForm.map((member) => (
                  <div key={member.id} className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-4 relative">
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Member Name</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Role / Title</label>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Avatar Image URL</label>
                        <input
                          type="text"
                          value={member.avatarUrl}
                          onChange={(e) => handleUpdateMember(member.id, 'avatarUrl', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Core Skills (comma-separated)</label>
                        <input
                          type="text"
                          value={member.skills.join(', ')}
                          onChange={(e) => handleUpdateMemberSkills(member.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Short Biography</label>
                      <textarea
                        value={member.bio}
                        onChange={(e) => handleUpdateMember(member.id, 'bio', e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">GitHub Profile URL</label>
                        <input
                          type="text"
                          value={member.githubUrl || ''}
                          onChange={(e) => handleUpdateMember(member.id, 'githubUrl', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">LinkedIn Profile URL</label>
                        <input
                          type="text"
                          value={member.linkedinUrl || ''}
                          onChange={(e) => handleUpdateMember(member.id, 'linkedinUrl', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-base font-bold text-white">AI Prototypes Registry</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddProject}
                    className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Plus className="h-3.5 w-3.5 text-teal-400" />
                    <span>Add Project</span>
                  </button>
                  <button
                    onClick={handleSaveProjects}
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-1.5 text-xs transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'Syncing...' : 'Save Projects'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {projectsForm.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-4 relative">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                      title="Remove Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Project Title</label>
                        <input
                          type="text"
                          value={project.title}
                          onChange={(e) => handleUpdateProject(project.id, 'title', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">GitHub Repository Link</label>
                        <input
                          type="url"
                          placeholder="https://github.com/..."
                          value={project.githubUrl || ''}
                          onChange={(e) => handleUpdateProject(project.id, 'githubUrl', e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Image URL (Display Banner)</label>
                      <input
                        type="text"
                        value={project.imageUrl}
                        onChange={(e) => handleUpdateProject(project.id, 'imageUrl', e.target.value)}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Description</label>
                      <textarea
                        value={project.description}
                        onChange={(e) => handleUpdateProject(project.id, 'description', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE RESEARCH */}
          {activeTab === 'research' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-base font-bold text-white">Publications & Papers Directory</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddPaper}
                    className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Plus className="h-3.5 w-3.5 text-teal-400" />
                    <span>Add Publication</span>
                  </button>
                  <button
                    onClick={handleSaveResearch}
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-1.5 text-xs transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'Syncing...' : 'Save Directory'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {researchForm.map((paper) => (
                  <div key={paper.id} className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-4 relative">
                    <button
                      onClick={() => handleDeletePaper(paper.id)}
                      className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                      title="Remove Paper"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Research Paper Title</label>
                      <input
                        type="text"
                        value={paper.title}
                        onChange={(e) => handleUpdatePaper(paper.id, 'title', e.target.value)}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Authors (comma-separated)</label>
                        <input
                          type="text"
                          value={paper.authors.join(', ')}
                          onChange={(e) => handleUpdatePaperAuthors(paper.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-slate-500 uppercase">Published Year</label>
                          <input
                            type="number"
                            value={paper.publishedYear}
                            onChange={(e) => handleUpdatePaper(paper.id, 'publishedYear', parseInt(e.target.value) || 2026)}
                            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-slate-500 uppercase">Citation Count</label>
                          <input
                            type="number"
                            value={paper.citationCount}
                            onChange={(e) => handleUpdatePaper(paper.id, 'citationCount', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Conference / Journal Venue</label>
                      <input
                        type="text"
                        value={paper.venue}
                        onChange={(e) => handleUpdatePaper(paper.id, 'venue', e.target.value)}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Paper URL / Link (e.g., arXiv, IEEE Xplore, Google Scholar)</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={paper.paperUrl || ''}
                        onChange={(e) => handleUpdatePaper(paper.id, 'paperUrl', e.target.value)}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Academic Abstract</label>
                      <textarea
                        value={paper.abstract}
                        onChange={(e) => handleUpdatePaper(paper.id, 'abstract', e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-850 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INCOMING INBOX INQUIRIES */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-base font-bold text-white">Collaboration Inquiries</h3>
                <button
                  onClick={fetchMessages}
                  className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Inbox</span>
                </button>
              </div>

              {messages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                  Your inbox is currently empty. Incoming inquiries will populate here.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl border p-5 space-y-3 transition-colors ${
                        msg.read
                          ? 'border-slate-900 bg-slate-950/20 text-slate-400'
                          : 'border-slate-800 bg-slate-900/10 text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{msg.name}</span>
                            <span className="text-xs text-slate-500">({msg.email})</span>
                          </div>
                          <div className="text-xs font-semibold text-teal-400">{msg.subject}</div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed bg-slate-950/40 p-3.5 rounded-lg border border-slate-900 text-slate-300">
                        {msg.message}
                      </p>

                      <div className="flex items-center space-x-3 pt-2">
                        {!msg.read && (
                          <button
                            onClick={() => handleMarkMessageRead(msg.id)}
                            className="rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 text-[10px] font-semibold text-indigo-400"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 text-[10px] font-semibold text-red-400"
                        >
                          Delete Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BACKUP & EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="border-b border-slate-900 pb-3">
                <h3 className="text-base font-bold text-white">Cloudflare Pages & GitHub Portability</h3>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  UETronForge portfolio updates are written directly to your active workspace file tree inside AI Studio (at <code className="text-teal-400 font-mono text-[11px]">/src/data/portfolio.json</code>).
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When you export your workspace to GitHub or download the ZIP archive from AI Studio's top navigation options, your latest edits are already fully baked in!
                </p>

                <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300">Backup Configuration Download</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You can also download a localized backup copy of your configuration directly from this button.
                  </p>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/10"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download portfolio.json Backup</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
