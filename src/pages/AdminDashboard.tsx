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
import {
  Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Ban, Unlock, Eye, ArrowLeft, Shield, Settings, BarChart3, UserCheck, Link2,
  Bell, MessageSquare, Upload, Image as ImageIcon, Send, Key, Copy, Wallet, PauseCircle, PlayCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar, type AdminSection } from '@/components/AdminSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminNotificationBell } from '@/components/AdminNotificationBell';
import logo from '@/assets/logo.png';

const CHART_COLORS = ['hsl(43, 96%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(220, 70%, 50%)'];

const REJECTION_REASONS = [
  'Invalid transaction hash',
  'Amount mismatch',
  'Wrong network used (not BEP20)',
  'Duplicate transaction',
  'Transaction not found on blockchain',
  'Suspicious activity detected',
  'Insufficient funds sent',
  'Other',
];

const WITHDRAWAL_HOLD_REASONS = [
  'Under review — verification pending',
  'Suspicious withdrawal pattern',
  'KYC verification required',
  'Account audit in progress',
  'Exceeds daily limit',
  'Other',
];

const CopyBtn = ({ text }: { text: string }) => (
  <button
    onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied!'); }}
    className="inline-flex items-center justify-center p-1 rounded hover:bg-muted/80 transition-colors shrink-0"
    title="Copy"
  >
    <Copy className="w-3 h-3 text-muted-foreground" />
  </button>
);

const AdminDashboard = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [allInvestments, setAllInvestments] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [allCommissions, setAllCommissions] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [usdtAddress, setUsdtAddress] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserInvestments, setSelectedUserInvestments] = useState<any[]>([]);
  const [selectedUserWithdrawals, setSelectedUserWithdrawals] = useState<any[]>([]);
  const [selectedUserEarnings, setSelectedUserEarnings] = useState<any[]>([]);
  const [selectedUserCommissions, setSelectedUserCommissions] = useState<any[]>([]);
  const [selectedUserReferrals, setSelectedUserReferrals] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState('all');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [rejectReason, setRejectReason] = useState('');
  const [customRejectReason, setCustomRejectReason] = useState('');

  const [qrUploading, setQrUploading] = useState(false);

  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  const [changingPasswordUserId, setChangingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [changingWalletUserId, setChangingWalletUserId] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState('');

  // Hold withdrawal state
  const [holdingWdId, setHoldingWdId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [customHoldReason, setCustomHoldReason] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin]);

  const fetchAll = async () => {
    const [usersRes, invRes, wdRes, settingsRes, commRes, ticketsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('investments').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
      supabase.from('referral_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
    ]);
    setUsers(usersRes.data || []);
    setAllInvestments(invRes.data || []);
    setAllWithdrawals(wdRes.data || []);
    setSiteSettings(settingsRes.data);
    setUsdtAddress(settingsRes.data?.usdt_address || '');
    setAllCommissions(commRes.data || []);
    setAllTickets(ticketsRes.data || []);
  };

  const stats = useMemo(() => {
    const confirmedInv = allInvestments.filter(i => i.status === 'confirmed');
    return {
      totalInvested: confirmedInv.reduce((s, i) => s + Number(i.amount), 0),
      activeUsers: users.filter(u => !u.is_blocked).length,
      totalPayouts: allWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0),
      pendingDeposits: allInvestments.filter(i => i.status === 'pending').length,
      pendingWithdrawals: allWithdrawals.filter(w => w.status === 'pending').length,
      totalCommissions: allCommissions.reduce((s, c) => s + Number(c.amount), 0),
      openTickets: allTickets.filter(t => t.status === 'open').length,
    };
  }, [allInvestments, allWithdrawals, users, allCommissions, allTickets]);

  const pendingInvestments = useMemo(() => allInvestments.filter(i => i.status === 'pending'), [allInvestments]);
  const pendingWithdrawalsList = useMemo(() => allWithdrawals.filter(w => w.status === 'pending'), [allWithdrawals]);

  // Investment count by filter
  const filteredInvestments = useMemo(() => allInvestments.filter(i => filterTab === 'all' || i.status === filterTab), [allInvestments, filterTab]);
  const investmentCountByStatus = useMemo(() => ({
    all: allInvestments.length,
    pending: allInvestments.filter(i => i.status === 'pending').length,
    confirmed: allInvestments.filter(i => i.status === 'confirmed').length,
    rejected: allInvestments.filter(i => i.status === 'rejected').length,
  }), [allInvestments]);

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

    await supabase.from('notifications').insert({
      user_id: inv.user_id,
      title: 'Deposit Confirmed',
      message: `Your deposit of $${Number(inv.amount).toFixed(2)} has been confirmed. Daily earnings will start shortly.`,
    });

    toast.success('Investment confirmed!');
    fetchAll();
  };

  const openRejectDialog = (id: string, type: 'deposit' | 'withdrawal') => {
    setRejectingId(id);
    setRejectType(type);
    setRejectReason('');
    setCustomRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    const reason = rejectReason === 'Other' ? customRejectReason : rejectReason;
    if (!reason) { toast.error('Please select a rejection reason'); return; }

    if (rejectType === 'deposit') {
      const { error } = await supabase.from('investments').update({ status: 'rejected' as any }).eq('id', rejectingId);
      if (error) { toast.error(error.message); return; }
      const inv = allInvestments.find(i => i.id === rejectingId);
      if (inv) {
        await supabase.from('notifications').insert({
          user_id: inv.user_id, title: 'Deposit Rejected',
          message: `Your deposit of $${Number(inv.amount).toFixed(2)} was rejected. Reason: ${reason}`,
        });
      }
    } else {
      const { error } = await supabase.from('withdrawals').update({
        status: 'rejected' as any, rejection_reason: reason
      }).eq('id', rejectingId);
      if (error) { toast.error(error.message); return; }
      const wd = allWithdrawals.find(w => w.id === rejectingId);
      if (wd) {
        await supabase.from('notifications').insert({
          user_id: wd.user_id, title: 'Withdrawal Rejected',
          message: `Your withdrawal of $${Number(wd.amount).toFixed(2)} was rejected. Reason: ${reason}`,
        });
      }
    }
    toast.success(`${rejectType === 'deposit' ? 'Deposit' : 'Withdrawal'} rejected`);
    setRejectingId(null);
    fetchAll();
  };

  const approveWithdrawal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('withdrawals').update({
      status: 'approved' as any, processed_by: user.id, processed_at: new Date().toISOString(), rejection_reason: null
    }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      const wd = allWithdrawals.find(w => w.id === id);
      if (wd) {
        await supabase.from('notifications').insert({
          user_id: wd.user_id, title: 'Withdrawal Approved',
          message: `Your withdrawal of $${Number(wd.amount).toFixed(2)} has been approved and will be sent to your wallet.`,
        });
      }
      toast.success('Withdrawal approved!');
      fetchAll();
    }
  };

  // Hold withdrawal with reason
  const handleHoldWithdrawal = async () => {
    if (!holdingWdId) return;
    const reason = holdReason === 'Other' ? customHoldReason : holdReason;
    if (!reason) { toast.error('Select a hold reason'); return; }
    const { error } = await supabase.from('withdrawals').update({
      rejection_reason: `ON HOLD: ${reason}`
    }).eq('id', holdingWdId);
    if (error) toast.error(error.message);
    else {
      const wd = allWithdrawals.find(w => w.id === holdingWdId);
      if (wd) {
        await supabase.from('notifications').insert({
          user_id: wd.user_id, title: 'Withdrawal On Hold',
          message: `Your withdrawal of $${Number(wd.amount).toFixed(2)} is on hold. Reason: ${reason}`,
        });
      }
      toast.success('Withdrawal put on hold');
      setHoldingWdId(null); setHoldReason(''); setCustomHoldReason('');
      fetchAll();
    }
  };

  const toggleBlockUser = async (profileId: string, currentBlocked: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !currentBlocked }).eq('id', profileId);
    if (error) toast.error(error.message); else { toast.success(currentBlocked ? 'User unblocked' : 'User blocked'); fetchAll(); }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordUserId || !newPassword.trim()) { toast.error('Enter new password'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('admin-update-user', {
        body: { action: 'change_password', user_id: changingPasswordUserId, password: newPassword },
      });
      if (response.error) throw response.error;
      toast.success('Password changed successfully');
      setChangingPasswordUserId(null); setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    }
  };

  const handleChangeWallet = async () => {
    if (!changingWalletUserId || !newWallet.trim()) { toast.error('Enter wallet address'); return; }
    const { error } = await supabase.from('profiles').update({ wallet_address: newWallet.trim() }).eq('user_id', changingWalletUserId);
    if (error) toast.error(error.message);
    else { toast.success('Wallet address updated'); setChangingWalletUserId(null); setNewWallet(''); fetchAll(); }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) { toast.error('Fill all fields'); return; }
    const { error } = await supabase.from('notifications').insert({
      user_id: notifTarget === 'all' ? null : notifTarget,
      title: notifTitle.trim(), message: notifMessage.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success('Notification sent!'); setNotifTitle(''); setNotifMessage(''); setNotifTarget('all'); }
  };

  const handleReplyTicket = async () => {
    if (!replyingTicketId || !ticketReply.trim()) { toast.error('Enter reply'); return; }
    const { error } = await supabase.from('support_tickets').update({
      admin_reply: ticketReply.trim(), status: 'resolved', replied_at: new Date().toISOString()
    }).eq('id', replyingTicketId);
    if (error) toast.error(error.message);
    else {
      const ticket = allTickets.find(t => t.id === replyingTicketId);
      if (ticket) {
        await supabase.from('notifications').insert({
          user_id: ticket.user_id, title: 'Support Ticket Reply',
          message: `Your ticket "${ticket.subject}" has been responded to.`,
        });
      }
      toast.success('Reply sent!');
      setReplyingTicketId(null); setTicketReply('');
      fetchAll();
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `qr-code-${Date.now()}.${ext}`;

      // Delete old file if exists
      const { data: oldFiles } = await supabase.storage.from('site-assets').list('', { search: 'qr-code' });
      if (oldFiles && oldFiles.length > 0) {
        await supabase.storage.from('site-assets').remove(oldFiles.map(f => f.name));
      }

      const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true, cacheControl: '0' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);

      if (siteSettings) {
        await supabase.from('site_settings').update({ qr_code_url: urlData.publicUrl }).eq('id', siteSettings.id);
      } else {
        await supabase.from('site_settings').insert({ usdt_address: usdtAddress, qr_code_url: urlData.publicUrl });
      }
      toast.success('QR code uploaded!');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
    setQrUploading(false);
  };

  const updateSettings = async () => {
    if (!siteSettings) {
      const { error } = await supabase.from('site_settings').insert({ usdt_address: usdtAddress });
      if (error) toast.error(error.message); else toast.success('Settings saved!');
    } else {
      const { error } = await supabase.from('site_settings').update({ usdt_address: usdtAddress }).eq('id', siteSettings.id);
      if (error) toast.error(error.message); else toast.success('Settings updated!');
    }
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
    const { data: refs } = await supabase.from('profiles').select('full_name, email, created_at').eq('referred_by', u.user_id);
    setSelectedUserReferrals(refs || []);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
      completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
      open: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      closed: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={colors[status] || 'border-border text-muted-foreground'}>{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  // REJECTION DIALOG
  const rejectionDialog = rejectingId && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-display text-foreground">Reject {rejectType === 'deposit' ? 'Deposit' : 'Withdrawal'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Select Reason</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {REJECTION_REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input type="radio" name="reject-reason" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} className="accent-primary" />
                  <span className="text-sm text-foreground">{r}</span>
                </label>
              ))}
            </div>
          </div>
          {rejectReason === 'Other' && (
            <div className="space-y-2">
              <Label className="text-foreground">Custom Reason</Label>
              <Input value={customRejectReason} onChange={e => setCustomRejectReason(e.target.value)} placeholder="Enter reason..." className="bg-background" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1 h-10" onClick={handleReject}>Reject</Button>
            <Button variant="outline" className="flex-1 h-10" onClick={() => setRejectingId(null)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // HOLD WITHDRAWAL DIALOG
  const holdDialog = holdingWdId && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-display text-foreground">Hold Withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Hold Reason</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {WITHDRAWAL_HOLD_REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input type="radio" name="hold-reason" value={r} checked={holdReason === r} onChange={() => setHoldReason(r)} className="accent-primary" />
                  <span className="text-sm text-foreground">{r}</span>
                </label>
              ))}
            </div>
          </div>
          {holdReason === 'Other' && (
            <div className="space-y-2">
              <Label className="text-foreground">Custom Reason</Label>
              <Input value={customHoldReason} onChange={e => setCustomHoldReason(e.target.value)} placeholder="Enter reason..." className="bg-background" />
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleHoldWithdrawal}>Hold</Button>
            <Button variant="outline" className="flex-1 h-10" onClick={() => { setHoldingWdId(null); setHoldReason(''); setCustomHoldReason(''); }}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // USER PORTFOLIO VIEW
  if (selectedUser) {
    const uTotalInvested = selectedUserInvestments.filter(i => i.status === 'confirmed').reduce((s, i) => s + Number(i.amount), 0);
    const uTotalEarned = selectedUserEarnings.reduce((s, e) => s + Number(e.amount), 0);
    const uTotalCommissions = selectedUserCommissions.reduce((s, c) => s + Number(c.amount), 0);
    const uTotalWithdrawn = selectedUserWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0);
    const uAvailable = uTotalEarned + uTotalCommissions - uTotalWithdrawn;
    const referrerProfile = selectedUser.referred_by ? users.find(u => u.user_id === selectedUser.referred_by) : null;
    const uExpected = uTotalInvested * 2;
    const uCapping = uExpected > 0 ? ((uTotalEarned + uTotalCommissions) / uExpected * 100).toFixed(1) : '0';

    return (
      <div className="min-h-screen bg-background">
        {rejectionDialog}
        {holdDialog}
        <div className="container mx-auto px-3 sm:px-4 pt-4 pb-12">
          <Button variant="ghost" className="mb-4 text-muted-foreground" onClick={() => setSelectedUser(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
          </Button>

          <div className="mb-6 p-4 sm:p-6 rounded-2xl border border-primary/20 bg-card">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">{selectedUser.full_name || 'Unknown'}</h2>
                <p className="text-muted-foreground text-sm">{selectedUser.email}</p>
                <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                  <Badge variant="outline" className={selectedUser.is_blocked ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}>
                    {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Code: <strong className="text-amber-600 dark:text-amber-400">{selectedUser.referral_code}</strong> <CopyBtn text={selectedUser.referral_code || ''} /></span>
                  {referrerProfile && <span className="text-xs text-muted-foreground">Referred by: <strong className="text-foreground">{referrerProfile.full_name}</strong></span>}
                  <span className="text-xs text-muted-foreground">Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground">Capping: <strong className="text-amber-600 dark:text-amber-400">{uCapping}%</strong></span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Wallet: <span className="font-mono text-[10px]">{selectedUser.wallet_address || 'Not set'}</span></span>
                  {selectedUser.wallet_address && <CopyBtn text={selectedUser.wallet_address} />}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toggleBlockUser(selectedUser.id, selectedUser.is_blocked)}>
                  {selectedUser.is_blocked ? <><Unlock className="w-3 h-3 mr-1" /> Unblock</> : <><Ban className="w-3 h-3 mr-1" /> Block</>}
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setChangingWalletUserId(selectedUser.user_id); setNewWallet(selectedUser.wallet_address || ''); }}>
                  <Wallet className="w-3 h-3 mr-1" /> Wallet
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setChangingPasswordUserId(selectedUser.user_id); setNewPassword(''); }}>
                  <Key className="w-3 h-3 mr-1" /> Password
                </Button>
              </div>
            </div>

            {/* Change password inline */}
            {changingPasswordUserId === selectedUser.user_id && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <Label className="text-foreground text-sm">New Password</Label>
                <div className="flex gap-2 mt-2">
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="bg-background text-sm" />
                  <Button size="sm" className="bg-gradient-gold text-primary-foreground h-9" onClick={handleChangePassword}>Save</Button>
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setChangingPasswordUserId(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Change wallet inline */}
            {changingWalletUserId === selectedUser.user_id && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <Label className="text-foreground text-sm">New Wallet Address</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={newWallet} onChange={e => setNewWallet(e.target.value)} placeholder="BEP20 wallet address" className="bg-background font-mono text-sm" />
                  <Button size="sm" className="bg-gradient-gold text-primary-foreground h-9" onClick={handleChangeWallet}>Save</Button>
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setChangingWalletUserId(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3 mb-6">
            {[
              { label: 'Invested', value: `$${uTotalInvested.toFixed(2)}`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Earned', value: `$${uTotalEarned.toFixed(2)}`, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Commissions', value: `$${uTotalCommissions.toFixed(2)}`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Withdrawn', value: `$${uTotalWithdrawn.toFixed(2)}`, color: 'text-muted-foreground' },
              { label: 'Available', value: `$${uAvailable.toFixed(2)}`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Capping', value: `${uCapping}%`, color: 'text-amber-600 dark:text-amber-400' },
            ].map((s, i) => (
              <Card key={i} className="border-border"><CardContent className="p-3 sm:p-4">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">{s.label}</p>
                <p className={`text-sm sm:text-lg font-display font-bold ${s.color}`}>{s.value}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* User data tables */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-sm font-display text-foreground">Investments ({selectedUserInvestments.length})</CardTitle></CardHeader>
              <CardContent><div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Daily</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Days</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">TX</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr></thead><tbody>
                  {selectedUserInvestments.map(inv => (
                    <tr key={inv.id} className="border-b border-border/50">
                      <td className="p-2 text-foreground text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-2 font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                      <td className="p-2 text-amber-600 dark:text-amber-400 text-xs">${((Number(inv.amount) * 2) / 600).toFixed(4)}</td>
                      <td className="p-2 text-muted-foreground text-xs">{inv.days_paid || 0}/600</td>
                      <td className="p-2">
                        {inv.tx_hash ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[60px]">{inv.tx_hash}</span>
                            <CopyBtn text={inv.tx_hash} />
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-2">{statusBadge(inv.status)}</td>
                      <td className="p-2">
                        {inv.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-2" onClick={() => confirmInvestment(inv)}>✓</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => openRejectDialog(inv.id, 'deposit')}>✗</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody></table>
                {selectedUserInvestments.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No investments</p>}
              </div></CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-sm font-display text-foreground">Withdrawals ({selectedUserWithdrawals.length})</CardTitle></CardHeader>
              <CardContent><div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Date</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Wallet</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Reason</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr></thead><tbody>
                  {selectedUserWithdrawals.map(wd => (
                    <tr key={wd.id} className="border-b border-border/50">
                      <td className="p-2 text-foreground text-xs">{new Date(wd.created_at).toLocaleDateString()}</td>
                      <td className="p-2 font-semibold text-foreground">${Number(wd.amount).toFixed(2)}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[80px]">{wd.wallet_address}</span>
                          <CopyBtn text={wd.wallet_address} />
                        </div>
                      </td>
                      <td className="p-2">{statusBadge(wd.status)}</td>
                      <td className="p-2 text-xs text-destructive max-w-[100px] truncate">{wd.rejection_reason || '-'}</td>
                      <td className="p-2">
                        {wd.status === 'pending' && (
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-2" onClick={() => approveWithdrawal(wd.id)}>✓</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => openRejectDialog(wd.id, 'withdrawal')}>✗</Button>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 border-amber-500/30 text-amber-600 dark:text-amber-400" onClick={() => setHoldingWdId(wd.id)}>⏸</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody></table>
                {selectedUserWithdrawals.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No withdrawals</p>}
              </div></CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-sm font-display text-foreground">Referrals ({selectedUserReferrals.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedUserReferrals.length === 0 ? <p className="text-center text-muted-foreground py-4 text-sm">No referrals</p> :
                    selectedUserReferrals.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div><p className="font-medium text-foreground text-sm">{r.full_name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{r.email}</p></div>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {rejectionDialog}
      {holdDialog}
      <div className="container mx-auto px-3 sm:px-4 pt-20 pb-12">
        <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-[#070a0f] border border-white/10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <Shield className="w-6 sm:w-7 h-6 sm:h-7 text-[hsl(43,96%,56%)] shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white truncate">
                Admin <span className="text-gradient-gold">Control Panel</span>
              </h1>
            </div>
            <AdminNotificationBell
              pendingDeposits={stats.pendingDeposits}
              pendingWithdrawals={stats.pendingWithdrawals}
              openTickets={stats.openTickets}
              recentRejections={allWithdrawals.filter(w => w.status === 'pending' && w.rejection_reason)}
              recentInvestments={allInvestments.slice(0, 5)}
              getUserName={getUserName}
            />
          </div>
          <p className="text-white/50 text-xs sm:text-sm">Full system management • Investments • Withdrawals • Users • Support</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-3 mb-8">
          {[
            { icon: DollarSign, label: 'Total Invested', value: `$${stats.totalInvested.toFixed(0)}`, color: 'text-amber-600 dark:text-amber-400' },
            { icon: Users, label: 'Total Users', value: users.length, color: 'text-foreground' },
            { icon: UserCheck, label: 'Active Users', value: stats.activeUsers, color: 'text-emerald-600 dark:text-emerald-400' },
            { icon: TrendingUp, label: 'Total Payouts', value: `$${stats.totalPayouts.toFixed(0)}`, color: 'text-emerald-600 dark:text-emerald-400' },
            { icon: AlertTriangle, label: 'Pending Deposits', value: stats.pendingDeposits, color: 'text-amber-600 dark:text-amber-400' },
            { icon: Link2, label: 'Commissions', value: `$${stats.totalCommissions.toFixed(0)}`, color: 'text-amber-600 dark:text-amber-400' },
            { icon: MessageSquare, label: 'Open Tickets', value: stats.openTickets, color: 'text-amber-600 dark:text-amber-400' },
          ].map((item, i) => (
            <Card key={i} className="border-border bg-card"><CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">{item.label}</span>
              </div>
              <div className={`text-lg sm:text-xl font-display font-bold ${item.color}`}>{item.value}</div>
            </CardContent></Card>
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
                    <PieChart><Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {statusPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} /></PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>}
                <div className="flex flex-wrap gap-3 justify-center mt-1">
                  {statusPieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-muted-foreground">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending-deposits" className="space-y-6">
          <div className="overflow-x-auto -mx-3 px-3">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-3 md:grid-cols-9">
              <TabsTrigger value="pending-deposits" className="text-xs whitespace-nowrap">Deposits {pendingInvestments.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{pendingInvestments.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="pending-withdrawals" className="text-xs whitespace-nowrap">Withdrawals {pendingWithdrawalsList.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{pendingWithdrawalsList.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="users" className="text-xs whitespace-nowrap">Users</TabsTrigger>
              <TabsTrigger value="all-investments" className="text-xs whitespace-nowrap">All Investments</TabsTrigger>
              <TabsTrigger value="all-withdrawals" className="text-xs whitespace-nowrap">All Withdrawals</TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs whitespace-nowrap">Referrals</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs whitespace-nowrap">Notifications</TabsTrigger>
              <TabsTrigger value="support" className="text-xs whitespace-nowrap">Support {stats.openTickets > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{stats.openTickets}</Badge>}</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs whitespace-nowrap">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Pending Deposits */}
          <TabsContent value="pending-deposits">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Pending Deposits ({pendingInvestments.length})</CardTitle></CardHeader>
              <CardContent>
                {pendingInvestments.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">✅ No pending deposits</p> : (
                  <div className="space-y-3">
                    {pendingInvestments.map(inv => (
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">{getUserName(inv.user_id)} — <span className="text-amber-600 dark:text-amber-400 font-bold">${Number(inv.amount).toFixed(2)}</span></p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-muted-foreground">TX: <span className="font-mono text-[10px]">{inv.tx_hash ? inv.tx_hash.slice(0, 20) + '...' : 'N/A'}</span></p>
                            {inv.tx_hash && <CopyBtn text={inv.tx_hash} />}
                          </div>
                          <p className="text-xs text-muted-foreground">{getUserEmail(inv.user_id)} • {new Date(inv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 text-xs px-3" onClick={() => confirmInvestment(inv)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="destructive" className="h-9 text-xs px-3" onClick={() => openRejectDialog(inv.id, 'deposit')}>
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
              <CardHeader><CardTitle className="text-base font-display text-foreground">Pending Withdrawals ({pendingWithdrawalsList.length})</CardTitle></CardHeader>
              <CardContent>
                {pendingWithdrawalsList.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">✅ No pending withdrawals</p> : (
                  <div className="space-y-3">
                    {pendingWithdrawalsList.map(wd => (
                      <div key={wd.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">{getUserName(wd.user_id)} — <span className="text-amber-600 dark:text-amber-400 font-bold">${Number(wd.amount).toFixed(2)}</span></p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-muted-foreground">To: <span className="font-mono text-[10px]">{wd.wallet_address.slice(0, 20)}...</span></p>
                            <CopyBtn text={wd.wallet_address} />
                          </div>
                          <p className="text-xs text-muted-foreground">{getUserEmail(wd.user_id)} • {new Date(wd.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 text-xs px-3" onClick={() => approveWithdrawal(wd.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="h-9 text-xs px-3" onClick={() => openRejectDialog(wd.id, 'withdrawal')}>
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 text-xs px-3 border-amber-500/30 text-amber-700 dark:text-amber-400" onClick={() => setHoldingWdId(wd.id)}>
                            <PauseCircle className="w-3 h-3 mr-1" /> Hold
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
              <CardContent><div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Name</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Email</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Code</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Referred By</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Wallet</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Joined</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr></thead><tbody>
                  {users.map(u => {
                    const referrer = u.referred_by ? users.find(r => r.user_id === u.referred_by) : null;
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="p-2 font-medium text-foreground text-xs">{u.full_name || '-'}</td>
                        <td className="p-2 text-muted-foreground text-[10px] sm:text-xs">{u.email}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">{u.referral_code}</span>
                            {u.referral_code && <CopyBtn text={u.referral_code} />}
                          </div>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground hidden sm:table-cell">{referrer ? referrer.full_name : '-'}</td>
                        <td className="p-2 hidden md:table-cell">
                          {u.wallet_address ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[80px]">{u.wallet_address}</span>
                              <CopyBtn text={u.wallet_address} />
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className={`text-[10px] ${u.is_blocked ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                            {u.is_blocked ? 'Blocked' : 'Active'}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={() => viewUserPortfolio(u)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={() => toggleBlockUser(u.id, u.is_blocked)}>
                              {u.is_blocked ? <Unlock className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody></table>
              </div></CardContent>
            </Card>
          </TabsContent>

          {/* All Investments */}
          <TabsContent value="all-investments">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-display text-foreground">All Investments ({filteredInvestments.length})</CardTitle>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(['all', 'pending', 'confirmed', 'rejected'] as const).map(f => (
                    <Button key={f} size="sm" variant={filterTab === f ? 'default' : 'outline'} className="text-xs h-7" onClick={() => setFilterTab(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)} ({investmentCountByStatus[f]})
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent><div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">User</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Daily</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Days</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">TX</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Date</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr></thead><tbody>
                  {filteredInvestments.slice(0, 100).map(inv => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-2"><p className="text-foreground text-xs font-medium">{getUserName(inv.user_id)}</p><p className="text-[10px] text-muted-foreground">{getUserEmail(inv.user_id)}</p></td>
                      <td className="p-2 font-semibold text-foreground text-xs">${Number(inv.amount).toFixed(2)}</td>
                      <td className="p-2 text-amber-600 dark:text-amber-400 text-xs hidden sm:table-cell">${((Number(inv.amount) * 2) / 600).toFixed(4)}</td>
                      <td className="p-2 text-muted-foreground text-xs hidden sm:table-cell">{inv.days_paid || 0}/600</td>
                      <td className="p-2">
                        {inv.tx_hash ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[50px]">{inv.tx_hash}</span>
                            <CopyBtn text={inv.tx_hash} />
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs hidden md:table-cell">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-2">{statusBadge(inv.status)}</td>
                      <td className="p-2">
                        {inv.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-2" onClick={() => confirmInvestment(inv)}>✓</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => openRejectDialog(inv.id, 'deposit')}>✗</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div></CardContent>
            </Card>
          </TabsContent>

          {/* All Withdrawals */}
          <TabsContent value="all-withdrawals">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">All Withdrawals ({allWithdrawals.length})</CardTitle></CardHeader>
              <CardContent><div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">User</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Amount</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Wallet</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Date</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Reason</th>
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">Actions</th>
                </tr></thead><tbody>
                  {allWithdrawals.slice(0, 100).map(wd => (
                    <tr key={wd.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-2"><p className="text-foreground text-xs font-medium">{getUserName(wd.user_id)}</p><p className="text-[10px] text-muted-foreground">{getUserEmail(wd.user_id)}</p></td>
                      <td className="p-2 font-semibold text-foreground text-xs">${Number(wd.amount).toFixed(2)}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[60px]">{wd.wallet_address}</span>
                          <CopyBtn text={wd.wallet_address} />
                        </div>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs hidden sm:table-cell">{new Date(wd.created_at).toLocaleDateString()}</td>
                      <td className="p-2">{statusBadge(wd.status)}</td>
                      <td className="p-2 text-xs text-destructive hidden sm:table-cell max-w-[100px] truncate">{wd.rejection_reason || '-'}</td>
                      <td className="p-2">
                        {wd.status === 'pending' && (
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-2" onClick={() => approveWithdrawal(wd.id)}>✓</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => openRejectDialog(wd.id, 'withdrawal')}>✗</Button>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 border-amber-500/30 text-amber-700 dark:text-amber-400" onClick={() => setHoldingWdId(wd.id)}>⏸</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div></CardContent>
            </Card>
          </TabsContent>

          {/* Referrals */}
          <TabsContent value="referrals">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Referral Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Referrer</th>
                    <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Referred User</th>
                    <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs">Commission</th>
                    <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium text-xs hidden sm:table-cell">Date</th>
                  </tr></thead><tbody>
                    {allCommissions.slice(0, 100).map((c, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-2 sm:p-3"><p className="text-foreground text-xs font-medium">{getUserName(c.referrer_id)}</p><p className="text-[10px] text-muted-foreground">{getUserEmail(c.referrer_id)}</p></td>
                        <td className="p-2 sm:p-3"><p className="text-foreground text-xs font-medium">{getUserName(c.referred_id)}</p><p className="text-[10px] text-muted-foreground">{getUserEmail(c.referred_id)}</p></td>
                        <td className="p-2 sm:p-3 font-semibold text-amber-600 dark:text-amber-400 text-xs">${Number(c.amount).toFixed(2)}</td>
                        <td className="p-2 sm:p-3 text-muted-foreground text-xs hidden sm:table-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody></table>
                  {allCommissions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No referral commissions yet</p>}
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-sm font-display font-semibold text-foreground mb-4">Referral Connections</h4>
                  <div className="space-y-2">
                    {users.filter(u => u.referred_by).map((u, i) => {
                      const referrer = users.find(r => r.user_id === u.referred_by);
                      return (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><UserCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-600 dark:text-amber-400" /></div>
                            <div className="min-w-0"><p className="text-xs font-medium text-foreground truncate">{referrer?.full_name || 'Unknown'}</p><p className="text-[10px] text-muted-foreground truncate">{referrer?.email}</p></div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">→</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600 dark:text-emerald-400" /></div>
                            <div className="min-w-0"><p className="text-xs font-medium text-foreground truncate">{u.full_name || 'Unknown'}</p><p className="text-[10px] text-muted-foreground truncate">{u.email}</p></div>
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

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="border-border max-w-2xl">
              <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><Bell className="w-4 h-4" /> Send Notification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Send To</Label>
                  <select value={notifTarget} onChange={e => setNotifTarget(e.target.value)} className="w-full p-2 rounded-md border border-input bg-background text-foreground text-sm">
                    <option value="all">All Users (Broadcast)</option>
                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Title</Label>
                  <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Notification title" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Message</Label>
                  <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Write your notification..." className="w-full p-3 rounded-md border border-input bg-background text-foreground text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold h-10" onClick={handleSendNotification}>
                  <Send className="w-4 h-4 mr-2" /> Send Notification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets */}
          <TabsContent value="support">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display text-foreground">Support Tickets ({allTickets.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allTickets.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">No support tickets</p> :
                    allTickets.map(t => (
                      <div key={t.id} className="p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-medium text-foreground text-sm">{t.subject}</p>
                            <p className="text-xs text-muted-foreground">{getUserName(t.user_id)} • {getUserEmail(t.user_id)} • {new Date(t.created_at).toLocaleString()}</p>
                          </div>
                          {statusBadge(t.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{t.message}</p>
                        {t.admin_reply && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-3">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-1">Your Reply:</p>
                            <p className="text-xs text-foreground">{t.admin_reply}</p>
                          </div>
                        )}
                        {t.status === 'open' && (
                          replyingTicketId === t.id ? (
                            <div className="space-y-2">
                              <textarea value={ticketReply} onChange={e => setTicketReply(e.target.value)} placeholder="Type your reply..." className="w-full p-3 rounded-md border border-input bg-background text-foreground text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-gradient-gold text-primary-foreground hover:opacity-90 h-9 text-xs px-3" onClick={handleReplyTicket}><Send className="w-3 h-3 mr-1" /> Send Reply</Button>
                                <Button size="sm" variant="outline" className="h-9 text-xs px-3" onClick={() => { setReplyingTicketId(null); setTicketReply(''); }}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="h-9 text-xs px-3" onClick={() => setReplyingTicketId(t.id)}>
                              <MessageSquare className="w-3 h-3 mr-1" /> Reply
                            </Button>
                          )
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><Settings className="w-4 h-4" /> Site Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">USDT Deposit Address (BEP20)</Label>
                    <Input value={usdtAddress} onChange={e => setUsdtAddress(e.target.value)} placeholder="BEP20 USDT address" className="bg-background font-mono text-sm" />
                  </div>
                  <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold shadow-gold h-10" onClick={updateSettings}>Save Address</Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display text-foreground flex items-center gap-2"><ImageIcon className="w-4 h-4" /> QR Code</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {siteSettings?.qr_code_url && (
                    <div className="text-center">
                      <img src={`${siteSettings.qr_code_url}?t=${Date.now()}`} alt="Current QR" className="w-40 h-40 mx-auto rounded-lg border border-border" />
                      <p className="text-xs text-muted-foreground mt-2">Current QR Code</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-foreground text-sm mb-2 block">Upload New QR Code</Label>
                    <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{qrUploading ? 'Uploading...' : 'Click to upload QR image'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={qrUploading} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
