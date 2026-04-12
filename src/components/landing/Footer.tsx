import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="py-16 bg-card border-t border-border">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Z</span>
            </div>
            <span className="font-display text-xl font-bold text-gradient-gold">Zentrix Finance</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">Professional forex trading fund delivering consistent daily returns to investors worldwide.</p>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#calculator" className="hover:text-primary transition-colors">ROI Calculator</a></li>
            <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4">Investors</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
            <li><Link to="/auth?tab=signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>support@zentrixfinance.com</li>
            <li>Telegram: @zentrixfinance</li>
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
