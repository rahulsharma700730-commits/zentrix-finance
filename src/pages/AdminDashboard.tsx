import { useEffect, useState } from 'react';
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
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Shield, Settings, Ban, Unlock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  const confirmInvestment = async (inv: any) => {
    if (!user) return;
    const dailyReturn = (Number(inv.amount) * 2) / 600;

    const { error } = await supabase.from('investments').update({
      status: 'confirmed' as any,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
      daily_return: dailyReturn,
    }).eq('id', inv.id);

    if (error) { toast.error(error.message); return; }

    // Check if user was referred - give 10% commission to referrer
    const { data: investorProfile } = await supabase.from('profiles').select('referred_by').eq('user_id', inv.user_id).single();

    if (investorProfile?.referred_by) {
      const commission = Number(inv.amount) * 0.1;
      await supabase.from('referral_commissions').insert({
        referrer_id: investorProfile.referred_by,
        referred_id: inv.user_id,
        investment_id: inv.id,
        amount: commission,
      });
      // Add to referrer's daily earnings as instant commission
      await supabase.from('daily_earnings').insert({
        user_id: investorProfile.referred_by,
        investment_id: inv.id,
        amount: commission,
        earned_date: new Date().toISOString().split('T')[0],
      });
    }

    toast.success('Investment confirmed!');
    fetchAll();
  };

  const rejectInvestment = async (id: string) => {
    const { error } = await supabase.from('investments').update({ status: 'rejected' as any }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Investment rejected'); fetchAll(); }
  };

  const approveWithdrawal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('withdrawals').update({
      status: 'approved' as any,
      processed_by: user.id,
      processed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal approved!'); fetchAll(); }
  };

  const rejectWithdrawal = async (id: string) => {
    const { error } = await supabase.from('withdrawals').update({
      status: 'rejected' as any,
      rejection_reason: 'Rejected by admin',
    }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal rejected'); fetchAll(); }
  };

  const toggleBlockUser = async (profileId: string, currentBlocked: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !currentBlocked }).eq('id', profileId);
    if (error) toast.error(error.message);
    else { toast.success(currentBlocked ? 'User unblocked' : 'User blocked'); fetchAll(); }
  };

  const updateSettings = async () => {
    if (!siteSettings) return;
    const { error } = await supabase.from('site_settings').update({ usdt_address: usdtAddress }).eq('id', siteSettings.id);
    if (error) toast.error(error.message);
    else toast.success('Settings updated!');
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-500', confirmed: 'bg-green-500/20 text-green-500', approved: 'bg-green-500/20 text-green-500', rejected: 'bg-red-500/20 text-red-500' };
    return <Badge className={colors[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2"><span className="text-gradient-gold">Admin</span> Dashboard</h1>
          <p className="text-muted-foreground">Manage all investments, withdrawals, and users.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${stats.totalInvested.toFixed(2)}` },
            { icon: Users, label: 'Active Users', value: stats.activeUsers },
            { icon: TrendingUp, label: 'Total Payouts', value: `$${stats.totalPayouts.toFixed(2)}` },
            { icon: Clock, label: 'Pending Requests', value: stats.pendingRequests },
          ].map((item, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <div className="text-xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending-investments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending-investments">Deposits ({pendingInvestments.length})</TabsTrigger>
            <TabsTrigger value="pending-withdrawals">Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="all-transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Pending Investments */}
          <TabsContent value="pending-investments">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Pending Deposit Confirmations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvestments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No pending deposits</p>
                  ) : pendingInvestments.map((inv: any) => (
                    <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted gap-3">
                      <div>
                        <p className="font-medium">{(inv as any).profiles?.full_name || 'Unknown'} — <span className="text-primary font-bold">${Number(inv.amount).toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground">TX: {inv.tx_hash || 'N/A'} • {new Date(inv.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmInvestment(inv)}>
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
              <CardHeader>
                <CardTitle className="text-lg font-display">Pending Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingWithdrawals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
                  ) : pendingWithdrawals.map((wd: any) => (
                    <div key={wd.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted gap-3">
                      <div>
                        <p className="font-medium">{(wd as any).profiles?.full_name || 'Unknown'} — <span className="text-primary font-bold">${Number(wd.amount).toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground">To: {wd.wallet_address}</p>
                        <p className="text-xs text-muted-foreground">{new Date(wd.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveWithdrawal(wd.id)}>
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
              <CardHeader>
                <CardTitle className="text-lg font-display">All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground">Name</th>
                        <th className="text-left p-3 text-muted-foreground">Email</th>
                        <th className="text-left p-3 text-muted-foreground">Referral Code</th>
                        <th className="text-left p-3 text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-muted-foreground">Joined</th>
                        <th className="text-left p-3 text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border/50">
                          <td className="p-3 font-medium">{u.full_name || '-'}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 font-mono text-xs">{u.referral_code}</td>
                          <td className="p-3">
                            <Badge className={u.is_blocked ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}>
                              {u.is_blocked ? 'Blocked' : 'Active'}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => toggleBlockUser(u.id, u.is_blocked)}>
                              {u.is_blocked ? <Unlock className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                              {u.is_blocked ? 'Unblock' : 'Block'}
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
              <CardHeader>
                <CardTitle className="text-lg font-display">All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    ...allInvestments.map((i: any) => ({ type: 'Deposit', user: (i as any).profiles?.full_name || 'Unknown', amount: Number(i.amount), date: i.created_at, status: i.status })),
                    ...allWithdrawals.map((w: any) => ({ type: 'Withdrawal', user: (w as any).profiles?.full_name || 'Unknown', amount: Number(w.amount), date: w.created_at, status: w.status })),
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 50)
                    .map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium text-sm">{tx.type} — {tx.user}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="font-medium">${tx.amount.toFixed(2)}</span>
                          {statusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="border-border max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg font-display">Site Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>USDT Deposit Address (TRC20)</Label>
                  <Input value={usdtAddress} onChange={e => setUsdtAddress(e.target.value)} placeholder="Enter USDT address" />
                </div>
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={updateSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
