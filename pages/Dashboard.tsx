import React from 'react';
import { View } from '../types';
import {
  Users,
  TrendingUp,
  Flower,
  DollarSign,
  CalendarCheck,
  Video,
  MoreVertical,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isSameDay, addMonths, subMonths, startOfDay, endOfDay, eachDayOfInterval, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [stats, setStats] = React.useState({
    totalPatients: 0,
    sessionsThisWeek: 0,
    monthlyRevenue: 0,
    todayAppointments: [] as any[]
  });

  const [profileName, setProfileName] = React.useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchProfileName();
    }
  }, [user, selectedDate, currentMonth]);

  async function fetchProfileName() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .single();
      if (data?.name) setProfileName(data.name.split(' ')[0]);
    } catch (err) {
      console.error('Error fetching profile name:', err);
    }
  }

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // 1. Total Patients (Unique count)
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // 2. Sessions this week
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();
      const { count: sessionCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .neq('status', 'cancelado');

      // 3. Advanced Revenue Calculation (Synced with Financial)
      const monthStart = startOfMonth(currentMonth).toISOString();
      const monthEnd = endOfMonth(currentMonth).toISOString();

      const { data: monthApps } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (
                payment_type,
                custom_price,
                plans (value)
            )
        `)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .neq('status', 'cancelado');

      const processedApps = monthApps?.map(app => {
        const patient = app.patients as any;
        let value = 0;
        if (patient) {
          if (patient.payment_type?.toLowerCase() === 'plano') {
            const plan = Array.isArray(patient.plans) ? patient.plans[0] : patient.plans;
            value = Number(plan?.value) || 0;
          } else {
            value = Number(patient.custom_price) || 0;
          }
        }
        return { ...app, computedValue: value };
      }) || [];

      // Projections for Recurring Slots
      const { data: slotsData } = await supabase
        .from('recurring_slots')
        .select(`
            *,
            patients (
                payment_type,
                custom_price,
                plans (value)
            )
        `)
        .eq('user_id', user?.id);

      let projectedRevenue = 0;
      if (slotsData && slotsData.length > 0) {
        const days = eachDayOfInterval({
          start: startOfMonth(currentMonth),
          end: endOfMonth(currentMonth)
        });

        slotsData.forEach(slot => {
          const slotDayOfWeek = slot.day_of_week;
          const slotTime = slot.start_time.substring(0, 5);

          days.forEach(date => {
            if (date.getDay() === slotDayOfWeek) {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isOverridden = processedApps.some(app => {
                const appDate = new Date(app.date);
                return format(appDate, 'yyyy-MM-dd') === dateStr &&
                  format(appDate, 'HH:mm') === slotTime;
              });

              if (!isOverridden) {
                const patient = slot.patients as any;
                let value = 0;
                if (patient) {
                  if (patient.payment_type?.toLowerCase() === 'plano') {
                    const plan = Array.isArray(patient.plans) ? patient.plans[0] : patient.plans;
                    value = Number(plan?.value) || 0;
                  } else {
                    value = Number(patient.custom_price) || 0;
                  }
                }
                projectedRevenue += value;
              }
            }
          });
        });
      }

      const totalRevenue = processedApps.reduce((acc, curr) => acc + curr.computedValue, 0) + projectedRevenue;

      // 4. Appointments for Selected Date
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      const { data: dayApps } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .gte('date', dayStart)
        .lte('date', dayEnd)
        .neq('status', 'cancelado')
        .order('date', { ascending: true });

      setStats({
        totalPatients: patientCount || 0,
        sessionsThisWeek: sessionCount || 0,
        monthlyRevenue: totalRevenue,
        todayAppointments: dayApps || []
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {profileName || user?.user_metadata?.name?.split(' ')[0] || 'Profissional'}! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Aqui está o resumo dos seus atendimentos para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pacientes Ativos"
          value={loading ? '...' : stats.totalPatients.toString()}
          trend="Total cadastrado"
          trendColor="bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          icon={<Users size={24} />}
          iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Sessões na Semana"
          value={loading ? '...' : stats.sessionsThisWeek.toString()}
          subValue="Agendadas/Realizadas"
          icon={<CalendarCheck size={24} />}
          iconBg="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Faturamento Estimado"
          value={loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)}
          trend={format(currentMonth, 'MMMM', { locale: ptBR })}
          trendColor="bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 capitalize"
          icon={<DollarSign size={24} />}
          iconBg="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          trendIcon={<TrendingUp size={14} className="mr-1" />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Calendar Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(currentMonth)),
                end: endOfWeek(endOfMonth(currentMonth))
              }).map((day, i) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`
                                h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all
                                ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300'}
                                ${isSelected ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                                ${isToday && !isSelected ? 'border border-primary-500 text-primary-500' : ''}
                            `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Appointments List for Selected Date */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="text-primary-500" size={20} />
                Agenda de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={32} />
              </div>
            ) : stats.todayAppointments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <CalendarCheck size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dia Livre</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  Nenhum atendimento agendado para esta data. Que tal aproveitar para descansar ou estudar?
                </p>
                <button
                  onClick={() => onViewChange('agenda')}
                  className="mt-6 px-6 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-bold hover:bg-primary-100 transition-colors"
                >
                  Ver Agenda Completa
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.todayAppointments.map((app) => (
                  <div key={app.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <span className="text-xl font-bold text-gray-400 min-w-[3rem]">{format(new Date(app.date), 'HH:mm')}</span>
                      <div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white">{app.patients?.name}</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium mt-1
                             ${app.type === 'online' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'}
                          `}>
                          {app.type === 'online' ? <Video size={12} /> : <Users size={12} />}
                          {app.type === 'online' ? 'Online' : 'Presencial'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                            ${app.status === 'realizado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          app.status === 'agendado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500'}
                         `}>
                        {app.status}
                      </span>
                      <button className="p-2 text-gray-300 hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <footer className="text-center text-xs text-gray-400 pb-8 pt-4">
        © 2026 PsicoFlow. Feito com 💜 para psicólogos.
      </footer>
    </div>
  );
};

// Sub-components for cleanliness
const StatCard = ({ title, value, subValue, trend, trendColor, icon, iconBg, trendIcon }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-start justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{value}</h3>
      {trend && (
        <div className={`flex items-center mt-3 text-xs font-bold px-2 py-1 rounded-lg w-fit ${trendColor}`}>
          {trendIcon}{trend}
        </div>
      )}
      {subValue && (
        <div className="flex items-center mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {subValue}
        </div>
      )}
    </div>
    <div className={`p-4 rounded-2xl ${iconBg}`}>
      {icon}
    </div>
  </div>
);

const MiniCalendar = () => {
  // Componente substituído pela implementação inline para melhor controle de estado
  return null;
}