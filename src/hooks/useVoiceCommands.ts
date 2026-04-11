import React from 'react';
import { BOOKS, VOICE_COMMAND_MAPPING } from '../constants';

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
        // Auto-restart if we're supposed to be listening
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };
    }
  }, [language, isListening]);

  const processTranscript = (text: string) => {
    let bookId: string | undefined;
    let chapter: number | undefined;
    let verse: number | undefined;

    // Find book using mapping
    for (const [key, id] of Object.entries(VOICE_COMMAND_MAPPING)) {
      if (text.includes(key)) {
        bookId = id;
        break;
      }
    }

    // Fallback to BOOKS names
    if (!bookId) {
      for (const book of BOOKS) {
        const name = language === 'pt' ? book.namePt.toLowerCase() : book.name.toLowerCase();
        if (text.includes(name)) {
          bookId = book.id;
          break;
        }
      }
    }

    // Find numbers
    const numbers = text.match(/\d+/g);
    if (numbers) {
      if (numbers[0]) chapter = parseInt(numbers[0]);
      if (numbers[1]) verse = parseInt(numbers[1]);
    }

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
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return { isListening, startListening, stopListening };
}
