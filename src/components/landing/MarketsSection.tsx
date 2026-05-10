import { Banknote, Bitcoin, BarChart3, LineChart, Building2, Coins } from 'lucide-react';

const markets = [
  { icon: Banknote, name: 'Forex', desc: '$6.6T traded daily — major, minor & exotic pairs with raw spreads from 0.0 pips.' },
  { icon: Coins, name: 'Commodities', desc: 'Gold, silver, oil, gas — the world\'s most-traded physical markets, hedged 24/5.' },
  { icon: BarChart3, name: 'Indices', desc: 'US500, NAS100, DAX40, FTSE100 — broad market exposure via global index CFDs.' },
  { icon: Building2, name: 'Stocks', desc: 'AAPL, TSLA, AMZN, MSFT, GOOGL — fractional positioning on the world\'s biggest names.' },
  { icon: Bitcoin, name: 'Crypto', desc: 'BTC, ETH, SOL, XRP — round-the-clock digital asset exposure, fully managed.' },
  { icon: LineChart, name: 'Bonds', desc: 'US Treasuries & global sovereigns — lower-volatility yield component for the fund.' },
];

export const MarketsSection = () => (
  <section className="py-20 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />
    <div className="container mx-auto px-4 relative">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-muted-foreground mb-3">Master The World&apos;s Largest Financial Markets</p>
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-foreground">
          What <span className="text-gradient-gold">We Trade</span>
        </h2>
        <p className="text-muted-foreground">
          Our institutional desk operates across 7 major asset classes with raw spreads from 0.0 pips.
          You get diversified, professionally-managed exposure — without ever placing a trade yourself.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-14">
        {markets.map((m) => (
          <div
            key={m.name}
            className="group relative p-5 sm:p-6 rounded-2xl border border-border bg-card lift overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
                <m.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-1.5">{m.name} CFDs</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure stat ribbon */}
      <div className="rounded-2xl bg-secondary text-secondary-foreground p-5 sm:p-7 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 shadow-elevated">
        {[
          { value: '0.0', label: 'Min. Spread (Raw)' },
          { value: '<40ms', label: 'Execution Latency' },
          { value: '$50', label: 'Min. Investment' },
          { value: '24/5', label: 'Expert Support' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display font-black text-2xl sm:text-4xl text-primary leading-none mb-1.5">{s.value}</p>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
