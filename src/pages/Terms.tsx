import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';

const sections = [
  { title: 'Acceptance of Terms', content: 'By accessing and using Zentrix Finance, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
  { title: 'Investment Risks', content: 'Forex trading involves substantial risk. While our professional traders aim for consistent returns, past performance does not guarantee future results. Invest only what you can afford.' },
  { title: 'Deposits & Withdrawals', content: 'All deposits and withdrawals are processed via USDT on the BEP20 (Binance Smart Chain) network. Minimum withdrawal is $20. Withdrawals are processed within 5 hours during business operations.' },
  { title: 'Referral Program', content: 'Users earn a 10% instant commission on investments made by their direct referrals. Referral commissions are credited immediately upon investment confirmation by admin.' },
  { title: 'Account Security', content: 'You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized access.' },
  { title: 'Limitation of Liability', content: 'Zentrix Finance shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or investment services.' },
  { title: 'Modifications', content: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.' },
];

const Terms = () => (
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Terms of <span className="text-gradient-gold">Service</span>
          </h1>
          <p className="text-muted-foreground">Last updated: April 2026</p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-8">
          {sections.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-display font-bold text-foreground mb-3">{i + 1}. {s.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Terms;
