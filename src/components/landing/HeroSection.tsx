import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Zap, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Hero3D } from './Hero3D';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-12 sm:py-16">
      <div className="absolute inset-0 bg-[#070a0f]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(43,96%,56%)]/10 blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(43,90%,40%)]/15 blur-[120px]" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-[hsl(43,96%,56%)]/5 blur-[100px]" />
      </div>

      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(43 96% 56%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <Hero3D className="absolute inset-0 z-[1] opacity-70" />


      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[hsl(43,96%,56%)]/20 bg-[hsl(43,96%,56%)]/5 mb-8 backdrop-blur-sm"
          >
            <div className="w-2 h-2 rounded-full bg-[hsl(43,96%,56%)] animate-pulse" />
            <span className="text-sm text-[hsl(43,96%,56%)]/90 font-medium tracking-wide">{t('hero.badge')}</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 text-white leading-[1.05]">
            {t('hero.titleSmart')}{' '}
            <span className="text-gradient-gold">{t('hero.titleWealth')}</span>
            <br className="hidden sm:block" />
            <span className="text-3xl md:text-5xl lg:text-6xl font-medium text-white/70">{t('hero.titleManagement')}</span>
          </h1>

          <p className="text-base md:text-lg text-white/50 mb-6 max-w-2xl mx-auto leading-relaxed font-light">
            {t('hero.desc')}
          </p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-[hsl(43,96%,56%)]/70 mb-10 font-medium"
          >
            {t('hero.tagline')}
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-gold text-[#0a0a0a] hover:opacity-90 text-base px-10 py-7 shadow-gold-lg font-semibold tracking-wide"
              onClick={() => navigate('/auth?tab=signup')}
            >
              {t('hero.ctaStart')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              className="inline-flex items-center justify-center rounded-md text-base px-10 py-3.5 font-medium border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.ctaCalculate')}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12"
          >
            {[
              { icon: TrendingUp, value: '200%', label: t('hero.stat.returnCap') },
              { icon: Shield, value: 'BEP20', label: t('hero.stat.network') },
              { icon: Zap, value: t('hero.stat.dailyValue'), label: t('hero.stat.dailyLabel') },
              { icon: Globe, value: t('hero.stat.marketValue'), label: t('hero.stat.marketLabel') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
              >
                <item.icon className="w-5 h-5 text-[hsl(43,96%,56%)] mx-auto mb-2" />
                <div className="text-white font-display font-bold text-lg">{item.value}</div>
                <div className="text-white/50 text-xs font-medium">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center"
          >
            <ChevronDown className="w-6 h-6 text-white/30 animate-bounce" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
