import { motion } from 'framer-motion';
import { TrendingUp, Users, Trophy, Layers, Coins, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const levels = [
  { lvl: 1, rate: 10, color: 'from-amber-400 to-yellow-500' },
  { lvl: 2, rate: 3, color: 'from-amber-300 to-amber-500' },
  { lvl: 3, rate: 3, color: 'from-amber-300 to-amber-500' },
  { lvl: 4, rate: 2, color: 'from-yellow-300 to-amber-400' },
  { lvl: 5, rate: 2, color: 'from-yellow-300 to-amber-400' },
];

const ranks = [
  { name: 'Bronze', directs: 3, team: 5, volume: '$500' },
  { name: 'Silver', directs: 10, team: 25, volume: '$5K' },
  { name: 'Gold', directs: 25, team: 100, volume: '$25K' },
  { name: 'Diamond', directs: 50, team: 500, volume: '$100K' },
  { name: 'Crown', directs: 100, team: 2000, volume: '$500K' },
];

export const RewardsSection = () => {
  return (
    <section id="rewards" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-primary/10 animate-blob pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-primary/5 animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary tracking-widest uppercase mb-3">
            <Sparkles className="w-4 h-4" /> How Rewards Work
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Three ways to <span className="text-gradient-gold">earn</span> with Zentrix
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Daily ROI on your deposit, multi-level network commissions paid every day,
            and rank bonuses that grow with your team. Every dollar you build the network earns is a dollar you can withdraw.
          </p>
        </motion.div>

        {/* Three pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 stagger">
          {[
            {
              icon: TrendingUp, title: 'Daily ROI',
              metric: '0.333%',
              sub: 'per day for 600 days',
              body: 'Every $100 you deposit earns ~$0.33 daily based on trading performance, with potential up to 200% over the 20-month cycle. Paid automatically at midnight UTC.',
            },
            {
              icon: Users, title: 'Network Commissions',
              metric: '20%',
              sub: 'across 5 levels, daily',
              body: 'Earn 10/3/3/2/2% of every downline\'s daily ROI — paid into your wallet the same day they earn. No upfront bonus, just lifetime cash flow.',
            },
            {
              icon: Trophy, title: 'Rank Bonuses',
              metric: 'Bronze → Crown',
              sub: '5 leadership tiers',
              body: 'Climb tiers as your team grows. Each rank unlocks higher visibility, exclusive perks, and bigger commission ceilings.',
            },
          ].map((p, i) => (
            <Card key={i} className="lift glass border-primary/15 overflow-hidden group">
              <CardContent className="p-7">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold mb-5 press">
                  <p.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl mb-1">{p.title}</h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-display font-bold text-gradient-gold">{p.metric}</span>
                  <span className="text-xs text-muted-foreground">{p.sub}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Level breakdown visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16"
        >
          <Card className="glass-strong border-primary/15 ring-gold-glow overflow-hidden">
            <CardContent className="p-6 md:p-10">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-2xl">5-Level Daily Commission</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                When anyone in your 5-deep network earns their daily ROI, you instantly get a slice. Here's the split:
              </p>

              <div className="grid grid-cols-5 gap-2 md:gap-4">
                {levels.map((l) => (
                  <div key={l.lvl} className="text-center">
                    <div className="relative mb-3">
                      <div
                        className={`mx-auto rounded-full bg-gradient-to-br ${l.color} flex items-center justify-center font-display font-bold text-primary-foreground shadow-gold`}
                        style={{ width: `${44 + l.rate * 4}px`, height: `${44 + l.rate * 4}px`, fontSize: `${14 + l.rate * 0.4}px` }}
                      >
                        {l.rate}%
                      </div>
                    </div>
                    <div className="text-xs md:text-sm font-semibold">L{l.lvl}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">Level {l.lvl}</div>
                  </div>
                ))}
              </div>

              {/* Worked example */}
              <div className="mt-10 p-5 rounded-xl bg-primary/5 border border-primary/15">
                <div className="flex items-start gap-3">
                  <Coins className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm leading-relaxed">
                    <strong className="text-foreground">Worked example:</strong>{' '}
                    A Level-1 referral with $1,000 invested earns{' '}
                    <span className="text-primary font-semibold">$3.33/day</span>. You receive{' '}
                    <span className="text-primary font-semibold">$0.33/day</span> from them — that's{' '}
                    <span className="text-primary font-semibold">~$200 over 20 months</span> from a single direct referral.
                    Build a real team and the math gets serious.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rank ladder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-8">
            <h3 className="font-display font-bold text-2xl mb-2">Climb the Leadership Ladder</h3>
            <p className="text-sm text-muted-foreground">Each tier unlocks status and stronger earnings ceilings.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 stagger">
            {ranks.map((r, i) => (
              <div
                key={r.name}
                className="relative glass border border-primary/15 rounded-xl p-4 lift text-center"
                style={{ opacity: 0.6 + i * 0.08 }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold"
                  style={{ opacity: 0.4 + i * 0.15 }}
                />
                <Trophy className={`w-7 h-7 mx-auto mb-2 ${i >= 2 ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-display font-bold text-lg">{r.name}</div>
                <div className="text-[11px] text-muted-foreground space-y-0.5 mt-2">
                  <div>{r.directs} direct refs</div>
                  <div>{r.team} team members</div>
                  <div className="text-primary font-semibold">{r.volume} volume</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
