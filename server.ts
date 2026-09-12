import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for PDFs
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware untuk menangkap ralat muat naik dengan betul (elakkan hantar HTML/unexpected token <)
  const uploadMiddleware = (req: any, res: any, next: any) => {
    upload.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Ralat muat naik fail (saiz terlalu besar?): ${err.message}` });
      } else if (err) {
        return res.status(500).json({ error: `Ralat pelayan: ${err.message}` });
      }
      next();
    });
  };

  // API Route to analyze uploaded article
  app.post("/api/analyze", uploadMiddleware, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Sila muat naik fail PDF atau teks." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi pada pelayan." });
      }

      const userTitle = req.body.title || "Kajian Umum SLR";
      const userKeywords = req.body.keywords || "Tiada konteks khusus";

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Anda adalah seorang penyelidik dan penganalisis akademik bertahap tinggi. Sila baca dokumen yang dilampirkan ini secara mendalam dan berikan analisis berstruktur untuk keperluan Systematic Literature Review (SLR). 

      MAKLUMAT KAJIAN PENGGUNA (SANGAT PENTING):
      Tajuk Kajian Pengguna: "${userTitle}"
      Tumpuan (Konstruk/Kata Kunci): "${userKeywords}"
      
      ARAHAN KESELAMATAN (PREDATORY JOURNALS):
      Semak nama jurnal atau penerbit artikel ini. Jika anda mendapati artikel ini berisiko tinggi diterbitkan dalam jurnal pemangsa (predatory journals) atau penerbit yang diragui (contoh: penerbit yang selalu tersenarai dalam Beall's List tanpa proses peer-review yang sah), anda MESTI menandakan "isPredatory": true dan berikan amaran di bahagian "predatoryWarning". Jika selamat, biarkan false.

      ARAHAN PENILAIAN PRIORITY & REJECT (SANGAT PENTING):
      Anda MESTI menilai tahap kerelevanan artikel ini dengan "Tumpuan" kajian pengguna di atas.
      - Jika artikel ini TERANG-TERANGAN TIADA KAITAN langsung (contoh: kajian biologi marin berbanding sejarah), setkan "autoPriority" kepada "REJECT" dan berikan sebab pada "rejectReason".
      - Jika artikel ini sangat hampir atau tepat dengan konstruk utama kajian pengguna, setkan "autoPriority" kepada "A-TERAS".
      - Jika artikel ini hanya menyokong sebahagian metodologi, latar belakang, atau konsep umum, setkan "autoPriority" kepada "B-SOKONGAN".

      PENTING: Anda MESTI memberikan analisis dalam DUA bahasa, iaitu Bahasa Melayu (bm) dan Bahasa Inggeris (en).
      Ekstrak maklumat berikut dan pulangkan DALAM FORMAT JSON SAHAJA seperti struktur ini (JANGAN letak markdown \`\`\`json, hanya pulangkan JSON tulen):
      {
        "title": "Tajuk penuh artikel",
        "authors": "Senarai nama penulis (dipisahkan dengan koma)",
        "year": "Tahun diterbitkan (contoh: 2023)",
        "doi": "Nombor DOI artikel jika ada (jika tiada, biarkan kosong)",
        "journal": "Nama Jurnal atau Persidangan (jika ada, jika tiada biarkan kosong)",
        "isPredatory": false, // Set kepada true jika ini jurnal pemangsa/diragui
        "predatoryWarning": "Berikan amaran ringkas mengapa ia disyaki jurnal pemangsa (jika isPredatory true)",
        "autoPriority": "A-TERAS atau B-SOKONGAN atau REJECT",
        "rejectReason": "Nyatakan sebab artikel ditolak. Biarkan kosong jika tidak ditolak.",
        "summary": {
          "bm": "Ringkasan padat kajian ini (3-4 ayat)",
          "en": "Concise summary of this study (3-4 sentences)"
        },
        "background": {
          "bm": "Latar belakang kajian (Background) yang ringkas",
          "en": "Brief background of the study"
        },
        "problemStatement": {
          "bm": "Penyataan masalah (Problem Statement)",
          "en": "Problem statement of the study"
        },
        "methodology": {
          "bm": "Pendekatan metodologi yang digunakan beserta sampel",
          "en": "Methodological approach used along with the sample"
        },
        "findings": {
          "bm": "Dapatan utama kajian (Findings)",
          "en": "Main findings of the study"
        },
        "futureResearch": {
          "bm": "Cadangan kajian akan datang (Future Research)",
          "en": "Future research recommendations"
        },
        "researchGap": {
          "bm": "Jurang kajian (Research Gap) utama yang cuba diselesaikan",
          "en": "Main research gap that the authors attempt to address"
        },
        "slrRelevance": {
          "bm": "Bagaimana artikel ini relevan ATAU BOLEH DIGUNAKAN untuk menyokong kajian pengguna.",
          "en": "How this article is relevant OR CAN BE USED to support the user's research."
        }
      }
      Pastikan tiada teks lain selain dari objek JSON yang sah.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: req.file.buffer.toString("base64")
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      let resultText = response.text || "{}";
      // Buang markdown formatting jika AI masih letak ```json
      resultText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      const parsedResult = JSON.parse(resultText);
      
      res.json({
        id: Date.now().toString(),
        ...parsedResult
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message || "Ralat semasa menganalisis artikel." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
