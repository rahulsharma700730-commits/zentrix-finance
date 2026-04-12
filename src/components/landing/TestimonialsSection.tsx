import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Ahmed K.', amount: '$2,000', text: 'Started with $1,000 and already earned $500 in daily returns. The dashboard makes it so easy to track everything.', rating: 5 },
  { name: 'Sarah M.', amount: '$5,000', text: 'Best investment platform I\'ve found. Daily returns are consistent and withdrawals are processed within hours.', rating: 5 },
  { name: 'Raj P.', amount: '$1,500', text: 'The referral program is amazing! I\'ve earned extra commissions just by sharing with friends. Highly recommended.', rating: 5 },
  { name: 'Maria L.', amount: '$3,000', text: 'Transparent, reliable, and professional. My portfolio has been growing steadily every single day.', rating: 5 },
];

export const TestimonialsSection = () => (
  <section className="py-24 bg-card">
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Investor <span className="text-gradient-gold">Reviews</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Hear from our satisfied investors around the world.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-background border border-border"
          >
            <div className="flex gap-1 mb-3">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{t.name}</span>
              <span className="text-xs text-primary font-medium">Invested {t.amount}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
