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
import { ArrowLeft, Eye, EyeOff, Shield, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Auth = () => {
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
    else toast.success('Welcome back!');
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, referralCode || undefined);
    if (error) toast.error(error.message);
    else toast.success('Account created successfully! You can now login.');
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success('Password reset link sent to your email!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="absolute top-4 left-4 z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      <Card className="w-full max-w-md border-primary/10 shadow-gold relative z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <img src={logo} alt="Zentrix Finance" className="w-14 h-14 rounded-xl mx-auto mb-4" />
          <CardTitle className="text-2xl font-display text-gradient-gold">Zentrix Finance</CardTitle>
          <CardDescription className="text-muted-foreground">Secure Investment Portal — USDT BEP20</CardDescription>
        </CardHeader>
        <CardContent>
          {showForgot ? (
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Forgot Password</h3>
              <p className="text-sm text-muted-foreground mb-4">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder="investor@example.com" className="bg-background" />
                </div>
                <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowForgot(false)}>Back to Login</Button>
              </form>
            </div>
          ) : (
            <>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Email</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="investor@example.com" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="bg-background" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                    <button type="button" onClick={() => setShowForgot(true)} className="w-full text-sm text-primary hover:underline">Forgot Password?</button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Full Name</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Email</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="investor@example.com" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="bg-background" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Referral Code <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                      <Input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Enter referral code" className="bg-background" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="flex justify-center gap-6 mt-6 pt-5 border-t border-border">
                {[
                  { icon: Shield, label: 'Secure' },
                  { icon: TrendingUp, label: '200% ROI' },
                  { icon: Zap, label: 'BEP20' },
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
