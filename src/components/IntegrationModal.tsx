import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Radio, Monitor, Copy, Check, ExternalLink, Zap, Smartphone, Share2, Tv } from 'lucide-react';
import { cn } from '../lib/utils';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'pt';
  isPro: boolean;
  onUpgrade: () => void;
  userId: string;
}

export function IntegrationModal({ isOpen, onClose, language, isPro, onUpgrade, userId }: IntegrationModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [copiedRemote, setCopiedRemote] = React.useState(false);
  const cleanFeedUrl = window.location.origin + window.location.pathname + "?mode=clean";
  const remoteControlUrl = window.location.origin + window.location.pathname + "?mode=remote";

  if (!isOpen) return null;

  const content = {
    en: {
      title: "Livestream Integration",
      subtitle: "Connect Biblia Sagrada LIVE to your broadcasting software.",
      proBadge: "PRO FEATURE",
      upgradeCta: "Upgrade to Pro to unlock professional integration",
      methods: [
        {
          title: "OBS Studio / Streamlabs",
          icon: Radio,
          steps: [
            "Add a new 'Browser Source' in OBS.",
            "Paste the Clean Feed URL below.",
            "Set width to 1920 and height to 1080.",
            "Check 'Shutdown source when not visible'.",
            "Use 'Interact' in OBS to control if needed, or use this dashboard."
          ]
        },
        {
          title: "vMix / Wirecast",
          icon: Monitor,
          steps: [
            "Add a 'Web Browser' input in vMix.",
            "Use the Clean Feed URL.",
            "Set resolution to 1920x1080.",
            "Enable 'Transparent Background' (Chroma Key) if using a green preset.",
            "Control via API: Use the URL parameters to change verses remotely."
          ]
        },
        {
          title: "ProPresenter / EasyWorship",
          icon: Tv,
          steps: [
            "Create a new 'Web View' or 'Browser' slide.",
            "Paste the Clean Feed URL.",
            "Set as a background layer for lower thirds.",
            "Adjust opacity and scale to fit your screen layout."
          ]
        },
        {
          title: "NDI / Syphon / Spout",
          icon: Share2,
          steps: [
            "Use 'NDI Screen Capture' to send this window as an NDI source.",
            "On Mac, use Syphon to share frames between local apps.",
            "On Windows, use Spout for low-latency local sharing.",
            "Ideal for high-end production with zero network lag."
          ]
        }
      ],
      remoteTitle: "Remote Control",
      remoteDesc: "Open this app on your phone or tablet to control the projection from anywhere in the church.",
      cleanFeed: "Clean Feed URL (For OBS/vMix)",
      copy: "Copy URL",
      copied: "Copied!",
      ndiNote: "Professional Tip: Use the Clean Feed for lower thirds and overlays. The dashboard remains your control center."
    },
    pt: {
      title: "Integração para Transmissão",
      subtitle: "Conecte a Biblia Sagrada LIVE ao seu software de transmissão.",
      proBadge: "RECURSO PRO",
      upgradeCta: "Atualize para o Pro para desbloquear integração profissional",
      methods: [
        {
          title: "OBS Studio / Streamlabs",
          icon: Radio,
          steps: [
            "Adicione uma nova 'Fonte de Navegador' no OBS.",
            "Cole a URL do Clean Feed abaixo.",
            "Defina a largura como 1920 e a altura como 1080.",
            "Marque 'Desativar fonte quando não visível'.",
            "Use a função 'Interagir' no OBS para controle direto."
          ]
        },
        {
          title: "vMix / Wirecast",
          icon: Monitor,
          steps: [
            "Adicione uma entrada de 'Navegador Web' no vMix.",
            "Use a URL do Clean Feed.",
            "Defina a resolução para 1920x1080.",
            "Ative 'Fundo Transparente' se usar preset Chroma Key.",
            "Controle Remoto: Use parâmetros de URL para trocar versos."
          ]
        },
        {
          title: "ProPresenter / EasyWorship",
          icon: Tv,
          steps: [
            "Crie um novo slide de 'Web View' ou 'Navegador'.",
            "Cole a URL do Clean Feed.",
            "Defina como camada de fundo para letras/versículos.",
            "Ajuste a opacidade e escala conforme seu layout."
          ]
        },
        {
          title: "NDI / Syphon / Spout",
          icon: Share2,
          steps: [
            "Use 'NDI Screen Capture' para enviar esta janela como fonte NDI.",
            "No Mac, use Syphon para compartilhar entre apps locais.",
            "No Windows, use Spout para compartilhamento de baixa latência.",
            "Ideal para produções de alto nível sem lag de rede."
          ]
        }
      ],
      remoteTitle: "Controle Remoto",
      remoteDesc: "Abra este app no seu celular ou tablet para controlar a projeção de qualquer lugar da igreja.",
      cleanFeed: "URL do Clean Feed (Para OBS/vMix)",
      copy: "Copiar URL",
      copied: "Copiado!",
      ndiNote: "Dica Profissional: Use o Clean Feed para sobreposições e GC. O painel principal continua sendo seu centro de comando."
    }
  }[language];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="relative w-full max-w-4xl bg-surface-container-highest rounded-3xl shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
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
                {/* Methods Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {content.methods.map((m, i) => (
                    <div key={i} className="bg-surface-container rounded-2xl p-6 border border-white/5 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <m.icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-sm">{m.title}</h3>
                      </div>
                      <ul className="space-y-2">
                        {m.steps.map((s, j) => (
                          <li key={j} className="flex items-start gap-3 text-[11px] text-outline leading-relaxed">
                            <span className="font-bold text-primary">{j + 1}.</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* URLs Section */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Clean Feed */}
                  <div className="space-y-4">
                    <label className="font-label text-[10px] font-bold tracking-widest uppercase text-outline">{content.cleanFeed}</label>
                    <div className="flex flex-col gap-2">
                      <div className="bg-surface-container p-4 rounded-xl font-mono text-[10px] text-primary truncate border border-white/5">
                        {cleanFeedUrl}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCopy(cleanFeedUrl)}
                          className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-105 transition-all"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? content.copied : content.copy}
                        </button>
                        <a 
                          href={cleanFeedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-surface-container-low text-primary rounded-xl hover:bg-primary hover:text-on-primary transition-all border border-white/5"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Remote Control */}
                  <div className="space-y-4">
                    <label className="font-label text-[10px] font-bold tracking-widest uppercase text-outline">{content.remoteTitle}</label>
                    <div className="bg-surface-container p-4 rounded-xl border border-white/5 flex gap-4">
                      <div className="w-20 h-20 bg-white p-2 rounded-lg shrink-0">
                        {/* Placeholder for QR Code - in a real app we'd use a QR lib */}
                        <div className="w-full h-full bg-black/5 flex items-center justify-center">
                          <Smartphone className="w-8 h-8 text-black" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-outline leading-relaxed">{content.remoteDesc}</p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(remoteControlUrl);
                            setCopiedRemote(true);
                            setTimeout(() => setCopiedRemote(false), 2000);
                          }}
                          className="text-[10px] font-label font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          {copiedRemote ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedRemote ? (language === 'en' ? 'Copied!' : 'Copiado!') : (language === 'en' ? 'Copy Remote Link' : 'Copiar Link Remoto')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remote Control API */}
                  <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex items-center justify-between">
                      <label className="font-label text-[10px] font-bold tracking-widest uppercase text-outline">
                        {language === 'en' ? 'Remote Control API' : 'API de Controle Remoto'}
                      </label>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded text-[8px] font-bold text-primary uppercase tracking-tighter">
                        <Zap className="w-2 h-2" />
                        PRO
                      </div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-xl border border-white/5 space-y-3">
                      <p className="text-[10px] text-outline leading-relaxed">
                        {language === 'en' 
                          ? 'Control the projection panel from external software via REST API.' 
                          : 'Controle o painel de projeção a partir de softwares externos via API REST.'}
                      </p>
                      <div className="space-y-1">
                        <p className="text-[8px] font-label font-bold text-outline uppercase tracking-widest">Endpoint (POST)</p>
                        <code className="text-[10px] text-primary break-all bg-black/20 p-1 rounded block">
                          {window.location.origin}/api/control/{userId}
                        </code>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-label font-bold text-outline uppercase tracking-widest">Example JSON</p>
                        <pre className="text-[8px] bg-black/20 p-2 rounded overflow-x-auto text-outline">
{`{
  "currentBook": "gen",
  "currentChapter": 1,
  "projectedVerse": 0,
  "translation": "NVI",
  "dualTranslation": true
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface-container/50 rounded-xl border border-white/5 flex items-start gap-4">
                  <Zap className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <p className="text-xs text-outline leading-relaxed italic">{content.ndiNote}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
  );
}
