import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'pt';
}

export function AuthModal({ isOpen, onClose, language }: AuthModalProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      onClose();
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/invalid-credential') {
        message = language === 'en' 
          ? 'Invalid email or password. If you don\'t have an account, please register.' 
          : 'Email ou senha inválidos. Se você não tem uma conta, por favor cadastre-se.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = language === 'en'
          ? 'This email is already in use.'
          : 'Este email já está em uso.';
      } else if (err.code === 'auth/weak-password') {
        message = language === 'en'
          ? 'Password should be at least 6 characters.'
          : 'A senha deve ter pelo menos 6 caracteres.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-container-lowest/80 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-surface-container-highest rounded-[2rem] shadow-2xl border border-outline-variant/10 overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold text-primary">
              {isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container p-4 pl-12 rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="João Silva"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">
                Endereço de Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container p-4 pl-12 rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="nome@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container p-4 pl-12 rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-error text-xs font-label bg-error/10 p-3 rounded-xl">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-label text-xs font-bold tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-label text-[10px] uppercase tracking-widest font-bold text-outline hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entrar"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
