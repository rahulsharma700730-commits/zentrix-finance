import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Shield, Award, Globe, BarChart3, Users, Clock, TrendingUp, Target } from 'lucide-react';

const About = () => (
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">About Us</span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            About <span className="text-gradient-gold">Zentrix Finance</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A professional forex trading fund delivering consistent daily returns to investors worldwide.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="p-8 rounded-2xl bg-card border border-border">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zentrix Finance bridges the gap between professional forex trading and everyday investors. Our experienced traders 
              leverage advanced strategies, deep market analysis, and 24/7 monitoring to generate consistent daily returns. 
              We believe everyone deserves access to high-quality investment opportunities, regardless of their initial capital.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Target, title: 'Our Vision', desc: 'To become the most trusted forex investment platform, empowering investors globally with transparent, consistent returns.' },
              { icon: TrendingUp, title: 'Our Strategy', desc: 'We trade major currency pairs using proven risk-managed strategies, diversifying across markets to minimize risk and maximize returns.' },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card border border-border">
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Key Highlights</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Shield, value: 'Verified', label: 'Platform' },
                { icon: Award, value: '5+ Years', label: 'Experience' },
                { icon: Globe, value: 'Global', label: 'Operations' },
                { icon: BarChart3, value: 'Forex', label: 'Expert Trading' },
                { icon: Users, value: '1,250+', label: 'Active Investors' },
                { icon: Clock, value: '24/7', label: 'Market Trading' },
                { icon: TrendingUp, value: '100%', label: 'ROI in 20 Months' },
                { icon: Shield, value: 'BEP20', label: 'Secure Network' },
              ].map((item, i) => (
                <div key={i} className="text-center p-5 rounded-xl bg-card border border-border">
                  <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-display font-bold text-gradient-gold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default About;
