import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const InvestmentPlans = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const plans = [
    {
      key: 'starter',
      amount: '$50 - $499',
      daily: '$0.17 - $1.66',
      total: '$100 - $998',
      features: ['daily', 'dashboard', 'withdraw', 'referral'],
      popular: false,
    },
    {
      key: 'growth',
      amount: '$500 - $4,999',
      daily: '$1.67 - $16.66',
      total: '$1,000 - $9,998',
      features: ['daily', 'dashboard', 'withdraw', 'referral', 'priority'],
      popular: true,
    },
    {
      key: 'premium',
      amount: '$5,000+',
      daily: '$16.67+',
      total: '$10,000+',
      features: ['daily', 'dashboard', 'withdraw', 'referral', 'priority', 'fast'],
      popular: false,
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-10" />
      <div className="container mx-auto px-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">{t('plans.eyebrow')}</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {t('plans.title1')} <span className="text-gradient-gold">{t('plans.title2')}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('plans.desc')}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className={`relative p-8 rounded-2xl border transition-all ${plan.popular ? 'bg-card border-primary/40 shadow-gold-lg scale-[1.02]' : 'bg-card border-border hover:border-primary/20'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-gradient-gold text-[#0a0a0a] text-xs font-bold px-4 py-1.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> {t('plans.popular')}
                  </span>
                </div>
              )}
              <h3 className="text-xl font-display font-bold text-foreground mb-2">{t(`plans.tiers.${plan.key}`)}</h3>
              <div className="text-3xl font-display font-bold text-gradient-gold mb-1">{plan.amount}</div>
              <p className="text-sm text-muted-foreground mb-6">{t('plans.range')}</p>

              <div className="space-y-2 mb-6 p-4 rounded-xl bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('plans.daily')}</span>
                  <span className="font-semibold text-foreground">{plan.daily}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('plans.total')}</span>
                  <span className="font-semibold text-primary">{plan.total}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {t(`plans.features.${f}`)}
                  </li>
                ))}
              </ul>

              <Button className={`w-full ${plan.popular ? 'bg-gradient-gold text-[#0a0a0a] hover:opacity-90 shadow-gold' : 'bg-primary/10 text-primary hover:bg-primary/20'}`} onClick={() => navigate('/auth?tab=signup')}>
                {t('plans.start')} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
