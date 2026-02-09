import React from 'react';
import { FileText, Download, FileBarChart, Clock, Calendar, Users, X, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateAttendancePDF, generateDischargePDF, generatePsychologicalReportPDF, generateWeeklyProgressPDF } from '../lib/pdfGenerator';
import { format } from 'date-fns';

export const Reports: React.FC = () => {
    const { user } = useAuth();
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = React.useState(false);
    const [patients, setPatients] = React.useState<any[]>([]);
    const [profile, setProfile] = React.useState<{ name: string; crp: string } | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [generating, setGenerating] = React.useState(false);
    const [activeModal, setActiveModal] = React.useState<'attendance' | 'discharge' | 'psychological' | 'weekly' | null>(null);

    // Modal Form State
    const [selectedPatientId, setSelectedPatientId] = React.useState('');
    const [dateRange, setDateRange] = React.useState({
        start: format(new Date(), 'yyyy-MM-01'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // Discharge Form
    const [dischargeForm, setDischargeForm] = React.useState({
        summary: '',
        evolution: '',
        reason: '',
        referrals: ''
    });

    // Psychological Report Form
    const [psychReportForm, setPsychReportForm] = React.useState({
        purpose: '',
        demand: '',
        procedure: '',
        analysis: '',
        conclusion: ''
    });

    // Weekly Progress Form
    const [weeklyForm, setWeeklyForm] = React.useState({
        weekGoals: '',
        observations: '',
        nextSteps: ''
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
            setActiveModal(null);
        } catch (err) {
            console.error('Error generating attendance:', err);
        } finally {
            setGenerating(false);
        }
    }

    const handleGenerateDischarge = () => {
        if (!selectedPatientId) return;
        const patient = patients.find(p => p.id === selectedPatientId);
        generateDischargePDF({
            patientName: patient.name,
            ...dischargeForm,
            psychologistName: profile?.name || user?.user_metadata?.name,
            crp: profile?.crp
        });
        setActiveModal(null);
    };

    const handleGeneratePsychReport = () => {
        if (!selectedPatientId) return;
        const patient = patients.find(p => p.id === selectedPatientId);
        generatePsychologicalReportPDF({
            patientName: patient.name,
            ...psychReportForm,
            psychologistName: profile?.name || user?.user_metadata?.name,
            crp: profile?.crp
        });
        setActiveModal(null);
    };

    const handleGenerateWeekly = () => {
        if (!selectedPatientId) return;
        const patient = patients.find(p => p.id === selectedPatientId);
        generateWeeklyProgressPDF({
            patientName: patient.name,
            ...weeklyForm,
            psychologistName: profile?.name || user?.user_metadata?.name,
            crp: profile?.crp
        });
        setActiveModal(null);
    };

    const templates = [
        { id: 'weekly', title: 'Acompanhamento de Progresso', description: 'Template para acompanhamento de progresso semanal.', icon: <Clock /> },
        { id: 'psychological', title: 'Laudo Psicológico', description: 'Modelo oficial para emissão de laudos.', icon: <FileText /> },
        { id: 'attendance', title: 'Atestado de Comparecimento', description: 'Documento simples para o paciente.', icon: <Download /> },
        { id: 'discharge', title: 'Relatório de Alta', description: 'Encerramento de ciclo terapêutico.', icon: <FileBarChart /> },
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
                        onClick={() => setActiveModal(template.id as any)}
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
            {activeModal === 'attendance' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/20">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Download className="text-emerald-500" size={20} />
                                Emitir Atestado
                            </h2>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Paciente</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white outline-none">
                                        <option value="">Selecione um paciente...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Data Início</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Data Fim</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                    O atestado incluirá apenas sessões com status <strong>"Realizado"</strong> no período.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                            <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold transition">Cancelar</button>
                            <button onClick={handleGenerateAttendance} disabled={!selectedPatientId || generating} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg transition">Gerar Atestado</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Discharge Modal */}
            {activeModal === 'discharge' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/20">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileBarChart className="text-emerald-500" size={20} />
                                Emitir Relatório de Alta
                            </h2>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Paciente</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white outline-none appearance-none transition-all">
                                        <option value="">Selecione um paciente...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Resumo do Processo</label>
                                    <textarea value={dischargeForm.summary} onChange={e => setDischargeForm({ ...dischargeForm, summary: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Breve resumo da terapia..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Evolução Observada</label>
                                    <textarea value={dischargeForm.evolution} onChange={e => setDischargeForm({ ...dischargeForm, evolution: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Principais avanços e conquistas..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Motivo da Alta</label>
                                    <textarea value={dischargeForm.reason} onChange={e => setDischargeForm({ ...dischargeForm, reason: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Por que a terapia está sendo encerrada?" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Encaminhamentos (Opcional)</label>
                                    <textarea value={dischargeForm.referrals} onChange={e => setDischargeForm({ ...dischargeForm, referrals: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Sugestões para o pós-terapia..." />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all">Cancelar</button>
                            <button onClick={handleGenerateDischarge} disabled={!selectedPatientId} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">Gerar Relatório</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Psychological Report Modal */}
            {activeModal === 'psychological' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/20">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="text-emerald-500" size={20} />
                                Emitir Laudo Psicológico
                            </h2>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Paciente</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white outline-none appearance-none transition-all">
                                        <option value="">Selecione um paciente...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Finalidade</label>
                                    <textarea value={psychReportForm.purpose} onChange={e => setPsychReportForm({ ...psychReportForm, purpose: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Descreva a finalidade do laudo..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Descrição da Demanda</label>
                                    <textarea value={psychReportForm.demand} onChange={e => setPsychReportForm({ ...psychReportForm, demand: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Descreva a demanda inicial..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Procedimento</label>
                                    <textarea value={psychReportForm.procedure} onChange={e => setPsychReportForm({ ...psychReportForm, procedure: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Descreva os procedimentos realizados..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Análise</label>
                                    <textarea value={psychReportForm.analysis} onChange={e => setPsychReportForm({ ...psychReportForm, analysis: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-40 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Desenvolva a análise técnica..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Conclusão</label>
                                    <textarea value={psychReportForm.conclusion} onChange={e => setPsychReportForm({ ...psychReportForm, conclusion: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Conclusão e parecer final..." />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all">Cancelar</button>
                            <button onClick={handleGeneratePsychReport} disabled={!selectedPatientId} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">Gerar Laudo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly PROGRESS Modal */}
            {activeModal === 'weekly' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/20">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="text-emerald-500" size={20} />
                                Acompanhamento Semanal
                            </h2>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Paciente</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white outline-none appearance-none transition-all">
                                        <option value="">Selecione um paciente...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Objetivos da Semana</label>
                                    <textarea value={weeklyForm.weekGoals} onChange={e => setWeeklyForm({ ...weeklyForm, weekGoals: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="O que se pretende trabalhar nesta semana..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Observações / Progresso</label>
                                    <textarea value={weeklyForm.observations} onChange={e => setWeeklyForm({ ...weeklyForm, observations: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Observações relevantes e evolução clínica..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Planejamento Próxima Sessão</label>
                                    <textarea value={weeklyForm.nextSteps} onChange={e => setWeeklyForm({ ...weeklyForm, nextSteps: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" placeholder="Plano de ação para o próximo encontro..." />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all">Cancelar</button>
                            <button onClick={handleGenerateWeekly} disabled={!selectedPatientId} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">Gerar Template</button>
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
