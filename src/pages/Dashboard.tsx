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
import { Copy, TrendingUp, Wallet, ArrowDownToLine, Users, DollarSign, Clock, BarChart3, Percent, UserCheck, Bell, MessageSquare, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const CHART_COLORS = ['hsl(43, 96%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(220, 70%, 50%)', 'hsl(0, 84%, 60%)'];

const Dashboard = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [editingWallet, setEditingWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [inv, earn, wd, comm, settings, notifs, tix] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('daily_earnings').select('*').eq('user_id', user.id).order('earned_date', { ascending: true }),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('referral_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
      supabase.from('notifications').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setInvestments(inv.data || []);
    setEarnings(earn.data || []);
    setWithdrawals(wd.data || []);
    setCommissions(comm.data || []);
    setSiteSettings(settings.data);
    setNotifications(notifs.data || []);
    setTickets(tix.data || []);

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
  const cappingPercent = expectedTotal > 0 ? Math.min(((totalEarned + totalCommissions) / expectedTotal) * 100, 100) : 0;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  // Capping chart data per investment
  const cappingData = useMemo(() =>
    investments.filter(i => i.status === 'confirmed').map(inv => {
      const target = Number(inv.amount) * 2;
      const earned = earnings.filter(e => e.investment_id === inv.id).reduce((s, e) => s + Number(e.amount), 0);
      return { name: `$${Number(inv.amount)}`, earned, remaining: Math.max(target - earned, 0), target, pct: target > 0 ? ((earned / target) * 100).toFixed(1) : '0' };
    }), [investments, earnings]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    earnings.forEach(e => { grouped[e.earned_date] = (grouped[e.earned_date] || 0) + Number(e.amount); });
    let cumulative = 0;
    return Object.entries(grouped).map(([date, amount]) => { cumulative += amount; return { date, daily: amount, total: cumulative }; });
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
    if (amt % 50 !== 0) { toast.error('Amount must be a multiple of $50'); return; }
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
    const addr = profile?.wallet_address;
    if (!addr) { toast.error('Please set your withdrawal wallet address first in the Settings section'); return; }
    const { error } = await supabase.from('withdrawals').insert({ user_id: user.id, amount: amt, wallet_address: addr });
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal request submitted!'); setWithdrawAmount(''); fetchData(); }
  };

  const handleUpdateWallet = async () => {
    if (!user || !newWalletAddress.trim()) { toast.error('Enter a valid wallet address'); return; }
    const { error } = await supabase.from('profiles').update({ wallet_address: newWalletAddress.trim() }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else { toast.success('Wallet address updated!'); setEditingWallet(false); setNewWalletAddress(''); refreshProfile(); }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!ticketSubject.trim() || !ticketMessage.trim()) { toast.error('Fill all fields'); return; }
    const { error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: ticketSubject.trim(), message: ticketMessage.trim() });
    if (error) toast.error(error.message);
    else { toast.success('Support ticket submitted!'); setTicketSubject(''); setTicketMessage(''); fetchData(); }
  };

  const markNotifRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchData();
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) { navigator.clipboard.writeText(profile.referral_code); toast.success('Referral code copied!'); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      open: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      closed: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={colors[status] || 'border-border text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        {/* Header */}
        <div className="mb-6 p-6 rounded-2xl bg-gradient-gold-subtle border border-primary/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 text-foreground">
                Welcome, <span className="text-gradient-gold">{profile?.full_name || 'Investor'}</span> 👋
              </h1>
              <p className="text-muted-foreground text-sm">USDT BEP20 Network • Wallet: <span className="font-mono text-xs">{profile?.wallet_address || 'Not set'}</span></p>
            </div>
            {unreadNotifs > 0 && (
              <Badge className="bg-destructive text-destructive-foreground"><Bell className="w-3 h-3 mr-1" /> {unreadNotifs} new notification{unreadNotifs > 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>

        {/* Rejected deposits alert */}
        {investments.filter(i => i.status === 'rejected').length > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Some deposits were rejected</p>
                {investments.filter(i => i.status === 'rejected').map(inv => (
                  <p key={inv.id} className="text-xs text-muted-foreground mt-1">
                    ${Number(inv.amount).toFixed(2)} on {new Date(inv.created_at).toLocaleDateString()}
                    {inv.tx_hash && <span className="font-mono"> — TX: {inv.tx_hash.slice(0, 20)}...</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${totalInvested.toFixed(2)}`, color: 'text-primary' },
            { icon: TrendingUp, label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, color: 'text-emerald-500' },
            { icon: Wallet, label: 'Available Balance', value: `$${availableBalance.toFixed(2)}`, color: 'text-primary' },
            { icon: BarChart3, label: 'Daily Earning', value: `$${dailyRate.toFixed(2)}`, color: 'text-emerald-500' },
            { icon: ArrowDownToLine, label: 'Total Withdrawn', value: `$${totalWithdrawn.toFixed(2)}`, color: 'text-muted-foreground' },
            { icon: Percent, label: 'Capping (200%)', value: `${cappingPercent.toFixed(1)}%`, color: 'text-primary' },
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

        {/* Capping Progress */}
        {totalInvested > 0 && (
          <Card className="border-border mb-6">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Investment Capping Status (200% Return)</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Earned: ${(totalEarned + totalCommissions).toFixed(2)}</span>
                  <span>Target: ${expectedTotal.toFixed(2)}</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" style={{ width: `${cappingPercent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">{cappingPercent.toFixed(1)}% of 200% cap reached</p>
              </div>
              {cappingData.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cappingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="earned" stackId="a" fill="hsl(43, 96%, 56%)" name="Earned" radius={[0,0,0,0]} />
                      <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" name="Remaining" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="md:col-span-2 border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Portfolio Growth</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                      <Area type="monotone" dataKey="total" stroke="hsl(43, 96%, 56%)" fill="url(#goldGrad)" strokeWidth={2} name="Total Earned" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No earnings data yet</div>}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Balance Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} /></PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 lg:w-auto lg:inline-grid">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="notifications">Alerts {unreadNotifs > 0 && <Badge className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1 py-0">{unreadNotifs}</Badge>}</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                      {siteSettings.qr_code_url && (
                        <img src={siteSettings.qr_code_url} alt="QR Code" className="w-40 h-40 mx-auto my-3 rounded-lg border border-border" />
                      )}
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
                      <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="e.g. 50, 100, 150..." min="50" step="50" required className="bg-background" />
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
                    {investments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No deposits yet</p> :
                      investments.slice(0, 8).map(inv => (
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
                    {availableBalance < 20 && <p className="text-xs text-destructive mt-1">Minimum $20 required</p>}
                  </div>
                  {!profile?.wallet_address ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-foreground font-medium mb-2">Set your withdrawal wallet first</p>
                      <p className="text-xs text-muted-foreground mb-3">Go to the Settings tab to add your BEP20 wallet address.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleWithdraw} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Amount (USDT)</Label>
                        <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Min $20" min="20" required className="bg-background" />
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground">Withdrawal to:</p>
                        <p className="text-sm font-mono text-foreground break-all">{profile.wallet_address}</p>
                      </div>
                      <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" disabled={availableBalance < 20}>
                        {availableBalance < 20 ? 'Insufficient Balance' : 'Request Withdrawal'}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">Withdrawals processed within 5 hours via BEP20</p>
                    </form>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Withdrawal History</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {withdrawals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No withdrawals yet</p> :
                      withdrawals.map(wd => (
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
                    <thead><tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Amount</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Daily Return</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Days Paid</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Total Expected</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                    </tr></thead>
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
                    <Button variant="outline" size="sm" className="border-primary/20" onClick={copyReferralCode}><Copy className="w-3 h-3 mr-1" /> Copy Code</Button>
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
                    {referrals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No referrals yet. Share your code!</p> :
                      referrals.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><UserCheck className="w-4 h-4 text-primary" /></div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{r.full_name || 'Investor'}</p>
                              <p className="text-xs text-muted-foreground">{r.email}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                  </div>
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
                    <thead><tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Type</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                      <th className="text-right p-3 text-muted-foreground font-medium text-xs">Amount</th>
                      <th className="text-right p-3 text-muted-foreground font-medium text-xs">Status</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ...investments.map(i => ({ type: 'Deposit', amount: Number(i.amount), date: i.created_at, status: i.status })),
                        ...withdrawals.map(w => ({ type: 'Withdrawal', amount: -Number(w.amount), date: w.created_at, status: w.status })),
                        ...commissions.map(c => ({ type: 'Referral', amount: Number(c.amount), date: c.created_at, status: 'confirmed' })),
                      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3"><div className="flex items-center gap-2">
                            {tx.type === 'Deposit' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                            {tx.type === 'Withdrawal' && <ArrowDownToLine className="w-3.5 h-3.5 text-red-500" />}
                            {tx.type === 'Referral' && <Users className="w-3.5 h-3.5 text-primary" />}
                            <span className="font-medium text-foreground">{tx.type}</span>
                          </div></td>
                          <td className="p-3 text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className={`p-3 text-right font-semibold ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}</td>
                          <td className="p-3 text-right">{statusBadge(tx.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {investments.length === 0 && withdrawals.length === 0 && commissions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications & Alerts</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p> :
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-xl border ${n.is_read ? 'bg-muted/30 border-border' : 'bg-primary/5 border-primary/20'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground text-sm">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                          {!n.is_read && <Button size="sm" variant="outline" className="text-xs h-6 px-2 shrink-0" onClick={() => markNotifRead(n.id)}>Mark Read</Button>}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Raise a Ticket</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Subject</Label>
                      <Input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Brief description of your issue" required className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Message</Label>
                      <textarea value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Describe your issue in detail..." required className="w-full p-3 rounded-md border border-input bg-background text-foreground text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold"><MessageSquare className="w-4 h-4 mr-2" /> Submit Ticket</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">My Tickets</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tickets.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No support tickets yet</p> :
                      tickets.map(t => (
                        <div key={t.id} className="p-4 rounded-xl border border-border bg-muted/30">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-foreground text-sm">{t.subject}</p>
                            {statusBadge(t.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{t.message}</p>
                          {t.admin_reply && (
                            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="text-[10px] text-primary font-medium mb-1">Admin Reply:</p>
                              <p className="text-xs text-foreground">{t.admin_reply}</p>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">{new Date(t.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-border max-w-lg">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Account Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-foreground text-sm font-medium mb-2 block">Profile Info</Label>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                    <p className="text-sm text-foreground"><strong>Name:</strong> {profile?.full_name}</p>
                    <p className="text-sm text-foreground"><strong>Email:</strong> {profile?.email}</p>
                    <p className="text-sm text-foreground"><strong>Referral Code:</strong> <span className="text-primary font-mono">{profile?.referral_code}</span></p>
                    <p className="text-sm text-foreground"><strong>Joined:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground text-sm font-medium mb-2 block">Withdrawal Wallet Address (BEP20)</Label>
                  {!editingWallet ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm font-mono text-foreground break-all">{profile?.wallet_address || 'Not set'}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setEditingWallet(true); setNewWalletAddress(profile?.wallet_address || ''); }}>
                        {profile?.wallet_address ? 'Change' : 'Add'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input value={newWalletAddress} onChange={e => setNewWalletAddress(e.target.value)} placeholder="Enter your BEP20 USDT wallet address" className="bg-background font-mono text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={handleUpdateWallet}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingWallet(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">This address will be used for all your withdrawals.</p>
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
