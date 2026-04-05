import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'pt';
}

export function PricingModal({ isOpen, onClose, language }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  const content = {
    en: {
      title: "Upgrade to Biblia Sagrada LIVE Pro",
      subtitle: "Unlock advanced customization and professional integration features.",
      monthly: "Monthly",
      annual: "Annual (Save 48%)",
      monthlyPrice: "$3.87",
      annualPrice: "$1.99",
      perMonth: "/month",
      features: [
        "Custom Background Images & Logo Uploads",
        "Advanced Typography & Font Selection",
        "Dual Translation Projection",
        "Clean Feed for OBS/vMix (Browser Source)",
        "NDI-Ready Web Integration",
        "Priority Support"
      ],
      cta: "Subscribe Now"
    },
    pt: {
      title: "Atualize para Biblia Sagrada LIVE Pro",
      subtitle: "Desbloqueie personalização avançada e recursos de integração profissional.",
      monthly: "Mensal",
      annual: "Anual (Economize 48%)",
      monthlyPrice: "$3.87",
      annualPrice: "$1.99",
      perMonth: "/mês",
      features: [
        "Upload de Imagens de Fundo e Logotipo",
        "Tipografia Avançada e Seleção de Fontes",
        "Projeção de Tradução Dupla",
        "Clean Feed para OBS/vMix (Browser Source)",
        "Integração Web Pronta para NDI",
        "Suporte Prioritário"
      ],
      cta: "Assinar Agora"
    }
  }[language];

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

          <div className="p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Zap className="w-6 h-6 text-secondary fill-secondary" />
              </div>
              <span className="font-label text-xs font-bold tracking-widest uppercase text-secondary">Premium Access</span>
            </div>

            <h2 className="text-3xl font-headline font-bold mb-2">{content.title}</h2>
            <p className="text-outline mb-8">{content.subtitle}</p>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                {content.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 bg-secondary/20 rounded-full">
                      <Check className="w-3 h-3 text-secondary" />
                    </div>
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container rounded-2xl p-8 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex bg-surface-container-lowest p-1 rounded-xl mb-6">
                    <button 
                      onClick={() => setBillingCycle('monthly')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-label font-bold uppercase tracking-widest rounded-lg transition-all",
                        billingCycle === 'monthly' ? "bg-primary text-on-primary shadow-lg" : "text-outline"
                      )}
                    >
                      {content.monthly}
                    </button>
                    <button 
                      onClick={() => setBillingCycle('annual')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-label font-bold uppercase tracking-widest rounded-lg transition-all",
                        billingCycle === 'annual' ? "bg-primary text-on-primary shadow-lg" : "text-outline"
                      )}
                    >
                      {content.annual}
                    </button>
                  </div>

                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-headline font-bold">
                        {billingCycle === 'monthly' ? content.monthlyPrice : content.annualPrice}
                      </span>
                      <span className="text-outline font-label text-xs font-bold uppercase tracking-widest">
                        {content.perMonth}
                      </span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest mt-2">
                        Billed annually ($23.88/yr)
                      </p>
                    )}
                  </div>
                </div>

                <button className="w-full py-4 bg-primary text-on-primary rounded-xl font-label text-xs font-bold tracking-widest uppercase hover:scale-105 transition-all shadow-xl">
                  {content.cta}
                </button>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-outline">
                <Star className="w-4 h-4" />
                <p className="text-[10px] font-label font-bold uppercase tracking-widest">Premium Access</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
  );
}
