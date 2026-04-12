import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Award } from 'lucide-react';

const stats = [
  { icon: DollarSign, value: '$500K+', label: 'Total Invested' },
  { icon: Users, value: '1,250+', label: 'Active Investors' },
  { icon: TrendingUp, value: '$125K+', label: 'Total Payouts' },
  { icon: Award, value: '100%', label: 'ROI Guaranteed' },
];

export const StatsSection = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center p-6 rounded-2xl bg-card border border-border"
          >
            <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl md:text-3xl font-display font-bold text-gradient-gold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
