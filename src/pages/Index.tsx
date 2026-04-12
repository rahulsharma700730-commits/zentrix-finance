import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ROICalculator } from '@/components/landing/ROICalculator';
import { StatsSection } from '@/components/landing/StatsSection';
import { LiveTicker } from '@/components/landing/LiveTicker';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { TeamSection } from '@/components/landing/TeamSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <LiveTicker />
    <HowItWorks />
    <ROICalculator />
    <StatsSection />
    <ComparisonSection />
    <TeamSection />
    <TestimonialsSection />
    <FAQSection />
    <Footer />
  </div>
);

export default Index;
