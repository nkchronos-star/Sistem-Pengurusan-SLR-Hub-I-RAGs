import React from "react";
import { SLRData, ArticleAnalysis } from "../types";
import { 
  FileText, 
  Target, 
  HelpCircle, 
  Settings, 
  LogOut,
  Database,
  BookOpen
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  data: SLRData;
  articles?: ArticleAnalysis[];
  onReset: () => void;
}

export function Dashboard({ data, articles = [], onReset }: DashboardProps) {
  // --- KPI LOGIC FOR ARTICLES ---
  const articleStatusCounts = {
    NEW: articles.filter(a => a.status === 'NEW').length,
    TO_READ: articles.filter(a => a.status === 'TO_READ').length,
    READING: articles.filter(a => a.status === 'READING').length,
    EXTRACTED: articles.filter(a => a.status === 'EXTRACTED').length,
    CITED: articles.filter(a => a.status === 'CITED').length,
  };

  const articlePriorityCounts = {
    'A-TERAS': articles.filter(a => a.priority === 'A-TERAS').length,
    'B-SOKONGAN': articles.filter(a => a.priority === 'B-SOKONGAN').length,
    'C-LATAR': articles.filter(a => a.priority === 'C-LATAR').length,
  };
  // -----------------------------

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Sistem Pengurusan SLR</h1>
              <p className="text-xs text-gray-500 font-medium">Papan Pemuka Automatik</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-md"
          >
            <LogOut className="w-4 h-4" />
            Muat Naik Semula
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Control Centre KPIs */}
        {articles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Pusat Kawalan Rujukan (LR Control Centre)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-500 mb-1">TOTAL PDF</p>
                <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 text-center">
                <p className="text-xs font-bold text-indigo-600 mb-1">TERAS UTAMA</p>
                <p className="text-2xl font-bold text-indigo-900">{articlePriorityCounts['A-TERAS']}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 text-center">
                <p className="text-xs font-bold text-yellow-600 mb-1">TO READ</p>
                <p className="text-2xl font-bold text-yellow-900">{articleStatusCounts.TO_READ}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 text-center">
                <p className="text-xs font-bold text-emerald-600 mb-1">EXTRACTED</p>
                <p className="text-2xl font-bold text-emerald-900">{articleStatusCounts.EXTRACTED}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-center">
                <p className="text-xs font-bold text-blue-600 mb-1">CITED IN THESIS</p>
                <p className="text-2xl font-bold text-blue-900">{articleStatusCounts.CITED}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Title Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-xl mt-1">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Maklumat Kajian</h2>
              <h3 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
                {data.title || "Tiada Tajuk Utama"}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {data.subtitle || "Sila rujuk fail muat naik untuk tajuk penuh."}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area: Protocols & RQs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Protocols Section */}
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Ketetapan Protokol</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {data.protocols.length > 0 ? (
                  data.protocols.map((protocol, index) => (
                    <div key={index} className="flex flex-col sm:flex-row p-6 hover:bg-gray-50/30 transition-colors">
                      <div className="sm:w-1/3 mb-2 sm:mb-0">
                        <span className="text-sm font-semibold text-gray-700">{protocol.component}</span>
                      </div>
                      <div className="sm:w-2/3">
                        <span className="text-sm text-gray-600">{protocol.setting}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">Tiada data protokol ditemui.</div>
                )}
              </div>
            </motion.section>

            {/* Research Questions Section */}
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Soalan Kajian (SLR-RQ)</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {data.researchQuestions.length > 0 ? (
                  data.researchQuestions.map((rq, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50/30 transition-colors flex gap-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                          {rq.id.replace("RQ", "")}
                        </span>
                      </div>
                      <div className="pt-2">
                        <p className="text-gray-800 text-sm font-medium leading-relaxed">{rq.question}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">Tiada soalan kajian ditemui.</div>
                )}
              </div>
            </motion.section>

          </div>

          {/* Sidebar Area: Metadata & Status */}
          <div className="space-y-8">
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24"
            >
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Status & Peraturan</h3>
              </div>
              <div className="p-6 space-y-5">
                {data.metadata.length > 0 ? (
                  data.metadata.map((meta, index) => (
                    <div key={index}>
                      <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{meta.key}</dt>
                      <dd className="text-sm text-gray-800 bg-gray-50 rounded-md p-3 border border-gray-100">{meta.value}</dd>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 text-sm">Tiada data status ditemui.</div>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
