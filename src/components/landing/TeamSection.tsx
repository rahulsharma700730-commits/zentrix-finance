import { motion } from 'framer-motion';
import { Shield, Award, Globe, BarChart3, Users, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';

export const TeamSection = () => {
  const { t } = useTranslation();
  const badges = [
    { icon: Shield, k: 'verified' },
    { icon: Award, k: 'years' },
    { icon: Globe, k: 'global' },
    { icon: BarChart3, k: 'forex' },
    { icon: Users, k: 'clients' },
    { icon: Clock, k: 'trading' },
  ];
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">{t('team.eyebrow')}</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">{t('team.title1')} <span className="text-gradient-gold">{t('team.title2')}</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('team.desc')}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <div className="text-center p-10 rounded-3xl bg-card border border-border">
            <img src={logo} alt="Zentrix Finance" className="w-20 h-20 rounded-2xl mx-auto mb-6" loading="lazy" />
            <h3 className="text-2xl font-display font-bold mb-2 text-foreground">Zentrix Finance</h3>
            <p className="text-primary font-medium mb-5">{t('team.card.subtitle')}</p>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-lg mx-auto">{t('team.card.body')}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {badges.map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                  <item.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <span className="text-xs text-muted-foreground font-medium">{t(`team.badges.${item.k}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
