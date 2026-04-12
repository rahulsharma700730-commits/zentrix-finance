import { motion } from 'framer-motion';
import { Shield, Award, Globe, BarChart3, Users, Clock } from 'lucide-react';
import logo from '@/assets/logo.png';

export const TeamSection = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">About Us</span>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Meet <span className="text-gradient-gold">Zentrix Finance</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Professional traders with years of forex market experience.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center p-10 rounded-3xl bg-card border border-border">
          <img src={logo} alt="Zentrix Finance" className="w-20 h-20 rounded-2xl mx-auto mb-6" loading="lazy" />
          <h3 className="text-2xl font-display font-bold mb-2 text-foreground">Zentrix Finance</h3>
          <p className="text-primary font-medium mb-5">Professional Forex Trading Fund</p>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-lg mx-auto">
            Our team of experienced forex traders leverages advanced strategies and deep market analysis to generate consistent returns. 
            We operate 24/7, trading on major currency pairs to maximize your investment growth.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { icon: Shield, label: 'Verified' },
              { icon: Award, label: '5+ Years' },
              { icon: Globe, label: 'Global' },
              { icon: BarChart3, label: 'Forex Expert' },
              { icon: Users, label: '1250+ Clients' },
              { icon: Clock, label: '24/7 Trading' },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                <item.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);
