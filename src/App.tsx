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
import { ApaReferences } from './components/ApaReferences';
import { parseSLRCSV } from './lib/csvParser';
import { SLRData, ArticleAnalysis, ResearchProfile } from './types';
import { LayoutDashboard, BookOpen, TableProperties, Settings, AlertTriangle, LogIn, LogOut, Library, BookText } from 'lucide-react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { subscribeToArticles, subscribeToSettings, saveSettingsToDb, updateArticleInDb, subscribeToCSVData, saveCSVDataToDb } from './lib/db';

export default function App() {
  const [data, setData] = useState<SLRData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'table' | 'settings' | 'apa'>('dashboard');
  const [articles, setArticles] = useState<ArticleAnalysis[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // Tetapan Kajian Default (Berdasarkan kajian pengguna)
  const [researchProfile, setResearchProfile] = useState<ResearchProfile>({
    title: "Pembangunan dan Penilaian HUB I-RAGS Berintegrasi Kecerdasan Buatan Terhadap Pencapaian, Motivasi dan Penglibatan Murid Tingkatan Empat Berprestasi Rendah Dalam Mata Pelajaran Sejarah",
    keywords: "Kecerdasan Buatan (AI), HUB I-RAGS (Modul/Web), Pencapaian (Achievement), Motivasi (Motivation), Penglibatan (Engagement), Murid Berprestasi Rendah (Low-performing students), Sejarah (History subject)"
  });

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setAuthError("Sila aktifkan 'Google Authentication' di panel Firebase Console anda (Authentication -> Sign-in method -> Google).");
      } else {
        setAuthError("Gagal mendaftar masuk: " + err.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setData(null);
      setArticles([]);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
          <p className="text-gray-500 mb-8">Sila log masuk menggunakan akaun Google anda untuk mula menggunakan Sistem Pengurusan SLR.</p>
          
          <button
            onClick={handleLogin}
            className="flex items-center justify-center w-full gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Log Masuk dengan Google
          </button>
          
          {authError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {authError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Banner with Logout */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">HUB I-RAGS SLR</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline-block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Keluar
          </button>
        </div>
      </div>

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
                  onClick={() => setActiveTab('apa')}
                  className={cn(
                    "inline-flex items-center gap-2 px-1 border-b-2 text-sm font-medium transition-colors",
                    activeTab === 'apa'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <BookText className="w-4 h-4" />
                  Senarai Rujukan (APA)
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
            {activeTab === 'apa' && <ApaReferences articles={articles} />}
            {activeTab === 'settings' && <SettingsPanel profile={researchProfile} onSave={handleProfileSave} hasArticles={articles.length > 0} />}
          </div>
        </div>
      )}
    </div>
  );
}

