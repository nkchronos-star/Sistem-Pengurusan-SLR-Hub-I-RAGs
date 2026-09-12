import React, { useState, useRef, useEffect } from "react";
import { ArticleAnalysis, BilingualText, ResearchProfile } from "../types";
import { UploadCloud, FileText, Search, Library, AlertCircle, X, ChevronRight, Languages, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { User } from 'firebase/auth';
import { saveArticleToDb, updateArticleInDb } from '../lib/db';

interface ArticleManagerProps {
  articles: ArticleAnalysis[];
  setArticles: React.Dispatch<React.SetStateAction<ArticleAnalysis[]>>;
  researchProfile: ResearchProfile;
  user: User | null;
}

export function ArticleManager({ articles, setArticles, researchProfile, user }: ArticleManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleAnalysis | null>(null);
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [panelWidth, setPanelWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      return;
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 400 && newWidth < window.innerWidth - 300) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    // Reset to page 1 when new items are added, or if current page is out of bounds
    if (currentPage > Math.ceil(articles.length / itemsPerPage)) {
      setCurrentPage(Math.max(1, Math.ceil(articles.length / itemsPerPage)));
    }
  }, [articles.length, currentPage]);

  const totalPages = Math.ceil(articles.length / itemsPerPage);
  const currentItems = articles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError(lang === 'bm' ? "Sila muat naik fail berformat PDF sahaja." : "Please upload PDF files only.");
      return;
    }

    // Duplicate Check based on filename
    const isDuplicate = articles.some(art => art.title.toLowerCase().includes(file.name.replace('.pdf', '').toLowerCase()));
    if (isDuplicate) {
       if (!window.confirm(lang === 'bm' 
        ? "Fail ini kelihatan seperti telah dimuat naik. Adakah anda pasti mahu memuat naik sekali lagi?" 
        : "This file appears to have already been uploaded. Are you sure you want to upload it again?")) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
       }
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", researchProfile.title);
    formData.append("keywords", researchProfile.keywords);
    formData.append("thesisStructure", researchProfile.thesisStructure || "");
    const fileUrl = URL.createObjectURL(file); // Generate URL for the PDF

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.error("Non-JSON response from server:", textResponse);
        throw new Error(lang === 'bm' 
          ? "Ralat pelayan: Pelayan mungkin sedang dimulakan semula atau mengalami kesesakan. Sila cuba sebentar lagi." 
          : "Server error: The server might be restarting or overloaded. Please try again in a moment.");
      }

      if (!response.ok) {
        throw new Error(data.error || (lang === 'bm' ? "Ralat pelayan" : "Server error"));
      }

      if (data.autoPriority === 'REJECT') {
        throw new Error(`DITOLAK: Artikel ini tiada kaitan dengan fokus kajian. \nSebab: ${data.rejectReason || 'Tidak relevan.'}`);
      }

      const newArticle = {
        ...data,
        priority: data.autoPriority || 'Belum Ditetapkan',
        status: 'NEW',
        thesisSection: '',
        pdfUrl: fileUrl,
        needsReevaluation: false,
      };

      if (user) {
        await saveArticleToDb(user.uid, newArticle);
      } else {
        setArticles((prev) => [newArticle, ...prev]);
      }
      
      if (!selectedArticle) setSelectedArticle(newArticle);
    } catch (err: any) {
      console.error(err);
      setError(err.message || (lang === 'bm' ? "Gagal menganalisis fail. Sila cuba lagi." : "Failed to analyze file. Please try again."));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updateArticleField = async (id: string, field: keyof ArticleAnalysis, value: string) => {
    if (user) {
      await updateArticleInDb(user.uid, id, { [field]: value });
    } else {
      setArticles(prev => prev.map(art => 
        art.id === id ? { ...art, [field]: value } : art
      ));
    }
    
    if (selectedArticle?.id === id) {
      setSelectedArticle(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const renderText = (text: BilingualText | string | undefined) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[lang] || text.bm || "";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Main List Area */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50/50 min-w-0">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Library className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="truncate">{lang === 'bm' ? 'Pengurusan Rujukan (SLR)' : 'Reference Management (SLR)'}</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {lang === 'bm' ? 'Muat naik artikel PDF untuk dianalisis' : 'Upload PDF articles for AI analysis'}
              </p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors w-full xl:w-auto",
                isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm"
              )}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
                  {lang === 'bm' ? 'Menganalisis...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  {lang === 'bm' ? 'Muat Naik PDF' : 'Upload PDF'}
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {articles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto p-6">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {lang === 'bm' ? 'Tiada Rujukan' : 'No References'}
                </h3>
                <p className="text-sm text-gray-500">
                  {lang === 'bm' 
                    ? 'Muat naik artikel kajian anda. AI akan secara automatik mengekstrak tajuk, penulis, jurang kajian, dan kaitannya dengan SLR anda.'
                    : 'Upload your research articles. AI will automatically extract the title, authors, research gap, and SLR relevance.'}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentItems.map((article) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md bg-white",
                      selectedArticle?.id === article.id ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-4 min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 leading-tight mb-1">{article.title || (lang === 'bm' ? 'Tiada Tajuk' : 'No Title')}</h4>
                        <p className="text-sm text-gray-500 mb-3">{article.authors} ({article.year})</p>
                        {article.methodology && (
                          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2 line-clamp-2">
                            {renderText(article.methodology)}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between shrink-0">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, articles.length)}</span> / <span className="font-semibold text-gray-900">{articles.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      // Simple logic to not show too many pages, but good enough for typical SLR (e.g. 50 articles = 10 pages)
                      if (totalPages > 5 && i > 0 && i < totalPages - 1 && Math.abs(currentPage - 1 - i) > 1) {
                         if (i === 1 && currentPage > 3) return <span key={i} className="text-gray-400 px-1">...</span>;
                         if (i === totalPages - 2 && currentPage < totalPages - 2) return <span key={i} className="text-gray-400 px-1">...</span>;
                         return null;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded text-sm font-semibold transition-colors",
                            currentPage === i + 1 
                              ? "bg-blue-600 text-white shadow-sm" 
                              : "text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedArticle ? (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: panelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: isDragging ? 0 : 0.3 }}
              className="border-l border-gray-200 bg-white overflow-hidden flex flex-col relative"
              style={{ minWidth: 400 }}
            >
              {/* Drag Handle */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 z-50 transition-colors"
                style={{ marginLeft: '-1px' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
              />
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-gray-700 text-sm">
                    {lang === 'bm' ? 'Butiran Analisis' : 'Analysis Details'}
                  </h3>
                  
                  {/* Language Toggle for Details */}
                  <div className="flex items-center bg-gray-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setLang('bm')}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                        lang === 'bm' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      BM
                    </button>
                    <button
                      onClick={() => setLang('en')}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                        lang === 'en' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {/* Control Centre / KPI Top Bar */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    {selectedArticle.pdfUrl && (
                      <a 
                        href={selectedArticle.pdfUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        {lang === 'bm' ? 'Buka PDF Asal' : 'Open Original PDF'}
                      </a>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Priority (Kepentingan)
                      </label>
                      <select 
                        value={selectedArticle.priority || 'Belum Ditetapkan'}
                        onChange={(e) => updateArticleField(selectedArticle.id, 'priority', e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded p-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Belum Ditetapkan">- Pilih -</option>
                        <option value="A-TERAS">A-TERAS (Sangat Hampir)</option>
                        <option value="B-SOKONGAN">B-SOKONGAN (Menyokong Konstruk)</option>
                        <option value="C-LATAR">C-LATAR (Dasar/Definisi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Status Bacaan
                      </label>
                      <select 
                        value={selectedArticle.status || 'NEW'}
                        onChange={(e) => updateArticleField(selectedArticle.id, 'status', e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded p-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="NEW">NEW (Baru Masuk)</option>
                        <option value="TO_READ">TO READ (Perlu Dibaca)</option>
                        <option value="READING">READING (Sedang Dibaca)</option>
                        <option value="EXTRACTED">EXTRACTED (Sudah Diekstrak)</option>
                        <option value="CITED">CITED (Sudah Digunakan/Dicitasi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Thesis Section (Bab)
                      </label>
                      <input 
                        type="text"
                        value={selectedArticle.thesisSection || ''}
                        onChange={(e) => updateArticleField(selectedArticle.id, 'thesisSection', e.target.value)}
                        placeholder="Contoh: Bab 2.16"
                        className="w-full bg-white border border-blue-200 rounded p-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-2">{selectedArticle.title}</h2>
                    <p className="text-sm text-gray-600 font-medium">{selectedArticle.authors} &bull; {selectedArticle.year}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <DetailSection title={lang === 'bm' ? 'Ringkasan Kajian' : 'Study Summary'} content={renderText(selectedArticle.summary)} />
                    <DetailSection title={lang === 'bm' ? 'Metodologi' : 'Methodology'} content={renderText(selectedArticle.methodology)} />
                    <DetailSection title={lang === 'bm' ? 'Jurang Kajian (Research Gap)' : 'Research Gap'} content={renderText(selectedArticle.researchGap)} highlight />
                    <DetailSection title={lang === 'bm' ? 'Kaitan dengan SLR' : 'SLR Relevance'} content={renderText(selectedArticle.slrRelevance)} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-gray-50/30 text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">
                {lang === 'bm' ? 'Pilih artikel untuk melihat analisis terperinci' : 'Select an article to view detailed analysis'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DetailSection({ title, content, highlight = false }: { title: string; content: string, highlight?: boolean }) {
  if (!content) return null;
  return (
    <div className={cn("p-4 rounded-xl border", highlight ? "bg-amber-50/50 border-amber-200" : "bg-white border-gray-100 shadow-sm")}>
      <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-2", highlight ? "text-amber-800" : "text-gray-500")}>
        {title}
      </h4>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
