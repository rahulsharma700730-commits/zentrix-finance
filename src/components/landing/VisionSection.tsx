import { Heart, GraduationCap, Sparkles } from 'lucide-react';

const pillars = [
  {
    icon: Heart,
    title: 'Child Welfare',
    desc: 'A measured share of our annual profits funds child welfare programs — nutrition, healthcare and safe shelter for vulnerable children worldwide.',
    accent: 'from-rose-500/20 to-amber-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Education',
    desc: 'Scholarships and digital-learning grants for underprivileged students. We believe access to education is the highest-yield investment of all.',
    accent: 'from-amber-500/20 to-emerald-500/10',
  },
  {
    icon: Sparkles,
    title: 'Women Empowerment',
    desc: 'Micro-finance and entrepreneurship grants enabling women to launch sustainable businesses and rise as community leaders.',
    accent: 'from-emerald-500/20 to-sky-500/10',
  },
];

export const VisionSection = () => (
  <section className="py-20 bg-card border-y border-border relative overflow-hidden">
    <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
    <div className="container mx-auto px-4 relative">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-muted-foreground mb-3">Future Goals</p>
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-foreground">
          Zentrix <span className="text-gradient-gold">Future Vision</span>
        </h2>
        <p className="text-muted-foreground">
          Profit with purpose. Beyond delivering consistent returns, Zentrix Finance is committed to
          creating initiatives that inspire growth, independence and equal access to success.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {pillars.map((p) => (
          <div
            key={p.title}
            className={`relative p-6 sm:p-7 rounded-2xl border border-border bg-background overflow-hidden lift`}
          >
            <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br ${p.accent} blur-3xl`} />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-5 shadow-gold">
                <p.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* IB / Partner strip */}
      <div className="mt-14 rounded-2xl border border-primary/30 bg-gradient-gold-subtle p-6 sm:p-8 text-center">
        <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-primary mb-2">Partner With Zentrix &amp; Earn Unlimited</p>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
          5-Level Referral Program — No Cap on Income
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Earn daily commission on every dollar your network earns. Real-time tracking,
          transparent reports, and a global opportunity for influencers, traders and agencies.
        </p>
      </div>
    </div>
  </section>
);
