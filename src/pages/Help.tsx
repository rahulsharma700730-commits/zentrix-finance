import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, MessageSquare, Mail, Shield, Clock, DollarSign, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const helpTopics = [
  { icon: DollarSign, title: 'How to Deposit', desc: 'Send USDT via BEP20 (BSC) network to the address shown in your dashboard. Enter the transaction hash and submit. Admin will confirm within a few hours.' },
  { icon: Clock, title: 'How Earnings Work', desc: 'Your investment doubles over 20 months (~600 days). Daily earnings = (Investment × 2) ÷ 600. Earnings are credited automatically every day at midnight UTC.' },
  { icon: ArrowRight, title: 'How to Withdraw', desc: 'Go to Withdraw tab in dashboard. Minimum withdrawal is $20. Enter amount and your BEP20 wallet address. Admin processes within 5 hours.' },
  { icon: Users, title: 'Referral Program', desc: 'Share your unique referral code. When someone signs up using your code and deposits, you get 10% instant commission on their investment.' },
  { icon: Shield, title: 'Security', desc: 'All deposits go through manual admin approval. Your funds are managed securely. Always use BEP20 network for USDT transactions.' },
  { icon: MessageSquare, title: 'Need More Help?', desc: 'Use the Support tab in your dashboard to raise a ticket. Our team responds to all queries promptly.' },
];

const Help = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="text-center mb-12">
        <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Help Center</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to know about investing with Zentrix Finance on the USDT BEP20 network.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {helpTopics.map((topic, i) => (
          <Card key={i} className="border-border hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <topic.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-display text-foreground">{topic.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{topic.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">Still need help? Contact our support team or raise a ticket from your dashboard.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/contact"><Button variant="outline" className="border-primary/20"><Mail className="w-4 h-4 mr-2" /> Contact Us</Button></Link>
          <Link to="/dashboard"><Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"><MessageSquare className="w-4 h-4 mr-2" /> Dashboard Support</Button></Link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Help;
