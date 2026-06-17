import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ArrowLeft, Eye, EyeOff, Shield, TrendingUp, Zap, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';

type SignupStage = 'email' | 'code';
type ResetStage = 'email' | 'code';

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup
  const [signupStage, setSignupStage] = useState<SignupStage>('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupReferral, setSignupReferral] = useState(searchParams.get('ref') || '');

  // Forgot
  const [showForgot, setShowForgot] = useState(false);
  const [resetStage, setResetStage] = useState<ResetStage>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { signIn, user, isAdmin } = useAuth();
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

  // --- Signup ---
  const sendSignupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim()) { toast.error(t('auth.toast.needEmail')); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email: signupEmail.trim(), purpose: 'signup' },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Failed to send code');
      return;
    }
    toast.success('We sent a 6-digit code to your email');
    setSignupStage('code');
  };

  const completeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupCode.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    if (!signupName.trim()) { toast.error('Please enter your full name'); return; }
    if (signupPassword.length < 6) { toast.error(t('auth.toast.passMin')); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-signup', {
      body: {
        email: signupEmail.trim(),
        code: signupCode,
        password: signupPassword,
        fullName: signupName.trim(),
        referralCode: signupReferral.trim() || undefined,
      },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Verification failed');
      setLoading(false);
      return;
    }
    // Auto sign-in
    const { error: signErr } = await signIn(signupEmail.trim(), signupPassword);
    setLoading(false);
    if (signErr) {
      toast.success('Account created. Please log in.');
      setTab('login');
      setEmail(signupEmail.trim());
    } else {
      toast.success('Welcome to Zentrix Finance!');
    }
  };

  // --- Forgot ---
  const sendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) { toast.error(t('auth.toast.needEmail')); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email: resetEmail.trim(), purpose: 'password_reset' },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Failed to send code');
      return;
    }
    toast.success('If an account exists, a 6-digit code has been sent');
    setResetStage('code');
  };

  const completeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    if (resetPassword.length < 6) { toast.error(t('auth.toast.passMin')); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-reset', {
      body: { email: resetEmail.trim(), code: resetCode, newPassword: resetPassword },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Reset failed');
      return;
    }
    toast.success('Password updated. Please log in.');
    setShowForgot(false);
    setResetStage('email');
    setResetCode('');
    setResetPassword('');
    setEmail(resetEmail.trim());
    setTab('login');
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
              {resetStage === 'email' ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Enter your email — we'll send a 6-digit code.</p>
                  <form onSubmit={sendResetCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t('auth.email')}</Label>
                      <Input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder={t('auth.emailPh')} className="bg-background" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                      {loading ? t('auth.sending') : 'Send code'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => { setShowForgot(false); setResetStage('email'); }}>{t('auth.backLogin')}</Button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Code sent to <span className="text-foreground">{resetEmail}</span></p>
                  <form onSubmit={completeReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">6-digit code</Label>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={resetCode} onChange={setResetCode}>
                          <InputOTPGroup>
                            {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">New password</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} value={resetPassword} onChange={e => setResetPassword(e.target.value)} required placeholder={t('auth.passMinPh')} className="bg-background" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                      {loading ? 'Updating…' : 'Update password'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setResetStage('email')}>Use a different email</Button>
                  </form>
                </>
              )}
            </div>
          ) : (
            <>
              <Tabs value={tab} onValueChange={(v) => { setTab(v); setSignupStage('email'); }}>
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
                  {signupStage === 'email' ? (
                    <form onSubmit={sendSignupCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">{t('auth.email')}</Label>
                        <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder={t('auth.emailPh')} className="bg-background" />
                        <p className="text-xs text-muted-foreground">We'll send a 6-digit verification code to this email.</p>
                      </div>
                      <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                        {loading ? t('auth.sending') : 'Send verification code'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={completeSignup} className="space-y-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" /> Code sent to <span className="text-foreground truncate">{signupEmail}</span>
                      </p>
                      <div className="space-y-2">
                        <Label className="text-foreground">6-digit code</Label>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={signupCode} onChange={setSignupCode}>
                            <InputOTPGroup>
                              {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">{t('auth.fullName')}</Label>
                        <Input value={signupName} onChange={e => setSignupName(e.target.value)} required placeholder={t('auth.namePh')} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">{t('auth.password')}</Label>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required placeholder={t('auth.passMinPh')} className="bg-background" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">{t('auth.refCode')} <span className="text-muted-foreground font-normal">{t('auth.optional')}</span></Label>
                        <Input value={signupReferral} onChange={e => setSignupReferral(e.target.value)} placeholder={t('auth.refPh')} className="bg-background" />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                        {loading ? t('auth.creating') : t('auth.createBtn')}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => { setSignupStage('email'); setSignupCode(''); }}>Use a different email</Button>
                    </form>
                  )}
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
