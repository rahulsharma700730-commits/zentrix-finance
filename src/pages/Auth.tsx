import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ArrowLeft, Eye, EyeOff, Shield, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(isAdmin ? '/admin' : '/dashboard');
  }, [user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    else toast.success(t('auth.toast.welcome'));
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t('auth.toast.passMin')); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, referralCode || undefined);
    if (error) toast.error(error.message);
    else toast.success(t('auth.toast.created'));
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error(t('auth.toast.needEmail')); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(t('auth.toast.resetSent'));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="absolute top-4 left-4 z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> {t('auth.back')}
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageToggle variant="inline" />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border-primary/10 shadow-gold relative z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <img src={logo} alt="Zentrix Finance" className="w-14 h-14 rounded-xl mx-auto mb-4" />
          <CardTitle className="text-2xl font-display text-gradient-gold">{t('auth.title')}</CardTitle>
          <CardDescription className="text-muted-foreground">{t('auth.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {showForgot ? (
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{t('auth.forgotTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('auth.forgotDesc')}</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t('auth.email')}</Label>
                  <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder={t('auth.emailPh')} className="bg-background" />
                </div>
                <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                  {loading ? t('auth.sending') : t('auth.sendReset')}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowForgot(false)}>{t('auth.backLogin')}</Button>
              </form>
            </div>
          ) : (
            <>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t('auth.tabLogin')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('auth.tabSignup')}</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.email')}</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.emailPh')} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.password')}</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.passPh')} className="bg-background" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                      {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
                    </Button>
                    <button type="button" onClick={() => setShowForgot(true)} className="w-full text-sm text-primary hover:underline">{t('auth.forgot')}</button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.fullName')}</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder={t('auth.namePh')} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.email')}</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.emailPh')} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.password')}</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.passMinPh')} className="bg-background" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.refCode')} <span className="text-muted-foreground font-normal">{t('auth.optional')}</span></Label>
                      <Input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder={t('auth.refPh')} className="bg-background" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                      {loading ? t('auth.creating') : t('auth.createBtn')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="flex justify-center gap-6 mt-6 pt-5 border-t border-border">
                {[
                  { icon: Shield, label: t('auth.footerLabels.secure') },
                  { icon: TrendingUp, label: t('auth.footerLabels.roi') },
                  { icon: Zap, label: t('auth.footerLabels.bep') },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <item.icon className="w-4 h-4 text-primary mx-auto mb-0.5" />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
