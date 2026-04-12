import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Award, Clock, Shield } from 'lucide-react';

const stats = [
  { icon: DollarSign, value: '$500K+', label: 'Total Invested', desc: 'Across all investors' },
  { icon: Users, value: '1,250+', label: 'Active Investors', desc: 'Growing community' },
  { icon: TrendingUp, value: '$125K+', label: 'Total Payouts', desc: 'Successfully processed' },
  { icon: Clock, value: '<5 Hrs', label: 'Withdrawal Speed', desc: 'Average processing' },
  { icon: Award, value: '100%', label: 'ROI Guaranteed', desc: 'In 20 months' },
  { icon: Shield, value: 'BEP20', label: 'Secure Network', desc: 'BSC blockchain' },
];

export const StatsSection = () => (
  <section className="py-20 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-gold-subtle opacity-20" />
    <div className="container mx-auto px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">Platform Stats</span>
        <h2 className="text-3xl md:text-4xl font-display font-bold">
          Numbers That <span className="text-gradient-gold">Speak</span>
        </h2>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
          >
            <stat.icon className="w-7 h-7 text-primary mx-auto mb-3" />
            <div className="text-2xl font-display font-bold text-gradient-gold mb-0.5">{stat.value}</div>
            <div className="text-sm font-medium text-foreground mb-0.5">{stat.label}</div>
            <div className="text-xs text-muted-foreground">{stat.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
