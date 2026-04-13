import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated successfully!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
      <div className="absolute top-4 left-4 z-10">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      <Card className="w-full max-w-md border-primary/10 shadow-gold relative z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <img src={logo} alt="Zentrix Finance" className="w-14 h-14 rounded-xl mx-auto mb-4" />
          <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl font-display text-gradient-gold">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isRecovery ? 'Enter your new password below' : 'Invalid or expired recovery link. Please request a new one.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">New Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="bg-background" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" className="bg-background" />
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <Link to="/auth">
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold">Go to Login</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
