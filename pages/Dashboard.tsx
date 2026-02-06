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
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || 'Profissional';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bom dia, {userName}! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Aqui está o resumo dos seus atendimentos hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Pacientes"
          value="--"
          trend="Dados reais"
          trendColor="bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          icon={<Users size={24} />}
          iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Sessões na Semana"
          value="--"
          subValue="Aguardando consultas"
          icon={<Flower size={24} />}
          iconBg="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Faturamento Mensal"
          value="R$ 0,00"
          trend="Sem variação"
          trendColor="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
          icon={<DollarSign size={24} />}
          iconBg="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          trendIcon={<TrendingUp size={14} className="mr-1" />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Empty Agenda State */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="text-emerald-500" size={20} />
                Consultas de Hoje
              </h2>
            </div>

            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <CalendarCheck size={32} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Nenhuma consulta hoje</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] mx-auto">
                Sua agenda está livre. Aproveite para organizar seus prontuários.
              </p>
              <button
                onClick={() => onViewChange('agenda')}
                className="mt-6 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-2 mx-auto"
              >
                <Plus size={16} /> Agendar Sessão
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <MiniCalendar />
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 pb-4 pt-8 dark:text-gray-600">
        © 2026 PsicoFlow. A plataforma do psicólogo moderno.
      </footer>
    </div>
  );
};

// Sub-components for cleanliness
const StatCard = ({ title, value, subValue, trend, trendColor, icon, iconBg, trendIcon }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start justify-between transition-colors">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
      {trend && (
        <div className={`flex items-center mt-2 text-xs font-medium px-2 py-1 rounded w-fit ${trendColor}`}>
          {trendIcon}{trend}
        </div>
      )}
      {subValue && (
        <div className="flex items-center mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {subValue}
        </div>
      )}
    </div>
    <div className={`p-3 rounded-lg ${iconBg}`}>
      {icon}
    </div>
  </div>
);

const AppointmentItem = ({ time, name, type, status, day, dayName, statusColor = "bg-green-100 text-green-700", video, edit }: any) => (
  <div className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl font-bold ${day === '09' ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
        <span className="text-xs uppercase">{dayName}</span>
        <span className="text-lg">{day}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{time}</p>
        <h4 className="text-base font-semibold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{type}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className={`px-3 py-1 rounded-full text-xs font-medium border border-opacity-10 ${statusColor.replace('text-', 'border-').replace('100', '200')} ${statusColor}`}>
        {status}
      </span>
      {video && (
        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors border border-transparent hover:border-gray-200 rounded-lg">
          <Video size={18} />
        </button>
      )}
      {edit && (
        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors border border-transparent hover:border-gray-200 rounded-lg">
          <Edit3 size={18} />
        </button>
      )}
      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical size={18} />
      </button>
    </div>
  </div>
);

const MiniCalendar = () => {
  const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  // Starting from 29th (Sunday) to fill the grid like the screenshot
  const dates = [
    { d: 29, inactive: true }, { d: 30, inactive: true },
    { d: 1 }, { d: 2 }, { d: 3 }, { d: 4 }, { d: 5 },
    { d: 6 }, { d: 7 }, { d: 8 },
    { d: 9, active: true }, // The selected day
    { d: 10, hasDot: true }, { d: 11 }, { d: 12 }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white truncate">Fevereiro 2026</h3>
        <div className="flex gap-2">
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg></button>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {days.map((d, i) => <span key={i} className="text-gray-400 font-medium">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {dates.map((date, i) => (
          <div
            key={i}
            className={`
                            relative p-1 rounded-lg cursor-pointer flex items-center justify-center w-8 h-8 mx-auto
                            ${date.inactive ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                            ${date.active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-none font-bold hover:bg-emerald-600' : ''}
                        `}
          >
            {date.d}
            {date.hasDot && (
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}