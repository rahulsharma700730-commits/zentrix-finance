import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    else toast.success('Account created! Please check your email to verify.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">Z</span>
          </div>
          <CardTitle className="text-2xl font-display text-gradient-gold">Zentrix Finance</CardTitle>
          <CardDescription>Secure investment portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="investor@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="investor@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Referral Code (Optional)</Label>
                  <Input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Enter referral code" />
                </div>
                <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
