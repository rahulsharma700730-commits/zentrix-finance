import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Zentrix Finance" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-xl font-bold text-gradient-gold">Zentrix Finance</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-5">
          {!user ? (
            <>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('nav.howItWorks')}</a>
              <a href="#calculator" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('nav.calculator')}</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t('nav.faq')}</a>
              <LanguageToggle variant="inline" />
              <ThemeToggle />
              <Button variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10" onClick={() => navigate('/auth')}>{t('nav.login')}</Button>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold" onClick={() => navigate('/auth?tab=signup')}>
                {t('nav.startInvesting')}
              </Button>
            </>
          ) : (
            <>
              <LanguageToggle variant="inline" />
              <ThemeToggle />
              <Button variant="outline" className="border-primary/30" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                {t('nav.dashboard')}
              </Button>
              <Button variant="ghost" className="text-muted-foreground" onClick={() => { signOut(); navigate('/'); }}>{t('nav.logout')}</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/50 glass p-4 space-y-3">
          {!user ? (
            <>
              <a href="#how-it-works" className="block text-sm text-foreground font-medium" onClick={() => setOpen(false)}>{t('nav.howItWorks')}</a>
              <a href="#calculator" className="block text-sm text-foreground font-medium" onClick={() => setOpen(false)}>{t('nav.calculator')}</a>
              <a href="#faq" className="block text-sm text-foreground font-medium" onClick={() => setOpen(false)}>{t('nav.faq')}</a>
              <Button className="w-full" variant="outline" onClick={() => { navigate('/auth'); setOpen(false); }}>{t('nav.login')}</Button>
              <Button className="w-full bg-gradient-gold text-primary-foreground" onClick={() => { navigate('/auth?tab=signup'); setOpen(false); }}>{t('nav.startInvesting')}</Button>
            </>
          ) : (
            <>
              <Button className="w-full" variant="outline" onClick={() => { navigate(isAdmin ? '/admin' : '/dashboard'); setOpen(false); }}>{t('nav.dashboard')}</Button>
              <Button className="w-full" variant="ghost" onClick={() => { signOut(); navigate('/'); setOpen(false); }}>{t('nav.logout')}</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
