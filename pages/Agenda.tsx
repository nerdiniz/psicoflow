import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, X, Clock, Trash2, User, Calendar as CalendarIcon, List, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, subWeeks, addWeeks, parseISO, isToday, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

export const Agenda: React.FC<{ onNavigate: (view: any, params?: any) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [slots, setSlots] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    type: 'presencial',
    status: 'agendado',
    is_recurring: false
  });

  const [draggedItem, setDraggedItem] = useState<any>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentDate, viewMode]);

  async function fetchData() {
    try {
      setLoading(true);

      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = addDays(start, 42);

      const [slotsRes, appRes, patientsRes] = await Promise.all([
        supabase.from('recurring_slots').select('*, patients(*)').eq('user_id', user.id),
        supabase.from('appointments').select('*, patients(*)').eq('user_id', user.id).gte('date', start.toISOString()).lte('date', end.toISOString()),
        supabase.from('patients').select('*').order('name')
      ]);

      if (slotsRes.error) throw slotsRes.error;
      if (appRes.error) throw appRes.error;
      if (patientsRes.error) throw patientsRes.error;

      const appData = (appRes.data || []).filter(a => a.status !== 'cancelado');
      const now = new Date();

      // Auto-update past appointments to 'realizado'
      const needsAutoUpdate = appData.filter(a => a.status === 'agendado' && new Date(a.date) < now);
      if (needsAutoUpdate.length > 0) {
        const ids = needsAutoUpdate.map(a => a.id);
        await supabase.from('appointments').update({ status: 'realizado' }).in('id', ids);
        // Just update local state for immediate feedback without another fetch
        appData.forEach(a => {
          if (ids.includes(a.id)) a.status = 'realizado';
        });
      }

      setSlots(slotsRes.data || []);
      setAppointments(appData);
      setPatients(patientsRes.data || []);
    } catch (err) {
      console.error('Error fetching agenda data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrev = () => {
    if (viewMode === 'week' && isMobile) {
      setCurrentDate(prev => addDays(prev, -1));
    } else {
      setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week' && isMobile) {
      setCurrentDate(prev => addDays(prev, 1));
    } else {
      setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) return;

    try {
      setIsSaving(true);
      const appointmentDate = new Date(`${formData.date}T${formData.start_time}:00`);

      if (formData.is_recurring) {
        const { error } = await supabase.from('recurring_slots').insert([{
          user_id: user.id,
          patient_id: formData.patient_id,
          day_of_week: appointmentDate.getDay(),
          start_time: formData.start_time + ':00'
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').insert([{
          user_id: user.id,
          patient_id: formData.patient_id,
          date: appointmentDate.toISOString(),
          type: formData.type,
          status: formData.status
        }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving appointment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  async function handleUpdateStatus(appId: string, status: string) {
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', appId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }

  async function handleDrop(targetDate: Date, targetHour: number) {
    if (!draggedItem) return;

    try {
      const newDate = new Date(targetDate);
      newDate.setHours(targetHour, 0, 0, 0);

      if (draggedItem.type === 'appointment') {
        const { error } = await supabase.from('appointments').update({ date: newDate.toISOString() }).eq('id', draggedItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').insert([{
          user_id: user.id,
          patient_id: draggedItem.patient_id,
          date: newDate.toISOString(),
          status: 'agendado'
        }]);
        if (error) throw error;
      }

      fetchData();
    } catch (err) {
      console.error('Error on drop:', err);
    } finally {
      setDraggedItem(null);
    }
  }

  async function handleDeleteRecurring(id: string) {
    if (!window.confirm('Deseja remover este horário fixo semanal?')) return;
    try {
      const { error } = await supabase.from('recurring_slots').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting recurring slot:', err);
    }
  }

  async function handleFinalizeRecurring(slot: any, date: string, status: 'realizado' | 'cancelado') {
    try {
      const { error } = await supabase.from('appointments').insert([{
        user_id: user.id,
        patient_id: slot.patient_id,
        date: date, // date is already ISO from getCellData/WeeklyView
        status: status,
        type: 'presencial' // Default for fixed slots
      }]);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error finalizing recurring slot:', err);
    }
  }

  const getCellData = (date: Date, hour?: number) => {
    const dayOfWeek = date.getDay();
    const timeStr = hour !== undefined ? hour.toString().padStart(2, '0') + ':00' : null;

    const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.date), date));
    const specificApp = timeStr ? dayAppointments.find(a => {
      const appTime = format(parseISO(a.date), 'HH:mm');
      if (appTime === timeStr.substring(0, 5)) return true;
      // Handle legacy/corrupted timezone shift (saved as UTC 8h instead of local 8h)
      const shiftedTime = format(addHours(parseISO(a.date), 3), 'HH:mm');
      return shiftedTime === timeStr.substring(0, 5);
    }) : null;
    const recurringSlot = timeStr ? slots.find(s => s.day_of_week === dayOfWeek && s.start_time.startsWith(timeStr)) : null;

    const allItems = [...dayAppointments];
    slots.filter(s => s.day_of_week === dayOfWeek).forEach(s => {
      const time = s.start_time.substring(0, 5);
      if (!dayAppointments.some(a => format(parseISO(a.date), 'HH:mm') === time)) {
        allItems.push({ ...s, date: date.toISOString(), is_recurring_projection: true });
      }
    });

    return { specificApp, recurringSlot, dayAppointments: allItems.sort((a, b) => (a.date || a.start_time).localeCompare(b.date || b.start_time)) };
  };

  // --- Sub-components defined inside to resolve scoping issues once and for all ---

  const WeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = isMobile && viewMode === 'week' ? [currentDate] : Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

    return (
      <div className={`${isMobile ? 'w-full' : 'min-w-[1000px]'} p-4 md:p-6 pb-20`}>
        <div className={`grid ${isMobile ? 'grid-cols-[60px_1fr]' : 'grid-cols-[100px_repeat(5,1fr)]'} gap-2 md:gap-4`}>
          <div className="h-10"></div>
          {days.map(day => (
            <div key={day.toString()} className={`text-center pb-4 flex flex-col items-center ${isToday(day) ? 'text-primary-600' : 'text-gray-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 truncate w-full">{format(day, 'EEEE', { locale: ptBR })}</span>
              <span className={`text-base md:text-lg font-bold w-10 h-10 flex items-center justify-center rounded-xl ${isToday(day) ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 font-black' : 'text-gray-900 dark:text-white'}`}>
                {format(day, 'd')}
              </span>
            </div>
          ))}

          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <div className="h-24 md:h-32 flex flex-col items-end pr-3 md:pr-6 pt-2">
                <span className="text-xs md:text-sm font-black text-gray-900 dark:text-white">{hour.toString().padStart(2, '0')}:00</span>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-0.5">Sessão</span>
              </div>
              {days.map(day => {
                const { specificApp, recurringSlot } = getCellData(day, hour);
                const data = specificApp || recurringSlot;

                return (
                  <div
                    key={`${day}-${hour}`}
                    draggable={!!data}
                    onDragStart={() => data && setDraggedItem({
                      type: specificApp ? 'appointment' : 'recurring',
                      id: data.id,
                      patient_id: data.patient_id
                    })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(day, hour)}
                    onClick={() => data ? setSelectedAppointment(data) : (function () {
                      setFormData({ ...formData, date: format(day, 'yyyy-MM-dd'), start_time: hour.toString().padStart(2, '0') + ':00', is_recurring: false });
                      setIsModalOpen(true);
                    })()}
                    className={`h-24 md:h-32 rounded-2xl md:rounded-3xl border-2 transition-all p-2 md:p-4 flex flex-col justify-between relative group overflow-hidden ${data
                      ? (specificApp?.status === 'realizado'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 shadow-md border-emerald-100 dark:border-emerald-800/50 cursor-move'
                        : 'bg-white dark:bg-gray-800 shadow-md border-transparent ring-1 ring-black/5 dark:ring-white/10 cursor-move')
                      : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer'
                      }`}
                  >
                    {data ? (
                      <>
                        <div className="flex items-start justify-between gap-2 overflow-hidden">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black uppercase tracking-tight truncate ${specificApp?.status === 'realizado' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                              {data.patients?.name}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {specificApp ? (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase truncate max-w-full ${specificApp.status === 'cancelado' ? 'bg-red-100 text-red-600' :
                                  specificApp.status === 'realizado' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                  {specificApp.status}
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-bold uppercase tracking-wider">Recorrente</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 p-0.5 rounded-lg backdrop-blur-sm">
                            {specificApp ? (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(specificApp.id, 'realizado'); }} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" title="Realizado"><CheckCircle2 size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(specificApp.id, 'cancelado'); }} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Faltou/Cancelado"><XCircle size={14} /></button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const d = new Date(day);
                                    d.setHours(hour, 0, 0, 0);
                                    handleFinalizeRecurring(recurringSlot, d.toISOString(), 'realizado');
                                  }}
                                  className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                                  title="Marcar como Realizado"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const d = new Date(day);
                                    d.setHours(hour, 0, 0, 0);
                                    handleFinalizeRecurring(recurringSlot, d.toISOString(), 'cancelado');
                                  }}
                                  className="p-1 text-red-400 hover:bg-red-50 rounded"
                                  title="Marcar como Falta"
                                >
                                  <XCircle size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRecurring(recurringSlot.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Remover Horário Fixo"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className={`h-5 rounded-xl flex items-center px-2 shadow-sm overflow-hidden ${specificApp?.status === 'realizado' ? 'bg-emerald-600 shadow-emerald-500/10' : 'bg-primary-500 shadow-primary-500/10'}`}>
                            <span className="text-[9px] text-white font-black uppercase tracking-widest whitespace-nowrap">Sessão 50m</span>
                          </div>
                          <div className={`h-5 border border-dashed rounded-xl flex items-center px-2 overflow-hidden ${specificApp?.status === 'realizado' ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-700'}`}>
                            <span className={`text-[9px] font-bold italic truncate ${specificApp?.status === 'realizado' ? 'text-emerald-500/60' : 'text-gray-400'}`}>Intervalo 10m</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="text-primary-300" size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const MonthlyView = () => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: addDays(startDate, 34) });

    return (
      <div className="p-8">
        <div className="grid grid-cols-7 border-t border-l border-gray-100 dark:border-gray-700 rounded-3xl overflow-hidden shadow-premium">
          {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(d => (
            <div key={d} className="bg-white dark:bg-gray-800 p-4 text-center text-[10px] font-black text-gray-400 border-r border-b border-gray-100 dark:border-gray-700 tracking-widest uppercase">{d}</div>
          ))}
          {days.map(day => {
            const { dayAppointments } = getCellData(day);
            const isSelectedMonth = isSameMonth(day, monthStart);

            return (
              <div
                key={day.toString()}
                onClick={() => { setCurrentDate(day); setViewMode('week'); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(day, 8)}
                className={`min-h-[140px] p-4 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer flex flex-col gap-3 group/day ${!isSelectedMonth ? 'opacity-30' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isToday(day) ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110' : 'text-gray-900 dark:text-white'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && <span className="text-[10px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">{dayAppointments.length}</span>}
                </div>

                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {dayAppointments.slice(0, 3).map((a: any, idx: number) => (
                    <div key={a.id || idx} className={`text-[9px] px-2 py-1 rounded-lg font-black truncate shadow-sm flex items-center gap-1.5 ${a.status === 'cancelado' ? 'bg-red-50 text-red-500 border border-red-100' :
                      a.status === 'realizado' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                        a.is_recurring_projection ? 'bg-gray-50 text-gray-500 border border-gray-100 border-dashed' :
                          'bg-primary-50 text-primary-600 border border-primary-100'
                      }`}>
                      <Clock size={8} />
                      {format(a.date ? parseISO(a.date) : parseISO(`2000-01-01T${a.start_time}`), 'HH:mm')} - {a.patients?.name}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && <p className="text-[9px] text-gray-400 font-bold ml-1 animate-pulse">+{dayAppointments.length - 3} mais...</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading && !slots.length) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="animate-spin text-primary-500" size={40} />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in font-sans">
      <header className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-gray-800 gap-4 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-2xl">
            <CalendarIcon className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {format(currentDate, viewMode === 'week' ? "'Semana de' d 'de' MMMM" : 'MMMM yyyy', { locale: ptBR })}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={handlePrev} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronLeft size={20} className="text-gray-500" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">Hoje</button>
              <button onClick={handleNext} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronRight size={20} className="text-gray-500" /></button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-xl flex gap-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mês
            </button>
          </div>
          <button
            onClick={() => { setFormData({ ...formData, is_recurring: false }); setIsModalOpen(true); }}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap text-xs sm:text-sm"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span>Novo <span className="hidden xs:inline">Agendamento</span></span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50">
        {viewMode === 'week' ? <WeeklyView /> : <MonthlyView />}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-in">
            <header className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Novo Agendamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </header>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none font-medium appearance-none"
              >
                <option value="">Selecione o paciente</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <select
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {HOURS.map(h => {
                    const t = h.toString().padStart(2, '0') + ':00';
                    return <option key={t} value={t}>{t}</option>;
                  })}
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="is_recurring" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Horário semanal fixo</label>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                Confirmar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-in">
            <header className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalhes da Sessão</h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </header>
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto text-primary-600 text-3xl font-black">
                {selectedAppointment.patients?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedAppointment.patients?.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="text-left">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{format(selectedAppointment.date ? parseISO(selectedAppointment.date) : new Date(), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horário</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAppointment.start_time?.substring(0, 5) || format(parseISO(selectedAppointment.date), 'HH:mm')}</p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('patients', { patientId: selectedAppointment.patient_id })}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-primary-500 text-primary-600 py-3.5 rounded-2xl font-black hover:bg-primary-50"
                >
                  <User size={20} /> Ver Prontuário
                </button>
                <button
                  onClick={() => {
                    if (selectedAppointment.is_recurring_projection) {
                      const d = new Date(selectedAppointment.date);
                      const hourMatch = (selectedAppointment.start_time || '08:00').match(/^(\d+):/);
                      const h = hourMatch ? parseInt(hourMatch[1]) : 8;
                      d.setHours(h, 0, 0, 0);
                      handleFinalizeRecurring(selectedAppointment, d.toISOString(), 'realizado');
                      setSelectedAppointment(null);
                    } else {
                      handleUpdateStatus(selectedAppointment.id, 'realizado');
                      setSelectedAppointment(null);
                    }
                  }}
                  className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-black"
                >
                  Marcar como Realizado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};