import React from 'react';
import { motion } from 'motion/react';
import { 
  Book as BookIcon, 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  MicOff, 
  Monitor, 
  Settings as SettingsIcon,
  Zap,
  Layers
} from 'lucide-react';
import { BibleState, Book, Translation } from '../types';
import { BOOKS } from '../constants';
import { cn } from '../lib/utils';
import { useVoiceCommands } from '../hooks/useVoiceCommands';

interface RemoteControlProps {
  state: BibleState;
  onUpdate: (updates: Partial<BibleState>) => void;
  onUpdateProjection: (updates: { bookId: string; chapter: number; verseIndex?: number }) => void;
}

export function RemoteControl({ state, onUpdate, onUpdateProjection }: RemoteControlProps) {
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(
    BOOKS.find(b => b.id === state.currentBook) || null
  );

  const { isListening, startListening, stopListening } = useVoiceCommands({
    onCommand: (command) => {
      if (command.type === 'navigate') {
        const updates = {
          currentBook: command.bookId || state.currentBook,
          currentChapter: command.chapter || state.currentChapter,
          projectedVerse: command.verse !== undefined ? command.verse - 1 : state.projectedVerse
        };
        onUpdate(updates);
        onUpdateProjection({
          bookId: updates.currentBook,
          chapter: updates.currentChapter,
          verseIndex: updates.projectedVerse
        });
      }
    },
    language: state.language
  });

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    onUpdate({ currentBook: book.id, currentChapter: 1 });
    onUpdateProjection({ bookId: book.id, chapter: 1, verseIndex: 0 });
  };

  const handleChapterChange = (delta: number) => {
    if (!selectedBook) return;
    const newChapter = Math.max(1, Math.min(selectedBook.chapters, state.currentChapter + delta));
    onUpdate({ currentChapter: newChapter });
    onUpdateProjection({ bookId: state.currentBook, chapter: newChapter, verseIndex: 0 });
  };

  const translations = state.language === 'en' ? ['KJV', 'NIV', 'BBE'] : ['BKJ', 'ARA', 'ACF', 'NVI', 'NTLH'];

  return (
    <div className="h-screen bg-surface flex flex-col font-sans overflow-hidden border-l border-outline-variant/10">
      {/* Header */}
      <header className="p-4 border-b border-outline-variant/10 bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <h1 className="font-headline font-bold text-sm uppercase tracking-widest">
            {state.language === 'en' ? 'Remote Control' : 'Controle Remoto'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "p-2 rounded-full transition-all",
              isListening ? "bg-error text-on-error animate-pulse" : "bg-surface-container-high text-outline hover:text-primary"
            )}
            title={state.language === 'en' ? "Voice Control" : "Comando de Voz"}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Version Selection */}
        <section className="space-y-3">
          <label className="text-[10px] font-label font-bold uppercase tracking-widest text-outline">
            {state.language === 'en' ? 'Translation' : 'Tradução'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {translations.map(t => (
              <button
                key={t}
                onClick={() => onUpdate({ translation: t as Translation })}
                className={cn(
                  "py-2 rounded-lg text-[10px] font-bold transition-all border",
                  state.translation === t 
                    ? "bg-primary text-on-primary border-primary shadow-md" 
                    : "bg-surface-container-lowest text-outline border-outline-variant/10 hover:border-primary/30"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Dual Translation Toggle */}
        <section className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold text-inverse-surface">
                {state.language === 'en' ? 'Dual Translation' : 'Tradução Dupla'}
              </span>
            </div>
            <button 
              onClick={() => onUpdate({ 
                projectionSettings: { 
                  ...state.projectionSettings, 
                  dualTranslation: !state.projectionSettings.dualTranslation 
                } 
              })}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative",
                state.projectionSettings.dualTranslation ? "bg-secondary" : "bg-outline-variant/30"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                state.projectionSettings.dualTranslation ? "right-1" : "left-1"
              )} />
            </button>
          </div>
          {state.projectionSettings.dualTranslation && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {translations.map(t => (
                <button
                  key={`sec-${t}`}
                  onClick={() => onUpdate({ 
                    projectionSettings: { 
                      ...state.projectionSettings, 
                      secondaryTranslation: t as Translation 
                    } 
                  })}
                  className={cn(
                    "py-1.5 rounded-lg text-[9px] font-bold transition-all border",
                    state.projectionSettings.secondaryTranslation === t 
                      ? "bg-secondary text-on-secondary border-secondary" 
                      : "bg-surface-container-lowest text-outline border-outline-variant/10"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Book & Chapter Selection */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-label font-bold uppercase tracking-widest text-outline">
              {state.language === 'en' ? 'Navigation' : 'Navegação'}
            </label>
            <span className="text-xs font-bold text-primary">
              {state.language === 'en' ? selectedBook?.name : selectedBook?.namePt} {state.currentChapter}
            </span>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleChapterChange(-1)}
              className="flex-1 py-3 bg-surface-container-high rounded-xl flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleChapterChange(1)}
              className="flex-1 py-3 bg-surface-container-high rounded-xl flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {BOOKS.map(book => (
              <button
                key={`remote-book-${book.id}`}
                onClick={() => handleBookSelect(book)}
                className={cn(
                  "text-left px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  state.currentBook === book.id 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "hover:bg-surface-container-low text-outline"
                )}
              >
                {state.language === 'en' ? book.name : book.namePt}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Status */}
      <footer className="p-4 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", state.isPro ? "bg-secondary" : "bg-outline")} />
            <span className="text-[9px] font-bold uppercase tracking-tighter text-outline">
              {state.isPro ? 'Pro Active' : 'Free Mode'}
            </span>
          </div>
          <Zap className={cn("w-3 h-3", state.isPro ? "text-secondary fill-secondary" : "text-outline")} />
        </div>
      </footer>
    </div>
  );
}
