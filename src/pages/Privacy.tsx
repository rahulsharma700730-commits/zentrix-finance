import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';

const sections = [
  { title: 'Information We Collect', content: 'We collect your name, email address, and USDT wallet address when you register. Transaction data is stored securely for record-keeping.' },
  { title: 'How We Use Your Data', content: 'Your information is used solely to manage your investments, process withdrawals, facilitate referral commissions, and communicate important updates.' },
  { title: 'Data Security', content: 'We employ industry-standard encryption and security measures to protect your personal and financial data. Access is restricted to authorized personnel only.' },
  { title: 'Third-Party Sharing', content: 'We do not sell or share your personal information with third parties, except as required by law or to process your USDT transactions on the BEP20 network.' },
  { title: 'Cookies & Analytics', content: 'We may use cookies and analytics tools to improve our platform experience. You can control cookie preferences through your browser settings.' },
  { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal data. Contact our support team for any data-related requests.' },
];

const Privacy = () => (
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Privacy <span className="text-gradient-gold">Policy</span>
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

export default Privacy;
