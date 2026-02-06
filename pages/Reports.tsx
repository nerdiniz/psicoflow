import React from 'react';
import { FileText, Download, FileBarChart, Clock, Calendar, Users, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateAttendancePDF } from '../lib/pdfGenerator';
import { format } from 'date-fns';

export const Reports: React.FC = () => {
    const { user } = useAuth();
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = React.useState(false);
    const [patients, setPatients] = React.useState<any[]>([]);
    const [profile, setProfile] = React.useState<{ name: string; crp: string } | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);

    // Modal Form State
    const [selectedPatientId, setSelectedPatientId] = React.useState('');
    const [dateRange, setDateRange] = React.useState({
        start: format(new Date(), 'yyyy-MM-01'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    React.useEffect(() => {
        if (user) {
            fetchPatients();
            fetchProfile();
        }
    }, [user]);

    async function fetchPatients() {
        const { data } = await supabase.from('patients').select('id, name').order('name');
        if (data) setPatients(data);
    }

    async function fetchProfile() {
        const { data } = await supabase.from('profiles').select('name, crp').eq('id', user?.id).single();
        if (data) setProfile(data);
    }

    async function handleGenerateAttendance() {
        if (!selectedPatientId || !dateRange.start || !dateRange.end) return;

        try {
            setGenerating(true);
            const patient = patients.find(p => p.id === selectedPatientId);

            const { data: sessions, error } = await supabase
                .from('appointments')
                .select('date, type, status')
                .eq('patient_id', selectedPatientId)
                .eq('status', 'realizado')
                .gte('date', `${dateRange.start}T00:00:00`)
                .lte('date', `${dateRange.end}T23:59:59`)
                .order('date', { ascending: true });

            if (error) throw error;

            if (!sessions || sessions.length === 0) {
                alert('Nenhuma sessão realizada encontrada para este paciente no período selecionado.');
                return;
            }

            generateAttendancePDF({
                patientName: patient.name,
                sessions: sessions,
                psychologistName: profile?.name || user?.user_metadata?.name,
                crp: profile?.crp,
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            setIsAttendanceModalOpen(false);
        } catch (err) {
            console.error('Error generating attendance:', err);
        } finally {
            setGenerating(false);
        }
    }

    const templates = [
        { title: 'Evolução Semanal', description: 'Template para acompanhamento de progresso.', icon: <Clock /> },
        { title: 'Laudo Psicológico', description: 'Modelo oficial para emissão de laudos.', icon: <FileText /> },
        { id: 'attendance', title: 'Atestado de Comparecimento', description: 'Documento simples para o paciente.', icon: <Download /> },
        { title: 'Relatório de Alta', description: 'Encerramento de ciclo terapêutico.', icon: <FileBarChart /> },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus documentos e templates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templates.map((template, index) => (
                    <div
                        key={index}
                        onClick={() => (template as any).id === 'attendance' && setIsAttendanceModalOpen(true)}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    >
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                            {template.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{template.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                    </div>
                ))}
            </div>

            {/* Attendance Modal */}
            {isAttendanceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/20">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Download className="text-emerald-500" size={20} />
                                Emitir Atestado
                            </h2>
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Paciente
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={selectedPatientId}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 transition text-sm text-gray-900 dark:text-white outline-none"
                                    >
                                        <option value="">Selecione um paciente...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Data Início
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 transition text-sm text-gray-900 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Data Fim
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 transition text-sm text-gray-900 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 rounded-lg">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                                    <strong>Nota:</strong> O atestado incluirá apenas sessões com status <strong>"Realizado"</strong> dentro do período selecionado.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGenerateAttendance}
                                disabled={!selectedPatientId || generating}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                            >
                                {generating ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                                Gerar Atestado
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl">
                <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    Novos templates em breve!
                </h3>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                    Estamos desenvolvendo novos modelos automáticos baseados nos prontuários para agilizar sua escrita.
                </p>
            </div>
        </div>
    );
};
