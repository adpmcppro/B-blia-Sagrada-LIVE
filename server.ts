import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for the API
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

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

const VERSION_MAPPING: Record<string, Record<string, string>> = {
  pt: {
    'KJV': 'kjv', 'NIV': 'nvi', 'ALMEIDA': 'acf', 'NVI': 'nvi', 
    'ACF': 'acf', 'ARC': 'rc', 'ARA': 'ra', 'BKJ': 'kjv', 'NTLH': 'nvi'
  },
  en: {
    'KJV': 'kjv', 'NIV': 'kjv', 'ALMEIDA': 'kjv', 'NVI': 'kjv', 
    'ACF': 'kjv', 'ARC': 'kjv', 'ARA': 'kjv', 'BKJ': 'kjv', 'NTLH': 'kjv'
  }
};

const cache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function fetchFromAbibliadigital(version: string, book: string, chapter: string, language: string = 'pt') {
  const lang = language === 'en' ? 'en' : 'pt';
  const v = VERSION_MAPPING[lang][version.toUpperCase()] || version.toLowerCase();
  const b = BOOK_MAPPING[book.toLowerCase()] || book.toLowerCase();
  
  // Only try abibliadigital for versions we know it supports to avoid 500s
  const supported = ['nvi', 'ra', 'rc', 'acf', 'kjv'];
  if (!supported.includes(v)) {
    throw new Error(`Version ${v} not supported by abibliadigital`);
  }

  const url = `https://www.abibliadigital.com.br/api/verses/${v}/${b}/${chapter}`;
  
  console.log(`Trying abibliadigital (${lang}): ${url}`);
  const response = await axios.get(url, { 
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 8000 
  });
  if (response.data && response.data.verses) {
    return response.data.verses.map((v: any) => v.text);
  }
  throw new Error("No verses in API response");
}

async function fetchFromGemini(version: string, book: string, chapter: string, language: string = 'pt') {
  console.log(`Using Gemini fallback for ${book} ${chapter} (${version})`);
  const prompt = `Provide the full text of the Bible book "${book}" chapter ${chapter} in the "${version}" version. 
  The language must be ${language === 'en' ? 'English' : 'Portuguese'}.
  Return ONLY a JSON array of strings, where each string is the text of a verse (in order). 
  Do NOT include verse numbers or any other text. 
  Example format: ["Verse 1 text", "Verse 2 text"]`;

  try {
    const response = await (genAI as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    const text = response.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback if not valid JSON
    return text.split('\n').filter((line: string) => line.trim().length > 5).map((line: string) => line.replace(/^\d+[\s.:]*/, '').trim());
  } catch (error) {
    console.error("Gemini Bible fetch failed:", error);
    throw error;
  }
}

async function fetchFromBibliaOnline(version: string, book: string, chapter: string, language: string = 'pt') {
  const boVersions: Record<string, Record<string, string>> = {
    pt: {
      'KJV': 'kjv', 'NIV': 'nvi', 'ALMEIDA': 'aa', 'NVI': 'nvi', 
      'ACF': 'acf', 'ARC': 'arc', 'ARA': 'ara', 'BKJ': 'kjv', 'NTLH': 'ntlh'
    },
    en: {
      'KJV': 'kjv', 'NIV': 'niv', 'ALMEIDA': 'kjv', 'NVI': 'niv', 
      'ACF': 'kjv', 'ARC': 'kjv', 'ARA': 'kjv', 'BKJ': 'kjv', 'NTLH': 'niv'
    }
  };
  const lang = language === 'en' ? 'en' : 'pt';
  const v = boVersions[lang][version.toUpperCase()] || version.toLowerCase();
  const b = BOOK_MAPPING[book.toLowerCase()] || book.toLowerCase();
  const url = `https://www.bibliaonline.com.br/${v}/${b}/${chapter}`;
  
  console.log(`Trying bibliaonline scraping (${lang}): ${url}`);
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 12000
  });
  
  const $ = cheerio.load(response.data);
  const verses: string[] = [];
  
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

  if (verses.length === 0) {
    $('span.v, .verse, .v, .verse-text').each((_, element) => {
      const el = $(element).clone();
      el.find('sup, .v-num, .verse-number').remove();
      let text = el.text().trim();
      text = text.replace(/^\d+\s*/, '').trim();
      if (text && text.length > 1) verses.push(text);
    });
  }

  if (verses.length > 0) return verses;
  throw new Error("No verses found in scraping");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Control API for external software
  app.post("/api/control/:userId", async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    if (!db) {
      return res.status(500).json({ error: "Firebase not initialized" });
    }

    try {
      const stateRef = doc(db, 'bible-states', userId);
      await updateDoc(stateRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      res.json({ status: "success", updated: updates });
    } catch (error: any) {
      console.error("Error updating projection state:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/control/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!db) {
      return res.status(500).json({ error: "Firebase not initialized" });
    }

    try {
      const stateRef = doc(db, 'bible-states', userId);
      const snap = await getDoc(stateRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "State not found" });
      }
      res.json(snap.data());
    } catch (error: any) {
      console.error("Error fetching projection state:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Bible fetching
  app.get("/api/bible/:version/:book/:chapter", async (req, res) => {
    const { version, book, chapter } = req.params;
    const language = (req.query.lang as string) || 'pt';
    const cacheKey = `${version}-${book}-${chapter}-${language}`;
    
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.json(cached.data);
    }

    try {
      // Strategy 1: abibliadigital API
      try {
        const verses = await fetchFromAbibliadigital(version, book, chapter, language);
        cache.set(cacheKey, { data: verses, timestamp: Date.now() });
        return res.json(verses);
      } catch (apiError: any) {
        console.warn(`abibliadigital failed: ${apiError.message}`);
        
        // Strategy 2: bibliaonline Scraping
        try {
          const verses = await fetchFromBibliaOnline(version, book, chapter, language);
          cache.set(cacheKey, { data: verses, timestamp: Date.now() });
          return res.json(verses);
        } catch (scrapingError: any) {
          console.warn(`bibliaonline failed: ${scrapingError.message}`);
          
          // Strategy 3: Gemini AI Fallback
          const verses = await fetchFromGemini(version, book, chapter, language);
          cache.set(cacheKey, { data: verses, timestamp: Date.now() });
          return res.json(verses);
        }
      }
    } catch (error: any) {
      console.error("All Bible fetch strategies failed:", error.message);
      res.status(500).json({ error: "Failed to fetch Bible chapter from all sources" });
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
      server: { 
        middlewareMode: true,
        hmr: false,
      },
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
