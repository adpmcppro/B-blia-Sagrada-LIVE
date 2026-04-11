import React from 'react';
import { motion } from 'motion/react';
import { Moon, Sun, Type, Languages, X } from 'lucide-react';
import { BibleState } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  state: BibleState;
  onUpdate: (updates: Partial<BibleState>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ state, onUpdate, isOpen, onClose }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 bg-surface shadow-2xl border-l border-outline-variant/10 p-8 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-headline font-bold text-primary">
          {state.language === 'en' ? 'Settings' : 'Configurações'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <X className="w-6 h-6 text-outline" />
        </button>
      </div>

      <div className="space-y-12">
        {/* Language */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Languages className="w-5 h-5 text-primary" />
            <h3 className="font-label uppercase tracking-widest text-xs font-bold text-outline">
              {state.language === 'en' ? 'App Language' : 'Idioma do Aplicativo'}
            </h3>
          </div>
          <div className="bg-surface-container-low p-1 rounded-xl flex">
            <button 
              onClick={() => onUpdate({ language: 'en' })}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-label transition-all",
                state.language === 'en' ? "bg-surface-container-lowest shadow-sm text-primary font-bold" : "text-outline hover:text-primary"
              )}
            >
              English
            </button>
            <button 
              onClick={() => onUpdate({ language: 'pt' })}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-label transition-all",
                state.language === 'pt' ? "bg-surface-container-lowest shadow-sm text-primary font-bold" : "text-outline hover:text-primary"
              )}
            >
              Português
            </button>
          </div>
        </section>

        {/* Theme */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sun className="w-5 h-5 text-primary" />
            <h3 className="font-label uppercase tracking-widest text-xs font-bold text-outline">
              {state.language === 'en' ? 'Display Theme' : 'Tema de Exibição'}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onUpdate({ theme: 'light' })}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                state.theme === 'light' ? "border-primary bg-surface-container-lowest" : "border-transparent bg-surface-container-low hover:bg-surface-container-high"
              )}
            >
              <Sun className="w-6 h-6 text-primary" />
              <span className="text-[10px] font-label uppercase tracking-wider font-bold">
                {state.language === 'en' ? 'Light' : 'Claro'}
              </span>
            </button>
            <button 
              onClick={() => onUpdate({ theme: 'dark' })}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                state.theme === 'dark' ? "border-primary bg-surface-container-lowest" : "border-transparent bg-surface-container-low hover:bg-surface-container-high"
              )}
            >
              <Moon className="w-6 h-6 text-primary" />
              <span className="text-[10px] font-label uppercase tracking-wider font-bold">
                {state.language === 'en' ? 'Dark' : 'Escuro'}
              </span>
            </button>
          </div>
        </section>

        {/* Font Size */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Type className="w-5 h-5 text-primary" />
            <h3 className="font-label uppercase tracking-widest text-xs font-bold text-outline">
              {state.language === 'en' ? 'Reading Font Size' : 'Tamanho da Fonte de Leitura'}
            </h3>
          </div>
          <div className="space-y-4">
            <input 
              type="range" 
              min="14" 
              max="32" 
              value={state.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-outline">
              <span>{state.language === 'en' ? 'Small' : 'Pequeno'}</span>
              <span className="text-primary font-bold">{state.fontSize}px</span>
              <span>{state.language === 'en' ? 'Large' : 'Grande'}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-20 pt-8 border-t border-outline-variant/10 text-center">
        <p className="text-[10px] font-label uppercase tracking-[0.2em] text-outline">The Sacred Folio • Vellum Edition</p>
      </div>
    </motion.div>
  );
}
