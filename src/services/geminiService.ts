import { GoogleGenAI } from "@google/genai";

export async function getDailyMeditation(verse: string, language: 'en' | 'pt') {
  try {
    const response = await fetch('/api/meditation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verse, language }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text || (language === 'en' ? "May this Word light your path today." : "Que esta Palavra ilumine seu caminho hoje.");
  } catch (error) {
    console.error("Error generating meditation:", error);
    return language === 'en' ? "May this Word light your path today." : "Que esta Palavra ilumine seu caminho hoje.";
  }
}

export async function fetchBibleChapter(book: string, chapter: number, translation: string, language: 'en' | 'pt') {
  try {
    const response = await fetch(`/api/bible/${translation}/${book}/${chapter}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as string[];
  } catch (error) {
    console.error("Error fetching Bible chapter from API:", error);
    return [];
  }
}
