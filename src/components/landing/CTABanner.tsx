import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CTABanner = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Dark background always */}
      <div className="absolute inset-0 bg-[#070a0f]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[hsl(43,96%,56%)]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full bg-[hsl(43,90%,40%)]/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <Sparkles className="w-10 h-10 text-[hsl(43,96%,56%)] mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Ready to <span className="text-gradient-gold">Double</span> Your Money?
          </h2>
          <p className="text-white/50 mb-8 text-lg">
            Join 1,250+ investors earning daily returns. Start with as little as $50 USDT (BEP20).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-gold text-[#0a0a0a] hover:opacity-90 text-base px-10 py-7 shadow-gold-lg font-semibold"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              className="inline-flex items-center justify-center rounded-md text-base px-10 py-3.5 font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
              onClick={() => navigate('/auth')}
            >
              Login to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
