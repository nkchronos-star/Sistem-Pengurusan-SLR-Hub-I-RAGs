import React, { useState, useEffect } from "react";
import { ArticleAnalysis, BilingualText } from "../types";
import { Table, Search, ExternalLink, Download, AlertCircle, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import Papa from "papaparse";

interface ReferenceTableProps {
  articles: ArticleAnalysis[];
}

export function ReferenceTable({ articles }: ReferenceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const renderText = (text: BilingualText | string | undefined) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[lang] || text.bm || "";
  };

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.authors.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const currentItems = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
  const [promptType, setPromptType] = useState('bab2');

  const handleCopyPrompt = () => {
    if (filteredArticles.length === 0) return;

    let promptText = "";

    if (promptType === 'bab1') {
      promptText = `Bertindak sebagai pakar akademik dan penilai tesis (Examiner). Sila bantu saya menulis bahagian Latar Belakang dan Penyataan Masalah (Bab 1) yang kukuh untuk menyokong keperluan dan rasional kajian saya, berdasarkan ${filteredArticles.length} artikel di bawah. 

Fokuskan penulisan anda kepada:
1. Jurang / Lompang kajian (research gap) yang ditinggalkan oleh kajian-kajian lepas.
2. Isu atau masalah utama yang belum diselesaikan secara tuntas.
3. Mengapa kajian baharu (kajian saya) sangat kritikal untuk dijalankan.

Gunakan penanda wacana akademik kelas pertama. Sila tulis dalam Bahasa Melayu.

MAKLUMAT ARTIKEL:
${filteredArticles.map((a, i) => `
[Artikel ${i + 1}]
Tajuk: ${a.title}
Penulis: ${a.authors} (${a.year})
Penyataan Masalah: ${renderText(a.problemStatement) || 'Tidak dinyatakan'}
Lompang Kajian: ${renderText(a.researchGap)}
`).join('\n')}`;
    } else if (promptType === 'bab2') {
      promptText = `Bertindak sebagai pakar akademik dan penilai tesis (Examiner). Sila bantu saya menulis ulasan literatur (Literature Review) yang kritis dan analitikal dengan mensintesiskan ${filteredArticles.length} artikel di bawah. 

Jangan senaraikan artikel ini satu per satu (seperti senarai rujukan), tetapi gabungkan dapatan mereka ke dalam perenggan berstruktur mengikut:
1. Tema utama atau persamaan.
2. Percanggahan pendapat atau kaedah.
3. Lompang kajian (research gap) yang ditinggalkan oleh mereka.

Gunakan penanda wacana akademik kelas pertama. Sila tulis dalam Bahasa Melayu.

MAKLUMAT ARTIKEL:
${filteredArticles.map((a, i) => `
[Artikel ${i + 1}]
Tajuk: ${a.title}
Penulis: ${a.authors} (${a.year})
Metodologi: ${renderText(a.methodology)}
Dapatan: ${renderText(a.findings)}
Lompang Kajian: ${renderText(a.researchGap)}
`).join('\n')}`;
    } else if (promptType === 'bab3') {
      promptText = `Bertindak sebagai pakar akademik. Sila bantu saya mensintesiskan bahagian Metodologi (Bab 3) dengan merumuskan kaedah yang digunakan oleh ${filteredArticles.length} kajian lepas di bawah bagi menyokong atau menjustifikasikan pemilihan kaedah kajian saya.

Fokuskan penulisan kepada:
1. Trend reka bentuk kajian (contoh: kualitatif, kuantitatif, eksperimen) yang biasa digunakan.
2. Kekuatan atau kelemahan pendekatan metodologi lepas.
3. Instrumen atau saiz sampel yang sering diguna pakai.

Gunakan penanda wacana akademik kelas pertama. Sila tulis dalam Bahasa Melayu.

MAKLUMAT ARTIKEL:
${filteredArticles.map((a, i) => `
[Artikel ${i + 1}]
Tajuk: ${a.title}
Penulis: ${a.authors} (${a.year})
Metodologi: ${renderText(a.methodology)}
`).join('\n')}`;
    } else if (promptType === 'bab5') {
      promptText = `Bertindak sebagai pakar akademik. Sila bantu saya mensintesiskan bahagian Perbincangan dan Cadangan (Bab 5) dengan merumuskan ${filteredArticles.length} artikel di bawah.

Bantu saya menyusun isi supaya saya boleh membandingkan (menyokong atau menolak) dapatan kajian saya nanti dengan dapatan lepas ini, dan menyenaraikan cadangan kajian lanjutan.
Fokuskan kepada:
1. Konklusi utama / dapatan besar.
2. Cadangan kajian masa depan (future research) yang dikemukakan oleh mereka.

Gunakan penanda wacana akademik kelas pertama. Sila tulis dalam Bahasa Melayu.

MAKLUMAT ARTIKEL:
${filteredArticles.map((a, i) => `
[Artikel ${i + 1}]
Tajuk: ${a.title}
Penulis: ${a.authors} (${a.year})
Dapatan: ${renderText(a.findings)}
Cadangan Kajian Akan Datang: ${renderText(a.futureResearch) || 'Tidak dinyatakan'}
`).join('\n')}`;
    }

    navigator.clipboard.writeText(promptText);
    setIsCopiedPrompt(true);
    setTimeout(() => setIsCopiedPrompt(false), 3000);
  };

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
      <div className="p-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              {lang === 'bm' ? 'Jadual Rujukan (Matriks SLR)' : 'Reference Table (SLR Matrix)'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {lang === 'bm' 
                ? 'Ringkasan keseluruhan artikel yang telah dimuat naik. Skrol jadual ke kanan atau ke bawah untuk paparan penuh.' 
                : 'Overview of all uploaded articles. Scroll table right or down for full view.'}
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
            
            {/* Export Prompt */}
            <div className="flex items-center gap-2">
              <select 
                value={promptType} 
                onChange={(e) => setPromptType(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="bab1">Bab 1 (Penyataan Masalah)</option>
                <option value="bab2">Bab 2 (Sorotan Literatur)</option>
                <option value="bab3">Bab 3 (Metodologi)</option>
                <option value="bab5">Bab 5 (Perbincangan)</option>
              </select>
              <button
                onClick={handleCopyPrompt}
                disabled={filteredArticles.length === 0}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm border",
                  filteredArticles.length === 0 
                    ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" 
                    : isCopiedPrompt
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                )}
              >
                {isCopiedPrompt ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Sparkles className="w-4 h-4" />}
                {isCopiedPrompt ? (lang === 'bm' ? 'Prompt Disalin!' : 'Prompt Copied!') : (lang === 'bm' ? 'Jana Prompt AI' : 'Generate AI Prompt')}
              </button>
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

      <div className="flex-1 overflow-hidden p-6 flex flex-col">
        <div className="w-full h-full flex flex-col">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm max-w-7xl mx-auto w-full">
              <Table className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {lang === 'bm' ? 'Tiada rekod rujukan dijumpai. Sila muat naik fail di tab Pengurusan Rujukan.' : 'No references found. Please upload files in the Reference Management tab.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 z-30 shadow-sm">
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4 w-12 text-center sticky left-0 z-40 bg-gray-100 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">#</th>
                      <th className="p-4 min-w-[150px] sticky left-[48px] z-40 bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Kawalan (Control)</th>
                      <th className="p-4 min-w-[150px] bg-gray-50">Author / Year</th>
                      <th className="p-4 min-w-[300px] bg-blue-50 text-blue-800">Title</th>
                      <th className="p-4 min-w-[300px] bg-emerald-50 text-emerald-800">Background</th>
                      <th className="p-4 min-w-[300px] bg-amber-50 text-amber-800">Problem Statement</th>
                      <th className="p-4 min-w-[300px] bg-orange-50 text-orange-800">Methodology</th>
                      <th className="p-4 min-w-[300px] bg-teal-50 text-teal-800">Finding</th>
                      <th className="p-4 min-w-[300px] bg-purple-50 text-purple-800">Future Research</th>
                      <th className="p-4 min-w-[300px] bg-indigo-50 text-indigo-800">Gap</th>
                      <th className="p-4 min-w-[300px] bg-sky-50 text-sky-800">Justify to Your Research</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((article, index) => {
                      const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                      <tr key={article.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 text-center text-sm font-bold text-gray-700 align-top sticky left-0 z-20 bg-gray-50/95 backdrop-blur-sm border-r border-gray-200 group-hover:bg-blue-50/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          {absoluteIndex}
                        </td>
                        <td className="p-4 align-top sticky left-[48px] z-20 bg-white/95 backdrop-blur-sm border-r border-gray-200 group-hover:bg-blue-50/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
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
                        <td className="p-4 align-top bg-white group-hover:bg-transparent">
                          <p className="text-sm font-bold text-gray-900 mb-1">{article.authors}</p>
                          <p className="text-xs text-gray-600 font-semibold">({article.year})</p>
                        </td>
                        <td className="p-4 align-top bg-white group-hover:bg-transparent">
                          <p className="text-sm text-gray-900 font-medium mb-1 leading-relaxed">{article.title}</p>
                          {article.needsReevaluation && (
                            <div className="mt-2 mb-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2 rounded flex items-start gap-1">
                               <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-600" />
                               <span className="font-semibold leading-tight">Amaran: Kajian pengguna telah diubah. Sila semak semula.</span>
                            </div>
                          )}
                          {article.isPredatory && (
                            <div className="mt-2 mb-2 bg-red-100 border border-red-200 text-red-800 text-xs p-2 rounded flex items-start gap-1">
                               <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-red-600" />
                               <span className="font-semibold leading-tight">{article.predatoryWarning || "Amaran: Jurnal Predatory"}</span>
                            </div>
                          )}
                          {article.journal && (
                            <p className="text-xs text-blue-700 bg-blue-50/50 inline-block px-2 py-1 rounded border border-blue-100 mb-1 mt-2 font-medium">
                              {article.journal}
                            </p>
                          )}
                          {article.doi && (
                            <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-2 font-medium transition-colors">
                              DOI <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.background).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.problemStatement).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.methodology).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.findings).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.futureResearch).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.researchGap).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-700 bg-white group-hover:bg-transparent">
                          <ul className="list-disc pl-4 space-y-2">
                            {renderText(article.slrRelevance).split('. ').filter(Boolean).map((sent, i) => (
                              <li key={i} className="leading-relaxed">{sent}.</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between shrink-0">
                  <p className="text-sm text-gray-600">
                    Menunjukkan <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredArticles.length)}</span> daripada <span className="font-semibold text-gray-900">{filteredArticles.length}</span> artikel
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
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
                      ))}
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
          )}
        </div>
      </div>
    </div>
  );
}

