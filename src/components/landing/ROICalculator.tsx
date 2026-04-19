import { motion } from 'framer-motion';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar, TrendingUp, Percent, BarChart3 } from 'lucide-react';

export const ROICalculator = () => {
  const [amountInput, setAmountInput] = useState('1000');
  const amount = amountInput === '' ? 0 : Math.max(0, Number(amountInput) || 0);

  const totalReturn = amount * 2;
  const dailyReturn = totalReturn / 600;
  const monthlyReturn = dailyReturn * 30;
  const weeklyReturn = dailyReturn * 7;
  const referralBonus = amount * 0.1;

  return (
    <section id="calculator" className="py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-20" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">Plan Your Investment</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            ROI <span className="text-gradient-gold">Calculator</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">See exactly how your USDT investment grows over 20 months.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <Card className="border-primary/20 shadow-gold-lg overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-10">
                <label className="text-sm text-muted-foreground mb-3 block font-medium">Investment Amount (USDT - BEP20)</label>
                <div className="relative max-w-sm mx-auto">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
                  <Input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="pl-12 text-3xl font-bold text-center h-16 border-primary/20 focus:border-primary bg-background"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { icon: TrendingUp, label: 'Daily Return', value: `$${dailyReturn.toFixed(2)}`, accent: true },
                  { icon: Calendar, label: 'Weekly Return', value: `$${weeklyReturn.toFixed(2)}` },
                  { icon: BarChart3, label: 'Monthly Return', value: `$${monthlyReturn.toFixed(2)}` },
                  { icon: DollarSign, label: 'Total (20mo)', value: `$${totalReturn.toLocaleString()}`, accent: true },
                  { icon: Percent, label: 'Total ROI', value: '100%' },
                  { icon: DollarSign, label: 'Referral Bonus', value: `$${referralBonus.toFixed(0)}` },
                ].map((item, i) => (
                  <div key={i} className={`text-center p-4 rounded-xl border transition-all ${item.accent ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'}`}>
                    <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.accent ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{item.label}</div>
                    <div className={`text-lg font-display font-bold ${item.accent ? 'text-gradient-gold' : 'text-foreground'}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <p className="text-sm text-foreground">
                  💡 <strong>Invest ${amount.toLocaleString()}</strong> today → Earn <strong className="text-primary">${dailyReturn.toFixed(2)}/day</strong> → 
                  Get back <strong className="text-primary">${totalReturn.toLocaleString()}</strong> in 20 months.
                  {amount >= 50 && <span className="text-muted-foreground"> Refer a friend and earn <strong className="text-primary">${referralBonus.toFixed(0)}</strong> instantly!</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
