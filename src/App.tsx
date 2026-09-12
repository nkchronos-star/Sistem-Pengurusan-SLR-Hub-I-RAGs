/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { ArticleManager } from './components/ArticleManager';
import { ReferenceTable } from './components/ReferenceTable';
import { SettingsPanel } from './components/Settings';
import { parseSLRCSV } from './lib/csvParser';
import { SLRData, ArticleAnalysis, ResearchProfile } from './types';
import { LayoutDashboard, BookOpen, TableProperties, Settings, AlertTriangle } from 'lucide-react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { subscribeToArticles, subscribeToSettings, saveSettingsToDb, updateArticleInDb, subscribeToCSVData, saveCSVDataToDb } from './lib/db';

export default function App() {
  const [data, setData] = useState<SLRData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'table' | 'settings'>('dashboard');
  const [articles, setArticles] = useState<ArticleAnalysis[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // Tetapan Kajian Default (Berdasarkan kajian pengguna)
  const [researchProfile, setResearchProfile] = useState<ResearchProfile>({
    title: "Pembangunan dan Penilaian HUB I-RAGS Berintegrasi Kecerdasan Buatan Terhadap Pencapaian, Motivasi dan Penglibatan Murid Tingkatan Empat Berprestasi Rendah Dalam Mata Pelajaran Sejarah",
    keywords: "Kecerdasan Buatan (AI), HUB I-RAGS (Modul/Web), Pencapaian (Achievement), Motivasi (Motivation), Penglibatan (Engagement), Murid Berprestasi Rendah (Low-performing students), Sejarah (History subject)"
  });

  useEffect(() => {
    // Attempt to sign in anonymously first
    signInAnonymously(auth).catch((err) => {
      console.error("Auth error:", err);
      if (err.code === 'auth/admin-restricted-operation') {
        setAuthError("Sila aktifkan 'Anonymous Authentication' di panel Firebase Console anda (Authentication -> Sign-in method -> Anonymous) untuk membolehkan pangkalan data berfungsi.");
      } else {
        setAuthError("Gagal menyambung ke pangkalan data: " + err.message);
      }
      setIsLoading(false);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
        // Subscribe to settings
        const unsubSettings = subscribeToSettings(currentUser.uid, (settings) => {
          setResearchProfile(settings);
        });
        
        // Subscribe to articles
        const unsubArticles = subscribeToArticles(currentUser.uid, (fetchedArticles) => {
          setArticles(fetchedArticles);
        });

        // Subscribe to CSV Data
        const unsubCSV = subscribeToCSVData(currentUser.uid, (csvData) => {
          if (csvData) setData(csvData);
        });

        setIsLoading(false);
        return () => {
          unsubSettings();
          unsubArticles();
          unsubCSV();
        };
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedData = await parseSLRCSV(file);
      setData(parsedData);
      if (user) {
        await saveCSVDataToDb(user.uid, parsedData);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memproses fail. Sila pastikan format CSV adalah betul.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setError(null);
    setActiveTab('dashboard');
    // We do not reset articles because they belong to the user's DB
  };

  const handleProfileSave = async (newProfile: ResearchProfile) => {
    setResearchProfile(newProfile);
    if (user) {
      await saveSettingsToDb(user.uid, newProfile);
      // Mark old articles for reevaluation in DB
      for (const art of articles) {
        await updateArticleInDb(user.uid, art.id, { needsReevaluation: true });
      }
    } else {
      setArticles(prev => prev.map(art => ({ ...art, needsReevaluation: true })));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memproses fail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {authError && (
        <div className="bg-amber-50 border-b-2 border-amber-500 p-4">
          <div className="flex max-w-7xl mx-auto">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-3" />
            <div>
              <p className="text-sm text-amber-800 font-bold">Ralat Pangkalan Data (Authentication)</p>
              <p className="text-sm text-amber-700 mt-1">{authError}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 max-w-2xl mx-auto rounded-r-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {!data ? (
        <FileUpload onFileUpload={handleFileUpload} />
      ) : (
        <div className="flex flex-col h-screen">
          {/* Top Navigation */}
          <nav className="bg-white border-b border-gray-200 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center space-x-8 h-16">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={cn(
                    "inline-flex items-center gap-2 px-1 border-b-2 text-sm font-medium transition-colors",
                    activeTab === 'dashboard'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Protokol SLR
                </button>
                <button
                  onClick={() => setActiveTab('articles')}
                  className={cn(
                    "inline-flex items-center gap-2 px-1 border-b-2 text-sm font-medium transition-colors",
                    activeTab === 'articles'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Pengurusan Rujukan
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={cn(
                    "inline-flex items-center gap-2 px-1 border-b-2 text-sm font-medium transition-colors",
                    activeTab === 'table'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <TableProperties className="w-4 h-4" />
                  Jadual Matriks SLR
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    "inline-flex items-center gap-2 px-1 border-b-2 text-sm font-medium transition-colors",
                    activeTab === 'settings'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Tetapan Kajian
                </button>
              </div>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'dashboard' && <Dashboard data={data} onReset={handleReset} articles={articles} />}
            {activeTab === 'articles' && <ArticleManager articles={articles} setArticles={setArticles} researchProfile={researchProfile} user={user} />}
            {activeTab === 'table' && <ReferenceTable articles={articles} />}
            {activeTab === 'settings' && <SettingsPanel profile={researchProfile} onSave={handleProfileSave} hasArticles={articles.length > 0} />}
          </div>
        </div>
      )}
    </div>
  );
}

