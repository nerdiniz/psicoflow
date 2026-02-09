import React from 'react';
import { View, IMAGES } from '../types';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Wallet,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Search,
  Menu,
  X,
  Loader2,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Sun,
  LogOut,
  FileBarChart,
  Brain
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { user } = useAuth();
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light');
  const [profile, setProfile] = React.useState<any>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (user) {
      fetchProfile();

      const channel = supabase
        .channel('profile-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          setProfile(payload.new);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq(user ? 'id' : '', user?.id)
        .single();
      if (data) setProfile(data);
    } catch (err) {
      console.error('Error fetching layout profile:', err);
    }
  }

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const navigationItems = (
    <>
      <NavItem
        icon={<LayoutDashboard size={20} />}
        label="Dashboard"
        active={currentView === 'dashboard'}
        onClick={() => { onViewChange('dashboard'); setIsMobileMenuOpen(false); }}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={<Users size={20} />}
        label="Pacientes"
        active={currentView === 'patients'}
        onClick={() => { onViewChange('patients'); setIsMobileMenuOpen(false); }}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={<CalendarDays size={20} />}
        label="Agenda"
        active={currentView === 'agenda'}
        onClick={() => { onViewChange('agenda'); setIsMobileMenuOpen(false); }}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={<FileBarChart size={20} />}
        label="Relatórios"
        active={currentView === 'reports'}
        onClick={() => { onViewChange('reports'); setIsMobileMenuOpen(false); }}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={<Wallet size={20} />}
        label="Financeiro"
        active={currentView === 'financial'}
        onClick={() => { onViewChange('financial'); setIsMobileMenuOpen(false); }}
        isCollapsed={isCollapsed}
      />
      <button
        onClick={() => supabase.auth.signOut()}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl font-medium transition-all group text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
        title={isCollapsed ? 'Sair' : ''}
      >
        <span className="flex-shrink-0">
          <LogOut size={20} />
        </span>
        {(!isCollapsed || isMobileMenuOpen) && <span className="truncate">Sair</span>}
      </button>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 z-[70] md:hidden transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shadow-sm flex-shrink-0">
            <Brain className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">PsicoFlow</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto p-2 text-gray-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigationItems}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <NavItem
            icon={<SettingsIcon size={20} />}
            label="Configurações"
            active={currentView === 'settings'}
            onClick={() => { onViewChange('settings'); setIsMobileMenuOpen(false); }}
          />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 relative`}>
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shadow-sm flex-shrink-0">
            <Brain className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight animate-fade-in">PsicoFlow</span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-all shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeftIcon size={14} />}
        </button>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigationItems}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <NavItem
            icon={<SettingsIcon size={20} />}
            label="Configurações"
            active={currentView === 'settings'}
            onClick={() => onViewChange('settings')}
            isCollapsed={isCollapsed}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-8 z-10 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Brain className="text-emerald-600 dark:text-emerald-400" size={18} />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-6 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-6 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                  {profile?.name || user?.user_metadata?.name || 'Profissional'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest">Psicólogo</p>
              </div>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-black border-2 border-white dark:border-gray-800 text-sm">
                  {(profile?.name || user?.email || 'P').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl font-medium transition-all group ${active
      ? 'bg-primary-50 text-primary-600'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      } `}
    title={isCollapsed ? label : ''}
  >
    <span className={`${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'} flex-shrink-0`}>
      {icon}
    </span>
    {!isCollapsed && <span className="truncate">{label}</span>}
  </button>
);