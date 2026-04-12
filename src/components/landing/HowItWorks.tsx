import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowDownToLine } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Invest USDT',
    desc: 'Send USDT to the provided wallet address. Your investment is confirmed by our team within hours.',
  },
  {
    icon: TrendingUp,
    title: 'Watch It Grow',
    desc: 'Our expert traders work the forex markets. Your portfolio grows daily — visible in real-time on your dashboard.',
  },
  {
    icon: ArrowDownToLine,
    title: 'Withdraw Anytime',
    desc: 'Once your available balance hits $20+, withdraw to your USDT wallet. Processed within 5 hours.',
  },
];

export const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          How It <span className="text-gradient-gold">Works</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Three simple steps to start growing your wealth with professional forex trading.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="relative text-center p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-6 group-hover:shadow-gold transition-shadow">
              <step.icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="absolute top-4 right-4 text-6xl font-display font-bold text-muted/50">{i + 1}</div>
            <h3 className="text-xl font-display font-bold mb-3">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
