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
import { Copy, TrendingUp, Wallet, ArrowDownToLine, Users, DollarSign, Clock, BarChart3, Percent, UserCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(43, 96%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(220, 70%, 50%)', 'hsl(0, 84%, 60%)'];

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
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

    if (profile?.referral_code) {
      const { data } = await supabase.from('profiles').select('full_name, email, created_at').eq('referred_by', user.id);
      setReferrals(data || []);
    }
  };

  const totalInvested = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount), 0), [investments]);
  const totalEarned = useMemo(() => earnings.reduce((s, e) => s + Number(e.amount), 0), [earnings]);
  const totalCommissions = useMemo(() => commissions.reduce((s, c) => s + Number(c.amount), 0), [commissions]);
  const totalWithdrawn = useMemo(() => withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0), [withdrawals]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0), [withdrawals]);
  const availableBalance = totalEarned + totalCommissions - totalWithdrawn - pendingWithdrawals;
  const dailyRate = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + (Number(i.amount) * 2) / 600, 0), [investments]);
  const expectedTotal = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount) * 2, 0), [investments]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    earnings.forEach(e => {
      grouped[e.earned_date] = (grouped[e.earned_date] || 0) + Number(e.amount);
    });
    let cumulative = 0;
    return Object.entries(grouped).map(([date, amount]) => {
      cumulative += amount;
      return { date, daily: amount, total: cumulative };
    });
  }, [earnings]);

  const pieData = useMemo(() => [
    { name: 'Earnings', value: totalEarned },
    { name: 'Commissions', value: totalCommissions },
    { name: 'Withdrawn', value: totalWithdrawn },
    { name: 'Pending', value: pendingWithdrawals },
  ].filter(d => d.value > 0), [totalEarned, totalCommissions, totalWithdrawn, pendingWithdrawals]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(depositAmount);
    if (amt < 50) { toast.error('Minimum deposit is $50'); return; }
    if (amt % 50 !== 0) { toast.error('Amount must be a multiple of $50 (e.g. 50, 100, 150...)'); return; }
    if (!depositTxHash.trim()) { toast.error('Please enter BEP20 transaction hash'); return; }
    const { error } = await supabase.from('investments').insert({ user_id: user.id, amount: amt, tx_hash: depositTxHash.trim() });
    if (error) toast.error(error.message);
    else { toast.success('Deposit submitted! Awaiting admin confirmation.'); setDepositAmount(''); setDepositTxHash(''); fetchData(); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(withdrawAmount);
    if (amt < 20) { toast.error('Minimum withdrawal is $20'); return; }
    if (amt > availableBalance) { toast.error('Insufficient balance'); return; }
    if (!withdrawAddress.trim()) { toast.error('Please enter your BEP20 wallet address'); return; }
    const { error } = await supabase.from('withdrawals').insert({ user_id: user.id, amount: amt, wallet_address: withdrawAddress.trim() });
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal request submitted!'); setWithdrawAmount(''); setWithdrawAddress(''); fetchData(); }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success('Referral code copied!');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    };
    return <Badge variant="outline" className={colors[status] || 'border-border text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        {/* Header */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-gold-subtle border border-primary/10">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 text-foreground">
            Welcome, <span className="text-gradient-gold">{profile?.full_name || 'Investor'}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm">Track your portfolio & earnings • USDT BEP20 Network</p>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${totalInvested.toFixed(2)}`, color: 'text-primary' },
            { icon: TrendingUp, label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, color: 'text-emerald-500' },
            { icon: Wallet, label: 'Available Balance', value: `$${availableBalance.toFixed(2)}`, color: 'text-primary' },
            { icon: BarChart3, label: 'Daily Earning', value: `$${dailyRate.toFixed(2)}`, color: 'text-emerald-500' },
            { icon: ArrowDownToLine, label: 'Total Withdrawn', value: `$${totalWithdrawn.toFixed(2)}`, color: 'text-muted-foreground' },
            { icon: Percent, label: 'Expected Return', value: `$${expectedTotal.toFixed(0)}`, color: 'text-primary' },
          ].map((item, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                </div>
                <div className={`text-lg font-display font-bold ${item.color}`}>{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="md:col-span-2 border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Portfolio Growth</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                      <Area type="monotone" dataKey="total" stroke="hsl(43, 96%, 56%)" fill="url(#goldGrad)" strokeWidth={2} name="Total Earned" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No earnings data yet. Invest to start growing!</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Balance Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                )}
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deposit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="investments">My Investments</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Deposit USDT (BEP20)</CardTitle></CardHeader>
                <CardContent>
                  {siteSettings?.usdt_address && (
                    <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border text-center">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Send USDT via BEP20 (BSC) Network to:</p>
                      <p className="text-sm font-mono break-all font-medium text-foreground mb-3">{siteSettings.usdt_address}</p>
                      <Button variant="outline" size="sm" className="border-primary/20" onClick={() => { navigator.clipboard.writeText(siteSettings.usdt_address); toast.success('Address copied!'); }}>
                        <Copy className="w-3 h-3 mr-1" /> Copy Address
                      </Button>
                      <p className="text-[10px] text-destructive mt-2">⚠️ Only send USDT on BEP20 network. Other networks may result in lost funds.</p>
                    </div>
                  )}
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Amount (USDT) — Multiples of $50 only</Label>
                      <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="e.g. 50, 100, 150, 200..." min="50" step="50" required className="bg-background" />
                      <p className="text-[10px] text-muted-foreground">Minimum: $50 • Must be multiple of $50</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Transaction Hash (BEP20)</Label>
                      <Input value={depositTxHash} onChange={e => setDepositTxHash(e.target.value)} placeholder="Paste your BEP20 tx hash" required className="bg-background" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold">Submit Deposit</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Recent Deposits</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {investments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No deposits yet</p>
                    ) : investments.slice(0, 8).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div>
                          <p className="font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</p>
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
                <CardHeader><CardTitle className="text-base font-display text-foreground">Withdraw Funds</CardTitle></CardHeader>
                <CardContent>
                  <div className="mb-6 p-5 rounded-xl bg-gradient-gold-subtle border border-primary/10 text-center">
                    <p className="text-xs text-muted-foreground font-medium">Available Balance</p>
                    <p className="text-3xl font-display font-bold text-gradient-gold">${availableBalance.toFixed(2)}</p>
                    {availableBalance < 20 && <p className="text-xs text-destructive mt-1">Minimum $20 required for withdrawal</p>}
                  </div>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Amount (USDT)</Label>
                      <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Min $20" min="20" required className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">USDT Wallet Address (BEP20)</Label>
                      <Input value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="Your BEP20 USDT wallet address" required className="bg-background" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={availableBalance < 20}>
                      {availableBalance < 20 ? 'Insufficient Balance' : 'Request Withdrawal'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">Withdrawals processed within 5 hours via BEP20 network</p>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Withdrawal History</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {withdrawals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No withdrawals yet</p>
                    ) : withdrawals.map(wd => (
                      <div key={wd.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div>
                          <p className="font-semibold text-foreground">${Number(wd.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(wd.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{wd.wallet_address}</p>
                        </div>
                        <div className="text-right">
                          {statusBadge(wd.status)}
                          {wd.rejection_reason && <p className="text-[10px] text-destructive mt-1">{wd.rejection_reason}</p>}
                        </div>
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
              <CardHeader><CardTitle className="text-base font-display text-foreground">My Investments</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Daily Return</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Days Paid</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Total Expected</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map(inv => (
                        <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="p-3 font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                          <td className="p-3 text-primary font-medium">${((Number(inv.amount) * 2) / 600).toFixed(4)}/day</td>
                          <td className="p-3 text-muted-foreground">{inv.days_paid || 0} / 600</td>
                          <td className="p-3 text-foreground font-medium">${(Number(inv.amount) * 2).toFixed(2)}</td>
                          <td className="p-3">{statusBadge(inv.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {investments.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No investments yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Your Referral Program</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-5 rounded-xl bg-gradient-gold-subtle border border-primary/10 mb-6 text-center">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Share this code to earn 10% instant commission:</p>
                    <div className="text-3xl font-display font-bold text-gradient-gold tracking-widest mb-3">{profile?.referral_code || '---'}</div>
                    <Button variant="outline" size="sm" className="border-primary/20" onClick={copyReferralCode}>
                      <Copy className="w-3 h-3 mr-1" /> Copy Code
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-3">New investor enters this code during signup → You get 10% of their investment instantly!</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                      <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-display font-bold text-foreground">{referrals.length}</div>
                      <div className="text-xs text-muted-foreground">Total Referrals</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                      <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-display font-bold text-gradient-gold">${totalCommissions.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Commission Earned</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Referred Investors</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {referrals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No referrals yet. Share your code to earn!</p>
                    ) : referrals.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{r.full_name || 'Investor'}</p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Active</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Commission History */}
                  {commissions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="text-sm font-display font-semibold text-foreground mb-3">Commission History</h4>
                      <div className="space-y-2">
                        {commissions.slice(0, 10).map((c, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg text-sm">
                            <span className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                            <span className="text-emerald-500 font-semibold">+${Number(c.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Transaction History</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Type</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-right p-3 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-right p-3 text-muted-foreground font-medium text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...investments.map(i => ({ type: 'Deposit', amount: Number(i.amount), date: i.created_at, status: i.status })),
                        ...withdrawals.map(w => ({ type: 'Withdrawal', amount: -Number(w.amount), date: w.created_at, status: w.status })),
                        ...commissions.map(c => ({ type: 'Referral', amount: Number(c.amount), date: c.created_at, status: 'confirmed' })),
                      ]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((tx, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {tx.type === 'Deposit' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                                {tx.type === 'Withdrawal' && <ArrowDownToLine className="w-3.5 h-3.5 text-red-500" />}
                                {tx.type === 'Referral' && <Users className="w-3.5 h-3.5 text-primary" />}
                                <span className="font-medium text-foreground">{tx.type}</span>
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className={`p-3 text-right font-semibold ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                            </td>
                            <td className="p-3 text-right">{statusBadge(tx.status)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {investments.length === 0 && withdrawals.length === 0 && commissions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>
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
