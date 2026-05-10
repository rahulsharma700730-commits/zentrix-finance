import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ROICalculator } from '@/components/landing/ROICalculator';
import { StatsSection } from '@/components/landing/StatsSection';
import { LiveTicker } from '@/components/landing/LiveTicker';
import { InvestmentPlans } from '@/components/landing/InvestmentPlans';
import { TrustBadges } from '@/components/landing/TrustBadges';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { TeamSection } from '@/components/landing/TeamSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTABanner } from '@/components/landing/CTABanner';
import { Footer } from '@/components/landing/Footer';
import { RewardsSection } from '@/components/landing/RewardsSection';
import { MarketsSection } from '@/components/landing/MarketsSection';
import { VisionSection } from '@/components/landing/VisionSection';

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <main className="pt-16">
      <HeroSection />
      <LiveTicker />
      <TrustBadges />
      <HowItWorks />
      <MarketsSection />
      <RewardsSection />
      <InvestmentPlans />
      <ROICalculator />
      <StatsSection />
      <ComparisonSection />
      <TeamSection />
      <VisionSection />
      <TestimonialsSection />
      <FAQSection />
      <CTABanner />
      <Footer />
    </main>
  </div>
);

export default Index;
