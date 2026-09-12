import { GoogleGenAI } from "@google/genai";
import { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import { promisify } from "util";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for PDFs
});

const uploadMiddleware = promisify(upload.single("file"));

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream for multer
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Run the middleware
    await uploadMiddleware(req as any, res as any);
    
    // Typecast after multer processes the request
    const multerReq = req as any;

    if (!multerReq.file) {
      return res.status(400).json({ error: "Sila muat naik fail PDF atau teks." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi pada pelayan." });
    }

    const userTitle = multerReq.body.title || "Kajian Umum SLR";
    const userKeywords = multerReq.body.keywords || "Tiada konteks khusus";

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
      "isPredatory": false,
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

    // Process file as base64 document
    const documentPart = {
      inlineData: {
        data: multerReq.file.buffer.toString("base64"),
        mimeType: multerReq.file.mimetype || "application/pdf",
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            documentPart,
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    let resultText = response.text || "{}";
    // Clean up markdown if AI includes it
    resultText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const parsedResult = JSON.parse(resultText);
    
    res.status(200).json({
      id: Date.now().toString(),
      ...parsedResult
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Ralat semasa menganalisis artikel." });
  }
}