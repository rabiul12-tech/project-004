'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Network,
  Building2,
  Clock,
  FileCheck2,
  CalendarDays,
  Sparkles,
  Wallet,
  ReceiptText,
  TrendingUp,
  Briefcase,
  Award,
  CheckSquare,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Activity,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { QuickCreateModalType, useHRStore } from '@/lib/stores/useHRStore';
import { DemoRole } from '@/lib/types/hr';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';
import { GlobalSearchDialog } from '@/components/modals/GlobalSearchDialog';
import { QuickCreateDialog } from '@/components/modals/QuickCreateDialog';
import { EmployeeProfileDrawer } from '@/components/modals/EmployeeProfileDrawer';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Employees', href: '/dashboard/employees', icon: Users },
      { label: 'Organization', href: '/dashboard/organization', icon: Network },
      { label: 'Departments', href: '/dashboard/departments', icon: Building2 },
    ],
  },
  {
    group: 'Time & Attendance',
    items: [
      { label: 'Attendance', href: '/dashboard/attendance', icon: Clock },
      { label: 'Leave Requests', href: '/dashboard/leave', icon: FileCheck2 },
      { label: 'Leave Calendar', href: '/dashboard/leave-calendar', icon: CalendarDays },
      { label: 'Holidays', href: '/dashboard/holidays', icon: Sparkles },
    ],
  },
  {
    group: 'Payroll',
    items: [
      { label: 'Payroll', href: '/dashboard/payroll', icon: Wallet },
      { label: 'Payslips', href: '/dashboard/payslips', icon: ReceiptText },
      { label: 'Compensation', href: '/dashboard/compensation', icon: TrendingUp },
    ],
  },
  {
    group: 'Talent',
    items: [
      { label: 'Recruitment', href: '/dashboard/recruitment', icon: Briefcase },
      { label: 'Performance', href: '/dashboard/performance', icon: Award },
      { label: 'Onboarding', href: '/dashboard/onboarding', icon: CheckSquare },
    ],
  },
  {
    group: 'Insights',
    items: [
      { label: 'HR Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/dashboard/reports', icon: FileSpreadsheet },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Team & Roles', href: '/dashboard/team', icon: ShieldCheck },
      { label: 'Activity', href: '/dashboard/activity', icon: Activity },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Help', href: '/dashboard/help', icon: HelpCircle },
    ],
  },
];

const QUICK_CREATE_ITEMS: { label: string; modal: Exclude<QuickCreateModalType, null> }[] = [
  { label: 'Add Employee', modal: 'employee' },
  { label: 'Add Department', modal: 'department' },
  { label: 'Record Attendance', modal: 'attendance' },
  { label: 'Request Leave', modal: 'leave' },
  { label: 'Create Job Opening', modal: 'job' },
  { label: 'Add Candidate', modal: 'candidate' },
  { label: 'Create Performance Review', modal: 'review' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isHydrated,
    recoveredFromCorruption,
    hydrateWorkspace,
    data,
    settings,
    ui,
    setTheme,
    toggleSidebar,
    setActiveDemoRole,
    setGlobalSearchOpen,
    setQuickCreateModal,
    setDrawerEmployeeId,
  } = useHRStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    hydrateWorkspace();
  }, [hydrateWorkspace]);

  useEffect(() => {
    if (!isHydrated) return;
    if (ui.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isHydrated, ui.theme]);

  useEffect(() => {
    if (recoveredFromCorruption) {
      toast.info('Recovered local storage state from deterministic seed backup.');
    }
  }, [recoveredFromCorruption]);

  const activeEmployee =
    data.employees.find((e) => e.id === ui.activeDemoEmployeeId) ??
    data.employees[3] ??
    data.employees[0];

  const pendingLeavesCount = data.leaveRequests.filter(
    (r) => r.status === 'Pending'
  ).length;

  // Compute Breadcrumbs
  const pathSegments = (pathname || '/dashboard')
    .split('/')
    .filter(Boolean);

  const breadcrumbLabels = pathSegments.map((seg, idx) => {
    if (seg === 'dashboard') return 'Peoplix Workspace';
    if (idx === 2 && pathSegments[1] === 'employees') {
      const emp = data.employees.find((e) => e.id === seg);
      return emp ? emp.fullName : seg;
    }
    return seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  });

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = !isMobile && ui.sidebarCollapsed;

    return (
      <div className="flex flex-col h-full justify-between bg-white dark:bg-[#121D2B] text-slate-800 dark:text-slate-100 select-none">
        {/* Top Brand & Workspace Selector */}
        <div>
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-[#304154]">
            <Link
              href="/dashboard"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                PX
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    {settings.logoText || 'PEOPLIX HR'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {settings.companyName}
                  </div>
                </div>
              )}
            </Link>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {!collapsed && (
            <div className="px-4 py-2.5 bg-[#E8F7F4] dark:bg-teal-950/30 border-b border-slate-200 dark:border-[#304154] flex items-center justify-between text-[11px]">
              <span className="font-medium text-teal-900 dark:text-teal-300">
                Local Browser Demo
              </span>
              <span className="text-teal-700 dark:text-teal-400 tabular-nums">
                {data.employees.filter((e) => !e.archived).length} People
              </span>
            </div>
          )}

          {/* Navigation Groups */}
          <nav
            aria-label="Primary Sidebar Navigation"
            className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-230px)]"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.group}>
                {!collapsed && (
                  <div className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                    {group.group}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={() => isMobile && setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-[#E8F7F4] dark:bg-teal-500/15 text-[#0D9488] dark:text-[#2DD4BF] font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182535] hover:text-slate-900 dark:hover:text-white'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {!collapsed &&
                          item.href === '/dashboard/leave' &&
                          pendingLeavesCount > 0 && (
                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                              {pendingLeavesCount}
                            </span>
                          )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Demo Role Selector & Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-[#304154] space-y-2.5 bg-slate-50/60 dark:bg-[#0D1420]/50">
          {!collapsed && activeEmployee && (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <EmployeeAvatar
                  name={activeEmployee.fullName}
                  color={activeEmployee.avatarColor}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setDrawerEmployeeId(activeEmployee.id)}
                    className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-teal-600 block text-left"
                  >
                    {activeEmployee.fullName}
                  </button>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Previewing as {ui.activeDemoRole}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="demo-role-select"
                  className="sr-only"
                >
                  Role Preview Selector
                </label>
                <select
                  id="demo-role-select"
                  value={ui.activeDemoRole}
                  onChange={(e) => setActiveDemoRole(e.target.value as DemoRole)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#304154] bg-white dark:bg-[#182535] text-slate-700 dark:text-slate-200"
                >
                  <option value="HR Admin">Role Preview: HR Admin</option>
                  <option value="HR Manager">Role Preview: HR Manager</option>
                  <option value="Department Manager">Role Preview: Dept Manager</option>
                  <option value="Employee">Role Preview: Employee Self-Service</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              type="button"
              onClick={() => setTheme(ui.theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#182535] transition-colors flex-1"
              aria-label="Toggle color theme"
            >
              {ui.theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {!collapsed && <span>Light</span>}
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  {!collapsed && <span>Dark</span>}
                </>
              )}
            </button>

            {!isMobile && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-[#182535] transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFC] dark:bg-[#0D1420] text-[#172033] dark:text-[#F8FAFC]">
      <Toaster position="bottom-right" richColors />
      <GlobalSearchDialog />
      <QuickCreateDialog />
      <EmployeeProfileDrawer />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-[#E7EAF0] dark:border-[#304154] transition-all duration-200 ${
          ui.sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#121D2B]/95 backdrop-blur-xs border-b border-[#E7EAF0] dark:border-[#304154] px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile Trigger + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              {breadcrumbLabels.map((label, idx) => (
                <React.Fragment key={`${label}-${idx}`}>
                  {idx > 0 && (
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                      /
                    </span>
                  )}
                  <span
                    className={`truncate ${
                      idx === breadcrumbLabels.length - 1
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hidden sm:inline'
                    }`}
                  >
                    {label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Search, Date, Quick Create, Notifications, Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Search Trigger */}
            <button
              type="button"
              onClick={() => setGlobalSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#304154] bg-slate-50 dark:bg-[#182535] text-xs text-slate-500 dark:text-slate-300 hover:border-teal-500 transition-colors"
              aria-label="Open Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Search people, pages, actions...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Current Date Display */}
            <span className="hidden xl:inline-block text-xs text-slate-500 dark:text-slate-400 tabular-nums px-1">
              Nov 13, 2026
            </span>

            {/* Quick Create Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setQuickCreateOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Create</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {quickCreateOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50"
                  role="menu"
                >
                  {QUICK_CREATE_ITEMS.map((item) => (
                    <button
                      key={item.modal}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setQuickCreateOpen(false);
                        setQuickCreateModal(item.modal);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setQuickCreateOpen(false);
                }}
                className="relative p-2 rounded-lg border border-slate-200 dark:border-[#304154] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182535]"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingLeavesCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {pendingLeavesCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Notifications & Action Queue
                    </span>
                    <Link
                      href="/dashboard/leave"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Review Leaves ({pendingLeavesCount})
                    </Link>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.activities.slice(0, 5).map((act) => (
                      <div
                        key={act.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs"
                      >
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {act.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle in Topbar */}
            <button
              type="button"
              onClick={() => setTheme(ui.theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#304154] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182535]"
              aria-label="Switch light or dark mode"
            >
              {ui.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Demo Profile Trigger */}
            {activeEmployee && (
              <button
                type="button"
                onClick={() => setDrawerEmployeeId(activeEmployee.id)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#182535] transition-colors"
                title={`Active Demo User: ${activeEmployee.fullName} (${ui.activeDemoRole})`}
              >
                <EmployeeAvatar
                  name={activeEmployee.fullName}
                  color={activeEmployee.avatarColor}
                  size="sm"
                />
                <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-200">
                  {activeEmployee.firstName}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
