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
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Ban, Unlock, BarChart3, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const CHART_COLORS = ['hsl(43, 96%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(220, 70%, 50%)'];

const AdminDashboard = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [pendingInvestments, setPendingInvestments] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [allInvestments, setAllInvestments] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [usdtAddress, setUsdtAddress] = useState('');
  const [stats, setStats] = useState({ totalInvested: 0, activeUsers: 0, totalPayouts: 0, pendingRequests: 0 });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin]);

  const fetchAll = async () => {
    const [usersRes, invRes, wdRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('investments').select('*, profiles!investments_user_id_fkey(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*, profiles!withdrawals_user_id_fkey(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
    ]);

    setUsers(usersRes.data || []);
    const invs = invRes.data || [];
    setAllInvestments(invs);
    setPendingInvestments(invs.filter((i: any) => i.status === 'pending'));
    const wds = wdRes.data || [];
    setAllWithdrawals(wds);
    setPendingWithdrawals(wds.filter((w: any) => w.status === 'pending'));
    setSiteSettings(settingsRes.data);
    setUsdtAddress(settingsRes.data?.usdt_address || '');

    setStats({
      totalInvested: invs.filter((i: any) => i.status === 'confirmed').reduce((s: number, i: any) => s + Number(i.amount), 0),
      activeUsers: (usersRes.data || []).filter((u: any) => !u.is_blocked).length,
      totalPayouts: wds.filter((w: any) => w.status === 'approved').reduce((s: number, w: any) => s + Number(w.amount), 0),
      pendingRequests: invs.filter((i: any) => i.status === 'pending').length + wds.filter((w: any) => w.status === 'pending').length,
    });
  };

  // Chart data
  const investmentByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    allInvestments.filter((i: any) => i.status === 'confirmed').forEach((inv: any) => {
      const month = new Date(inv.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      months[month] = (months[month] || 0) + Number(inv.amount);
    });
    return Object.entries(months).slice(-12).map(([month, amount]) => ({ month, amount }));
  }, [allInvestments]);

  const statusPieData = useMemo(() => {
    const confirmed = allInvestments.filter((i: any) => i.status === 'confirmed').length;
    const pending = allInvestments.filter((i: any) => i.status === 'pending').length;
    const rejected = allInvestments.filter((i: any) => i.status === 'rejected').length;
    return [
      { name: 'Confirmed', value: confirmed },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ].filter(d => d.value > 0);
  }, [allInvestments]);

  const confirmInvestment = async (inv: any) => {
    if (!user) return;
    const dailyReturn = (Number(inv.amount) * 2) / 600;
    const { error } = await supabase.from('investments').update({
      status: 'confirmed' as any, confirmed_by: user.id, confirmed_at: new Date().toISOString(), daily_return: dailyReturn,
    }).eq('id', inv.id);
    if (error) { toast.error(error.message); return; }

    const { data: investorProfile } = await supabase.from('profiles').select('referred_by').eq('user_id', inv.user_id).single();
    if (investorProfile?.referred_by) {
      const commission = Number(inv.amount) * 0.1;
      await supabase.from('referral_commissions').insert({ referrer_id: investorProfile.referred_by, referred_id: inv.user_id, investment_id: inv.id, amount: commission });
      await supabase.from('daily_earnings').insert({ user_id: investorProfile.referred_by, investment_id: inv.id, amount: commission, earned_date: new Date().toISOString().split('T')[0] });
    }
    toast.success('Investment confirmed!');
    fetchAll();
  };

  const rejectInvestment = async (id: string) => {
    const { error } = await supabase.from('investments').update({ status: 'rejected' as any }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Investment rejected'); fetchAll(); }
  };

  const approveWithdrawal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('withdrawals').update({ status: 'approved' as any, processed_by: user.id, processed_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Withdrawal approved!'); fetchAll(); }
  };

  const rejectWithdrawal = async (id: string) => {
    const { error } = await supabase.from('withdrawals').update({ status: 'rejected' as any, rejection_reason: 'Rejected by admin' }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Withdrawal rejected'); fetchAll(); }
  };

  const toggleBlockUser = async (profileId: string, currentBlocked: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !currentBlocked }).eq('id', profileId);
    if (error) toast.error(error.message); else { toast.success(currentBlocked ? 'User unblocked' : 'User blocked'); fetchAll(); }
  };

  const updateSettings = async () => {
    if (!siteSettings) return;
    const { error } = await supabase.from('site_settings').update({ usdt_address: usdtAddress }).eq('id', siteSettings.id);
    if (error) toast.error(error.message); else toast.success('Settings updated!');
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    };
    return <Badge variant="outline" className={colors[status] || 'border-border text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-1 text-foreground"><span className="text-gradient-gold">Admin</span> Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage investments, withdrawals, and users • USDT BEP20</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${stats.totalInvested.toFixed(2)}`, color: 'text-primary' },
            { icon: Users, label: 'Active Users', value: stats.activeUsers, color: 'text-foreground' },
            { icon: TrendingUp, label: 'Total Payouts', value: `$${stats.totalPayouts.toFixed(2)}`, color: 'text-emerald-500' },
            { icon: AlertTriangle, label: 'Pending', value: stats.pendingRequests, color: 'text-amber-500' },
          ].map((item, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                </div>
                <div className={`text-xl font-display font-bold ${item.color}`}>{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Investment Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                {investmentByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={investmentByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="amount" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} name="Investment ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display text-foreground">Investment Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {statusPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
                <div className="flex flex-wrap gap-3 justify-center mt-1">
                  {statusPieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending-investments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending-investments">Deposits ({pendingInvestments.length})</TabsTrigger>
            <TabsTrigger value="pending-withdrawals">Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="all-transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Pending Investments */}
          <TabsContent value="pending-investments">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Pending Deposit Confirmations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvestments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No pending deposits</p>
                  ) : pendingInvestments.map((inv: any) => (
                    <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 border border-border gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{(inv as any).profiles?.full_name || 'Unknown'} — <span className="text-primary font-bold">${Number(inv.amount).toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground">TX: {inv.tx_hash || 'N/A'} • {new Date(inv.created_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Email: {(inv as any).profiles?.email || '-'}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={() => confirmInvestment(inv)}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectInvestment(inv.id)}>
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Withdrawals */}
          <TabsContent value="pending-withdrawals">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Pending Withdrawal Requests</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingWithdrawals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No pending withdrawals</p>
                  ) : pendingWithdrawals.map((wd: any) => (
                    <div key={wd.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 border border-border gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{(wd as any).profiles?.full_name || 'Unknown'} — <span className="text-primary font-bold">${Number(wd.amount).toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground">To: <span className="font-mono">{wd.wallet_address}</span></p>
                        <p className="text-xs text-muted-foreground">{new Date(wd.created_at).toLocaleString()} • {(wd as any).profiles?.email || '-'}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={() => approveWithdrawal(wd.id)}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectWithdrawal(wd.id)}>
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">All Users ({users.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Name</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Email</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Wallet</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Referral Code</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Joined</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{u.full_name || '-'}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{u.wallet_address || '-'}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{u.referral_code}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={u.is_blocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}>
                              {u.is_blocked ? 'Blocked' : 'Active'}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleBlockUser(u.id, u.is_blocked)}>
                              {u.is_blocked ? <><Unlock className="w-3 h-3 mr-1" /> Unblock</> : <><Ban className="w-3 h-3 mr-1" /> Block</>}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Transactions */}
          <TabsContent value="all-transactions">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">All Transactions</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Type</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">User</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-right p-3 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-right p-3 text-muted-foreground font-medium text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...allInvestments.map((i: any) => ({ type: 'Deposit', user: (i as any).profiles?.full_name || 'Unknown', email: (i as any).profiles?.email || '', amount: Number(i.amount), date: i.created_at, status: i.status })),
                        ...allWithdrawals.map((w: any) => ({ type: 'Withdrawal', user: (w as any).profiles?.full_name || 'Unknown', email: (w as any).profiles?.email || '', amount: Number(w.amount), date: w.created_at, status: w.status })),
                      ]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 100)
                        .map((tx, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <Badge variant="outline" className={tx.type === 'Deposit' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}>
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <p className="font-medium text-foreground text-xs">{tx.user}</p>
                              <p className="text-[10px] text-muted-foreground">{tx.email}</p>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">{new Date(tx.date).toLocaleString()}</td>
                            <td className="p-3 text-right font-semibold text-foreground">${tx.amount.toFixed(2)}</td>
                            <td className="p-3 text-right">{statusBadge(tx.status)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="border-border max-w-lg">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Site Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">USDT Deposit Address (BEP20 / BSC)</Label>
                  <Input value={usdtAddress} onChange={e => setUsdtAddress(e.target.value)} placeholder="Enter BEP20 USDT address" className="bg-background font-mono text-sm" />
                  <p className="text-[10px] text-muted-foreground">This address will be shown to investors for deposits via BEP20 network.</p>
                </div>
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold" onClick={updateSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
