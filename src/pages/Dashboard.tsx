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
  const [commissions, setCommissions] = useState<any[]>([]); // legacy referral_commissions (history)
  const [mlmCommissions, setMlmCommissions] = useState<any[]>([]);
  const [downline, setDownline] = useState<any[]>([]); // flat array with .level
  const [rankTiers, setRankTiers] = useState<any[]>([]);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mlm_commissions', filter: `referrer_id=eq.${user.id}` }, () => fetchData())
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
    const sb = supabase as any;
    const [inv, earn, wd, comm, mlm, settings, notifs, tix, ranks] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('daily_earnings').select('*').eq('user_id', user.id).order('earned_date', { ascending: true }),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('referral_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      sb.from('mlm_commissions').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
      supabase.from('notifications').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('rank_tiers').select('*').order('sort_order', { ascending: true }),
    ]);
    setInvestments(inv.data || []);
    setEarnings(earn.data || []);
    setWithdrawals(wd.data || []);
    setCommissions(comm.data || []);
    setMlmCommissions(mlm.data || []);
    setSiteSettings(settings.data);
    setNotifications(notifs.data || []);
    setTickets(tix.data || []);
    setRankTiers(ranks.data || []);

    // Fetch full 5-level downline via SECURITY DEFINER RPC (bypasses per-row RLS for aggregates)
    const { data: dlData } = await supabase.rpc('get_user_downline', { _user_id: user.id });
    const flat = (dlData || []).map((u: any) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      created_at: u.created_at,
      referred_by: u.referred_by,
      level: u.level,
      invested: Number(u.invested || 0),
      hasActive: !!u.has_active,
      commissionFromUser: (mlm.data || [])
        .filter((c: any) => c.downline_id === u.user_id)
        .reduce((s: number, c: any) => s + Number(c.amount), 0),
    }));
    setDownline(flat);

    if (profile?.referred_by) {
      const { data: refData } = await supabase.from('profiles').select('full_name').eq('user_id', profile.referred_by).single();
      setReferrerName(refData?.full_name || null);
    }
  };

  const totalInvested = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount), 0), [investments]);
  const totalEarned = useMemo(() => earnings.reduce((s, e) => s + Number(e.amount), 0), [earnings]);
  const totalCommissions = useMemo(() => commissions.reduce((s, c) => s + Number(c.amount), 0), [commissions]);
  const totalMlm = useMemo(() => mlmCommissions.reduce((s, c) => s + Number(c.amount), 0), [mlmCommissions]);
  const totalWithdrawn = useMemo(() => withdrawals.filter(w => ['approved','sent','confirmed'].includes(w.status)).reduce((s, w) => s + Number(w.amount), 0), [withdrawals]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => ['pending','on_hold'].includes(w.status)).reduce((s, w) => s + Number(w.amount), 0), [withdrawals]);
  // ROI cap (200%) applies only to own daily earnings; MLM/referral commissions are separate income.
  const roiCap = useMemo(() => investments.filter(i => ['confirmed','completed'].includes(i.status)).reduce((s, i) => s + Number(i.amount) * 2, 0), [investments]);
  const cappedEarned = Math.min(totalEarned, roiCap);
  const availableBalance = cappedEarned + totalCommissions + totalMlm - totalWithdrawn - pendingWithdrawals;
  const dailyRate = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + (Number(i.amount) * 2) / 600, 0), [investments]);
  const expectedTotal = useMemo(() => investments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount) * 2, 0), [investments]);
  const cappingPercent = expectedTotal > 0 ? Math.min(((totalEarned + totalCommissions + totalMlm) / expectedTotal) * 100, 100) : 0;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  // MLM derived data
  const directReferrals = useMemo(() => downline.filter(d => d.level === 1), [downline]);
  const teamSize = downline.length;
  const teamVolume = useMemo(() => downline.reduce((s, d) => s + Number(d.invested || 0), 0), [downline]);
  const directWithInvestment = useMemo(() => directReferrals.filter(d => d.hasActive).length, [directReferrals]);
  const currentRank = useMemo(() => {
    const sorted = [...rankTiers].sort((a, b) => b.sort_order - a.sort_order);
    return sorted.find(r =>
      directWithInvestment >= r.min_direct_referrals &&
      teamSize >= r.min_team_size &&
      teamVolume >= Number(r.min_team_volume_usd)
    ) || null;
  }, [rankTiers, directWithInvestment, teamSize, teamVolume]);
  const nextRank = useMemo(() => {
    const sorted = [...rankTiers].sort((a, b) => a.sort_order - b.sort_order);
    return sorted.find(r =>
      directWithInvestment < r.min_direct_referrals ||
      teamSize < r.min_team_size ||
      teamVolume < Number(r.min_team_volume_usd)
    ) || null;
  }, [rankTiers, directWithInvestment, teamSize, teamVolume]);
  const levelStats = useMemo(() => {
    const rates: Record<number, number> = { 1: 10, 2: 3, 3: 3, 4: 2, 5: 2 };
    return [1, 2, 3, 4, 5].map(lvl => {
      const members = downline.filter(d => d.level === lvl);
      const earned = mlmCommissions.filter((c: any) => c.level === lvl).reduce((s: number, c: any) => s + Number(c.amount), 0);
      const invested = members.reduce((s, m) => s + Number(m.invested || 0), 0);
      return { level: lvl, rate: rates[lvl], members: members.length, invested, earned };
    });
  }, [downline, mlmCommissions]);

  // Daily network earnings trend (last 30 days) — stacked by level
  const networkTrend = useMemo(() => {
    const days = 30;
    const map: Record<string, any> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, total: 0 };
    }
    mlmCommissions.forEach((c: any) => {
      const key = (c.earned_date || c.created_at?.slice(0, 10));
      if (map[key]) {
        map[key][`L${c.level}`] += Number(c.amount);
        map[key].total += Number(c.amount);
      }
    });
    return Object.values(map);
  }, [mlmCommissions]);

  // Cumulative network earnings
  const networkCumulative = useMemo(() => {
    let cum = 0;
    return (networkTrend as any[]).map(d => { cum += d.total; return { date: d.date, cumulative: Number(cum.toFixed(3)) }; });
  }, [networkTrend]);

  // Team composition by level (for radial / bar)
  const teamComposition = useMemo(() =>
    levelStats.map(s => ({ name: `Level ${s.level}`, members: s.members, volume: Number(s.invested.toFixed(2)), earned: Number(s.earned.toFixed(3)) })),
  [levelStats]);

  // Rank progression — show all tiers w/ user position
  const rankProgression = useMemo(() => {
    const sorted = [...rankTiers].sort((a, b) => a.sort_order - b.sort_order);
    return sorted.map(r => {
      const reqVol = Number(r.min_team_volume_usd);
      const volPct = reqVol > 0 ? Math.min((teamVolume / reqVol) * 100, 100) : 100;
      const sizePct = r.min_team_size > 0 ? Math.min((teamSize / r.min_team_size) * 100, 100) : 100;
      const dirPct = r.min_direct_referrals > 0 ? Math.min((directWithInvestment / r.min_direct_referrals) * 100, 100) : 100;
      const overall = Math.round((volPct + sizePct + dirPct) / 3);
      const achieved = directWithInvestment >= r.min_direct_referrals && teamSize >= r.min_team_size && teamVolume >= reqVol;
      return { name: r.name, color: r.badge_color, overall, achieved };
    });
  }, [rankTiers, teamSize, teamVolume, directWithInvestment]);

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
            {/* Premium account hero — visible on every section */}
            <div className="mb-5 relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_60%)]" />
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                  <span className="font-display font-black text-2xl sm:text-3xl text-zinc-950">
                    {(profile?.full_name || 'I').trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-white truncate">
                      {profile?.full_name || 'Investor'}
                    </h1>
                    <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/40 text-[10px] tracking-wider uppercase">Premium Investor</Badge>
                    {firstConfirmed && (
                      <Badge variant="outline" className="bg-zinc-900 text-amber-400 border-amber-500/40 text-[10px]">
                        {daysActive}d active
                      </Badge>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs mt-1 truncate">{profile?.email}</p>
                  <p className="text-zinc-500 text-[11px] mt-2">
                    USDT BEP20 • <span className="font-mono text-zinc-300 break-all">{profile?.wallet_address ? `${profile.wallet_address.slice(0, 10)}…${profile.wallet_address.slice(-6)}` : 'Wallet not set'}</span>
                  </p>
                  {referrerName && (
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Referred by <strong className="text-amber-400">{referrerName}</strong>
                    </p>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-amber-500/20 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Balance</p>
                    <p className="font-display font-bold text-amber-400 text-sm">${availableBalance.toFixed(2)}</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-emerald-500/20 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Daily</p>
                    <p className="font-display font-bold text-emerald-400 text-sm">${dailyRate.toFixed(2)}</p>
                  </div>
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
                        <p className="font-semibold text-foreground">{directReferrals.length}</p>
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

            {/* REFERRAL / NETWORK */}
            {section === 'referral' && (
              <div className="space-y-6">
                {/* Code + summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base font-display text-foreground">Your Referral Code</CardTitle></CardHeader>
                    <CardContent>
                      <div className="p-5 rounded-xl bg-gradient-gold-subtle border border-primary/20 mb-4 text-center">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Build your network — earn on 5 levels of daily ROI:</p>
                        <div className="text-2xl sm:text-3xl font-display font-bold text-amber-700 dark:text-amber-400 tracking-widest mb-3">{profile?.referral_code || '---'}</div>
                        <Button variant="outline" size="sm" className="border-primary/30" onClick={() => profile?.referral_code && copyToClipboard(profile.referral_code)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy Code
                        </Button>
                        {referralLink && (
                          <Button variant="outline" size="sm" className="border-primary/30 ml-2" onClick={() => copyToClipboard(referralLink)}>
                            <Copy className="w-3 h-3 mr-1" /> Copy Link
                          </Button>
                        )}
                      </div>
                      {referrerName && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-xs text-muted-foreground">You were referred by:</p>
                          <p className="text-sm font-medium text-foreground">{referrerName}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                          <div className="text-lg font-display font-bold text-foreground">{directReferrals.length}</div>
                          <div className="text-[10px] text-muted-foreground">Directs</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                          <div className="text-lg font-display font-bold text-foreground">{teamSize}</div>
                          <div className="text-[10px] text-muted-foreground">Team (5 lvl)</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                          <div className="text-lg font-display font-bold text-amber-700 dark:text-amber-400">${totalMlm.toFixed(3)}</div>
                          <div className="text-[10px] text-muted-foreground">Network Earnings</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rank card */}
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-base font-display text-foreground">Leader Rank</CardTitle></CardHeader>
                    <CardContent>
                      <div className="p-5 rounded-xl border border-border text-center mb-4" style={{ backgroundColor: currentRank ? `${currentRank.badge_color}20` : undefined }}>
                        <div className="text-2xl sm:text-3xl font-display font-bold mb-1" style={{ color: currentRank?.badge_color || 'hsl(var(--muted-foreground))' }}>
                          {currentRank?.name || 'Unranked'}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Your current leader rank</p>
                      </div>
                      {nextRank ? (
                        <div className="space-y-2 text-xs">
                          <p className="text-muted-foreground">Progress to <span className="font-semibold text-foreground">{nextRank.name}</span>:</p>
                          {[
                            { label: 'Active directs', cur: directWithInvestment, target: nextRank.min_direct_referrals },
                            { label: 'Team size', cur: teamSize, target: nextRank.min_team_size },
                            { label: 'Team volume', cur: teamVolume, target: Number(nextRank.min_team_volume_usd), money: true },
                          ].map((m, i) => {
                            const pct = m.target > 0 ? Math.min((m.cur / m.target) * 100, 100) : 100;
                            return (
                              <div key={i}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-muted-foreground">{m.label}</span>
                                  <span className="text-foreground font-medium">
                                    {m.money ? `$${m.cur.toFixed(0)} / $${m.target}` : `${m.cur} / ${m.target}`}
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-center text-muted-foreground">You've reached the top rank! 👑</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Daily network earnings trend (stacked by level) */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-display text-foreground">Daily Network Earnings (Last 30 days)</CardTitle>
                    <p className="text-xs text-muted-foreground">Stacked by upline level — see which depth of your team is paying you the most.</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={networkTrend as any[]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }}
                          formatter={(v: any) => `$${Number(v).toFixed(3)}`}
                        />
                        <Bar dataKey="L1" stackId="a" fill="hsl(43, 96%, 56%)" />
                        <Bar dataKey="L2" stackId="a" fill="hsl(142, 76%, 45%)" />
                        <Bar dataKey="L3" stackId="a" fill="hsl(220, 70%, 60%)" />
                        <Bar dataKey="L4" stackId="a" fill="hsl(280, 70%, 60%)" />
                        <Bar dataKey="L5" stackId="a" fill="hsl(0, 84%, 60%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Two charts: cumulative + team composition */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base font-display text-foreground">Cumulative Network Earnings</CardTitle>
                      <p className="text-xs text-muted-foreground">Your all-time growth from team activity.</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={networkCumulative} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} formatter={(v: any) => `$${Number(v).toFixed(3)}`} />
                          <Area type="monotone" dataKey="cumulative" stroke="hsl(43, 96%, 56%)" strokeWidth={2} fill="url(#netGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base font-display text-foreground">Team Composition by Level</CardTitle>
                      <p className="text-xs text-muted-foreground">Members & invested volume per level.</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={teamComposition} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                          <Bar yAxisId="left" dataKey="members" fill="hsl(220, 70%, 60%)" name="Members" />
                          <Bar yAxisId="right" dataKey="volume" fill="hsl(43, 96%, 56%)" name="Volume ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Rank progression visual */}
                {rankProgression.length > 0 && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base font-display text-foreground">Rank Progression</CardTitle>
                      <p className="text-xs text-muted-foreground">Your journey across all leader ranks.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {rankProgression.map((r, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                                <span className="text-sm font-medium text-foreground">{r.name}</span>
                                {r.achieved && <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 text-[10px]">Achieved</Badge>}
                              </div>
                              <span className="text-xs text-muted-foreground">{r.overall}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full transition-all" style={{ width: `${r.overall}%`, background: r.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Levels breakdown */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-display text-foreground">Earnings by Level</CardTitle>
                    <p className="text-xs text-muted-foreground">L1: 10% • L2: 3% • L3: 3% • L4: 2% • L5: 2% — paid daily on each member's ROI.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs">Level</th>
                          <th className="text-left p-2 text-muted-foreground font-medium text-xs">Rate</th>
                          <th className="text-right p-2 text-muted-foreground font-medium text-xs">Members</th>
                          <th className="text-right p-2 text-muted-foreground font-medium text-xs">Invested</th>
                          <th className="text-right p-2 text-muted-foreground font-medium text-xs">Earned</th>
                        </tr></thead>
                        <tbody>
                          {levelStats.map(s => (
                            <tr key={s.level} className="border-b border-border/50">
                              <td className="p-2 font-semibold text-foreground">L{s.level}</td>
                              <td className="p-2 text-muted-foreground">{s.rate}%</td>
                              <td className="p-2 text-right text-foreground">{s.members}</td>
                              <td className="p-2 text-right text-foreground">${s.invested.toFixed(3)}</td>
                              <td className="p-2 text-right text-emerald-700 dark:text-emerald-400 font-semibold">${s.earned.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Team list */}
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base font-display text-foreground">My Team ({teamSize})</CardTitle></CardHeader>
                  <CardContent>
                    {downline.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No referrals yet. Share your code to start building your team!</p>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {downline.map((r, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">{r.full_name || 'Investor'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{r.email?.replace(/^(.{2}).+(@.+)$/, '$1***$2')}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 text-[10px]">L{r.level}</Badge>
                                {r.hasActive ? (
                                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 text-[10px]">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 text-[10px]">Pending</Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                              <div>
                                <p className="text-muted-foreground">Joined</p>
                                <p className="text-foreground font-medium">{new Date(r.created_at).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Invested</p>
                                <p className="text-foreground font-medium">${Number(r.invested || 0).toFixed(3)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Earned from</p>
                                <p className="text-emerald-700 dark:text-emerald-400 font-semibold">${Number(r.commissionFromUser || 0).toFixed(3)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Commission ledger */}
                {(mlmCommissions.length > 0 || commissions.length > 0) && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base font-display text-foreground">Commission Ledger</CardTitle>
                      <p className="text-xs text-muted-foreground">Every payout, by date and level. Updates in real time.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-card">
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                              <th className="text-left p-2 text-muted-foreground font-medium text-xs">Level</th>
                              <th className="text-left p-2 text-muted-foreground font-medium text-xs">Rate</th>
                              <th className="text-left p-2 text-muted-foreground font-medium text-xs">From</th>
                              <th className="text-right p-2 text-muted-foreground font-medium text-xs">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mlmCommissions.map((c: any, i: number) => {
                              const member = downline.find(d => d.user_id === c.downline_id);
                              return (
                                <tr key={`m-${i}`} className="border-b border-border/50 hover:bg-muted/30">
                                  <td className="p-2 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                                  <td className="p-2"><Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 text-[10px]">L{c.level}</Badge></td>
                                  <td className="p-2 text-muted-foreground text-xs">{c.percentage}%</td>
                                  <td className="p-2 text-foreground text-xs truncate max-w-[140px]">{member?.full_name || '—'}</td>
                                  <td className="p-2 text-right text-emerald-700 dark:text-emerald-400 font-semibold">+${Number(c.amount).toFixed(3)}</td>
                                </tr>
                              );
                            })}
                            {commissions.map((c, i) => (
                              <tr key={`l-${i}`} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="p-2 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="p-2"><Badge variant="outline" className="text-[10px]">Legacy</Badge></td>
                                <td className="p-2 text-muted-foreground text-xs">—</td>
                                <td className="p-2 text-foreground text-xs">—</td>
                                <td className="p-2 text-right text-emerald-700 dark:text-emerald-400 font-semibold">+${Number(c.amount).toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                          ...mlmCommissions.map((c: any) => ({ type: `Network L${c.level}`, amount: Number(c.amount), date: c.created_at, status: 'confirmed' })),
                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="p-2 sm:p-3"><div className="flex items-center gap-2">
                              {tx.type === 'Deposit' && <TrendingUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                              {tx.type === 'Withdrawal' && <ArrowDownToLine className="w-3.5 h-3.5 text-red-500" />}
                              {tx.type === 'Referral' && <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                              {tx.type.startsWith('Network') && <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
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
