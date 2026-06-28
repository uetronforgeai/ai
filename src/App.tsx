/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import PrototypesView from './components/PrototypesView';
import ResearchView from './components/ResearchView';
import DashboardView from './components/DashboardView';
import { PortfolioData } from './types';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Default fallback data in case API is loading or unavailable on startup
const defaultPortfolioData: PortfolioData = {
  settings: {
    companyName: "UETronForge AI",
    heroTitle: "Forging the Future of AI in Pakistan",
    heroSubtitle: "We are a deep-tech AI collective of 4 BS AI students from UET Lahore, engineering state-of-the-art intelligent solutions, applied research, and custom prototypes.",
    aboutText: "Formed at the University of Engineering and Technology (UET) Lahore, UETronForge AI brings together cutting-edge academic research and robust industry-grade software engineering. Our collective focus spans Natural Language Processing, Computer Vision, Edge AI, and Predictive Analytics, with a mission to develop localized AI solutions tailored for Pakistani agriculture, healthcare, and languages.",
    contactEmail: "uetronforge.ai@gmail.com",
    logoText: "UETronForge",
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    twitterUrl: "https://twitter.com",
    youtubeUrl: ""
  },
  team: [],
  projects: [],
  research: []
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(defaultPortfolioData);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load portfolio data and authentication state on mount
  useEffect(() => {
    // 1. Subscribe to Firebase Auth changes (Single source of truth)
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          localStorage.setItem('uetronforge_token', idToken);
        } catch (err) {
          console.error('Error getting ID token:', err);
          setToken(user.uid);
        }
      } else {
        setToken(null);
        localStorage.removeItem('uetronforge_token');
      }
    });

    // 2. Fetch Portfolio Data
    const sanitizeAndSetPortfolioData = (data: any) => {
      const sanitized: PortfolioData = {
        settings: {
          companyName: data?.settings?.companyName || defaultPortfolioData.settings.companyName,
          heroTitle: data?.settings?.heroTitle || defaultPortfolioData.settings.heroTitle,
          heroSubtitle: data?.settings?.heroSubtitle || defaultPortfolioData.settings.heroSubtitle,
          aboutText: data?.settings?.aboutText || defaultPortfolioData.settings.aboutText,
          contactEmail: data?.settings?.contactEmail || defaultPortfolioData.settings.contactEmail,
          logoText: data?.settings?.logoText || defaultPortfolioData.settings.logoText,
          githubUrl: data?.settings?.githubUrl !== undefined ? data.settings.githubUrl : (defaultPortfolioData.settings.githubUrl || ''),
          linkedinUrl: data?.settings?.linkedinUrl !== undefined ? data.settings.linkedinUrl : (defaultPortfolioData.settings.linkedinUrl || ''),
          twitterUrl: data?.settings?.twitterUrl !== undefined ? data.settings.twitterUrl : (defaultPortfolioData.settings.twitterUrl || ''),
          youtubeUrl: data?.settings?.youtubeUrl !== undefined ? data.settings.youtubeUrl : (defaultPortfolioData.settings.youtubeUrl || ''),
        },
        team: Array.isArray(data?.team) ? data.team : [],
        projects: Array.isArray(data?.projects) ? data.projects : [],
        research: Array.isArray(data?.research) ? data.research : [],
      };
      setPortfolioData(sanitized);
    };

    const loadPortfolio = async () => {
      try {
        // Try Firebase Firestore first
        const docRef = doc(db, 'portfolio', 'data');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log('Successfully loaded portfolio data from Firebase Firestore.');
          sanitizeAndSetPortfolioData(docSnap.data());
        } else {
          console.warn('No portfolio document found in Firestore, checking backend/fallback.');
          // Fallback to local Express API if database document is not initialized yet
          const response = await fetch('/api/portfolio');
          if (response.ok) {
            const data = await response.json();
            sanitizeAndSetPortfolioData(data);
          } else {
            console.warn('Backend portfolio API returned error, using fallback state.');
          }
        }
      } catch (err) {
        console.error('Failed to communicate with portfolio Firestore/API, using defaults:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolio();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out of Firebase Auth:', err);
    }
    setToken(null);
    localStorage.removeItem('uetronforge_token');
    setCurrentTab('home');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-teal-500" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Initializing Lab Environment...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-950 text-slate-100">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        logoText={portfolioData.settings?.logoText || "UETronForge"}
        isLoggedIn={!!token}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {currentTab === 'home' && (
          <HomeView portfolioData={portfolioData} />
        )}

        {currentTab === 'prototypes' && (
          <PrototypesView projects={portfolioData.projects} />
        )}

        {currentTab === 'research' && (
          <ResearchView research={portfolioData.research} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            portfolioData={portfolioData}
            setPortfolioData={setPortfolioData}
            token={token}
            setToken={setToken}
          />
        )}
      </main>

      <Footer settings={portfolioData.settings} />
    </div>
  );
}
