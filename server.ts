import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOK_MAPPING: Record<string, string> = {
  'gen': 'gn', 'exo': 'ex', 'lev': 'lv', 'num': 'nm', 'deu': 'dt',
  'jos': 'js', 'jdg': 'jz', 'rut': 'rt', '1sa': '1sm', '2sa': '2sm',
  '1ki': '1rs', '2ki': '2rs', '1ch': '1cr', '2ch': '2cr', 'ezr': 'ed',
  'neh': 'ne', 'est': 'et', 'job': 'jó', 'psa': 'sl', 'pro': 'pv',
  'ecc': 'ec', 'sng': 'ct', 'isa': 'is', 'jer': 'jr', 'lam': 'lm',
  'eze': 'ez', 'dan': 'dn', 'hos': 'os', 'joe': 'jl', 'amo': 'am',
  'oba': 'ob', 'jon': 'jn', 'mic': 'mq', 'nah': 'na', 'hab': 'hc',
  'zep': 'sf', 'hag': 'ag', 'zec': 'zc', 'mal': 'ml', 'mat': 'mt',
  'mrk': 'mc', 'luk': 'lc', 'jhn': 'jo', 'act': 'at', 'rom': 'rm',
  '1co': '1co', '2co': '2co', 'gal': 'gl', 'eph': 'ef', 'php': 'fp',
  'col': 'cl', '1th': '1ts', '2th': '2ts', '1ti': '1tm', '2ti': '2tm',
  'tit': 'tt', 'phm': 'fm', 'heb': 'hb', 'jas': 'tg', '1pe': '1pe',
  '2pe': '2pe', '1jn': '1jo', '2jn': '2jo', '3jn': '3jo', 'jud': 'jd',
  'rev': 'ap'
};

const TRANSLATION_MAPPING: Record<string, string> = {
  'KJV': 'kjv',
  'NIV': 'niv',
  'ALMEIDA': 'aa',
  'NVI': 'nvi',
  'ACF': 'acf',
  'ARC': 'arc',
  'ARA': 'ara',
  'NAA': 'naa',
  'NVT': 'nvt'
};

const cache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Bible fetching
  app.get("/api/bible/:version/:book/:chapter", async (req, res) => {
    try {
      const { version, book, chapter } = req.params;
      const v = TRANSLATION_MAPPING[version.toUpperCase()] || version.toLowerCase();
      const b = BOOK_MAPPING[book.toLowerCase()] || book.toLowerCase();
      
      const cacheKey = `${v}-${b}-${chapter}`;
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.json(cached.data);
      }

      const url = `https://www.bibliaonline.com.br/${v}/${b}/${chapter}`;
      console.log(`Fetching: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const verses: string[] = [];
      
      // Try multiple selectors common in bibliaonline.com.br
      // 1. Standard article paragraphs (NVI, etc.)
      $('article p').each((_, element) => {
        const text = $(element).text().trim();
        if (/^\d+/.test(text)) {
          const parts = text.split(/(?=\d+\s)/).filter(p => p.trim().length > 0);
          parts.forEach(part => {
            const cleanPart = part.replace(/^\d+\s*/, '').trim();
            if (cleanPart.length > 0) verses.push(cleanPart);
          });
        }
      });

      // 2. Specific verse spans (ARC, ACF, etc.)
      if (verses.length === 0) {
        $('span.v, .verse, .v, .verse-text').each((_, element) => {
          const el = $(element).clone();
          el.find('sup, .v-num, .verse-number').remove();
          let text = el.text().trim();
          text = text.replace(/^\d+\s*/, '').trim();
          if (text && text.length > 1) verses.push(text);
        });
      }

      // 3. Generic paragraphs with numbers
      if (verses.length === 0) {
        $('p').each((_, element) => {
          const text = $(element).text().trim();
          if (/^\d+/.test(text)) {
            const cleanText = text.replace(/^\d+\s*/, '').trim();
            if (cleanText.length > 5) verses.push(cleanText);
          }
        });
      }

      // 4. If still empty, maybe it's a different layout (some versions use <div> with numbers)
      if (verses.length === 0) {
        $('div').each((_, element) => {
          const text = $(element).text().trim();
          if (/^\d+/.test(text) && text.length < 500) {
             const cleanText = text.replace(/^\d+\s*/, '').trim();
             if (cleanText.length > 5) verses.push(cleanText);
          }
        });
      }

      if (verses.length > 0) {
        console.log(`Successfully fetched ${verses.length} verses for ${cacheKey}`);
        cache.set(cacheKey, { data: verses, timestamp: Date.now() });
        res.json(verses);
      } else {
        console.log(`No verses found for ${url}. HTML length: ${response.data.length}`);
        res.status(404).json({ error: "No verses found" });
      }
    } catch (error: any) {
      console.error("Error fetching from bibliaonline:", error.message);
      res.status(500).json({ error: "Failed to fetch Bible chapter" });
    }
  });

  // API Route for Meditation
  app.post("/api/meditation", async (req, res) => {
    try {
      const { verse, language } = req.body;
      if (!verse) return res.status(400).json({ error: "Verse is required" });

      const prompt = language === 'en' 
        ? `Provide a short, 3-sentence spiritual meditation based on this Bible verse: "${verse}". Focus on encouragement and practical application.`
        : `Forneça uma meditação espiritual curta de 3 frases baseada neste versículo bíblico: "${verse}". Foque em encorajamento e aplicação prática.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error generating meditation:", error.message);
      res.status(500).json({ error: "Failed to generate meditation" });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
