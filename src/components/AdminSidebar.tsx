import {
  LayoutDashboard, AlertTriangle, ArrowDownToLine, Users, TrendingUp, History,
  Link2, Bell, MessageSquare, Settings, LogOut, Download, Shield,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import logo from '@/assets/logo.png';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type AdminSection =
  | 'overview' | 'deposits' | 'withdrawals' | 'users'
  | 'all-investments' | 'all-withdrawals' | 'referrals'
  | 'notifications' | 'support' | 'settings';

interface Props {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
  openTickets?: number;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

const items: { id: AdminSection; title: string; icon: any; badgeKey?: 'deposits' | 'withdrawals' | 'tickets' }[] = [
  { id: 'overview', title: 'Overview', icon: LayoutDashboard },
  { id: 'deposits', title: 'Pending Deposits', icon: AlertTriangle, badgeKey: 'deposits' },
  { id: 'withdrawals', title: 'Pending Withdrawals', icon: ArrowDownToLine, badgeKey: 'withdrawals' },
  { id: 'users', title: 'Users', icon: Users },
  { id: 'all-investments', title: 'All Investments', icon: TrendingUp },
  { id: 'all-withdrawals', title: 'All Withdrawals', icon: History },
  { id: 'referrals', title: 'Referrals', icon: Link2 },
  { id: 'notifications', title: 'Send Alerts', icon: Bell },
  { id: 'support', title: 'Support', icon: MessageSquare, badgeKey: 'tickets' },
  { id: 'settings', title: 'Settings', icon: Settings },
];

export const AdminSidebar = ({
  active, onChange, pendingDeposits = 0, pendingWithdrawals = 0, openTickets = 0,
  canInstallPwa, onInstallPwa,
}: Props) => {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (id: AdminSection) => {
    onChange(id);
    if (isMobile) setOpenMobile(false);
  };

  const badgeFor = (key?: string) => {
    if (key === 'deposits') return pendingDeposits;
    if (key === 'withdrawals') return pendingWithdrawals;
    if (key === 'tickets') return openTickets;
    return 0;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <img src={logo} alt="Zentrix" className="w-8 h-8 rounded-lg shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-display font-bold text-sm text-gradient-gold truncate">Admin Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Control Center</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const count = badgeFor(item.badgeKey);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleSelect(item.id)}
                      isActive={active === item.id}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {count > 0 && !collapsed && (
                        <Badge className="ml-auto h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px]">
                          {count}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {canInstallPwa && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onInstallPwa} tooltip="Install App">
                <Download className="h-4 w-4" />
                <span>Install App</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate('/'); }}
              tooltip="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
