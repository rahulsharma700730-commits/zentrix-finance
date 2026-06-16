import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowDownToLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const HowItWorks = () => {
  const { t } = useTranslation();
  const steps = [
    { icon: Wallet, k: 'step1' },
    { icon: TrendingUp, k: 'step2' },
    { icon: ArrowDownToLine, k: 'step3' },
  ];
  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      <div className="container mx-auto px-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">{t('how.eyebrow')}</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {t('how.title1')} <span className="text-gradient-gold">{t('how.title2')}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('how.desc')}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group hover:shadow-gold">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0 group-hover:shadow-gold transition-shadow">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{t(`how.${step.k}.highlight`)}</span>
              </div>
              <div className="absolute top-6 right-6 text-5xl font-display font-bold text-muted-foreground/10">0{i + 1}</div>
              <h3 className="text-xl font-display font-bold mb-3 text-foreground">{t(`how.${step.k}.title`)}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(`how.${step.k}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
