import React, { useState } from "react";
import { ArticleAnalysis, BilingualText } from "../types";
import { Table, Search, ExternalLink, Download, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import Papa from "papaparse";

interface ReferenceTableProps {
  articles: ArticleAnalysis[];
}

export function ReferenceTable({ articles }: ReferenceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lang, setLang] = useState<'bm' | 'en'>('bm');

  const renderText = (text: BilingualText | string | undefined) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[lang] || text.bm || "";
  };

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.authors.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const exportData = filteredArticles.map((a, i) => ({
      "No": i + 1,
      "Priority": a.priority || 'Belum Ditetapkan',
      "Status": a.status || 'NEW',
      "Thesis Section": a.thesisSection || '',
      "Author": a.authors,
      "Year": a.year,
      "Title": a.title,
      "Journal": a.journal || "",
      "DOI": a.doi || "",
      "Background": renderText(a.background),
      "Problem Statement": renderText(a.problemStatement),
      "Methodology": renderText(a.methodology),
      "Findings": renderText(a.findings),
      "Future Research": renderText(a.futureResearch),
      "Research Gap": renderText(a.researchGap),
      "Justification / SLR Contribution": renderText(a.slrRelevance)
    }));

    const csv = Papa.unparse(exportData);
    // Add BOM to fix UTF-8 encoding in Excel
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SLR_Matrix_${lang.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              {lang === 'bm' ? 'Jadual Rujukan (Matriks SLR)' : 'Reference Table (SLR Matrix)'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {lang === 'bm' ? 'Ringkasan keseluruhan artikel yang telah dimuat naik' : 'Overview of all uploaded articles'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={lang === 'bm' ? 'Cari tajuk/penulis...' : 'Search title/authors...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={filteredArticles.length === 0}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                filteredArticles.length === 0 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              )}
            >
              <Download className="w-4 h-4" />
              {lang === 'bm' ? 'Muat Turun CSV' : 'Export CSV'}
            </button>

            {/* Language Toggle */}
            <div className="flex items-center bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setLang('bm')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                  lang === 'bm' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                BM
              </button>
              <button
                onClick={() => setLang('en')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                  lang === 'en' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto w-full">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Table className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {lang === 'bm' ? 'Tiada rekod rujukan dijumpai. Sila muat naik fail di tab Pengurusan Rujukan.' : 'No references found. Please upload files in the Reference Management tab.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4 min-w-[200px] border-r border-gray-200">Kawalan (Control)</th>
                      <th className="p-4 min-w-[200px]">Author / Year</th>
                      <th className="p-4 min-w-[250px] bg-blue-50 text-blue-800">Title</th>
                      <th className="p-4 min-w-[200px] bg-emerald-50 text-emerald-800">Background</th>
                      <th className="p-4 min-w-[200px] bg-amber-50 text-amber-800">Problem Statement</th>
                      <th className="p-4 min-w-[200px] bg-orange-50 text-orange-800">Methodology</th>
                      <th className="p-4 min-w-[200px] bg-teal-50 text-teal-800">Finding</th>
                      <th className="p-4 min-w-[200px] bg-purple-50 text-purple-800">Future Research</th>
                      <th className="p-4 min-w-[200px] bg-indigo-50 text-indigo-800">Gap</th>
                      <th className="p-4 min-w-[200px] bg-sky-50 text-sky-800">Justify to Your Research</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredArticles.map((article, index) => (
                      <tr key={article.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 text-center text-sm font-bold text-gray-700 align-top bg-gray-50/50">
                          {index + 1}
                        </td>
                        <td className="p-4 align-top border-r border-gray-100 bg-gray-50/20">
                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Priority</span>
                              <div className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded inline-block w-full mt-0.5 truncate">
                                {article.priority || 'Belum Ditetapkan'}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                              <div className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded inline-block w-full mt-0.5 truncate">
                                {article.status || 'NEW'}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Thesis Section</span>
                              <div className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-800 rounded inline-block w-full mt-0.5 truncate min-h-[22px]">
                                {article.thesisSection || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm font-bold text-gray-900 mb-1">{article.authors}</p>
                          <p className="text-xs text-gray-600 font-semibold">({article.year})</p>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm text-gray-900 font-medium mb-1">{article.title}</p>
                          {article.needsReevaluation && (
                            <div className="mt-2 mb-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2 rounded flex items-start gap-1">
                               <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-600" />
                               <span className="font-semibold leading-tight">Amaran: Kajian pengguna telah diubah. Sila semak semula perkaitan.</span>
                            </div>
                          )}
                          {article.isPredatory && (
                            <div className="mt-2 mb-2 bg-red-100 border border-red-200 text-red-800 text-xs p-2 rounded flex items-start gap-1">
                               <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-red-600" />
                               <span className="font-semibold leading-tight">{article.predatoryWarning || "Amaran: Jurnal Predatory"}</span>
                            </div>
                          )}
                          {article.journal && (
                            <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100 mb-1 mt-2">
                              {article.journal}
                            </p>
                          )}
                          {article.doi && (
                            <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 mt-1">
                              DOI <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.background).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.problemStatement).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.methodology).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.findings).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.futureResearch).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.researchGap).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {renderText(article.slrRelevance).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i}>{sent}.</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
