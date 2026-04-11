import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, 
  Minimize2, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  Church,
  Image as ImageIcon,
  Book as BookIcon,
  Hash,
  Layers,
  Upload,
  Zap
} from 'lucide-react';
import { BibleState, ProjectionSettings, Translation } from '../types';
import { BOOKS, MOCK_BIBLE_DATA, MOCK_BIBLE_DATA_PT } from '../constants';
import { cn } from '../lib/utils';

interface ProjectionModeProps {
  state: BibleState;
  verses: string[];
  secondaryVerses?: string[];
  onClose: () => void;
  onUpdateSettings: (settings: Partial<ProjectionSettings>) => void;
  onSelectVerse: (index: number) => void;
  onNavigate: (bookId: string, chapter: number) => void;
  onUpgrade: () => void;
}

const FONTS = [
  { name: 'Serif (Classic)', value: 'var(--font-headline)' },
  { name: 'Sans (Modern)', value: 'var(--font-sans)' },
  { name: 'Mono (Technical)', value: 'var(--font-mono)' },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Outfit', value: "'Outfit', sans-serif" },
  { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" }
];

export function ProjectionMode({ 
  state, 
  verses, 
  secondaryVerses,
  onClose, 
  onUpdateSettings,
  onSelectVerse,
  onNavigate,
  onUpgrade
}: ProjectionModeProps) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const settings = state.projectionSettings;
  const currentVerseIndex = state.projectedVerse ?? 0;
  const currentVerseText = verses[currentVerseIndex] || "";
  const secondaryVerseText = secondaryVerses?.[currentVerseIndex] || "";
  const isPro = state.isPro;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'backgroundImageUrl') => {
    if (!isPro) {
      onUpgrade();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      onSelectVerse(Math.min(verses.length - 1, currentVerseIndex + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      onSelectVerse(Math.max(0, currentVerseIndex - 1));
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVerseIndex, verses.length]);

  // Check for clean feed mode from URL
  const isCleanFeed = new URLSearchParams(window.location.search).get('mode') === 'clean';

  const currentVerses = verses.filter((_, i) => i === state.projectedVerse);
  const currentSecondaryVerses = secondaryVerses.filter((_, i) => i === state.projectedVerse);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ 
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        fontFamily: settings.fontFamily
      }}
    >
      {/* Background Image */}
      {settings.backgroundImageUrl && (
        <div className="absolute inset-0 z-[-2]">
          <img 
            src={settings.backgroundImageUrl} 
            alt="Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Background Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-[-1]"
        style={{ 
          backgroundColor: settings.backgroundColor,
          opacity: settings.backgroundImageUrl ? settings.backgroundOpacity : 1
        }}
      />

      {/* Top Bar (Auto-hide) */}
      {!isCleanFeed && (
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="font-label text-xs font-bold tracking-widest uppercase opacity-70">
                {state.language === 'en' ? 'Projection Mode' : 'Modo de Projeção'}
              </h2>
              <div className="h-4 w-px bg-white/20 mx-2" />
              <div className="flex items-center gap-4">
                <select 
                  value={state.currentBook}
                  onChange={(e) => onNavigate(e.target.value, 1)}
                  className="bg-transparent font-label text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer hover:text-primary transition-colors"
                >
                  {BOOKS.map(b => (
                    <option key={`proj-book-${b.id}`} value={b.id} className="bg-surface-container-highest text-on-surface">
                      {state.language === 'en' ? b.name : b.namePt}
                    </option>
                  ))}
                </select>
                <select 
                  value={state.currentChapter}
                  onChange={(e) => onNavigate(state.currentBook, parseInt(e.target.value))}
                  className="bg-transparent font-label text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer hover:text-primary transition-colors"
                >
                  {Array.from({ length: BOOKS.find(b => b.id === state.currentBook)?.chapters || 1 }, (_, i) => i + 1).map(ch => (
                    <option key={`proj-ch-${ch}`} value={ch} className="bg-surface-container-highest text-on-surface">
                      {ch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={toggleFullScreen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col p-12 md:p-24 relative z-0",
        settings.alignment === 'center' ? 'items-center justify-center text-center' : 
        settings.alignment === 'right' ? 'items-end justify-center text-right' : 'items-start justify-center text-left'
      )}>
        {/* Church Identity (Top Corner) */}
        {(settings.churchName || settings.logoUrl) && (
          <div className="absolute top-12 left-12 right-12 flex items-center gap-4 opacity-40">
            {settings.logoUrl && (
              <img 
                src={settings.logoUrl} 
                alt="Church Logo" 
                className="w-12 h-12 object-contain"
                referrerPolicy="no-referrer"
              />
            )}
            {settings.churchName && (
              <span className="font-label text-sm font-bold tracking-[0.3em] uppercase">
                {settings.churchName}
              </span>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentVerseIndex}-${settings.dualTranslation}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-6xl w-full space-y-12"
          >
            <div className={cn(
              "grid gap-12 items-center",
              settings.dualTranslation ? "grid-cols-2 text-left" : "grid-cols-1"
            )}>
              <p 
                className="leading-tight font-bold"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                {currentVerseText.split(' ').map((word, idx) => {
                  const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
                  const isHighlighted = state.highlightedWords?.includes(cleanWord);
                  return (
                    <span 
                      key={idx} 
                      className={cn(
                        "transition-all duration-300",
                        isHighlighted && "bg-yellow-400/80 text-black px-2 rounded-lg shadow-lg scale-110 inline-block mx-1"
                      )}
                    >
                      {word}{' '}
                    </span>
                  );
                })}
              </p>
              
              {settings.dualTranslation && secondaryVerseText && (
                <div className="border-l border-white/10 pl-12">
                  <p 
                    className="leading-tight font-bold opacity-70 italic"
                    style={{ fontSize: `${settings.fontSize * 0.8}px` }}
                  >
                    {secondaryVerseText}
                  </p>
                </div>
              )}
            </div>
            
            {settings.showReference && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                className="font-label text-2xl uppercase tracking-[0.2em] font-bold"
              >
                {BOOKS.find(b => b.id === state.currentBook)?.[state.language === 'en' ? 'name' : 'namePt'].toUpperCase()} {state.currentChapter}:{currentVerseIndex + 1}
                {settings.dualTranslation && ` (${state.translation}/${settings.secondaryTranslation})`}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation (Auto-hide) */}
      {!isCleanFeed && (
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-12 opacity-0 hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-sm">
          <button 
            onClick={() => onSelectVerse(Math.max(0, currentVerseIndex - 1))}
            className="p-4 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <div className="flex items-center gap-4">
            <div className="font-label text-sm font-bold tracking-widest opacity-50">
              {currentVerseIndex + 1} / {verses.length}
            </div>
            <select 
              value={currentVerseIndex}
              onChange={(e) => onSelectVerse(parseInt(e.target.value))}
              className="bg-transparent font-label text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer hover:text-primary transition-colors"
            >
              {verses.map((_, i) => (
                <option key={`verse-opt-${i}`} value={i} className="bg-surface-container-highest text-on-surface">
                  {state.language === 'en' ? 'VERSE' : 'VERSÍCULO'} {i + 1}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => onSelectVerse(Math.min(verses.length - 1, currentVerseIndex + 1))}
            className="p-4 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}

      {/* Settings Sidebar */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 bottom-0 w-80 bg-surface-container-highest border-l border-white/10 p-8 z-30 overflow-y-auto text-on-surface"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-label text-xs font-bold tracking-widest uppercase">
                  {state.language === 'en' ? 'PROJECTION SETTINGS' : 'AJUSTES DE PROJEÇÃO'}
                </h3>
                <button onClick={() => setIsSettingsOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Church Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <Church className="w-4 h-4" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Church Identity' : 'Identidade da Igreja'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder={state.language === 'en' ? "Church Name" : "Nome da Igreja"}
                      value={settings.churchName || ''}
                      onChange={(e) => onUpdateSettings({ churchName: e.target.value })}
                      className="w-full bg-surface-container p-3 rounded-lg text-xs font-label focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-label text-outline uppercase tracking-widest font-bold">
                        {state.language === 'en' ? 'Logo Upload' : 'Upload de Logo'}
                      </label>
                      <div className="flex gap-2">
                        <label className="flex-1 bg-surface-container p-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-surface-container-lowest transition-colors">
                          <Upload className="w-4 h-4 text-outline" />
                          <span className="text-[10px] font-label font-bold uppercase tracking-widest">
                            {state.language === 'en' ? 'Upload Logo' : 'Enviar Logo'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'logoUrl')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-label text-outline uppercase tracking-widest font-bold">
                        {state.language === 'en' ? 'Background Upload' : 'Upload de Fundo'}
                      </label>
                      <div className="flex gap-2">
                        <label className="flex-1 bg-surface-container p-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-surface-container-lowest transition-colors">
                          <Upload className="w-4 h-4 text-outline" />
                          <span className="text-[10px] font-label font-bold uppercase tracking-widest">
                            {state.language === 'en' ? 'Upload Background' : 'Enviar Fundo'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'backgroundImageUrl')}
                            className="hidden"
                          />
                        </label>
                        {settings.backgroundImageUrl && (
                          <button 
                            onClick={() => onUpdateSettings({ backgroundImageUrl: undefined })}
                            className="p-3 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors"
                            title={state.language === 'en' ? "Remove Background" : "Remover Fundo"}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dual Translation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <Layers className="w-4 h-4" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Dual Translation' : 'Tradução Dupla'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={settings.dualTranslation}
                        onChange={(e) => {
                          if (!isPro) {
                            onUpgrade();
                            return;
                          }
                          onUpdateSettings({ dualTranslation: e.target.checked });
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-label text-[10px] uppercase tracking-widest font-bold text-outline group-hover:text-primary transition-colors">
                        {state.language === 'en' ? 'Enable Dual View' : 'Ativar Visualização Dupla'}
                      </span>
                      {!isPro && <Zap className="w-3 h-3 text-secondary fill-secondary" />}
                    </label>
                    {settings.dualTranslation && (
                      <select 
                        value={settings.secondaryTranslation}
                        onChange={(e) => onUpdateSettings({ secondaryTranslation: e.target.value as Translation })}
                        className="w-full bg-surface-container p-3 rounded-lg text-xs font-label focus:outline-none"
                      >
                        {(state.language === 'en' ? ['BKJ', 'NIV', 'NKJ', 'NLT', 'AMPLIFIED'] : ['ACF', 'ARA', 'ARC', 'KJA', 'NAA', 'NTLH', 'NVI', 'NVT']).map(t => (
                          <option key={`sec-trans-${t}`} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Font Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <Type className="w-4 h-4" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Typography' : 'Tipografia'}
                    </span>
                  </div>
                  <select 
                    value={settings.fontFamily}
                    onChange={(e) => {
                      if (!isPro) {
                        onUpgrade();
                        return;
                      }
                      onUpdateSettings({ fontFamily: e.target.value });
                    }}
                    className="w-full bg-surface-container p-3 rounded-lg text-xs font-label focus:outline-none"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label text-outline uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Font Size' : 'Tamanho da Fonte'}
                    </label>
                    <input 
                      type="range" 
                      min="32" 
                      max="120" 
                      value={settings.fontSize}
                      onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <Palette className="w-4 h-4" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Presets' : 'Estilos Predefinidos'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => onUpdateSettings({
                        backgroundColor: '#000000',
                        textColor: '#ffffff',
                        backgroundOpacity: 0.3,
                        overlayColor: '#000000',
                        fontFamily: 'var(--font-headline)'
                      })}
                      className="p-3 bg-surface-container rounded-lg text-[10px] font-label font-bold hover:bg-primary hover:text-on-primary transition-all"
                    >
                      {state.language === 'en' ? 'CLASSIC DARK' : 'ESCURO CLÁSSICO'}
                    </button>
                    <button 
                      onClick={() => onUpdateSettings({
                        backgroundColor: '#ffffff',
                        textColor: '#000000',
                        backgroundOpacity: 0.1,
                        overlayColor: '#ffffff',
                        fontFamily: 'var(--font-sans)'
                      })}
                      className="p-3 bg-surface-container rounded-lg text-[10px] font-label font-bold hover:bg-primary hover:text-on-primary transition-all"
                    >
                      {state.language === 'en' ? 'MODERN LIGHT' : 'MODERNO CLARO'}
                    </button>
                    <button 
                      onClick={() => onUpdateSettings({
                        backgroundColor: '#00ff00',
                        textColor: '#ffffff',
                        backgroundOpacity: 0,
                        overlayColor: '#000000',
                        fontFamily: 'var(--font-sans)'
                      })}
                      className="p-3 bg-surface-container rounded-lg text-[10px] font-label font-bold hover:bg-primary hover:text-on-primary transition-all"
                    >
                      CHROMA KEY
                    </button>
                    <button 
                      onClick={() => onUpdateSettings({
                        backgroundColor: 'transparent',
                        textColor: '#ffffff',
                        backgroundOpacity: 0.8,
                        overlayColor: '#000000',
                        fontFamily: 'var(--font-headline)',
                        alignment: 'center'
                      })}
                      className="p-3 bg-surface-container rounded-lg text-[10px] font-label font-bold hover:bg-primary hover:text-on-primary transition-all"
                    >
                      {state.language === 'en' ? 'OBS LOWER THIRD' : 'OBS TERÇO INFERIOR'}
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <Palette className="w-4 h-4" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Colors' : 'Cores'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-label text-outline uppercase">
                        {state.language === 'en' ? 'Background' : 'Fundo'}
                      </label>
                      <input 
                        type="color" 
                        value={settings.backgroundColor}
                        onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-label text-outline uppercase">
                        {state.language === 'en' ? 'Text' : 'Texto'}
                      </label>
                      <input 
                        type="color" 
                        value={settings.textColor}
                        onChange={(e) => onUpdateSettings({ textColor: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Alignment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <AlignLeft className="w-4 h-4" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold">
                      {state.language === 'en' ? 'Alignment' : 'Alinhamento'}
                    </span>
                  </div>
                  <div className="flex bg-surface-container p-1 rounded-lg">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => onUpdateSettings({ alignment: align })}
                        className={cn(
                          "flex-1 py-2 flex items-center justify-center rounded-md transition-all",
                          settings.alignment === align ? "bg-surface-container-lowest text-primary shadow-sm" : "text-outline"
                        )}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Opacity */}
                <div className="space-y-4">
                  <label className="text-[10px] font-label text-outline uppercase tracking-widest font-bold">
                    {state.language === 'en' ? 'Overlay Opacity' : 'Opacidade da Camada'}
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={settings.backgroundOpacity}
                    onChange={(e) => onUpdateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                <button 
                  onClick={() => onUpdateSettings({
                    backgroundColor: '#000000',
                    textColor: '#ffffff',
                    fontSize: 64,
                    alignment: 'center',
                    fontFamily: 'var(--font-headline)',
                    showReference: true,
                    backgroundOpacity: 0.3,
                    overlayColor: '#000000',
                    dualTranslation: false
                  })}
                  className="w-full py-3 border border-outline-variant/30 rounded-xl font-label text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-colors"
                >
                  {state.language === 'en' ? 'Reset Defaults' : 'Redefinir Padrão'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
