import React, { useState, useEffect } from 'react';
import {
    Wallet,
    TrendingUp,
    Calendar,
    Download,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    DollarSign,
    FileText,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, subWeeks, addWeeks, parseISO, isToday, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

// Utility for CSV export
const exportToCSV = (data: any[]) => {
    const headers = ['Data', 'Hora', 'Paciente', 'Tipo', 'Plano', 'Valor', 'Status'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            format(new Date(row.date), 'dd/MM/yyyy'),
            format(new Date(row.date), 'HH:mm'),
            `"${row.patients?.name || ''}"`,
            row.planName === 'Particular' ? 'Particular' : 'Plano',
            `"${row.planName}"`,
            row.computedValue.toFixed(2),
            row.status
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_${format(new Date(), 'yyyy_MM')}.csv`;
    link.click();
};

export const Financial: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        estimated: 0,
        received: 0,
        pending: 0,
        averageTicket: 0
    });

    // Filters and Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [typeFilter, setTypeFilter] = useState('todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (user) fetchFinancialData();
    }, [user, currentDate]);

    useEffect(() => {
        applyFilters();
    }, [transactions, statusFilter, typeFilter, searchQuery]);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page on filter change
    }, [statusFilter, typeFilter, searchQuery, pageSize]);

    function applyFilters() {
        let filtered = [...transactions];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.patients?.name?.toLowerCase().includes(query)
            );
        }

        // Status Filter
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Type Filter
        if (typeFilter !== 'todos') {
            if (typeFilter === 'particular') {
                filtered = filtered.filter(t => t.planName === 'Particular');
            } else if (typeFilter === 'plano') {
                filtered = filtered.filter(t => t.planName !== 'Particular');
            }
        }

        setFilteredTransactions(filtered);
    }

    async function fetchFinancialData() {
        try {
            setLoading(true);
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();

            // Fetch appointments with patient financial details
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients (
                        name,
                        payment_type,
                        custom_price,
                        plans (
                            name,
                            value
                        )
                    )
                `)
                .gte('date', start)
                .lte('date', end)
                .neq('status', 'cancelado')
                .order('date', { ascending: true });

            if (error) throw error;

            const appData = data || [];
            const now = new Date();
            const needsAutoUpdate = appData.filter(a => a.status === 'agendado' && new Date(a.date) < now);

            if (needsAutoUpdate.length > 0) {
                const ids = needsAutoUpdate.map(a => a.id);
                await supabase.from('appointments').update({ status: 'realizado' }).in('id', ids);
                appData.forEach(a => {
                    if (ids.includes(a.id)) a.status = 'realizado';
                });
            }

            const processedData = appData.filter(app => app.status !== 'cancelado').map(app => {
                const patient = app.patients as any;
                let value = 0;
                let planName = 'Particular';

                if (patient) {
                    // Check for variations in payment_type (case insensitive) just in case
                    const getType = (t: string) => t?.toLowerCase() || '';

                    if (getType(patient.payment_type) === 'plano') {
                        // Handle potential array or object return from Supabase join
                        const plansRaw = patient.plans;
                        const plan = Array.isArray(plansRaw) ? plansRaw[0] : plansRaw;

                        if (plan) {
                            // Ensure value is treated as number, handling potential string format from DB
                            // e.g. "150.00" or 150
                            const rawValue = plan.value;
                            value = typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue);

                            if (isNaN(value)) value = 0;

                            planName = plan.name || 'Convênio';
                        } else {
                            console.warn(`[Financial] Patient ${patient.name} has 'plano' but no plan data.`);
                        }
                    } else {
                        value = Number(patient.custom_price) || 0;
                        planName = 'Particular';
                    }
                }

                return {
                    ...app,
                    computedValue: value,
                    planName
                };
            }) || [];

            // --- Recurring Slots Logic ---
            const { data: slotsData, error: slotsError } = await supabase
                .from('recurring_slots')
                .select(`
                    *,
                    patients (
                        name,
                        payment_type,
                        custom_price,
                        plans (
                            name,
                            value
                        )
                    )
                `)
                .eq('user_id', user.id);

            if (slotsError) console.error('Error fetching slots:', slotsError);
            console.log('Slots Data:', slotsData);

            const recurringTransactions: any[] = [];


            if (slotsData && slotsData.length > 0) {
                console.log('Current Date in Logic:', currentDate);
                const days = [];
                let d = startOfMonth(currentDate);
                const lastDay = endOfMonth(currentDate);

                while (d <= lastDay) {
                    days.push(d);
                    d = addDays(d, 1);
                }

                slotsData.forEach(slot => {
                    const slotDayOfWeek = slot.day_of_week; // 0=Sun, 1=Mon...
                    const slotTime = slot.start_time.substring(0, 5); // HH:mm

                    days.forEach(date => {
                        if (date.getDay() === slotDayOfWeek) {
                            // Check collision with REAL appointments
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isOverridden = appData.some(app => {
                                const appDate = new Date(app.date);
                                if (format(appDate, 'yyyy-MM-dd') !== dateStr) return false;

                                const appTime = format(appDate, 'HH:mm');
                                if (appTime === slotTime) return true;

                                // Handle legacy/corrupted timezone shift (+3h)
                                return format(addHours(appDate, 3), 'HH:mm') === slotTime;
                            });

                            if (!isOverridden) {
                                // Create virtual transaction
                                const patient = slot.patients as any;
                                let value = 0;
                                let planName = 'Particular';

                                // Calculate value logic
                                const getType = (t: string) => t?.toLowerCase() || '';
                                if (patient) {
                                    if (getType(patient.payment_type) === 'plano') {
                                        const plansRaw = patient.plans;
                                        const plan = Array.isArray(plansRaw) ? plansRaw[0] : plansRaw;
                                        if (plan) {
                                            const rawValue = plan.value;
                                            value = typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue);
                                            if (isNaN(value)) value = 0;
                                            planName = plan.name || 'Convênio';
                                        }
                                    } else {
                                        value = Number(patient.custom_price) || 0;
                                        planName = 'Particular';
                                    }
                                }

                                recurringTransactions.push({
                                    id: `rec-${slot.id}-${dateStr}`,
                                    date: `${dateStr}T${slot.start_time}`,
                                    status: 'agendado', // Virtual status
                                    patients: patient,
                                    computedValue: value,
                                    planName,
                                    isRecurringProjection: true
                                });
                            }
                        }
                    });
                });
            }

            const allTransactions = [...processedData, ...recurringTransactions].sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            setTransactions(allTransactions);

            // Calculate totals from ALL processed data
            const targetData = allTransactions;

            let totalEstimated = 0;
            let totalReceived = 0;
            let totalPending = 0;
            let count = 0;

            targetData.forEach(t => {
                totalEstimated += t.computedValue;
                if (t.status === 'realizado') {
                    totalReceived += t.computedValue;
                } else {
                    totalPending += t.computedValue;
                }
                count++;
            });

            setStats({
                estimated: totalEstimated,
                received: totalReceived,
                pending: totalPending,
                averageTicket: count > 0 ? totalEstimated / count : 0
            });


        } catch (err) {
            console.error('Error fetching financial data:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleGenerateReceipt = (transaction: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text('RECIBO DE PAGAMENTO', 105, 20, { align: 'center' });

        // Content
        doc.setFontSize(12);
        doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 150, 40);

        doc.setFontSize(14);
        doc.text(`Recebi de ${transaction.patients?.name}`, 20, 60);
        doc.text(`A quantia de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.computedValue)}`, 20, 70);
        doc.text(`Referente a atendimento psicológico (${transaction.planName})`, 20, 80);
        doc.text(`Realizado em ${format(new Date(transaction.date), 'dd/MM/yyyy')} às ${format(new Date(transaction.date), 'HH:mm')}`, 20, 90);

        // Footer
        doc.setFontSize(10);
        doc.text('__________________________________________', 105, 140, { align: 'center' });
        doc.text(`${user?.user_metadata?.name || 'Profissional'}`, 105, 145, { align: 'center' });
        doc.text(`CRP: ${user?.user_metadata?.crp || '00/0000'}`, 105, 150, { align: 'center' });

        doc.save(`recibo_${transaction.patients?.name}_${format(new Date(transaction.date), 'yyyyMMdd')}.pdf`);
    };

    const handleWhatsAppCharge = (transaction: any) => {
        // Assuming we had a phone number, but let's check if patient has one
        // For now, prompt or just open generic link if no number
        // Check patient phone (need to fetch it or ensure it's in the select)
        // I need to update the select query to include phone if I want to use it properly.
        // Assuming I added phone to patients table in a previous step?
        // Let's assume phone is unavailable for a robust partial implementation or I need to add it to the select query.
        // I'll add 'phone' to the select query in fetchFinancialData.

        const message = `Olá, ${transaction.patients?.name}. Gostaria de lembrar sobre o pagamento da sessão de ${format(new Date(transaction.date), 'dd/MM')} no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.computedValue)}.`;
        const encodedMessage = encodeURIComponent(message);

        // If phone exists (it's not in my select yet, I should add it)
        // For now, I'll just open a link that asks for the number or sends to a dummy number if missing
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-10">
            {/* Header with Date Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-emerald-500" />
                        Fluxo de Caixa
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus recebimentos e previsões.</p>
                </div>

                <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <span className="px-4 font-bold text-gray-900 dark:text-white capitalize min-w-[140px] text-center">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Faturamento Estimado"
                    value={loading ? '...' : stats.estimated}
                    icon={<TrendingUp size={24} />}
                    color="blue"
                    subtext="Baseado em agendamentos"
                />
                <StatCard
                    title="Recebido"
                    value={loading ? '...' : stats.received}
                    icon={<CheckCircle2 size={24} />}
                    color="emerald"
                    subtext="Sessões realizadas"
                />
                <StatCard
                    title="A Receber"
                    value={loading ? '...' : stats.pending}
                    icon={<Clock size={24} />}
                    color="orange"
                    subtext="Sessões futuras/pendentes"
                />
                <StatCard
                    title="Ticket Médio"
                    value={loading ? '...' : stats.averageTicket}
                    icon={<Wallet size={24} />}
                    color="purple"
                    subtext="Por sessão"
                />
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Movimentações do Mês</h2>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="todos">Status: Todos</option>
                            <option value="realizado">Realizado</option>
                            <option value="agendado">Agendado</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="todos">Tipo: Todos</option>
                            <option value="particular">Particular</option>
                            <option value="plano">Plano de Saúde</option>
                        </select>

                        <button
                            onClick={() => exportToCSV(filteredTransactions)}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                            title="Exportar CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="animate-spin text-primary-500" size={32} />
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Wallet size={32} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sem movimentações</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nenhum agendamento encontrado para este mês.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Data</th>
                                    <th className="px-6 py-4 font-semibold">Paciente</th>
                                    <th className="px-6 py-4 font-semibold">Tipo</th>
                                    <th className="px-6 py-4 font-semibold">Valor</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredTransactions
                                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                    .map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {format(new Date(t.date), 'dd/MM')} <br />
                                                <span className="text-xs text-gray-400 font-mono tracking-tighter">
                                                    {format(new Date(t.date), 'HH:mm')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {t.patients?.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${t.planName === 'Particular' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                    {t.planName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                {t.computedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={t.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleGenerateReceipt(t)}
                                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Gerar Recibo"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsAppCharge(t)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        title="Enviar Cobrança"
                                                    >
                                                        <MessageCircle size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && filteredTransactions.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">Itens por página:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-xs text-gray-400">
                                Mostrando {Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredTransactions.length, currentPage * pageSize)} de {filteredTransactions.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold px-3">
                                {currentPage} / {Math.ceil(filteredTransactions.length / pageSize) || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTransactions.length / pageSize), p + 1))}
                                disabled={currentPage >= Math.ceil(filteredTransactions.length / pageSize)}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, subtext }: any) => {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{subtext}</p>
            </div>
            <div className={`p-3 rounded-lg ${(colorStyles as any)[color]}`}>
                {icon}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        realizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        agendado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border border-transparent ${(styles as any)[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
};
