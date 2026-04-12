import { motion } from 'framer-motion';
import { Shield, Lock, Clock, Users, Wallet, BadgeCheck } from 'lucide-react';

const badges = [
  { icon: Shield, title: 'Secure Platform', desc: 'Bank-grade security protocols' },
  { icon: Lock, title: 'Encrypted Data', desc: 'End-to-end encryption' },
  { icon: Clock, title: 'Fast Withdrawals', desc: 'Processed within 5 hours' },
  { icon: Users, title: '1,250+ Investors', desc: 'Growing global community' },
  { icon: Wallet, title: 'USDT BEP20', desc: 'Low fees, fast transactions' },
  { icon: BadgeCheck, title: 'Verified Traders', desc: '5+ years forex experience' },
];

export const TrustBadges = () => (
  <section className="py-16 bg-card border-y border-border">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl font-display font-bold">
          Why Investors <span className="text-gradient-gold">Trust Us</span>
        </h2>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="text-center p-4 rounded-xl bg-background border border-border hover:border-primary/20 transition-all"
          >
            <badge.icon className="w-7 h-7 text-primary mx-auto mb-2" />
            <div className="text-sm font-semibold text-foreground mb-0.5">{badge.title}</div>
            <div className="text-xs text-muted-foreground">{badge.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
