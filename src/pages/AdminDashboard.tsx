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
import {
  Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Ban, Unlock, Eye, ArrowLeft, Shield, Settings, BarChart3, UserCheck, Link2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['hsl(43, 96%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(220, 70%, 50%)'];

const AdminDashboard = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [allInvestments, setAllInvestments] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [allCommissions, setAllCommissions] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [usdtAddress, setUsdtAddress] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserInvestments, setSelectedUserInvestments] = useState<any[]>([]);
  const [selectedUserWithdrawals, setSelectedUserWithdrawals] = useState<any[]>([]);
  const [selectedUserEarnings, setSelectedUserEarnings] = useState<any[]>([]);
  const [selectedUserCommissions, setSelectedUserCommissions] = useState<any[]>([]);
  const [selectedUserReferrals, setSelectedUserReferrals] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState('all');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin]);

  const fetchAll = async () => {
    const [usersRes, invRes, wdRes, settingsRes, commRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('investments').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
      supabase.from('referral_commissions').select('*').order('created_at', { ascending: false }),
    ]);
    setUsers(usersRes.data || []);
    setAllInvestments(invRes.data || []);
    setAllWithdrawals(wdRes.data || []);
    setSiteSettings(settingsRes.data);
    setUsdtAddress(settingsRes.data?.usdt_address || '');
    setAllCommissions(commRes.data || []);
  };

  // Stats
  const stats = useMemo(() => {
    const confirmedInv = allInvestments.filter(i => i.status === 'confirmed');
    return {
      totalInvested: confirmedInv.reduce((s, i) => s + Number(i.amount), 0),
      activeUsers: users.filter(u => !u.is_blocked).length,
      totalPayouts: allWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0),
      pendingDeposits: allInvestments.filter(i => i.status === 'pending').length,
      pendingWithdrawals: allWithdrawals.filter(w => w.status === 'pending').length,
      totalCommissions: allCommissions.reduce((s, c) => s + Number(c.amount), 0),
    };
  }, [allInvestments, allWithdrawals, users, allCommissions]);

  const pendingInvestments = useMemo(() => allInvestments.filter(i => i.status === 'pending'), [allInvestments]);
  const pendingWithdrawals = useMemo(() => allWithdrawals.filter(w => w.status === 'pending'), [allWithdrawals]);

  // Chart data
  const investmentByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    allInvestments.filter(i => i.status === 'confirmed').forEach(inv => {
      const month = new Date(inv.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      months[month] = (months[month] || 0) + Number(inv.amount);
    });
    return Object.entries(months).slice(-12).map(([month, amount]) => ({ month, amount }));
  }, [allInvestments]);

  const statusPieData = useMemo(() => [
    { name: 'Confirmed', value: allInvestments.filter(i => i.status === 'confirmed').length },
    { name: 'Pending', value: allInvestments.filter(i => i.status === 'pending').length },
    { name: 'Rejected', value: allInvestments.filter(i => i.status === 'rejected').length },
  ].filter(d => d.value > 0), [allInvestments]);

  const getUserName = (userId: string) => users.find(u => u.user_id === userId)?.full_name || 'Unknown';
  const getUserEmail = (userId: string) => users.find(u => u.user_id === userId)?.email || '';

  // Actions
  const confirmInvestment = async (inv: any) => {
    if (!user) return;
    const dailyReturn = (Number(inv.amount) * 2) / 600;
    const { error } = await supabase.from('investments').update({
      status: 'confirmed' as any, confirmed_by: user.id, confirmed_at: new Date().toISOString(), daily_return: dailyReturn,
    }).eq('id', inv.id);
    if (error) { toast.error(error.message); return; }

    const investorProfile = users.find(u => u.user_id === inv.user_id);
    if (investorProfile?.referred_by) {
      const commission = Number(inv.amount) * 0.1;
      await supabase.from('referral_commissions').insert({
        referrer_id: investorProfile.referred_by, referred_id: inv.user_id,
        investment_id: inv.id, amount: commission
      });
      await supabase.from('daily_earnings').insert({
        user_id: investorProfile.referred_by, investment_id: inv.id,
        amount: commission, earned_date: new Date().toISOString().split('T')[0]
      });
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
    const { error } = await supabase.from('withdrawals').update({
      status: 'approved' as any, processed_by: user.id, processed_at: new Date().toISOString()
    }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Withdrawal approved!'); fetchAll(); }
  };

  const rejectWithdrawal = async (id: string, reason?: string) => {
    const { error } = await supabase.from('withdrawals').update({
      status: 'rejected' as any, rejection_reason: reason || 'Rejected by admin'
    }).eq('id', id);
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

  const viewUserPortfolio = async (u: any) => {
    setSelectedUser(u);
    const [inv, wd, earn, comm] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', u.user_id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', u.user_id).order('created_at', { ascending: false }),
      supabase.from('daily_earnings').select('*').eq('user_id', u.user_id).order('earned_date', { ascending: false }),
      supabase.from('referral_commissions').select('*').eq('referrer_id', u.user_id).order('created_at', { ascending: false }),
    ]);
    setSelectedUserInvestments(inv.data || []);
    setSelectedUserWithdrawals(wd.data || []);
    setSelectedUserEarnings(earn.data || []);
    setSelectedUserCommissions(comm.data || []);

    // Get referrals
    const { data: refs } = await supabase.from('profiles').select('full_name, email, created_at').eq('referred_by', u.user_id);
    setSelectedUserReferrals(refs || []);
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

  // USER PORTFOLIO VIEW
  if (selectedUser) {
    const uTotalInvested = selectedUserInvestments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount), 0);
    const uTotalEarned = selectedUserEarnings.reduce((s, e) => s + Number(e.amount), 0);
    const uTotalCommissions = selectedUserCommissions.reduce((s, c) => s + Number(c.amount), 0);
    const uTotalWithdrawn = selectedUserWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0);
    const uAvailable = uTotalEarned + uTotalCommissions - uTotalWithdrawn;
    const referrerProfile = selectedUser.referred_by ? users.find(u => u.user_id === selectedUser.referred_by) : null;

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-12">
          <Button variant="ghost" className="mb-4 text-muted-foreground" onClick={() => setSelectedUser(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
          </Button>

          {/* User Header */}
          <div className="mb-6 p-6 rounded-2xl border border-primary/20 bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">{selectedUser.full_name || 'Unknown'}</h2>
                <p className="text-muted-foreground text-sm">{selectedUser.email}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge variant="outline" className={selectedUser.is_blocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}>
                    {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Referral Code: <strong className="text-primary">{selectedUser.referral_code}</strong></span>
                  {referrerProfile && (
                    <span className="text-xs text-muted-foreground">Referred by: <strong className="text-foreground">{referrerProfile.full_name}</strong></span>
                  )}
                  <span className="text-xs text-muted-foreground">Wallet: <span className="font-mono">{selectedUser.wallet_address || 'Not set'}</span></span>
                  <span className="text-xs text-muted-foreground">Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleBlockUser(selectedUser.id, selectedUser.is_blocked)}>
                {selectedUser.is_blocked ? <><Unlock className="w-3 h-3 mr-1" /> Unblock</> : <><Ban className="w-3 h-3 mr-1" /> Block</>}
              </Button>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Invested', value: `$${uTotalInvested.toFixed(2)}`, color: 'text-primary' },
              { label: 'Earned', value: `$${uTotalEarned.toFixed(2)}`, color: 'text-emerald-500' },
              { label: 'Commissions', value: `$${uTotalCommissions.toFixed(2)}`, color: 'text-primary' },
              { label: 'Withdrawn', value: `$${uTotalWithdrawn.toFixed(2)}`, color: 'text-muted-foreground' },
              { label: 'Available', value: `$${uAvailable.toFixed(2)}`, color: 'text-primary' },
            ].map((s, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                  <p className={`text-lg font-display font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Investments */}
          <Card className="border-border mb-6">
            <CardHeader><CardTitle className="text-sm font-display text-foreground">Investments ({selectedUserInvestments.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Daily</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Days</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">TX Hash</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserInvestments.map(inv => (
                      <tr key={inv.id} className="border-b border-border/50">
                        <td className="p-2 text-foreground text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="p-2 font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                        <td className="p-2 text-primary text-xs">${((Number(inv.amount) * 2) / 600).toFixed(4)}</td>
                        <td className="p-2 text-muted-foreground text-xs">{inv.days_paid || 0}/600</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground truncate max-w-[100px]">{inv.tx_hash || '-'}</td>
                        <td className="p-2">{statusBadge(inv.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedUserInvestments.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No investments</p>}
              </div>
            </CardContent>
          </Card>

          {/* User Withdrawals */}
          <Card className="border-border mb-6">
            <CardHeader><CardTitle className="text-sm font-display text-foreground">Withdrawals ({selectedUserWithdrawals.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Wallet</th>
                      <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserWithdrawals.map(wd => (
                      <tr key={wd.id} className="border-b border-border/50">
                        <td className="p-2 text-foreground text-xs">{new Date(wd.created_at).toLocaleDateString()}</td>
                        <td className="p-2 font-semibold text-foreground">${Number(wd.amount).toFixed(2)}</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground truncate max-w-[150px]">{wd.wallet_address}</td>
                        <td className="p-2">{statusBadge(wd.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedUserWithdrawals.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No withdrawals</p>}
              </div>
            </CardContent>
          </Card>

          {/* Referrals */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-sm font-display text-foreground">Referrals ({selectedUserReferrals.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedUserReferrals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">No referrals</p>
                ) : selectedUserReferrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">{r.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        {/* Header */}
        <div className="mb-8 p-6 rounded-2xl bg-[#070a0f] border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7 text-[hsl(43,96%,56%)]" />
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
              Admin <span className="text-gradient-gold">Control Panel</span>
            </h1>
          </div>
          <p className="text-white/50 text-sm">Full system management • Investments • Withdrawals • Users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${stats.totalInvested.toFixed(0)}`, color: 'text-primary' },
            { icon: Users, label: 'Total Users', value: users.length, color: 'text-foreground' },
            { icon: UserCheck, label: 'Active Users', value: stats.activeUsers, color: 'text-emerald-500' },
            { icon: TrendingUp, label: 'Total Payouts', value: `$${stats.totalPayouts.toFixed(0)}`, color: 'text-emerald-500' },
            { icon: AlertTriangle, label: 'Pending Deposits', value: stats.pendingDeposits, color: 'text-amber-500' },
            { icon: Link2, label: 'Referral Commissions', value: `$${stats.totalCommissions.toFixed(0)}`, color: 'text-primary' },
          ].map((item, i) => (
            <Card key={i} className="border-border bg-card">
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

        {/* Tabs */}
        <Tabs defaultValue="pending-deposits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending-deposits" className="text-xs">
              Deposits {pendingInvestments.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{pendingInvestments.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pending-withdrawals" className="text-xs">
              Withdrawals {pendingWithdrawals.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{pendingWithdrawals.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="all-investments" className="text-xs">All Investments</TabsTrigger>
            <TabsTrigger value="all-withdrawals" className="text-xs">All Withdrawals</TabsTrigger>
            <TabsTrigger value="referrals" className="text-xs">Referrals</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          {/* Pending Deposits */}
          <TabsContent value="pending-deposits">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Pending Deposit Confirmations ({pendingInvestments.length})</CardTitle></CardHeader>
              <CardContent>
                {pendingInvestments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">✅ No pending deposits</p>
                ) : (
                  <div className="space-y-3">
                    {pendingInvestments.map((inv: any) => (
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{getUserName(inv.user_id)} — <span className="text-primary font-bold">${Number(inv.amount).toFixed(2)}</span></p>
                          <p className="text-xs text-muted-foreground">TX: <span className="font-mono">{inv.tx_hash || 'N/A'}</span></p>
                          <p className="text-xs text-muted-foreground">Email: {getUserEmail(inv.user_id)} • {new Date(inv.created_at).toLocaleString()}</p>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Withdrawals */}
          <TabsContent value="pending-withdrawals">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Pending Withdrawal Requests ({pendingWithdrawals.length})</CardTitle></CardHeader>
              <CardContent>
                {pendingWithdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">✅ No pending withdrawals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingWithdrawals.map((wd: any) => (
                      <div key={wd.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{getUserName(wd.user_id)} — <span className="text-primary font-bold">${Number(wd.amount).toFixed(2)}</span></p>
                          <p className="text-xs text-muted-foreground">To: <span className="font-mono">{wd.wallet_address}</span></p>
                          <p className="text-xs text-muted-foreground">Email: {getUserEmail(wd.user_id)} • {new Date(wd.created_at).toLocaleString()}</p>
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
                )}
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
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Referral Code</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Referred By</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Joined</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => {
                        const referrer = u.referred_by ? users.find(r => r.user_id === u.referred_by) : null;
                        return (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium text-foreground">{u.full_name || '-'}</td>
                            <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                            <td className="p-3 font-mono text-xs text-primary font-semibold">{u.referral_code}</td>
                            <td className="p-3 text-xs text-muted-foreground">{referrer ? referrer.full_name : '-'}</td>
                            <td className="p-3">
                              <Badge variant="outline" className={u.is_blocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}>
                                {u.is_blocked ? 'Blocked' : 'Active'}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => viewUserPortfolio(u)}>
                                  <Eye className="w-3 h-3 mr-1" /> View
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => toggleBlockUser(u.id, u.is_blocked)}>
                                  {u.is_blocked ? <Unlock className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Investments */}
          <TabsContent value="all-investments">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-display text-foreground">All Investments ({allInvestments.length})</CardTitle>
                <div className="flex gap-2 mt-2">
                  {['all', 'pending', 'confirmed', 'rejected'].map(f => (
                    <Button key={f} size="sm" variant={filterTab === f ? 'default' : 'outline'} className="text-xs h-7" onClick={() => setFilterTab(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">User</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Daily</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Days</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">TX Hash</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allInvestments
                        .filter(i => filterTab === 'all' || i.status === filterTab)
                        .slice(0, 100)
                        .map(inv => (
                          <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-2">
                              <p className="text-foreground text-xs font-medium">{getUserName(inv.user_id)}</p>
                              <p className="text-[10px] text-muted-foreground">{getUserEmail(inv.user_id)}</p>
                            </td>
                            <td className="p-2 font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                            <td className="p-2 text-primary text-xs">${((Number(inv.amount) * 2) / 600).toFixed(4)}</td>
                            <td className="p-2 text-muted-foreground text-xs">{inv.days_paid || 0}/600</td>
                            <td className="p-2 font-mono text-[10px] text-muted-foreground truncate max-w-[80px]">{inv.tx_hash || '-'}</td>
                            <td className="p-2 text-muted-foreground text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                            <td className="p-2">{statusBadge(inv.status)}</td>
                            <td className="p-2">
                              {inv.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[10px] px-2" onClick={() => confirmInvestment(inv)}>✓</Button>
                                  <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => rejectInvestment(inv.id)}>✗</Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Withdrawals */}
          <TabsContent value="all-withdrawals">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">All Withdrawals ({allWithdrawals.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">User</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Wallet</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allWithdrawals.slice(0, 100).map(wd => (
                        <tr key={wd.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-2">
                            <p className="text-foreground text-xs font-medium">{getUserName(wd.user_id)}</p>
                            <p className="text-[10px] text-muted-foreground">{getUserEmail(wd.user_id)}</p>
                          </td>
                          <td className="p-2 font-semibold text-foreground">${Number(wd.amount).toFixed(2)}</td>
                          <td className="p-2 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{wd.wallet_address}</td>
                          <td className="p-2 text-muted-foreground text-xs">{new Date(wd.created_at).toLocaleDateString()}</td>
                          <td className="p-2">{statusBadge(wd.status)}</td>
                          <td className="p-2">
                            {wd.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[10px] px-2" onClick={() => approveWithdrawal(wd.id)}>✓</Button>
                                <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => rejectWithdrawal(wd.id)}>✗</Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals */}
          <TabsContent value="referrals">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Referral Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Referrer</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Referred User</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Commission</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCommissions.slice(0, 100).map((c, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3">
                            <p className="text-foreground text-xs font-medium">{getUserName(c.referrer_id)}</p>
                            <p className="text-[10px] text-muted-foreground">{getUserEmail(c.referrer_id)}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-foreground text-xs font-medium">{getUserName(c.referred_id)}</p>
                            <p className="text-[10px] text-muted-foreground">{getUserEmail(c.referred_id)}</p>
                          </td>
                          <td className="p-3 font-semibold text-primary">${Number(c.amount).toFixed(2)}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allCommissions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No referral commissions yet</p>}
                </div>

                {/* Referral Tree */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-sm font-display font-semibold text-foreground mb-4">Referral Connections</h4>
                  <div className="space-y-2">
                    {users.filter(u => u.referred_by).map((u, i) => {
                      const referrer = users.find(r => r.user_id === u.referred_by);
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><UserCheck className="w-3.5 h-3.5 text-primary" /></div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{referrer?.full_name || 'Unknown'}</p>
                              <p className="text-[10px] text-muted-foreground">{referrer?.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">→ referred →</span>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-emerald-500" /></div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{u.full_name || 'Unknown'}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {users.filter(u => u.referred_by).length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No referral connections yet</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="border-border max-w-lg">
              <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><Settings className="w-4 h-4" /> Site Settings</CardTitle></CardHeader>
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
