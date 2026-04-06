import { GoogleGenAI } from "@google/genai";

// Safe way to access API Key in Vite (client-side)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '') || '';
const ai = new GoogleGenAI({ apiKey });

export async function getDailyMeditation(verse: string, language: 'en' | 'pt') {
  const prompt = language === 'en' 
    ? `Provide a short, 3-sentence spiritual meditation based on this Bible verse: "${verse}". Focus on encouragement and practical application.`
    : `Forneça uma meditação espiritual curta de 3 frases baseada neste versículo bíblico: "${verse}". Foque em encorajamento e aplicação prática.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || (language === 'en' ? "May this Word light your path today." : "Que esta Palavra ilumine seu caminho hoje.");
  } catch (error) {
    console.error("Error generating meditation:", error);
    return language === 'en' ? "May this Word light your path today." : "Que esta Palavra ilumine seu caminho hoje.";
  }
}

export async function fetchBibleChapter(book: string, chapter: number, translation: string, language: 'en' | 'pt') {
  const prompt = `Atue como uma API de Bíblia de alta precisão. 
  Retorne APENAS um array JSON de strings contendo os versículos do capítulo solicitado.
  Não inclua números de versículos, títulos ou introduções. Apenas o texto puro de cada versículo.
  
  Livro: ${book}
  Capítulo: ${chapter}
  Versão: ${translation}
  Idioma: ${language === 'pt' ? 'Português' : 'Inglês'}

  Formato de resposta esperado: ["versículo 1", "versículo 2", ...]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const verses = JSON.parse(text);
    return Array.isArray(verses) ? verses : [];
  } catch (error) {
    console.error("Error fetching Bible chapter from Gemini:", error);
    return [];
  }
}
