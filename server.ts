import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const verses: string[] = [];
      
      // bibliaonline.com.br structure varies by version, but usually:
      // 1. Each verse is in a <span> with class 'v' or similar
      // 2. Or verses are in <p> tags within an <article>
      
      // Try specific verse spans first (most accurate for separation)
      const verseSpans = $('span.v, .verse, .v');
      if (verseSpans.length > 0) {
        verseSpans.each((_, element) => {
          // Clone to avoid modifying the original DOM if needed
          const el = $(element).clone();
          el.find('sup, .v-num, .verse-number').remove();
          let text = el.text().trim();
          text = text.replace(/^\d+\s*/, '').trim();
          if (text && text.length > 1) {
            verses.push(text);
          }
        });
      }

      // If no spans found, try paragraphs but be careful not to group
      if (verses.length === 0) {
        $('article p, .chapter p, .text p').each((_, element) => {
          const el = $(element).clone();
          
          // Before removing numbers, check if we should split by them
          const rawText = el.text().trim();
          
          // Regex to find verse numbers followed by text
          // We look for patterns like "1 Text 2 Text" or "1. Text 2. Text"
          const verseParts = rawText.split(/\s*(?=\d+\s+)/).filter(p => p.trim().length > 0);
          
          if (verseParts.length > 1) {
            verseParts.forEach(part => {
              let cleanPart = part.replace(/^\d+[\s\.]*/, '').trim();
              if (cleanPart.length > 1) {
                verses.push(cleanPart);
              }
            });
          } else {
            el.find('sup, .v-num, .verse-number').remove();
            let text = el.text().trim();
            text = text.replace(/^\d+[\s\.]*/, '').trim();
            if (text && text.length > 5) {
              verses.push(text);
            }
          }
        });
      }

      // Final fallback: if we have one very long verse that contains numbers, split it
      if (verses.length === 1 && verses[0].length > 500) {
        const singleVerse = verses[0];
        const splitVerses = singleVerse.split(/\s*(?=\d+\s+)/).filter(p => p.trim().length > 0);
        if (splitVerses.length > 1) {
          verses.length = 0; // Clear
          splitVerses.forEach(v => {
            let cleanV = v.replace(/^\d+[\s\.]*/, '').trim();
            if (cleanV.length > 1) verses.push(cleanV);
          });
        }
      }

      if (verses.length > 0) {
        cache.set(cacheKey, { data: verses, timestamp: Date.now() });
      }

      res.json(verses);
    } catch (error: any) {
      console.error("Error fetching from bibliaonline:", error.message);
      res.status(500).json({ error: "Failed to fetch Bible chapter" });
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
