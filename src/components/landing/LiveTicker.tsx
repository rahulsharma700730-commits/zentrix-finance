import { useTranslation } from 'react-i18next';

export const LiveTicker = () => {
  const { t } = useTranslation();
  const items = [
    t('ticker.deposit', { id: 1847, amt: 500 }),
    t('ticker.withdraw', { id: 923, amt: 150 }),
    t('ticker.deposit', { id: 2105, amt: '2,000' }),
    t('ticker.withdraw', { id: 456, amt: 85 }),
    t('ticker.deposit', { id: 3201, amt: '1,000' }),
    t('ticker.withdraw', { id: 1102, amt: 200 }),
    t('ticker.deposit', { id: 789, amt: 750 }),
    t('ticker.withdraw', { id: 1560, amt: 120 }),
  ];

  return (
    <div className="bg-primary/10 border-y border-primary/20 py-3 overflow-hidden">
      <div className="animate-ticker flex whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8 text-sm text-foreground font-medium">🟢 {item}</span>
        ))}
      </div>
    </div>
  );
};
