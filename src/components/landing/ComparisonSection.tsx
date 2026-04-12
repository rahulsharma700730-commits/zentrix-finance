import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const data = [
  { feature: 'Annual ROI', zentrix: '100%', bank: '6-8%', crypto: 'Variable' },
  { feature: 'Minimum Investment', zentrix: '$50', bank: '$1,000+', crypto: '$10' },
  { feature: 'Daily Returns', zentrix: true, bank: false, crypto: false },
  { feature: 'Guaranteed Returns', zentrix: true, bank: true, crypto: false },
  { feature: 'Withdrawal Flexibility', zentrix: 'Anytime (≥$20)', bank: 'Lock-in Period', crypto: 'Anytime' },
  { feature: 'Professional Management', zentrix: true, bank: true, crypto: false },
  { feature: 'Referral Bonus', zentrix: '10% Instant', bank: 'None', crypto: 'Varies' },
];

const renderCell = (val: string | boolean) => {
  if (typeof val === 'boolean') return val ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-destructive mx-auto" />;
  return <span>{val}</span>;
};

export const ComparisonSection = () => (
  <section className="py-24 bg-card">
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Why <span className="text-gradient-gold">Zentrix?</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">See how we compare to traditional investment options.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-muted-foreground">Feature</th>
              <th className="p-4 text-center text-primary font-bold">Zentrix Finance</th>
              <th className="p-4 text-center text-muted-foreground">Bank FD</th>
              <th className="p-4 text-center text-muted-foreground">Crypto Staking</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-background/50">
                <td className="p-4 font-medium">{row.feature}</td>
                <td className="p-4 text-center font-semibold text-primary">{renderCell(row.zentrix)}</td>
                <td className="p-4 text-center text-muted-foreground">{renderCell(row.bank)}</td>
                <td className="p-4 text-center text-muted-foreground">{renderCell(row.crypto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  </section>
);
