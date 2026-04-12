import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const Footer = () => (
  <footer className="py-16 bg-card border-t border-border">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="Zentrix Finance" className="w-8 h-8 rounded-lg" loading="lazy" />
            <span className="font-display text-xl font-bold text-gradient-gold">Zentrix Finance</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">Professional forex trading fund delivering consistent daily returns to investors worldwide via USDT BEP20 network.</p>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4 text-foreground">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#calculator" className="hover:text-primary transition-colors">ROI Calculator</a></li>
            <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
            <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4 text-foreground">Investors</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
            <li><Link to="/auth?tab=signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4 text-foreground">Contact & Legal</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>support@zentrixfinance.com</li>
            <li>Telegram: @zentrixfinance</li>
            <li className="pt-2"><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li className="text-xs text-muted-foreground/70 pt-2">Network: USDT (BEP20 / BSC)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border pt-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zentrix Finance. All rights reserved. Trading involves risk. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  </footer>
);
