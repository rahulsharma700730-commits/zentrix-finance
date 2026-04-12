import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Z</span>
          </div>
          <span className="font-display text-xl font-bold text-gradient-gold">Zentrix Finance</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">How It Works</a>
              <a href="#calculator" className="text-sm text-muted-foreground hover:text-primary transition-colors">Calculator</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</a>
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate('/auth')}>Login</Button>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={() => navigate('/auth?tab=signup')}>
                Start Investing
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => { signOut(); navigate('/'); }}>Logout</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          {!user ? (
            <>
              <a href="#how-it-works" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>How It Works</a>
              <a href="#calculator" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>Calculator</a>
              <a href="#faq" className="block text-sm text-muted-foreground" onClick={() => setOpen(false)}>FAQ</a>
              <Button className="w-full" variant="outline" onClick={() => { navigate('/auth'); setOpen(false); }}>Login</Button>
              <Button className="w-full bg-gradient-gold text-primary-foreground" onClick={() => { navigate('/auth?tab=signup'); setOpen(false); }}>Start Investing</Button>
            </>
          ) : (
            <>
              <Button className="w-full" variant="outline" onClick={() => { navigate(isAdmin ? '/admin' : '/dashboard'); setOpen(false); }}>Dashboard</Button>
              <Button className="w-full" variant="ghost" onClick={() => { signOut(); navigate('/'); setOpen(false); }}>Logout</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
