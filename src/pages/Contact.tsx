import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Clock, Globe } from 'lucide-react';

const Contact = () => (
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">Get in Touch</span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            Contact <span className="text-gradient-gold">Us</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">Have questions? We're here to help you 24/7.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Mail, title: 'Email', value: 'support@zentrixfinance.com', desc: 'We reply within 24 hours' },
            { icon: MessageSquare, title: 'Telegram', value: '@zentrixfinance', desc: 'Instant support available' },
            { icon: Clock, title: 'Support Hours', value: '24/7 Available', desc: 'Round the clock assistance' },
            { icon: Globe, title: 'Network', value: 'USDT BEP20 (BSC)', desc: 'Binance Smart Chain' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
            >
              <item.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-display font-bold text-foreground mb-1">{item.title}</h3>
              <div className="text-primary font-semibold mb-1">{item.value}</div>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Contact;
