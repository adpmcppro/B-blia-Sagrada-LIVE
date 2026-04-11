import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from "dotenv";
import { XMLParser } from 'fast-xml-parser';
import { BOOKS } from './src/constants.js';

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
    'ACF': 'ACF', 'ARA': 'ARA', 'ARC': 'ARC', 'KJA': 'KJA', 
    'NAA': 'NAA', 'NTLH': 'NTLH', 'NVI': 'NVI', 'NVT': 'NVT'
  },
  en: {
    'BKJ': 'BKJ', 'NIV': 'NIV', 'NKJ': 'NKJ', 'NLT': 'NLT', 'AMPLIFIED': 'AMPLIFIED'
  }
};

const BIBLE_SOURCES: Record<string, string> = {
  // Portuguese (JSON)
  'ACF': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/ACF.json',
  'ARA': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/ARA.json',
  'ARC': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/ARC.json',
  'KJA': 'https://raw.githubusercontent.com/damarals/biblias/master/inst/json/KJA.json',
  // Portuguese (XML)
  'NAA': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNAABible.xml',
  'NTLH': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNTLHBible.xml',
  'NVI': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNVI2023Bible.xml',
  'NVT': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/PortugueseNVTBible.xml',
  // English (XML)
  'BKJ': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishKJBible.xml',
  'NIV': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishNIVBible.xml',
  'NKJ': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishNKJBible.xml',
  'NLT': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishNLTBible.xml',
  'AMPLIFIED': 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishAmplifiedBible.xml'
};

const FULL_BOOK_NAMES: Record<string, { pt: string, en: string }> = {
  'gen': { pt: 'Gênesis', en: 'Genesis' },
  'exo': { pt: 'Êxodo', en: 'Exodus' },
  'lev': { pt: 'Levítico', en: 'Leviticus' },
  'num': { pt: 'Números', en: 'Numbers' },
  'deu': { pt: 'Deuteronômio', en: 'Deuteronomy' },
  'jos': { pt: 'Josué', en: 'Joshua' },
  'jdg': { pt: 'Juízes', en: 'Judges' },
  'rut': { pt: 'Rute', en: 'Ruth' },
  '1sa': { pt: '1 Samuel', en: '1 Samuel' },
  '2sa': { pt: '2 Samuel', en: '2 Samuel' },
  '1ki': { pt: '1 Reis', en: '1 Kings' },
  '2ki': { pt: '2 Reis', en: '2 Kings' },
  '1ch': { pt: '1 Crônicas', en: '1 Chronicles' },
  '2ch': { pt: '2 Crônicas', en: '2 Chronicles' },
  'ezr': { pt: 'Esdras', en: 'Ezra' },
  'neh': { pt: 'Neemias', en: 'Nehemiah' },
  'est': { pt: 'Ester', en: 'Esther' },
  'job': { pt: 'Jó', en: 'Job' },
  'psa': { pt: 'Salmos', en: 'Psalms' },
  'pro': { pt: 'Provérbios', en: 'Proverbs' },
  'ecc': { pt: 'Eclesiastes', en: 'Ecclesiastes' },
  'sng': { pt: 'Cantares', en: 'Song of Solomon' },
  'isa': { pt: 'Isaías', en: 'Isaiah' },
  'jer': { pt: 'Jeremias', en: 'Jeremiah' },
  'lam': { pt: 'Lamentações', en: 'Lamentations' },
  'eze': { pt: 'Ezequiel', en: 'Ezekiel' },
  'dan': { pt: 'Daniel', en: 'Daniel' },
  'hos': { pt: 'Oséias', en: 'Hosea' },
  'joe': { pt: 'Joel', en: 'Joel' },
  'amo': { pt: 'Amós', en: 'Amos' },
  'oba': { pt: 'Obadias', en: 'Obadiah' },
  'jon': { pt: 'Jonas', en: 'Jonah' },
  'mic': { pt: 'Miquéias', en: 'Micah' },
  'nah': { pt: 'Naum', en: 'Nahum' },
  'hab': { pt: 'Habacuque', en: 'Habakkuk' },
  'zep': { pt: 'Sofonias', en: 'Zephaniah' },
  'hag': { pt: 'Ageu', en: 'Haggai' },
  'zec': { pt: 'Zacarias', en: 'Zechariah' },
  'mal': { pt: 'Malaquias', en: 'Malachi' },
  'mat': { pt: 'Mateus', en: 'Matthew' },
  'mrk': { pt: 'Marcos', en: 'Mark' },
  'luk': { pt: 'Lucas', en: 'Luke' },
  'jhn': { pt: 'João', en: 'John' },
  'act': { pt: 'Atos', en: 'Acts' },
  'rom': { pt: 'Romanos', en: 'Romans' },
  '1co': { pt: '1 Coríntios', en: '1 Corinthians' },
  '2co': { pt: '2 Coríntios', en: '2 Corinthians' },
  'gal': { pt: 'Gálatas', en: 'Galatians' },
  'eph': { pt: 'Efésios', en: 'Ephesians' },
  'php': { pt: 'Filipenses', en: 'Philippians' },
  'col': { pt: 'Colossenses', en: 'Colossians' },
  '1th': { pt: '1 Tessalonicenses', en: '1 Thessalonians' },
  '2th': { pt: '2 Tessalonicenses', en: '2 Thessalonians' },
  '1ti': { pt: '1 Timóteo', en: '1 Timothy' },
  '2ti': { pt: '2 Timóteo', en: '2 Timothy' },
  'tit': { pt: 'Tito', en: 'Titus' },
  'phm': { pt: 'Filemom', en: 'Philemon' },
  'heb': { pt: 'Hebreus', en: 'Hebrews' },
  'jas': { pt: 'Tiago', en: 'James' },
  '1pe': { pt: '1 Pedro', en: '1 Peter' },
  '2pe': { pt: '2 Pedro', en: '2 Peter' },
  '1jn': { pt: '1 João', en: '1 John' },
  '2jn': { pt: '2 João', en: '2 John' },
  '3jn': { pt: '3 João', en: '3 John' },
  'jud': { pt: 'Judas', en: 'Jude' },
  'rev': { pt: 'Apocalipse', en: 'Revelation' }
};

const cache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const bibleFileCache = new Map<string, any>();

async function getBibleData(version: string) {
  const url = BIBLE_SOURCES[version.toUpperCase()];
  if (!url) throw new Error(`Source not found for version: ${version}`);

  if (bibleFileCache.has(version)) {
    return bibleFileCache.get(version);
  }

  console.log(`Fetching full Bible data for ${version}: ${url}`);
  const response = await axios.get(url, { responseType: 'text' });
  let data;

  if (url.includes('json')) {
    data = JSON.parse(response.data);
  } else {
    const parser = new XMLParser({ 
      ignoreAttributes: false, 
      attributeNamePrefix: "",
      isArray: (name) => ['book', 'chapter', 'verse', 'BOOK', 'CHAPTER', 'VERSE'].includes(name)
    });
    data = parser.parse(response.data);
  }

  bibleFileCache.set(version, data);
  return data;
}

async function fetchFromNewSources(version: string, book: string, chapter: string, language: string = 'pt') {
  const v = version.toUpperCase();
  const data = await getBibleData(v);
  const bookIndex = BOOKS.findIndex(b => b.id === book.toLowerCase());
  if (bookIndex === -1) throw new Error(`Book not found: ${book}`);
  
  const bookInfo = FULL_BOOK_NAMES[book.toLowerCase()];
  const targetBookName = language === 'en' ? bookInfo?.en : bookInfo?.pt;
  const chapterNum = parseInt(chapter);

  if (BIBLE_SOURCES[v].includes('json')) {
    // JSON format (damarals) - Array of 66 books
    const bookData = data[bookIndex];
    if (!bookData) throw new Error(`Book index ${bookIndex} not found in JSON`);
    const chapterData = bookData.chapters[chapterNum - 1];
    if (!chapterData) throw new Error(`Chapter ${chapterNum} not found`);
    return chapterData;
  } else {
    // XML format (Beblia)
    const bibleRoot = data.bible || data.BIBLE || data;
    const testaments = bibleRoot.testament || bibleRoot.TESTAMENT || [bibleRoot];
    const testamentArray = Array.isArray(testaments) ? testaments : [testaments];
    
    const bookNumber = bookIndex + 1;
    let bookData = null;
    for (const testament of testamentArray) {
      const books = testament.book || testament.BOOK || testament.BIBLEBOOK;
      if (!books) continue;
      bookData = books.find((b: any) => 
        (b.number || b.BNUMBER || "").toString() === bookNumber.toString() ||
        (b.name || b.bname || b.BNAME || "").toLowerCase() === targetBookName?.toLowerCase() ||
        (b.name || b.bname || b.BNAME || "").toLowerCase() === book.toLowerCase()
      );
      if (bookData) break;
    }

    if (!bookData) throw new Error(`Book ${book} (number ${bookNumber}) not found in XML`);
    const chapters = bookData.chapter || bookData.CHAPTER;
    const chapterData = chapters.find((c: any) => (c.number || c.cnumber || c.CNUMBER) == chapterNum);
    if (!chapterData) throw new Error(`Chapter ${chapterNum} not found`);
    const verses = chapterData.verse || chapterData.VERSE;
    return verses.map((v: any) => v['#text'] || v.text || (typeof v === 'string' ? v : JSON.stringify(v)));
  }
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const app = express();

export async function createServer() {
  app.use(express.json());

  // API Route for health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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
      const verses = await fetchFromNewSources(version, book, chapter, language);
      cache.set(cacheKey, { data: verses, timestamp: Date.now() });
      return res.json(verses);
    } catch (error: any) {
      console.error("Bible fetch failed:", error.message);
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

      const response = await (genAI as any).models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error generating meditation:", error.message);
      res.status(500).json({ error: "Failed to generate meditation" });
    }
  });

  return app;
}

async function startServer() {
  const PORT = 3000;
  await createServer();

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

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== "production" || (!process.env.NETLIFY && !process.env.VERCEL)) {
  startServer();
}
