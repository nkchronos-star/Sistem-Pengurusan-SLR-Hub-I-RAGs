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
    Kata Kunci/Fokus: "${userKeywords}"

    ARAHAN:
    Nilai sama ada artikel ini relevan dengan kajian pengguna berdasarkan MAKLUMAT KAJIAN PENGGUNA di atas.

    Sila ekstrak maklumat berikut HANYA dalam format JSON (tanpa sebarang penerangan tambahan):
    {
      "title": "Tajuk sebenar artikel/kajian",
      "authors": "Senarai nama pengarang",
      "year": 2023,
      "summary": {
        "bm": "Rumusan ringkas tentang artikel (max 50 patah perkataan dalam BM)",
        "en": "Brief summary of the article (max 50 words in EN)"
      },
      "objective": {
        "bm": "Objektif utama kajian (dalam BM)",
        "en": "Main objective of the study (in EN)"
      },
      "methodology": {
        "bm": "Metodologi, instrumen atau reka bentuk kajian yang digunakan (BM)",
        "en": "Methodology, instruments or research design used (EN)"
      },
      "findings": {
        "bm": "Dapatan utama/hasil kajian (BM)",
        "en": "Main findings/results (EN)"
      },
      "gap": {
        "bm": "Jurang kajian (research gap) atau cadangan kajian akan datang yang dinyatakan pengarang (BM)",
        "en": "Research gap or future research recommendations stated by authors (EN)"
      },
      "relevance": {
        "bm": "Kaitan dan sumbangan artikel ini dengan MAKLUMAT KAJIAN PENGGUNA di atas. Nyatakan dengan spesifik mengapa ia berguna (BM)",
        "en": "Relevance and contribution of this article to the USER'S RESEARCH INFO above. State specifically why it is useful (EN)"
      },
      "autoPriority": "HIGH / MEDIUM / LOW / REJECT",
      "rejectReason": "Jika autoPriority adalah REJECT, nyatakan sebab utama mengapa artikel ini TIADA KAITAN LANGSUNG dengan kajian pengguna. Jika tidak, biarkan kosong."
    }

    Panduan autoPriority:
    - HIGH: Sangat relevan. Merangkumi hampir keseluruhan kata kunci dan tajuk kajian pengguna (Sesuai jadi rujukan utama).
    - MEDIUM: Sederhana relevan. Berkongsi sebahagian kata kunci (contoh: hanya kaji Kecerdasan Buatan, tetapi bukan Sejarah). Sesuai untuk ulasan literatur (sorotan kajian).
    - LOW: Kurang relevan. Hanya menyebut kata kunci secara lalu atau kaedah/fokus sangat jauh menyimpang (Boleh digugurkan).
    - REJECT: Langsung tiada kaitan atau merujuk kepada bidang yang sama sekali berbeza (Wajib buang).
    `;

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