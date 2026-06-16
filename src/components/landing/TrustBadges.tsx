import { motion } from 'framer-motion';
import { Shield, Lock, Clock, Users, Wallet, BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TrustBadges = () => {
  const { t } = useTranslation();
  const badges = [
    { icon: Shield, key: 'secure' },
    { icon: Lock, key: 'encrypted' },
    { icon: Clock, key: 'fast' },
    { icon: Users, key: 'investors' },
    { icon: Wallet, key: 'usdt' },
    { icon: BadgeCheck, key: 'verified' },
  ];
  return (
    <section className="py-16 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            {t('trust.title1')} <span className="text-gradient-gold">{t('trust.title2')}</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {badges.map((badge, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="text-center p-4 rounded-xl bg-background border border-border hover:border-primary/20 transition-all">
              <badge.icon className="w-7 h-7 text-primary mx-auto mb-2" />
              <div className="text-sm font-semibold text-foreground mb-0.5">{t(`trust.items.${badge.key}.t`)}</div>
              <div className="text-xs text-muted-foreground">{t(`trust.items.${badge.key}.d`)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
