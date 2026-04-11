import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Lock, Camera, Save, Key, LogOut } from 'lucide-react';
import { auth, db } from '../firebase';
import { updateProfile, updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'pt';
}

export function UserProfile({ isOpen, onClose, language }: UserProfileProps) {
  const user = auth.currentUser;
  const [name, setName] = React.useState(user?.displayName || '');
  const [photoUrl, setPhotoUrl] = React.useState(user?.photoURL || '');
  const [newPassword, setNewPassword] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update Auth Display Name
      await updateProfile(user, {
        displayName: name
      });
      
      // Update everything in Firestore (Firestore has much higher limits than Auth photoURL)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        photoURL: photoUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess(language === 'en' ? 'Profile updated successfully!' : 'Perfil atualizado com sucesso!');
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/network-request-failed') {
        message = language === 'en'
          ? 'Network error. Please check your internet connection or if your browser is blocking Firebase.'
          : 'Erro de rede. Verifique sua conexão ou se o navegador está bloqueando o Firebase.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(language === 'en' ? 'Password changed successfully!' : 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/network-request-failed') {
        message = language === 'en'
          ? 'Network error. Please check your internet connection or if your browser is blocking Firebase.'
          : 'Erro de rede. Verifique sua conexão ou se o navegador está bloqueando o Firebase.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-surface-container-highest rounded-3xl shadow-2xl overflow-hidden border border-white/10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-headline font-bold mb-8">
            {language === 'en' ? 'User Profile' : 'Perfil do Usuário'}
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Profile Info */}
            <div className="space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-surface-container flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-outline" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div className="text-center">
                  <p className="font-headline font-bold text-lg">{user.displayName || (language === 'en' ? 'User' : 'Usuário')}</p>
                  <p className="text-sm text-outline">{user.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">
                    {language === 'en' ? 'Name' : 'Nome'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container p-4 pl-12 rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-label text-xs font-bold tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {language === 'en' ? 'SAVE CHANGES' : 'SALVAR ALTERAÇÕES'}
                </button>
              </form>
            </div>

            {/* Security */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <Key className="w-5 h-5" />
                <h3 className="font-headline font-bold">
                  {language === 'en' ? 'Security' : 'Segurança'}
                </h3>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">
                    {language === 'en' ? 'Current Password' : 'Senha Atual'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-surface-container p-4 pl-12 rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest font-bold text-outline">
                    {language === 'en' ? 'New Password' : 'Nova Senha'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-surface-container p-4 pl-12 rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 border border-outline-variant/30 rounded-2xl font-label text-xs font-bold tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  {language === 'en' ? 'CHANGE PASSWORD' : 'TROCAR SENHA'}
                </button>
              </form>

              {error && <p className="text-error text-xs p-3 bg-error/10 rounded-xl">{error}</p>}
              {success && <p className="text-green-500 text-xs p-3 bg-green-500/10 rounded-xl">{success}</p>}

              <button 
                onClick={() => {
                  signOut(auth);
                  onClose();
                }}
                className="w-full py-4 text-error font-label text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-error/10 rounded-2xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                {language === 'en' ? 'SIGN OUT' : 'SAIR DA CONTA'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
