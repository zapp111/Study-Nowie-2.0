import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', label: 'Today', icon: LayoutDashboard },
  { href: '/sessions', label: 'Study plan', icon: CalendarDays },
  { href: '/syllabus', label: 'Syllabus tracker', icon: ListChecks },
  { href: '/quizzes', label: 'Quizzes', icon: BookOpen },
  { href: '/mistakes', label: 'Mistake notebook', icon: NotebookPen },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/completed', label: 'Completed', icon: CheckCircle2 },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export const ADMIN_ITEMS = [{ href: '/admin', label: 'Admin', icon: Shield }] as const;

export const BRAND_ICON = GraduationCap;
