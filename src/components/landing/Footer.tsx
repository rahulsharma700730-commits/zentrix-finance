import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/LanguageToggle';
import logo from '@/assets/logo.png';

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logo} alt="Zentrix Finance" className="w-8 h-8 rounded-lg" loading="lazy" />
              <span className="font-display text-xl font-bold text-gradient-gold">Zentrix Finance</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t('footer.tagline')}</p>
            <LanguageToggle variant="inline" />
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-foreground">{t('footer.quick')}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">{t('nav.howItWorks')}</a></li>
              <li><a href="#calculator" className="hover:text-primary transition-colors">{t('footer.calc')}</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">{t('nav.faq')}</a></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-foreground">{t('footer.investors')}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary transition-colors">{t('footer.login')}</Link></li>
              <li><Link to="/auth?tab=signup" className="hover:text-primary transition-colors">{t('footer.signup')}</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t('footer.dashboard')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-foreground">{t('footer.contactLegal')}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>support@zentrixfinance.com</li>
              <li>Telegram: @zentrixfinance</li>
              <li className="pt-2"><Link to="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
              <li className="text-xs text-muted-foreground/70 pt-2">{t('footer.network')}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">{t('footer.rights', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
};
