import { motion } from 'framer-motion';
import { Shield, Award, Globe } from 'lucide-react';

export const TeamSection = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Meet Our <span className="text-gradient-gold">Team</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Professional traders with years of forex market experience.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-md mx-auto text-center p-8 rounded-2xl bg-card border border-border"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-gold mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl font-display font-bold text-primary-foreground">ZF</span>
        </div>
        <h3 className="text-2xl font-display font-bold mb-2">Zentrix Finance</h3>
        <p className="text-primary font-medium mb-4">Professional Forex Trading Fund</p>
        <p className="text-muted-foreground text-sm mb-6">
          Our team of experienced forex traders leverages advanced strategies and market analysis to generate consistent returns for our investors.
        </p>
        <div className="flex justify-center gap-6">
          {[
            { icon: Shield, label: 'Verified' },
            { icon: Award, label: '5+ Years' },
            { icon: Globe, label: 'Global' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <item.icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);
