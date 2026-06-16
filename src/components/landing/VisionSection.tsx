import { Heart, GraduationCap, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const VisionSection = () => {
  const { t } = useTranslation();
  const pillars = [
    { icon: Heart, k: 'child', accent: 'from-rose-500/20 to-amber-500/10' },
    { icon: GraduationCap, k: 'edu', accent: 'from-amber-500/20 to-emerald-500/10' },
    { icon: Sparkles, k: 'women', accent: 'from-emerald-500/20 to-sky-500/10' },
  ];
  return (
    <section className="py-20 bg-card border-y border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-muted-foreground mb-3">{t('vision.eyebrow')}</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-foreground">
            {t('vision.title1')} <span className="text-gradient-gold">{t('vision.title2')}</span>
          </h2>
          <p className="text-muted-foreground">{t('vision.desc')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <div key={p.k} className="relative p-6 sm:p-7 rounded-2xl border border-border bg-background overflow-hidden lift">
              <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br ${p.accent} blur-3xl`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-5 shadow-gold">
                  <p.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">{t(`vision.pillars.${p.k}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`vision.pillars.${p.k}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-primary/30 bg-gradient-gold-subtle p-6 sm:p-8 text-center">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-primary mb-2">{t('vision.partner.eyebrow')}</p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">{t('vision.partner.title')}</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">{t('vision.partner.desc')}</p>
        </div>
      </div>
    </section>
  );
};
