import { LayoutDashboard, ArrowDownToLine, TrendingUp, Users, History, Bell, HelpCircle, Settings, LogOut, Wallet, Download } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import logo from '@/assets/logo.png';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type DashboardSection =
  | 'overview' | 'deposit' | 'withdraw' | 'investments'
  | 'referral' | 'history' | 'notifications' | 'support' | 'settings';

interface Props {
  active: DashboardSection;
  onChange: (s: DashboardSection) => void;
  unreadCount?: number;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

const items: { id: DashboardSection; title: string; icon: any }[] = [
  { id: 'overview', title: 'Overview', icon: LayoutDashboard },
  { id: 'deposit', title: 'Deposit', icon: Wallet },
  { id: 'withdraw', title: 'Withdraw', icon: ArrowDownToLine },
  { id: 'investments', title: 'Investments', icon: TrendingUp },
  { id: 'referral', title: 'Referral', icon: Users },
  { id: 'history', title: 'History', icon: History },
  { id: 'notifications', title: 'Alerts', icon: Bell },
  { id: 'support', title: 'Support', icon: HelpCircle },
  { id: 'settings', title: 'Settings', icon: Settings },
];

export const DashboardSidebar = ({ active, onChange, unreadCount = 0, canInstallPwa, onInstallPwa }: Props) => {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (id: DashboardSection) => {
    onChange(id);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <img src={logo} alt="Zentrix" className="w-8 h-8 rounded-lg shrink-0" />
          {!collapsed && <span className="font-display font-bold text-sm text-gradient-gold">Zentrix Finance</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Investor Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelect(item.id)}
                    isActive={active === item.id}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.id === 'notifications' && unreadCount > 0 && !collapsed && (
                      <Badge className="ml-auto h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
