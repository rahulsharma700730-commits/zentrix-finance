import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gold-dark/30 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Trusted by 1,250+ Investors Worldwide</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 text-white">
            Double Your <span className="text-gradient-gold">Investment</span> in 20 Months
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Professional forex trading with guaranteed daily returns. Invest USDT, watch your portfolio grow daily, and withdraw anytime above $20.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 text-lg px-8 py-6 shadow-gold"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Start Investing <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 text-lg px-8 py-6"
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Calculate Returns
            </Button>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 max-w-xl mx-auto"
          >
            {[
              { icon: TrendingUp, label: '100% ROI', desc: '20 Months' },
              { icon: Shield, label: 'Secure', desc: 'USDT Based' },
              { icon: Zap, label: 'Daily', desc: 'Returns' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-white font-semibold">{item.label}</div>
                <div className="text-gray-500 text-sm">{item.desc}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
