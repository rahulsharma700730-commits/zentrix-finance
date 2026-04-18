import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, ArrowDownToLine, MessageSquare, PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  pendingDeposits: number;
  pendingWithdrawals: number;
  openTickets: number;
  recentRejections: any[];
  recentInvestments: any[];
  getUserName: (id: string) => string;
}

export const AdminNotificationBell = ({
  pendingDeposits, pendingWithdrawals, openTickets, recentRejections, recentInvestments, getUserName,
}: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = pendingDeposits + pendingWithdrawals + openTickets + recentRejections.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    pendingDeposits > 0 && {
      icon: AlertTriangle, color: 'text-amber-500',
      title: `${pendingDeposits} Pending Deposit${pendingDeposits > 1 ? 's' : ''}`,
      desc: 'Awaiting your confirmation',
    },
    pendingWithdrawals > 0 && {
      icon: ArrowDownToLine, color: 'text-amber-500',
      title: `${pendingWithdrawals} Pending Withdrawal${pendingWithdrawals > 1 ? 's' : ''}`,
      desc: 'Review and approve / reject',
    },
    openTickets > 0 && {
      icon: MessageSquare, color: 'text-blue-500',
      title: `${openTickets} Open Support Ticket${openTickets > 1 ? 's' : ''}`,
      desc: 'Users waiting for reply',
    },
    ...recentRejections.map(w => ({
      icon: PauseCircle, color: 'text-amber-600',
      title: `Withdrawal On Hold — ${getUserName(w.user_id)}`,
      desc: w.rejection_reason,
    })),
  ].filter(Boolean) as { icon: any; color: string; title: string; desc: string }[];

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {total > 0 && (
          <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 bg-red-500 hover:bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#070a0f]">
            {total > 9 ? '9+' : total}
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-card border border-border shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground">Admin Alerts</p>
            <p className="text-[11px] text-muted-foreground">{total} item{total !== 1 ? 's' : ''} need attention</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                ✅ All clear — nothing pending
              </div>
            ) : items.map((it, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border-b border-border/50 hover:bg-muted/30 transition-colors">
                <it.icon className={`w-4 h-4 ${it.color} mt-0.5 shrink-0`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{it.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{it.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
