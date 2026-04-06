import React from 'react';
import { BOOKS } from '../constants';

interface VoiceCommand {
  type: 'navigate';
  bookId?: string;
  chapter?: number;
  verse?: number;
}

interface UseVoiceCommandsProps {
  onCommand: (command: VoiceCommand) => void;
  language: 'en' | 'pt';
}

export function useVoiceCommands({ onCommand, language }: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'pt' ? 'pt-BR' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        processTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const processTranscript = (text: string) => {
    // Basic navigation logic: "ir para gênesis capítulo 1 versículo 5"
    // or "go to genesis chapter 1 verse 5"
    
    let bookId: string | undefined;
    let chapter: number | undefined;
    let verse: number | undefined;

    // Find book
    for (const book of BOOKS) {
      const name = language === 'pt' ? book.namePt.toLowerCase() : book.name.toLowerCase();
      if (text.includes(name)) {
        bookId = book.id;
        break;
      }
    }

    // Find chapter and verse using regex
    const chapterMatch = text.match(/(?:capítulo|chapter)\s*(\d+)/);
    if (chapterMatch) chapter = parseInt(chapterMatch[1]);

    const verseMatch = text.match(/(?:versículo|verse)\s*(\d+)/);
    if (verseMatch) verse = parseInt(verseMatch[1]);

    if (bookId || chapter || verse) {
      onCommand({ type: 'navigate', bookId, chapter, verse });
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start listening:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening };
}
