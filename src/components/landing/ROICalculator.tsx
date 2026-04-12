import { motion } from 'framer-motion';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar, TrendingUp, Percent } from 'lucide-react';

export const ROICalculator = () => {
  const [amount, setAmount] = useState(1000);

  const totalReturn = amount * 2;
  const dailyReturn = totalReturn / 600;
  const monthlyReturn = dailyReturn * 30;

  return (
    <section id="calculator" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            ROI <span className="text-gradient-gold">Calculator</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">See exactly how much you'll earn. Enter your investment amount below.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border-primary/20 shadow-gold">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <label className="text-sm text-muted-foreground mb-2 block">Investment Amount (USDT)</label>
                <div className="relative max-w-xs mx-auto">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="pl-10 text-2xl font-bold text-center h-14 border-primary/30 focus:border-primary"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: TrendingUp, label: 'Daily Return', value: `$${dailyReturn.toFixed(2)}` },
                  { icon: Calendar, label: 'Monthly Return', value: `$${monthlyReturn.toFixed(2)}` },
                  { icon: DollarSign, label: 'Total Return (20mo)', value: `$${totalReturn.toLocaleString()}` },
                  { icon: Percent, label: 'ROI', value: '100%' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-background border border-border">
                    <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                    <div className="text-xl font-bold text-gradient-gold">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
