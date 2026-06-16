import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const renderCell = (val: string | boolean) => {
  if (typeof val === 'boolean') return val ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-destructive/60 mx-auto" />;
  return <span>{val}</span>;
};

export const ComparisonSection = () => {
  const { t } = useTranslation();
  const data: { feature: string; zentrix: string | boolean; bank: string | boolean; crypto: string | boolean }[] = [
    { feature: t('compare.rows.roi'), zentrix: '100%', bank: '6-8%', crypto: t('compare.values.variable') },
    { feature: t('compare.rows.min'), zentrix: '$50', bank: '$1,000+', crypto: '$10' },
    { feature: t('compare.rows.daily'), zentrix: true, bank: false, crypto: false },
    { feature: t('compare.rows.managed'), zentrix: true, bank: true, crypto: false },
    { feature: t('compare.rows.network'), zentrix: 'USDT BEP20', bank: t('compare.values.bankTransfer'), crypto: t('compare.values.multiple') },
    { feature: t('compare.rows.speed'), zentrix: t('compare.values.fast'), bank: t('compare.values.days'), crypto: t('compare.values.varies') },
    { feature: t('compare.rows.pm'), zentrix: true, bank: true, crypto: false },
    { feature: t('compare.rows.referral'), zentrix: t('compare.values.instant10'), bank: t('compare.values.none'), crypto: t('compare.values.varies') },
  ];
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">{t('compare.eyebrow')}</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">{t('compare.title1')} <span className="text-gradient-gold">{t('compare.title2')}</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('compare.desc')}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground font-medium">{t('compare.headers.feature')}</th>
                <th className="p-4 text-center"><span className="font-display font-bold text-primary">Zentrix Finance</span></th>
                <th className="p-4 text-center text-muted-foreground font-medium">{t('compare.headers.bank')}</th>
                <th className="p-4 text-center text-muted-foreground font-medium">{t('compare.headers.crypto')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{row.feature}</td>
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
};
