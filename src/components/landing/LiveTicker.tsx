export const LiveTicker = () => {
  const items = [
    '🟢 Investor #1847 deposited $500',
    '💰 Investor #923 withdrew $150',
    '🟢 Investor #2105 deposited $2,000',
    '💰 Investor #456 withdrew $85',
    '🟢 Investor #3201 deposited $1,000',
    '💰 Investor #1102 withdrew $200',
    '🟢 Investor #789 deposited $750',
    '💰 Investor #1560 withdrew $120',
  ];

  return (
    <div className="bg-primary/10 border-y border-primary/20 py-3 overflow-hidden">
      <div className="animate-ticker flex whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8 text-sm text-foreground font-medium">{item}</span>
        ))}
      </div>
    </div>
  );
};
