import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, TrendingUp, Wallet, ArrowDownToLine, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [inv, earn, wd, comm, settings] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('daily_earnings').select('*').eq('user_id', user.id).order('earned_date', { ascending: true }),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('referral_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
    ]);
    setInvestments(inv.data || []);
    setEarnings(earn.data || []);
    setWithdrawals(wd.data || []);
    setCommissions(comm.data || []);
    setSiteSettings(settings.data);

    // Fetch referrals
    if (profile?.referral_code) {
      const { data } = await supabase.from('profiles').select('full_name, email, created_at').eq('referred_by', user.id);
      setReferrals(data || []);
    }
  };

  // Calculations
  const totalInvested = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount), 0), [investments]);
  const totalEarned = useMemo(() => earnings.reduce((s, e) => s + Number(e.amount), 0), [earnings]);
  const totalCommissions = useMemo(() => commissions.reduce((s, c) => s + Number(c.amount), 0), [commissions]);
  const totalWithdrawn = useMemo(() => withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0), [withdrawals]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0), [withdrawals]);
  const availableBalance = totalEarned + totalCommissions - totalWithdrawn - pendingWithdrawals;

  // Simulate daily returns for confirmed investments
  const currentValue = useMemo(() => {
    return investments.filter(i => i.status === 'confirmed').reduce((sum, inv) => {
      const dailyReturn = (Number(inv.amount) * 2) / 600;
      const daysSinceConfirm = inv.confirmed_at ? Math.floor((Date.now() - new Date(inv.confirmed_at).getTime()) / 86400000) : 0;
      const earned = Math.min(daysSinceConfirm * dailyReturn, Number(inv.amount) * 2);
      return sum + earned;
    }, 0);
  }, [investments]);

  // Chart data
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    earnings.forEach(e => {
      const date = e.earned_date;
      grouped[date] = (grouped[date] || 0) + Number(e.amount);
    });
    let cumulative = 0;
    return Object.entries(grouped).map(([date, amount]) => {
      cumulative += amount;
      return { date, daily: amount, total: cumulative };
    });
  }, [earnings]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(depositAmount);
    if (amt <= 0) { toast.error('Enter a valid amount'); return; }

    const { error } = await supabase.from('investments').insert({
      user_id: user.id,
      amount: amt,
      tx_hash: depositTxHash,
    });
    if (error) toast.error(error.message);
    else { toast.success('Deposit submitted! Awaiting admin confirmation.'); setDepositAmount(''); setDepositTxHash(''); fetchData(); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(withdrawAmount);
    if (amt < 20) { toast.error('Minimum withdrawal is $20'); return; }
    if (amt > availableBalance) { toast.error('Insufficient balance'); return; }

    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      amount: amt,
      wallet_address: withdrawAddress,
    });
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal request submitted!'); setWithdrawAmount(''); setWithdrawAddress(''); fetchData(); }
  };

  const copyReferralLink = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?tab=signup&ref=${profile.referral_code}`);
      toast.success('Referral link copied!');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-500', confirmed: 'bg-green-500/20 text-green-500', approved: 'bg-green-500/20 text-green-500', rejected: 'bg-red-500/20 text-red-500', completed: 'bg-blue-500/20 text-blue-500' };
    return <Badge className={colors[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Welcome, <span className="text-gradient-gold">{profile?.full_name || 'Investor'}</span></h1>
          <p className="text-muted-foreground">Track your investments and earnings in real-time.</p>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${totalInvested.toFixed(2)}`, color: 'text-primary' },
            { icon: TrendingUp, label: 'Current Value', value: `$${currentValue.toFixed(2)}`, color: 'text-green-500' },
            { icon: Wallet, label: 'Available Balance', value: `$${availableBalance.toFixed(2)}`, color: 'text-primary' },
            { icon: ArrowDownToLine, label: 'Total Withdrawn', value: `$${totalWithdrawn.toFixed(2)}`, color: 'text-muted-foreground' },
          ].map((item, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Growth Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Portfolio Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="total" stroke="hsl(43, 96%, 56%)" fill="url(#goldGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="deposit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Deposit USDT</CardTitle>
                </CardHeader>
                <CardContent>
                  {siteSettings?.usdt_address && (
                    <div className="mb-6 p-4 rounded-xl bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-2">Send USDT (TRC20) to:</p>
                      <p className="text-sm font-mono break-all font-medium mb-2">{siteSettings.usdt_address}</p>
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(siteSettings.usdt_address); toast.success('Address copied!'); }}>
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                  )}
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount (USDT)</Label>
                      <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Enter amount" min="1" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Transaction Hash</Label>
                      <Input value={depositTxHash} onChange={e => setDepositTxHash(e.target.value)} placeholder="Paste your tx hash" required />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">Submit Deposit</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Recent Deposits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No deposits yet</p>
                    ) : investments.slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium">${Number(inv.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                        </div>
                        {statusBadge(inv.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Withdraw Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-xl bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-gradient-gold">${availableBalance.toFixed(2)}</p>
                    {availableBalance < 20 && <p className="text-xs text-destructive mt-1">Minimum $20 required for withdrawal</p>}
                  </div>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount (USDT)</Label>
                      <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Min $20" min="20" required />
                    </div>
                    <div className="space-y-2">
                      <Label>USDT Wallet Address (TRC20)</Label>
                      <Input value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="Your USDT wallet address" required />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90" disabled={availableBalance < 20}>
                      {availableBalance < 20 ? 'Insufficient Balance' : 'Request Withdrawal'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Withdrawal History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {withdrawals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No withdrawals yet</p>
                    ) : withdrawals.slice(0, 5).map(wd => (
                      <div key={wd.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium">${Number(wd.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(wd.created_at).toLocaleDateString()}</p>
                        </div>
                        {statusBadge(wd.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">All Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground">Date</th>
                        <th className="text-left p-3 text-muted-foreground">Amount</th>
                        <th className="text-left p-3 text-muted-foreground">Daily Return</th>
                        <th className="text-left p-3 text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-muted-foreground">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map(inv => (
                        <tr key={inv.id} className="border-b border-border/50">
                          <td className="p-3">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="p-3 font-medium">${Number(inv.amount).toFixed(2)}</td>
                          <td className="p-3 text-primary">${((Number(inv.amount) * 2) / 600).toFixed(4)}/day</td>
                          <td className="p-3">{statusBadge(inv.status)}</td>
                          <td className="p-3 font-mono text-xs truncate max-w-[120px]">{inv.tx_hash || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {investments.length === 0 && <p className="text-center text-muted-foreground py-8">No investments yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Your Referral Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-muted mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Share this link to earn 10% commission:</p>
                    <p className="text-sm font-mono break-all mb-3">{window.location.origin}/auth?tab=signup&ref={profile?.referral_code}</p>
                    <Button variant="outline" size="sm" onClick={copyReferralLink}>
                      <Copy className="w-3 h-3 mr-1" /> Copy Link
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-muted">
                      <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-bold">{referrals.length}</div>
                      <div className="text-xs text-muted-foreground">Referrals</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted">
                      <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-bold text-gradient-gold">${totalCommissions.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Commission Earned</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Referred Investors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referrals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No referrals yet. Share your link to earn!</p>
                    ) : referrals.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium">{r.full_name || 'Investor'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    ...investments.map(i => ({ type: 'Deposit', amount: Number(i.amount), date: i.created_at, status: i.status })),
                    ...withdrawals.map(w => ({ type: 'Withdrawal', amount: -Number(w.amount), date: w.created_at, status: w.status })),
                    ...commissions.map(c => ({ type: 'Referral Commission', amount: Number(c.amount), date: c.created_at, status: 'confirmed' })),
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          {tx.type === 'Deposit' && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {tx.type === 'Withdrawal' && <ArrowDownToLine className="w-4 h-4 text-red-500" />}
                          {tx.type === 'Referral Commission' && <Users className="w-4 h-4 text-primary" />}
                          <div>
                            <p className="font-medium text-sm">{tx.type}</p>
                            <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                          </p>
                          {statusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                  {investments.length === 0 && withdrawals.length === 0 && commissions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
