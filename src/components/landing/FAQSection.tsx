import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'How does Zentrix Finance work?', a: 'You invest USDT (BEP20 network), and our professional forex traders generate returns. Your investment doubles in 20 months with daily returns credited to your dashboard.' },
  { q: 'What network is used for USDT?', a: 'We use USDT on BEP20 (Binance Smart Chain) network for all deposits and withdrawals. This ensures fast transactions and low fees.' },
  { q: 'What is the minimum investment?', a: 'There is no strict minimum, but we recommend at least $50 for meaningful daily returns. You can invest any amount.' },
  { q: 'How are daily returns calculated?', a: 'Total return = Investment × 2 over 600 days. Daily return = (Investment × 2) / 600. Example: $1,000 investment earns ~$3.33 per day.' },
  { q: 'When can I withdraw?', a: 'Anytime your available balance reaches $20 or more. Withdrawals go to your BEP20 USDT wallet and are processed within 5 hours.' },
  { q: 'How does the referral program work?', a: 'Share your unique referral link. When someone invests through your link, you instantly receive 10% of their investment as a commission — credited immediately.' },
  { q: 'Is my investment safe?', a: 'Our experienced traders use risk-managed strategies. All transactions are in USDT on the BEP20 blockchain, ensuring transparency and security.' },
  { q: 'How do I deposit?', a: 'After signing up, go to Deposit in your dashboard. Send USDT (BEP20) to the provided wallet address and submit your transaction hash for admin confirmation.' },
];

export const FAQSection = () => (
  <section id="faq" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">Got Questions?</span>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Frequently Asked <span className="text-gradient-gold">Questions</span></h2>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-6 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/[0.02] transition-all">
              <AccordionTrigger className="text-left font-medium hover:text-primary text-foreground">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);
