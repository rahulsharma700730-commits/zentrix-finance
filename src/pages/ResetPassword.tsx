import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) setIsRecovery(true);
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t('auth.toast.passMin')); return; }
    if (password !== confirmPassword) { toast.error(t('auth.toast.passMismatch')); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success(t('auth.toast.passUpdated'));
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      <div className="absolute top-4 left-4 z-10">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> {t('auth.backLogin')}
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageToggle variant="inline" />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border-primary/10 shadow-gold relative z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <img src={logo} alt="Zentrix Finance" className="w-14 h-14 rounded-xl mx-auto mb-4" />
          <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl font-display text-gradient-gold">{t('auth.reset.title')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isRecovery ? t('auth.reset.newDesc') : t('auth.reset.invalid')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t('auth.reset.newPass')}</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.passMinPh')} className="bg-background" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('auth.reset.confirm')}</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder={t('auth.reset.confirmPh')} className="bg-background" />
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                {loading ? t('auth.reset.updating') : t('auth.reset.update')}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <Link to="/auth">
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold">{t('auth.reset.goLogin')}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
