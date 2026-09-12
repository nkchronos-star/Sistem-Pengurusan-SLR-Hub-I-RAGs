import React, { useState } from "react";
import { ArticleAnalysis } from "../types";
import { BookText, Copy, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface ApaReferencesProps {
  articles: ArticleAnalysis[];
}

export function ApaReferences({ articles }: ApaReferencesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sort articles alphabetically by author for APA format
  const sortedArticles = [...articles].sort((a, b) => {
    return (a.apaCitation || a.authors).localeCompare(b.apaCitation || b.authors);
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = () => {
    const allCitations = sortedArticles
      .map(a => a.apaCitation || `${a.authors} (${a.year}). ${a.title}. ${a.journal || ''}. ${a.doi ? "https://doi.org/" + a.doi : ''}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(allCitations);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
      <div className="p-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookText className="w-5 h-5 text-blue-600" />
              Senarai Rujukan (Format APA)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Senarai sitasi lengkap mengikut format APA Edisi Ke-7. Sedia untuk disalin ke Microsoft Word.
            </p>
          </div>
          {sortedArticles.length > 0 && (
            <button
              onClick={copyAll}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              {copiedId === 'all' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Berjaya Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Semua
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto w-full">
          {sortedArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <BookText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                Tiada artikel. Sila muat naik PDF di tab Pengurusan Rujukan terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
              <h3 className="text-center font-bold text-lg mb-8 uppercase tracking-widest text-gray-900">References</h3>
              <div className="space-y-6">
                {sortedArticles.map((article) => {
                  const citationText = article.apaCitation || `${article.authors} (${article.year}). ${article.title}. ${article.journal || ''}. ${article.doi ? "https://doi.org/" + article.doi : ''}`;
                  
                  return (
                    <div 
                      key={article.id} 
                      className="group relative pl-8 pr-12 -indent-8 text-gray-800 leading-relaxed hover:bg-gray-50 p-2 rounded transition-colors"
                      style={{ textIndent: '-32px', paddingLeft: '40px' }} // APA Hanging Indent
                    >
                      <span dangerouslySetInnerHTML={{ __html: citationText }} />
                      
                      <button
                        onClick={() => handleCopy(citationText, article.id)}
                        className={cn(
                          "absolute right-2 top-2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                          copiedId === article.id ? "bg-emerald-50 text-emerald-600 opacity-100" : "bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                        )}
                        title="Salin sitasi ini"
                      >
                        {copiedId === article.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
