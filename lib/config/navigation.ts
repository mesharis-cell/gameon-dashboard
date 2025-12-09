import {
  LayoutDashboard,
  Zap,
  type LucideIcon,
  ChartNoAxesColumnDecreasing,
  SlidersHorizontal,
  UserRound,
  House,
  Milk,
  CalendarDays,
  Upload,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permissions?: string[]; // Empty array = accessible to all
}

export const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    permissions: [], // All users can access
  },
  {
    title: 'Proposals',
    href: '/proposals',
    icon: CalendarDays,
    permissions: ['proposal:view:own', 'proposal:view:all', 'proposal:manage:own', 'proposal:admin:all'],
  },
  {
    title: 'Brands',
    href: '/brands',
    icon: Milk,
    permissions: ['brand:view:all', 'brand:manage:all'],
  },
  {
    title: 'Activations',
    href: '/activations',
    icon: Zap,
    permissions: ['activation:view:all', 'activation:manage:all'],
  },
  {
    title: 'Venues',
    href: '/venues',
    icon: House,
    permissions: ['venue:view:own', 'venue:view:all', 'venue:manage:own', 'venue:manage:all'],
  },
  {
    title: 'Import',
    href: '/import',
    icon: Upload,
    permissions: ['import:manage:all'],
  },
  {
    title: 'Users',
    href: '/users',
    icon: UserRound,
    permissions: ['user:manage:all'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: SlidersHorizontal,
    permissions: ['setting:manage:all', 'setting:view:all', 'role:view:all'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: ChartNoAxesColumnDecreasing,
    permissions: ['report:view:all', 'report:export:all'],
  },

];