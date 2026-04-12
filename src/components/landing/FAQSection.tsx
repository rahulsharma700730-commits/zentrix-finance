import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'How does Zentrix Finance work?', a: 'You invest USDT, and our professional forex traders generate returns. Your investment doubles in 20 months with daily returns credited to your dashboard.' },
  { q: 'What is the minimum investment?', a: 'There is no strict minimum, but we recommend starting with at least $50 for meaningful daily returns.' },
  { q: 'How are daily returns calculated?', a: 'Your total return is 2x your investment over 600 days (20 months). Daily return = (Investment × 2) / 600. For example, $1,000 investment earns ~$3.33 per day.' },
  { q: 'When can I withdraw?', a: 'You can request a withdrawal anytime your available balance reaches $20 or more. Withdrawals are processed within 5 hours to your USDT wallet.' },
  { q: 'How does the referral program work?', a: 'Share your unique referral link. When someone invests through your link, you instantly receive 10% of their investment amount as a commission.' },
  { q: 'Is my investment safe?', a: 'Our experienced traders use risk-managed strategies. All transactions are in USDT on the blockchain, ensuring transparency and security.' },
  { q: 'How do I deposit?', a: 'After signing up, go to the Deposit section in your dashboard. Send USDT to the provided wallet address and submit your transaction hash for confirmation.' },
];

export const FAQSection = () => (
  <section id="faq" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Frequently Asked <span className="text-gradient-gold">Questions</span></h2>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-6 data-[state=open]:border-primary/50">
              <AccordionTrigger className="text-left font-medium hover:text-primary">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);
