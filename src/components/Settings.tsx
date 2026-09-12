import React, { useState } from "react";
import { ResearchProfile } from "../types";
import { Settings, Save, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

interface SettingsPanelProps {
  profile: ResearchProfile;
  onSave: (newProfile: ResearchProfile) => void;
  hasArticles: boolean;
}

export function SettingsPanel({ profile, onSave, hasArticles }: SettingsPanelProps) {
  const [localProfile, setLocalProfile] = useState<ResearchProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (window.confirm("Menukar tetapan kajian akan menjejaskan kesahan artikel yang telah dimuat naik sebelum ini. Artikel lama akan ditandakan dengan amaran 'Perlu Disemak Semula'. Teruskan?")) {
      onSave(localProfile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Tetapan Kajian Semasa
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tetapkan tajuk dan kata kunci kajian. AI akan menggunakan maklumat ini untuk menapis, menolak artikel tidak relevan, dan menentukan tahap keutamaan (A-TERAS / B-SOKONGAN) secara automatik.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {hasArticles && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Amaran Perubahan Kajian</h4>
                <p className="text-sm text-amber-800 mt-1">
                  Anda sudah mempunyai artikel yang dimuat naik berdasarkan tetapan lama. Jika anda menukar tajuk atau konteks di bawah, artikel lama akan ditandakan supaya anda menyemaknya semula.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tajuk Kajian Keseluruhan</label>
              <textarea 
                rows={3}
                value={localProfile.title}
                onChange={(e) => setLocalProfile({ ...localProfile, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Contoh: Pembangunan dan Penilaian HUB I-RAGS..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Fokus & Konstruk Utama (Kata Kunci)</label>
              <textarea 
                rows={3}
                value={localProfile.keywords}
                onChange={(e) => setLocalProfile({ ...localProfile, keywords: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Contoh: Kecerdasan Buatan (AI), HUB I-RAGS, Sejarah, Murid Berprestasi Rendah..."
              />
              <p className="text-xs text-gray-500 mt-2">
                *Pisahkan dengan koma. AI akan menggunakan kunci ini untuk menilai sama ada artikel baru relevan atau harus ditolak (REJECT).
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  isSaved ? "bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                )}
              >
                <Save className="w-4 h-4" />
                {isSaved ? "Berjaya Disimpan!" : "Simpan Tetapan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
