import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
  'KJV': 'kjv', 'NIV': 'niv', 'ALMEIDA': 'aa', 'NVI': 'nvi',
  'ACF': 'acf', 'ARC': 'arc', 'ARA': 'ara', 'NAA': 'naa', 'NVT': 'nvt'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { version, book, chapter } = req.query;

  if (!version || !book || !chapter) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const v = TRANSLATION_MAPPING[version.toString().toUpperCase()] || version.toString().toLowerCase();
    const b = BOOK_MAPPING[book.toString().toLowerCase()] || book.toString().toLowerCase();
    const c = chapter.toString();

    const url = `https://www.bibliaonline.com.br/${v}/${b}/${c}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const verses: string[] = [];
    
    const verseSpans = $('span.v, .verse, .v');
    if (verseSpans.length > 0) {
      verseSpans.each((_, element) => {
        const el = $(element).clone();
        el.find('sup, .v-num, .verse-number').remove();
        let text = el.text().trim();
        text = text.replace(/^\d+\s*/, '').trim();
        if (text && text.length > 1) verses.push(text);
      });
    }

    if (verses.length === 0) {
      $('article p, .chapter p, .text p').each((_, element) => {
        const el = $(element).clone();
        const rawText = el.text().trim();
        const verseParts = rawText.split(/\s*(?=\d+\s+)/).filter(p => p.trim().length > 0);
        
        if (verseParts.length > 1) {
          verseParts.forEach(part => {
            let cleanPart = part.replace(/^\d+[\s\.]*/, '').trim();
            if (cleanPart.length > 1) verses.push(cleanPart);
          });
        } else {
          el.find('sup, .v-num, .verse-number').remove();
          let text = el.text().trim();
          text = text.replace(/^\d+[\s\.]*/, '').trim();
          if (text && text.length > 5) verses.push(text);
        }
      });
    }

    return res.status(200).json(verses);
  } catch (error: any) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch Bible chapter" });
  }
}
