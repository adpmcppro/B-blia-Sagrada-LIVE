import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getDailyMeditation(verse: string, language: 'en' | 'pt') {
  const prompt = language === 'en' 
    ? `Provide a short, 3-sentence spiritual meditation based on this Bible verse: "${verse}". Focus on encouragement and practical application.`
    : `Forneça uma meditação espiritual curta de 3 frases baseada neste versículo bíblico: "${verse}". Foque em encorajamento e aplicação prática.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating meditation:", error);
    return language === 'en' ? "May this Word light your path today." : "Que esta Palavra ilumine seu caminho hoje.";
  }
}
