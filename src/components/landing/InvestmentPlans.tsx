import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    amount: '$50 - $499',
    daily: '$0.17 - $1.66',
    total: '$100 - $998',
    features: ['Daily Returns', 'Dashboard Access', 'Withdrawal ≥ $20', 'Referral 10%'],
    popular: false,
  },
  {
    name: 'Growth',
    amount: '$500 - $4,999',
    daily: '$1.67 - $16.66',
    total: '$1,000 - $9,998',
    features: ['Daily Returns', 'Dashboard Access', 'Withdrawal ≥ $20', 'Referral 10%', 'Priority Support'],
    popular: true,
  },
  {
    name: 'Premium',
    amount: '$5,000+',
    daily: '$16.67+',
    total: '$10,000+',
    features: ['Daily Returns', 'Dashboard Access', 'Withdrawal ≥ $20', 'Referral 10%', 'Priority Support', 'Fast Withdrawal'],
    popular: false,
  },
];

export const InvestmentPlans = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-10" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">Investment Tiers</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Choose Your <span className="text-gradient-gold">Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">All plans offer the same 100% ROI in 20 months. Invest what fits your budget.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative p-8 rounded-2xl border transition-all ${
                plan.popular
                  ? 'bg-card border-primary/40 shadow-gold-lg scale-[1.02]'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-gradient-gold text-[#0a0a0a] text-xs font-bold px-4 py-1.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-display font-bold text-foreground mb-2">{plan.name}</h3>
              <div className="text-3xl font-display font-bold text-gradient-gold mb-1">{plan.amount}</div>
              <p className="text-sm text-muted-foreground mb-6">Investment Range</p>

              <div className="space-y-2 mb-6 p-4 rounded-xl bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Return</span>
                  <span className="font-semibold text-foreground">{plan.daily}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Return (20mo)</span>
                  <span className="font-semibold text-primary">{plan.total}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.popular ? 'bg-gradient-gold text-[#0a0a0a] hover:opacity-90 shadow-gold' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                onClick={() => navigate('/auth?tab=signup')}
              >
                Start Investing <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
