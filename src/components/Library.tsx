import React from 'react';
import { motion } from 'motion/react';
import { X, Search } from 'lucide-react';
import { Book } from '../types';
import { BOOKS } from '../constants';
import { cn } from '../lib/utils';

interface LibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bookId: string, chapter: number) => void;
  language: 'en' | 'pt';
}

export function Library({ isOpen, onClose, onSelect, language }: LibraryProps) {
  const [search, setSearch] = React.useState('');
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);

  const filteredBooks = BOOKS.filter(b => 
    (language === 'en' ? b.name : b.namePt).toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-surface w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-outline-variant/10"
      >
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text"
                placeholder={language === 'en' ? "Search books..." : "Pesquisar livros..."}
                className="w-full bg-surface-container-lowest border-none rounded-full py-2 pl-10 pr-4 text-sm font-label focus:ring-1 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-5 h-5 text-outline" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Books List */}
          <div className="w-1/2 border-r border-outline-variant/10 overflow-y-auto p-4 space-y-1">
            {filteredBooks.map(book => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-all font-headline text-lg",
                  selectedBook?.id === book.id 
                    ? "bg-primary text-on-primary shadow-md" 
                    : "hover:bg-surface-container-low text-inverse-surface"
                )}
              >
                {language === 'en' ? book.name : book.namePt}
              </button>
            ))}
          </div>

          {/* Chapters Grid */}
          <div className="w-1/2 overflow-y-auto p-6 bg-surface-container-lowest">
            {selectedBook ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-headline font-bold text-primary">
                  {language === 'en' ? selectedBook.name : selectedBook.namePt}
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                    <button
                      key={ch}
                      onClick={() => {
                        onSelect(selectedBook.id, ch);
                        onClose();
                      }}
                      className="aspect-square flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all font-label font-bold text-sm border border-outline-variant/5"
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-outline italic font-body">
                {language === 'en' ? "Select a book to see chapters" : "Selecione um livro para ver os capítulos"}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
