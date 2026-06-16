import { Banknote, Bitcoin, BarChart3, LineChart, Building2, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MarketsSection = () => {
  const { t } = useTranslation();
  const markets = [
    { icon: Banknote, k: 'forex' },
    { icon: Coins, k: 'commodities' },
    { icon: BarChart3, k: 'indices' },
    { icon: Building2, k: 'stocks' },
    { icon: Bitcoin, k: 'crypto' },
    { icon: LineChart, k: 'bonds' },
  ];
  const stats = [
    { value: '0.0', k: 'spread' },
    { value: '<40ms', k: 'latency' },
    { value: '$50', k: 'min' },
    { value: '24/5', k: 'support' },
  ];
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-muted-foreground mb-3">{t('markets.eyebrow')}</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-foreground">
            {t('markets.title1')} <span className="text-gradient-gold">{t('markets.title2')}</span>
          </h2>
          <p className="text-muted-foreground">{t('markets.desc')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-14">
          {markets.map((m) => (
            <div key={m.k} className="group relative p-5 sm:p-6 rounded-2xl border border-border bg-card lift overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
                  <m.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-1.5">{t(`markets.cards.${m.k}.name`)} {t('markets.cfdsSuffix')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t(`markets.cards.${m.k}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-secondary text-secondary-foreground p-5 sm:p-7 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 shadow-elevated">
          {stats.map((s) => (
            <div key={s.k} className="text-center">
              <p className="font-display font-black text-2xl sm:text-4xl text-primary leading-none mb-1.5">{s.value}</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80">{t(`markets.stats.${s.k}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
