import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book as BookIcon, 
  Search, 
  Settings as SettingsIcon, 
  Languages, 
  ChevronLeft, 
  ChevronRight,
  Bookmark,
  Share2,
  Quote,
  Sparkles,
  Monitor,
  Copy,
  Check,
  User as UserIcon,
  LogOut,
  Zap,
  Radio,
  Upload
} from 'lucide-react';
import { BibleState, Translation } from './types';
import { BOOKS, MOCK_BIBLE_DATA, MOCK_BIBLE_DATA_PT } from './constants';
import { Library } from './components/Library';
import { Settings } from './components/Settings';
import { ProjectionMode } from './components/ProjectionMode';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { IntegrationModal } from './components/IntegrationModal';
import { getDailyMeditation } from './services/geminiService';
import { cn } from './lib/utils';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);
  const [state, setState] = React.useState<BibleState>({
    currentBook: 'jhn',
    currentChapter: 1,
    translation: 'KJV',
    theme: 'light',
    fontSize: 20,
    language: 'en',
    isPro: false,
    projectionSettings: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      fontSize: 64,
      showReference: true,
      alignment: 'center',
      fontFamily: 'var(--font-headline)',
      backgroundOpacity: 0.3,
      overlayColor: '#000000',
      dualTranslation: false,
      secondaryTranslation: 'NIV',
      isCleanFeed: false
    }
  });

  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isProjectionOpen, setIsProjectionOpen] = React.useState(false);
  const [meditation, setMeditation] = React.useState<string | null>(null);
  const [isGeneratingMeditation, setIsGeneratingMeditation] = React.useState(false);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const isAdpmcp = user.email?.endsWith('@adpmcp.org');
        setState(prev => ({ ...prev, isPro: isAdpmcp }));
      } else {
        setState(prev => ({ ...prev, isPro: false }));
      }
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string, index: number) => {
    const reference = `${currentBookData?.name} ${state.currentChapter}:${index + 1}`;
    const fullText = `"${text}" - ${reference} (${state.translation})`;
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  React.useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  React.useEffect(() => {
    setState(prev => ({ ...prev, projectedVerse: 0 }));
    setMeditation(null);
  }, [state.currentBook, state.currentChapter]);

  const currentBookData = BOOKS.find(b => b.id === state.currentBook);
  const verses = state.language === 'en' 
    ? MOCK_BIBLE_DATA[state.currentBook]?.[state.currentChapter] || []
    : MOCK_BIBLE_DATA_PT[state.currentBook]?.[state.currentChapter] || [];

  const secondaryVerses = state.projectionSettings.dualTranslation && state.projectionSettings.secondaryTranslation
    ? (state.language === 'en' 
        ? MOCK_BIBLE_DATA[state.currentBook]?.[state.currentChapter] || []
        : MOCK_BIBLE_DATA_PT[state.currentBook]?.[state.currentChapter] || [])
    : [];

  const handleMeditation = async () => {
    if (verses.length === 0) return;
    setIsGeneratingMeditation(true);
    const text = await getDailyMeditation(verses[0], state.language);
    setMeditation(text);
    setIsGeneratingMeditation(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">Biblia Sagrada LIVE</h1>
            
            <div className="hidden lg:flex items-center bg-surface-container p-1 rounded-full">
              {(['KJV', 'NIV', 'ALMEIDA', 'NVI'] as Translation[]).map(t => (
                <button
                  key={t}
                  onClick={() => setState(prev => ({ ...prev, translation: t }))}
                  className={cn(
                    "px-4 py-1 text-[10px] font-label font-bold rounded-full transition-all",
                    state.translation === t 
                      ? "bg-surface-container-lowest text-primary shadow-sm" 
                      : "text-outline hover:text-primary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsIntegrationOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-container text-primary rounded-full font-label text-[10px] font-bold tracking-widest hover:bg-primary hover:text-on-primary transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>{state.language === 'en' ? 'INTEGRATION' : 'INTEGRAÇÃO'}</span>
            </button>
            <button 
              onClick={() => setIsProjectionOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-container text-primary rounded-full font-label text-[10px] font-bold tracking-widest hover:bg-primary hover:text-on-primary transition-all"
            >
              <Monitor className="w-4 h-4" />
              <span>{state.language === 'en' ? 'PROJECTION' : 'PROJEÇÃO'}</span>
            </button>
            <button 
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full font-label text-xs font-bold tracking-widest hover:scale-105 transition-all shadow-lg"
            >
              <BookIcon className="w-4 h-4" />
              <span className="hidden sm:inline">
                {state.language === 'en' ? 'LIBRARY' : 'BIBLIOTECA'}
              </span>
            </button>
            
            <div className="h-6 w-px bg-outline-variant/20 mx-2" />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {state.isPro && <Zap className="w-3 h-3 text-secondary fill-secondary" />}
                    <p className="text-[10px] font-label font-bold text-primary uppercase tracking-widest leading-none">
                      {user.displayName || 'User'}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-[9px] font-label font-bold text-outline hover:text-error transition-colors uppercase tracking-widest"
                  >
                    {state.language === 'en' ? 'Sign Out' : 'Sair'}
                  </button>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline font-bold">
                  {user.displayName?.[0] || <UserIcon className="w-5 h-5" />}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2 text-outline hover:text-primary transition-colors"
              >
                <UserIcon className="w-6 h-6" />
              </button>
            )}

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-outline hover:text-primary transition-colors"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.currentBook}-${state.currentChapter}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Chapter Header */}
            <header className="relative mb-20">
              <div className="absolute -left-12 -top-12 text-[12rem] font-headline font-bold text-primary/5 select-none pointer-events-none">
                {state.currentChapter.toString().padStart(2, '0')}
              </div>
              <div className="relative space-y-4">
                <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">
                  {state.language === 'en' ? 'Scripture Reading' : 'Leitura das Escrituras'}
                </span>
                <h2 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
                  {state.language === 'en' ? currentBookData?.name : currentBookData?.namePt} {state.currentChapter}
                </h2>
                <div className="h-1 w-24 bg-secondary rounded-full" />
              </div>
            </header>

            {/* Daily Meditation Trigger */}
            <section className="bg-surface-container-low rounded-3xl p-8 relative overflow-hidden group border border-outline-variant/10">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  <h3 className="font-label uppercase tracking-widest text-xs font-bold text-outline">
                    {state.language === 'en' ? 'Daily Meditation' : 'Meditação Diária'}
                  </h3>
                </div>
                {meditation ? (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-headline italic text-inverse-surface leading-relaxed"
                  >
                    "{meditation}"
                  </motion.p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <p className="text-outline font-body italic">
                      {state.language === 'en' 
                        ? "Generate a spiritual reflection based on this chapter using AI." 
                        : "Gere uma reflexão espiritual baseada neste capítulo usando IA."}
                    </p>
                    <button 
                      onClick={handleMeditation}
                      disabled={isGeneratingMeditation}
                      className="whitespace-nowrap px-6 py-3 bg-primary-container text-on-primary-container rounded-xl font-label text-xs font-bold tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isGeneratingMeditation 
                        ? (state.language === 'en' ? 'REFLECTING...' : 'REFLETINDO...') 
                        : (state.language === 'en' ? 'GENERATE REFLECTION' : 'GERAR REFLEXÃO')}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Scripture Text */}
            <div 
              className="scripture-body space-y-8 font-headline leading-[1.8] text-inverse-surface selection:bg-secondary-container/30"
              style={{ fontSize: `${state.fontSize}px` }}
            >
              {verses.length > 0 ? (
                verses.map((text, i) => (
                  <p key={i} className={cn("relative group", i === 0 && "scripture-drop-cap")}>
                    <sup className="text-[10px] font-label font-bold text-outline mr-3 select-none">
                      {i + 1}
                    </sup>
                    {text}
                    <span className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          setState(prev => ({ ...prev, projectedVerse: i }));
                          setIsProjectionOpen(true);
                        }}
                        className="p-2 hover:bg-surface-container rounded-full text-outline hover:text-primary transition-colors"
                        title={state.language === 'en' ? "Project this verse" : "Projetar este versículo"}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(text, i)}
                        className="p-2 hover:bg-surface-container rounded-full text-outline hover:text-primary transition-colors"
                        title={state.language === 'en' ? "Copy verse" : "Copiar versículo"}
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button className="p-2 hover:bg-surface-container rounded-full text-outline hover:text-primary transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-surface-container rounded-full text-outline hover:text-primary transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </span>
                  </p>
                ))
              ) : (
                <div className="py-20 text-center space-y-6">
                  <Quote className="w-12 h-12 text-outline/20 mx-auto" />
                  <p className="text-outline font-body italic">
                    {state.language === 'en' 
                      ? "This chapter is currently being archived. Please select John 1 for a preview." 
                      : "Este capítulo está sendo arquivado. Por favor, selecione João 1 para uma prévia."}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <footer className="pt-20 border-t border-outline-variant/10 flex items-center justify-between">
              <button className="flex items-center gap-3 text-outline hover:text-primary transition-colors group">
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <span className="block text-[10px] font-label uppercase tracking-widest font-bold">Previous</span>
                  <span className="font-headline font-bold">Chapter {state.currentChapter - 1}</span>
                </div>
              </button>
              <button className="flex items-center gap-3 text-outline hover:text-primary transition-colors group text-right">
                <div className="text-right">
                  <span className="block text-[10px] font-label uppercase tracking-widest font-bold">Next</span>
                  <span className="font-headline font-bold">Chapter {state.currentChapter + 1}</span>
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </footer>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {isLibraryOpen && (
          <Library 
            isOpen={isLibraryOpen} 
            onClose={() => setIsLibraryOpen(false)} 
            language={state.language}
            onSelect={(bookId, ch) => setState(prev => ({ ...prev, currentBook: bookId, currentChapter: ch }))}
          />
        )}
        {isSettingsOpen && (
          <Settings 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            state={state}
            onUpdate={(updates) => setState(prev => ({ ...prev, ...updates }))}
          />
        )}
        {isProjectionOpen && (
          <ProjectionMode 
            state={state}
            verses={verses}
            secondaryVerses={secondaryVerses}
            onClose={() => setIsProjectionOpen(false)}
            onUpdateSettings={(settings) => setState(prev => ({ 
              ...prev, 
              projectionSettings: { ...prev.projectionSettings, ...settings } 
            }))}
            onSelectVerse={(index) => setState(prev => ({ ...prev, projectedVerse: index }))}
            onNavigate={(bookId, chapter) => setState(prev => ({ ...prev, currentBook: bookId, currentChapter: chapter }))}
            onUpgrade={() => setIsPricingOpen(true)}
          />
        )}
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            language={state.language} 
          />
        )}
        <PricingModal 
          isOpen={isPricingOpen} 
          onClose={() => setIsPricingOpen(false)} 
          language={state.language} 
        />
        <IntegrationModal 
          isOpen={isIntegrationOpen} 
          onClose={() => setIsIntegrationOpen(false)} 
          language={state.language} 
          isPro={state.isPro || false}
          onUpgrade={() => {
            setIsIntegrationOpen(false);
            setIsPricingOpen(true);
          }}
        />
      </AnimatePresence>

      {/* Floating Action Menu (Mobile) */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-surface-container-highest/80 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/10">
          <button onClick={() => setIsLibraryOpen(true)} className="text-primary">
            <BookIcon className="w-6 h-6" />
          </button>
          <button className="text-outline">
            <Search className="w-6 h-6" />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="text-outline">
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
