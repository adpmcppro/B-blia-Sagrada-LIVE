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
import { getDailyMeditation, fetchBibleChapter } from './services/geminiService';
import { cn } from './lib/utils';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);
  const [state, setState] = React.useState<BibleState>({
    currentBook: 'jhn',
    currentChapter: 1,
    translation: 'ARA',
    theme: 'light',
    fontSize: 20,
    language: 'pt',
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
      secondaryTranslation: 'ARA',
      isCleanFeed: false
    }
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'clean') {
      setIsProjectionOpen(true);
      setState(prev => ({
        ...prev,
        projectionSettings: {
          ...prev.projectionSettings,
          isCleanFeed: true
        }
      }));
    }
  }, []);

  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isProjectionOpen, setIsProjectionOpen] = React.useState(false);
  const [meditation, setMeditation] = React.useState<string | null>(null);
  const [isGeneratingMeditation, setIsGeneratingMeditation] = React.useState(false);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [verses, setVerses] = React.useState<string[]>([]);
  const [secondaryVerses, setSecondaryVerses] = React.useState<string[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = React.useState(false);

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

  // Sync projection state from Firestore
  React.useEffect(() => {
    const docRef = doc(db, 'projection', 'current');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only update if we are in Clean Feed mode or if the change came from another user
        // Actually, in Clean Feed mode we ALWAYS want to follow the Firestore state.
        const isCleanFeed = new URLSearchParams(window.location.search).get('mode') === 'clean';
        
        if (isCleanFeed || data.updatedBy !== auth.currentUser?.uid) {
          setState(prev => ({
            ...prev,
            currentBook: data.bookId,
            currentChapter: data.chapter,
            projectedVerse: data.verseIndex,
            translation: data.translation
          }));
        }
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
    });
    return () => unsubscribe();
  }, []);

  const updateProjectionInFirestore = async (updates: Partial<{ bookId: string, chapter: number, verseIndex: number, translation: string }>) => {
    if (!auth.currentUser) return;
    
    const docRef = doc(db, 'projection', 'current');
    const currentData = {
      bookId: state.currentBook,
      chapter: state.currentChapter,
      verseIndex: state.projectedVerse ?? 0,
      translation: state.translation,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    };

    try {
      await setDoc(docRef, currentData);
    } catch (error) {
      console.error("Error updating projection state:", error);
    }
  };

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
      setMeditation(null);
      
      const loadVerses = async () => {
        setIsLoadingVerses(true);
        
        // Use bibliaonline via our API
        const mainText = await fetchBibleChapter(state.currentBook, state.currentChapter, state.translation, state.language);
        setVerses(mainText || []);

        // Load secondary verses if needed
        if (state.projectionSettings.dualTranslation && state.projectionSettings.secondaryTranslation) {
          const secText = await fetchBibleChapter(state.currentBook, state.currentChapter, state.projectionSettings.secondaryTranslation, state.language);
          setSecondaryVerses(secText || []);
        }
        setIsLoadingVerses(false);
      };

      loadVerses();
    }, [state.currentBook, state.currentChapter, state.translation, state.projectionSettings.dualTranslation, state.projectionSettings.secondaryTranslation, state.language]);

  const currentBookData = BOOKS.find(b => b.id === state.currentBook);

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
            
            <div className="hidden lg:flex items-center bg-surface-container p-1 rounded-full overflow-x-auto max-w-[400px] no-scrollbar">
              {(['BKJ', 'ARA', 'ACF', 'NVI', 'NTLH'] as Translation[]).map(t => (
                <button
                  key={`trans-${t}`}
                  onClick={() => {
                    setState(prev => ({ ...prev, translation: t }));
                    updateProjectionInFirestore({ translation: t });
                  }}
                  className={cn(
                    "px-4 py-1 text-[10px] font-label font-bold rounded-full transition-all whitespace-nowrap",
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
                      {user.displayName || 'Usuário'}
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
              {isLoadingVerses ? (
                <div className="py-20 text-center space-y-6">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-outline font-body italic">
                    {state.language === 'en' ? "Fetching scripture from the archives..." : "Buscando as escrituras nos arquivos..."}
                  </p>
                </div>
              ) : verses.length > 0 ? (
                verses.map((text, i) => (
                  <p key={`v-${state.currentBook}-${state.currentChapter}-${i}`} className={cn("relative group", i === 0 && "scripture-drop-cap")}>
                    <sup className="text-[10px] font-label font-bold text-outline mr-3 select-none">
                      {i + 1}
                    </sup>
                    {text}
                    <span className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          setState(prev => ({ ...prev, projectedVerse: i }));
                          updateProjectionInFirestore({ verseIndex: i });
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
                      ? "Unable to load scripture. Please check your connection or try another chapter." 
                      : "Não foi possível carregar as escrituras. Verifique sua conexão ou tente outro capítulo."}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <footer className="pt-20 border-t border-outline-variant/10 flex items-center justify-between">
              <button 
                onClick={() => {
                  let newChapter = state.currentChapter;
                  let newBook = state.currentBook;
                  if (state.currentChapter > 1) {
                    newChapter = state.currentChapter - 1;
                  } else {
                    const bookIndex = BOOKS.findIndex(b => b.id === state.currentBook);
                    if (bookIndex > 0) {
                      const prevBook = BOOKS[bookIndex - 1];
                      newBook = prevBook.id;
                      newChapter = prevBook.chapters;
                    }
                  }
                  setState(prev => ({ ...prev, currentBook: newBook, currentChapter: newChapter, projectedVerse: 0 }));
                  updateProjectionInFirestore({ bookId: newBook, chapter: newChapter, verseIndex: 0 });
                }}
                className="flex items-center gap-3 text-outline hover:text-primary transition-colors group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <span className="block text-[10px] font-label uppercase tracking-widest font-bold">
                    {state.language === 'en' ? 'Previous' : 'Anterior'}
                  </span>
                  <span className="font-headline font-bold">
                    {state.language === 'en' ? 'Chapter' : 'Capítulo'} {state.currentChapter - 1 <= 0 ? '' : state.currentChapter - 1}
                  </span>
                </div>
              </button>
              <button 
                onClick={() => {
                  const bookData = BOOKS.find(b => b.id === state.currentBook);
                  let newChapter = state.currentChapter;
                  let newBook = state.currentBook;
                  if (state.currentChapter < (bookData?.chapters || 0)) {
                    newChapter = state.currentChapter + 1;
                  } else {
                    const bookIndex = BOOKS.findIndex(b => b.id === state.currentBook);
                    if (bookIndex < BOOKS.length - 1) {
                      const nextBook = BOOKS[bookIndex + 1];
                      newBook = nextBook.id;
                      newChapter = 1;
                    }
                  }
                  setState(prev => ({ ...prev, currentBook: newBook, currentChapter: newChapter, projectedVerse: 0 }));
                  updateProjectionInFirestore({ bookId: newBook, chapter: newChapter, verseIndex: 0 });
                }}
                className="flex items-center gap-3 text-outline hover:text-primary transition-colors group text-right"
              >
                <div className="text-right">
                  <span className="block text-[10px] font-label uppercase tracking-widest font-bold">
                    {state.language === 'en' ? 'Next' : 'Próximo'}
                  </span>
                  <span className="font-headline font-bold">
                    {state.language === 'en' ? 'Chapter' : 'Capítulo'} {state.currentChapter + 1}
                  </span>
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
            onSelect={(bookId, ch) => {
              setState(prev => ({ ...prev, currentBook: bookId, currentChapter: ch, projectedVerse: 0 }));
              updateProjectionInFirestore({ bookId, chapter: ch, verseIndex: 0 });
            }}
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
            onSelectVerse={(index) => {
              setState(prev => ({ ...prev, projectedVerse: index }));
              updateProjectionInFirestore({ verseIndex: index });
            }}
            onNavigate={(bookId, chapter) => {
              setState(prev => ({ ...prev, currentBook: bookId, currentChapter: chapter, projectedVerse: 0 }));
              updateProjectionInFirestore({ bookId, chapter, verseIndex: 0 });
            }}
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
        {isPricingOpen && (
          <PricingModal 
            isOpen={isPricingOpen} 
            onClose={() => setIsPricingOpen(false)} 
            language={state.language} 
          />
        )}
        {isIntegrationOpen && (
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
        )}
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
