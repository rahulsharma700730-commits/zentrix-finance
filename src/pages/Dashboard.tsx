import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, TrendingUp, Wallet, ArrowDownToLine, Users, DollarSign, BarChart3, Percent, UserCheck, Bell, MessageSquare, HelpCircle, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar, type DashboardSection } from '@/components/DashboardSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

const CHART_COLORS = ['hsl(43, 96%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(220, 70%, 50%)', 'hsl(0, 84%, 60%)'];

const CopyBtn = ({ text }: { text: string }) => (
  <button
    onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied!'); }}
    className="inline-flex items-center justify-center p-1 rounded hover:bg-muted/80 transition-colors shrink-0"
    title="Copy"
  >
    <Copy className="w-3 h-3 text-muted-foreground" />
  </button>
);

const Dashboard = () => {
  const { user, profile, isAdmin, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, isLoading, navigate]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [section, setSection] = useState<DashboardSection>('overview');

  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [editingWallet, setEditingWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Realtime — refresh dashboard data when investments, withdrawals, profiles, etc. change
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`investor-rt-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_earnings', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_commissions', filter: `referrer_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `referred_by=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    const installed = () => { setIsInstalled(true); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { toast.success('App installed!'); setIsInstalled(true); }
      setDeferredPrompt(null);
    } else {
      toast.info('To install: open browser menu → "Add to Home Screen"');
    }
  };

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

    const { data: refList } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, created_at')
      .eq('referred_by', user.id)
      .order('created_at', { ascending: false });

    // Enrich with each referee's confirmed investment totals + commission earned from them
    const enriched = await Promise.all((refList || []).map(async (r: any) => {
      const { data: invs } = await supabase
        .from('investments')
        .select('amount, status')
        .eq('user_id', r.user_id);
      const invested = (invs || [])
        .filter((i: any) => i.status === 'confirmed')
        .reduce((s: number, i: any) => s + Number(i.amount), 0);
      const commissionFromUser = (comm.data || [])
        .filter((c: any) => c.referred_id === r.user_id)
        .reduce((s: number, c: any) => s + Number(c.amount), 0);
      const hasActive = (invs || []).some((i: any) => i.status === 'confirmed');
      return { ...r, invested, commissionFromUser, hasActive };
    }));
    setReferrals(enriched);

    if (profile?.referred_by) {
      const { data: refData } = await supabase.from('profiles').select('full_name').eq('user_id', profile.referred_by).single();
      setReferrerName(refData?.full_name || null);
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

  // Account / cycle metadata
  const confirmedInvs = useMemo(() => investments.filter(i => i.status === 'confirmed'), [investments]);
  const firstConfirmed = useMemo(() => {
    if (confirmedInvs.length === 0) return null;
    return confirmedInvs
      .map(i => new Date(i.confirmed_at || i.created_at).getTime())
      .reduce((a, b) => Math.min(a, b));
  }, [confirmedInvs]);
  const expectedCompletion = firstConfirmed ? new Date(firstConfirmed + 600 * 24 * 60 * 60 * 1000) : null;
  const daysActive = firstConfirmed ? Math.floor((Date.now() - firstConfirmed) / (24 * 60 * 60 * 1000)) : 0;
  const daysRemaining = firstConfirmed ? Math.max(600 - daysActive, 0) : 600;
  const referralLink = profile?.referral_code
    ? `${window.location.origin}/auth?ref=${profile.referral_code}`
    : '';

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
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => { cumulative += amount; return { date, daily: amount, total: cumulative }; });
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
    if (!addr) { toast.error('Please set your withdrawal wallet address first'); return; }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40',
      confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40',
      approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40',
      rejected: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40',
      completed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40',
      open: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40',
      resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40',
      closed: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={colors[status] || 'border-border text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const sectionTitle: Record<DashboardSection, string> = {
    overview: 'Overview', deposit: 'Deposit', withdraw: 'Withdraw', investments: 'My Investments',
    referral: 'Referral Program', history: 'Transaction History', notifications: 'Alerts', support: 'Support', settings: 'Settings',
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          active={section}
          onChange={setSection}
          unreadCount={unreadNotifs}
          canInstallPwa={!isInstalled}
          onInstallPwa={handleInstallPwa}
        />
        <SidebarInset className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-2 px-3 sm:px-5 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <Link to="/" className="flex items-center gap-2 min-w-0">
                <img src={logo} alt="Zentrix" className="w-7 h-7 rounded-md shrink-0" />
                <span className="font-display font-bold text-sm sm:text-base text-gradient-gold truncate">{sectionTitle[section]}</span>
              </Link>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {unreadNotifs > 0 && (
                <Badge className="bg-destructive text-destructive-foreground h-6 px-2 text-[10px]">
                  <Bell className="w-3 h-3 mr-1" /> {unreadNotifs}
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </header>

          <main className="p-3 sm:p-5 pb-20">
            {/* Account header strip — visible on every section */}
            <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-gold-subtle border border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground">
                    Welcome, <span className="text-amber-700 dark:text-amber-400">{profile?.full_name || 'Investor'}</span> 👋
                  </h1>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    USDT BEP20 • Wallet: <span className="font-mono text-foreground/80 break-all">{profile?.wallet_address || 'Not set'}</span>
                  </p>
                  {referrerName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Referred by: <strong className="text-foreground">{referrerName}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rejected deposits alert */}
            {investments.filter(i => i.status === 'rejected').length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-destructive">Some deposits were rejected</p>
                    {investments.filter(i => i.status === 'rejected').map(inv => (
                      <p key={inv.id} className="text-xs text-foreground/80 mt-1 break-all">
                        ${Number(inv.amount).toFixed(2)} on {new Date(inv.created_at).toLocaleDateString()}
                        {inv.tx_hash && <span className="font-mono"> — TX: {inv.tx_hash.slice(0, 20)}...</span>}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* OVERVIEW */}
            {section === 'overview' && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
                  {[
                    { icon: DollarSign, label: 'Total Invested', value: `$${totalInvested.toFixed(2)}`, color: 'text-amber-700 dark:text-amber-400' },
                    { icon: TrendingUp, label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, color: 'text-emerald-700 dark:text-emerald-400' },
                    { icon: Wallet, label: 'Available Balance', value: `$${availableBalance.toFixed(2)}`, color: 'text-amber-700 dark:text-amber-400' },
                    { icon: BarChart3, label: 'Daily Earning', value: `$${dailyRate.toFixed(2)}`, color: 'text-emerald-700 dark:text-emerald-400' },
                    { icon: ArrowDownToLine, label: 'Total Withdrawn', value: `$${totalWithdrawn.toFixed(2)}`, color: 'text-foreground' },
                    { icon: Percent, label: 'Capping (200%)', value: `${cappingPercent.toFixed(1)}%`, color: 'text-amber-700 dark:text-amber-400' },
                  ].map((item, i) => (
                    <Card key={i} className="border-border bg-card">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">{item.label}</span>
                        </div>
                        <div className={`text-sm sm:text-lg font-display font-bold ${item.color}`}>{item.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Account details */}
                <Card className="border-border mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display text-foreground flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" /> Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Full Name</p>
                        <p className="font-medium text-foreground truncate">{profile?.full_name || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                        <p className="font-medium text-foreground truncate">{profile?.email || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Joining Date</p>
                        <p className="font-medium text-foreground">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Cycle Start</p>
                        <p className="font-medium text-foreground">
                          {firstConfirmed ? new Date(firstConfirmed).toLocaleDateString() : 'Not started'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Expected Completion</p>
                        <p className="font-medium text-foreground">
                          {expectedCompletion ? expectedCompletion.toLocaleDateString() : '-'}
                        </p>
                        {firstConfirmed && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {daysActive} days active • {daysRemaining} days left
                          </p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Referral Code</p>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-semibold text-amber-700 dark:text-amber-400">{profile?.referral_code || '-'}</p>
                          {profile?.referral_code && <CopyBtn text={profile.referral_code} />}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border col-span-2 md:col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Withdrawal Wallet (BEP20)</p>
                        <p className="font-mono text-foreground break-all text-[11px]">{profile?.wallet_address || 'Not set'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Account Status</p>
                        {profile?.is_blocked ? (
                          <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40">Blocked</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40">Active</Badge>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Referrals</p>
                        <p className="font-semibold text-foreground">{referrals.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Referred By</p>
                        <p className="font-medium text-foreground truncate">{referrerName || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500" style={{ width: `${cappingPercent}%` }} />
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
                              <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(v: any) => [`$${Number(v).toFixed(3)}`, '']}
                              />
                              <Bar dataKey="earned" stackId="a" fill="hsl(43, 96%, 56%)" name="Earned" />
                              <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" name="Remaining" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                              <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(v: any, n: any) => [`$${Number(v).toFixed(3)}`, n]}
                              />
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
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(v: any, n: any) => [`$${Number(v).toFixed(3)}`, n]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
                        <div className="flex flex-wrap gap-3 justify-center mt-2">
                          {pieData.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-muted-foreground">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* DEPOSIT */}
            {section === 'deposit' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base font-display text-foreground">Deposit USDT (BEP20)</CardTitle></CardHeader>
                  <CardContent>
                    {siteSettings?.usdt_address && (
                      <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border text-center">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Send USDT via BEP20 (BSC) Network to:</p>
                        {siteSettings.qr_code_url && (
                          <img src={`${siteSettings.qr_code_url}?t=${Date.now()}`} alt="QR Code" className="w-40 h-40 mx-auto my-3 rounded-lg border border-border" />
                        )}
                        <p className="text-sm font-mono break-all font-medium text-foreground mb-3">{siteSettings.usdt_address}</p>
                        <Button variant="outline" size="sm" className="border-primary/30" onClick={() => copyToClipboard(siteSettings.usdt_address)}>
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
                          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                              {inv.tx_hash && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">{inv.tx_hash}</p>
                                  <CopyBtn text={inv.tx_hash} />
                                </div>
                              )}
                            </div>
                            {statusBadge(inv.status)}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* WITHDRAW */}
            {section === 'withdraw' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base font-display text-foreground">Withdraw Funds</CardTitle></CardHeader>
                  <CardContent>
                    <div className="mb-6 p-5 rounded-xl bg-gradient-gold-subtle border border-primary/20 text-center">
                      <p className="text-xs text-muted-foreground font-medium">Available Balance</p>
                      <p className="text-3xl font-display font-bold text-amber-700 dark:text-amber-400">${availableBalance.toFixed(2)}</p>
                      {availableBalance < 20 && <p className="text-xs text-destructive mt-1">Minimum $20 required</p>}
                    </div>
                    {!profile?.wallet_address ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                        <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 mx-auto mb-2" />
                        <p className="text-sm text-foreground font-medium mb-2">Set your withdrawal wallet first</p>
                        <p className="text-xs text-muted-foreground mb-3">Open Settings to add your BEP20 wallet address.</p>
                        <Button size="sm" variant="outline" onClick={() => setSection('settings')}>Go to Settings</Button>
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
                          <div key={wd.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">${Number(wd.amount).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(wd.created_at).toLocaleDateString()}</p>
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{wd.wallet_address}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {statusBadge(wd.status)}
                              {wd.rejection_reason && <p className="text-[10px] text-destructive mt-1 max-w-[120px]">{wd.rejection_reason}</p>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* INVESTMENTS */}
            {section === 'investments' && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">My Investments</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Daily</th>
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Days</th>
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">TX Hash</th>
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Status</th>
                      </tr></thead>
                      <tbody>
                        {investments.map(inv => (
                          <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-2 sm:p-3 text-foreground text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                            <td className="p-2 sm:p-3 font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                            <td className="p-2 sm:p-3 text-amber-700 dark:text-amber-400 font-medium text-xs">${((Number(inv.amount) * 2) / 600).toFixed(4)}/day</td>
                            <td className="p-2 sm:p-3 text-muted-foreground text-xs">{inv.days_paid || 0}/600</td>
                            <td className="p-2 sm:p-3">
                              {inv.tx_hash ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[80px]">{inv.tx_hash}</span>
                                  <CopyBtn text={inv.tx_hash} />
                                </div>
                              ) : '-'}
                            </td>
                            <td className="p-2 sm:p-3">{statusBadge(inv.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {investments.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No investments yet</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* REFERRAL */}
            {section === 'referral' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base font-display text-foreground">Your Referral Program</CardTitle></CardHeader>
                  <CardContent>
                    <div className="p-5 rounded-xl bg-gradient-gold-subtle border border-primary/20 mb-6 text-center">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Share this code to earn 10% instant commission:</p>
                      <div className="text-2xl sm:text-3xl font-display font-bold text-amber-700 dark:text-amber-400 tracking-widest mb-3">{profile?.referral_code || '---'}</div>
                      <Button variant="outline" size="sm" className="border-primary/30" onClick={() => profile?.referral_code && copyToClipboard(profile.referral_code)}>
                        <Copy className="w-3 h-3 mr-1" /> Copy Code
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-3">New investor enters this code during signup → You get 10% of their investment instantly!</p>
                    </div>
                    {referrerName && (
                      <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground">You were referred by:</p>
                        <p className="text-sm font-medium text-foreground">{referrerName}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                        <Users className="w-5 h-5 text-amber-700 dark:text-amber-400 mx-auto mb-1" />
                        <div className="text-2xl font-display font-bold text-foreground">{referrals.length}</div>
                        <div className="text-xs text-muted-foreground">Total Referrals</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                        <DollarSign className="w-5 h-5 text-amber-700 dark:text-amber-400 mx-auto mb-1" />
                        <div className="text-2xl font-display font-bold text-amber-700 dark:text-amber-400">${totalCommissions.toFixed(2)}</div>
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
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" /></div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">{r.full_name || 'Investor'}</p>
                                <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground shrink-0">{new Date(r.created_at).toLocaleDateString()}</p>
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
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">+${Number(c.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* HISTORY */}
            {section === 'history' && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Transaction History</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Type</th>
                        <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Date</th>
                        <th className="text-right p-2 sm:p-3 text-muted-foreground font-medium text-xs">Amount</th>
                        <th className="text-right p-2 sm:p-3 text-muted-foreground font-medium text-xs">Status</th>
                      </tr></thead>
                      <tbody>
                        {[
                          ...investments.map(i => ({ type: 'Deposit', amount: Number(i.amount), date: i.created_at, status: i.status })),
                          ...withdrawals.map(w => ({ type: 'Withdrawal', amount: -Number(w.amount), date: w.created_at, status: w.status })),
                          ...commissions.map(c => ({ type: 'Referral', amount: Number(c.amount), date: c.created_at, status: 'confirmed' })),
                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-2 sm:p-3"><div className="flex items-center gap-2">
                              {tx.type === 'Deposit' && <TrendingUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                              {tx.type === 'Withdrawal' && <ArrowDownToLine className="w-3.5 h-3.5 text-red-500" />}
                              {tx.type === 'Referral' && <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                              <span className="font-medium text-foreground text-xs sm:text-sm">{tx.type}</span>
                            </div></td>
                            <td className="p-2 sm:p-3 text-muted-foreground text-xs">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className={`p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm ${tx.amount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-500'}`}>{tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}</td>
                            <td className="p-2 sm:p-3 text-right">{statusBadge(tx.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {investments.length === 0 && withdrawals.length === 0 && commissions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NOTIFICATIONS */}
            {section === 'notifications' && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications & Alerts</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {notifications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p> :
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-xl border ${n.is_read ? 'bg-muted/30 border-border' : 'bg-primary/10 border-primary/30'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                            {!n.is_read && <Button size="sm" variant="outline" className="text-xs h-7 px-2 shrink-0" onClick={() => markNotifRead(n.id)}>Read</Button>}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SUPPORT */}
            {section === 'support' && (
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
                              <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-1">Admin Reply:</p>
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
            )}

            {/* SETTINGS */}
            {section === 'settings' && (
              <Card className="border-border max-w-lg">
                <CardHeader><CardTitle className="text-base font-display text-foreground">Account Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-foreground text-sm font-medium mb-2 block">Profile Info</Label>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                      <p className="text-sm text-foreground"><strong>Name:</strong> {profile?.full_name}</p>
                      <p className="text-sm text-foreground"><strong>Email:</strong> {profile?.email}</p>
                      <div className="flex items-center gap-2 text-sm text-foreground flex-wrap">
                        <strong>Referral Code:</strong> <span className="text-amber-700 dark:text-amber-400 font-mono">{profile?.referral_code}</span>
                        {profile?.referral_code && <CopyBtn text={profile.referral_code} />}
                      </div>
                      {referrerName && <p className="text-sm text-foreground"><strong>Referred by:</strong> {referrerName}</p>}
                      <p className="text-sm text-foreground"><strong>Joined:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground text-sm font-medium mb-2 block">Withdrawal Wallet Address (BEP20)</Label>
                    {!editingWallet ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-0 p-3 rounded-lg bg-muted/50 border border-border">
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
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
