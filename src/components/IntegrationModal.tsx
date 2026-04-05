import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Radio, Monitor, Copy, Check, ExternalLink, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'pt';
  isPro: boolean;
  onUpgrade: () => void;
}

export function IntegrationModal({ isOpen, onClose, language, isPro, onUpgrade }: IntegrationModalProps) {
  const [copied, setCopied] = React.useState(false);
  const cleanFeedUrl = window.location.href + "?mode=clean";

  if (!isOpen) return null;

  const content = {
    en: {
      title: "Livestream Integration",
      subtitle: "Connect Biblia Sagrada LIVE to your broadcasting software.",
      proBadge: "PRO FEATURE",
      upgradeCta: "Upgrade to Pro to unlock integration",
      methods: [
        {
          title: "OBS Studio / Streamlabs",
          icon: Radio,
          steps: [
            "Add a new 'Browser Source' in OBS.",
            "Paste the Clean Feed URL below.",
            "Set width to 1920 and height to 1080.",
            "Check 'Shutdown source when not visible'."
          ]
        },
        {
          title: "vMix / Wirecast",
          icon: Monitor,
          steps: [
            "Add a 'Web Browser' input.",
            "Use the Clean Feed URL.",
            "Enable 'Transparent Background' if needed.",
            "Control verses from this main window."
          ]
        }
      ],
      cleanFeed: "Clean Feed URL",
      copy: "Copy URL",
      copied: "Copied!",
      ndiNote: "NDI Integration: Use the 'NDI Screen Capture' tool or a virtual webcam bridge to send the Clean Feed as a high-quality NDI source."
    },
    pt: {
      title: "Integração para Transmissão",
      subtitle: "Conecte a Biblia Sagrada LIVE ao seu software de transmissão.",
      proBadge: "RECURSO PRO",
      upgradeCta: "Atualize para o Pro para desbloquear a integração",
      methods: [
        {
          title: "OBS Studio / Streamlabs",
          icon: Radio,
          steps: [
            "Adicione uma nova 'Fonte de Navegador' no OBS.",
            "Cole a URL do Clean Feed abaixo.",
            "Defina a largura como 1920 e a altura como 1080.",
            "Marque 'Desativar fonte quando não visível'."
          ]
        },
        {
          title: "vMix / Wirecast",
          icon: Monitor,
          steps: [
            "Adicione uma entrada de 'Navegador Web'.",
            "Use a URL do Clean Feed.",
            "Ative 'Fundo Transparente' se necessário.",
            "Controle os versículos a partir desta janela principal."
          ]
        }
      ],
      cleanFeed: "URL do Clean Feed",
      copy: "Copiar URL",
      copied: "Copiado!",
      ndiNote: "Integração NDI: Use a ferramenta 'NDI Screen Capture' ou uma ponte de webcam virtual para enviar o Clean Feed como uma fonte NDI de alta qualidade."
    }
  }[language];

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanFeedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-3xl bg-surface-container-highest rounded-3xl shadow-2xl overflow-hidden border border-white/10"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-headline font-bold mb-2">{content.title}</h2>
                <p className="text-outline">{content.subtitle}</p>
              </div>
              {!isPro && (
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-full">
                  <Zap className="w-4 h-4 text-secondary fill-secondary" />
                  <span className="font-label text-[10px] font-bold tracking-widest uppercase text-secondary">{content.proBadge}</span>
                </div>
              )}
            </div>

            {!isPro ? (
              <div className="bg-surface-container rounded-2xl p-12 text-center border border-white/5">
                <Zap className="w-12 h-12 text-secondary fill-secondary mx-auto mb-6" />
                <h3 className="text-xl font-headline font-bold mb-4">{content.upgradeCta}</h3>
                <button 
                  onClick={onUpgrade}
                  className="px-8 py-4 bg-primary text-on-primary rounded-xl font-label text-xs font-bold tracking-widest uppercase hover:scale-105 transition-all shadow-xl"
                >
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="grid md:grid-cols-2 gap-8">
                  {content.methods.map((m, i) => (
                    <div key={i} className="bg-surface-container rounded-2xl p-8 border border-white/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <m.icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-headline font-bold">{m.title}</h3>
                      </div>
                      <ul className="space-y-3">
                        {m.steps.map((s, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-outline">
                            <span className="font-bold text-primary">{j + 1}.</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <label className="font-label text-[10px] font-bold tracking-widest uppercase text-outline">{content.cleanFeed}</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-surface-container p-4 rounded-xl font-mono text-xs text-primary truncate border border-white/5">
                      {cleanFeedUrl}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="px-6 bg-primary text-on-primary rounded-xl font-label text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? content.copied : content.copy}
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-surface-container/50 rounded-xl border border-white/5 flex items-start gap-4">
                  <ExternalLink className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <p className="text-xs text-outline leading-relaxed italic">{content.ndiNote}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
