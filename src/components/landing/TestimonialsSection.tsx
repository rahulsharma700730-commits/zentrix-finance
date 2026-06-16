import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TestimonialsSection = () => {
  const { t } = useTranslation();
  const testimonials = [
    { name: 'Ahmed K.', country: '🇦🇪 UAE', amount: '$2,000', rating: 5 },
    { name: 'Sarah M.', country: '🇬🇧 UK', amount: '$5,000', rating: 5 },
    { name: 'Raj P.', country: '🇮🇳 India', amount: '$1,500', rating: 5 },
    { name: 'Maria L.', country: '🇪🇸 Spain', amount: '$3,000', rating: 5 },
  ];
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-10" />
      <div className="container mx-auto px-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">{t('testimonials.eyebrow')}</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">{t('testimonials.title1')} <span className="text-gradient-gold">{t('testimonials.title2')}</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('testimonials.desc')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {testimonials.map((t2, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-6 rounded-2xl bg-background border border-border hover:border-primary/20 transition-all group">
              <Quote className="w-6 h-6 text-primary/20 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t2.rating }).map((_, j) => (<Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />))}
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">"{t(`testimonials.items.${i}.text`)}"</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <span className="font-semibold text-sm text-foreground block">{t2.name}</span>
                  <span className="text-xs text-muted-foreground">{t2.country}</span>
                </div>
                <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full">{t('testimonials.invested')} {t2.amount}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
