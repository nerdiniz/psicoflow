import React, { useState, useEffect } from 'react';
import { X, Save, ClipboardList, User, MessageCircle, History, Stethoscope, Wine, Users, Milestone, Activity, Eye, Target, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnamnesisModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

const SECTIONS = [
    { id: 'identificacao', title: '1. Identificação', icon: <User size={18} /> },
    { id: 'queixa', title: '2. Queixa Principal', icon: <MessageCircle size={18} /> },
    { id: 'historia_problema', title: '3. História do Problema', icon: <History size={18} /> },
    { id: 'historico_psi', title: '4. Histórico Psi', icon: <ClipboardList size={18} /> },
    { id: 'historico_medico', title: '5. Histórico Médico', icon: <Stethoscope size={18} /> },
    { id: 'substancias', title: '6. Uso de Substâncias', icon: <Wine size={18} /> },
    { id: 'familiar', title: '7. Histórico Familiar', icon: <Users size={18} /> },
    { id: 'vida_desenvolvimento', title: '8. Vida e Desenv.', icon: <Milestone size={18} /> },
    { id: 'funcionamento_atual', title: '9. Funcionamento Atual', icon: <Activity size={18} /> },
    { id: 'observacoes', title: '10. Obs. Clínicas', icon: <Eye size={18} /> },
    { id: 'objetivos', title: '11. Objetivos', icon: <Target size={18} /> },
];

export const AnamnesisModal: React.FC<AnamnesisModalProps> = ({ isOpen, onClose, patientId, patientName }) => {
    const [activeSection, setActiveSection] = useState('identificacao');
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && patientId) {
            fetchAnamnesis();
        }
    }, [isOpen, patientId]);

    async function fetchAnamnesis() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('anamnesis')
                .select('data')
                .eq('patient_id', patientId)
                .maybeSingle();

            if (error) throw error;
            if (data) setFormData(data.data || {});
            else setFormData({});
        } catch (err) {
            console.error('Error fetching anamnesis:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('anamnesis')
                .upsert({
                    patient_id: patientId,
                    data: formData,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'patient_id' });

            if (error) throw error;
            onClose();
        } catch (err) {
            console.error('Error saving anamnesis:', err);
            alert('Erro ao salvar anamnese.');
        } finally {
            setSaving(false);
        }
    }

    const updateField = (section: string, field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [field]: value
            }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 lg:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Anamnese Psicológica</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Paciente: <span className="font-semibold text-primary-600">{patientName}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-64 border-r border-gray-100 dark:border-gray-700 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/20 hidden md:block">
                        <div className="p-4 space-y-1">
                            {SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === section.id
                                            ? 'bg-primary-500 text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {section.icon}
                                    {section.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Loader2 className="animate-spin mb-4" size={40} />
                                <p>Carregando dados da anamnese...</p>
                            </div>
                        ) : (
                            <div className="max-w-3xl">
                                {activeSection === 'identificacao' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">1. Identificação do Paciente</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField label="Nome Completo" value={formData.identificacao?.nome || ''} onChange={(v) => updateField('identificacao', 'nome', v)} />
                                            <FormField label="Data de Nascimento" type="date" value={formData.identificacao?.nascimento || ''} onChange={(v) => updateField('identificacao', 'nascimento', v)} />
                                            <FormField label="Idade" value={formData.identificacao?.idade || ''} onChange={(v) => updateField('identificacao', 'idade', v)} />
                                            <FormField label="Estado Civil" value={formData.identificacao?.estado_civil || ''} onChange={(v) => updateField('identificacao', 'estado_civil', v)} />
                                            <FormField label="Profissão / Ocupação" value={formData.identificacao?.profissao || ''} onChange={(v) => updateField('identificacao', 'profissao', v)} />
                                            <FormField label="Escolaridade" value={formData.identificacao?.escolaridade || ''} onChange={(v) => updateField('identificacao', 'escolaridade', v)} />
                                            <FormField label="Cidade / Residência" value={formData.identificacao?.cidade || ''} onChange={(v) => updateField('identificacao', 'cidade', v)} />
                                            <FormField label="Telefone" value={formData.identificacao?.telefone || ''} onChange={(v) => updateField('identificacao', 'telefone', v)} />
                                            <FormField label="E-mail" type="email" value={formData.identificacao?.email || ''} onChange={(v) => updateField('identificacao', 'email', v)} />
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'queixa' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">2. Queixa Principal</h3>
                                        <FormField label="Motivo da procura" textArea value={formData.queixa?.motivo || ''} onChange={(v) => updateField('queixa', 'motivo', v)} />
                                        <FormField label="Descrição com as palavras do paciente" textArea value={formData.queixa?.descricao || ''} onChange={(v) => updateField('queixa', 'descricao', v)} />
                                        <FormField label="Tempo de duração do problema" value={formData.queixa?.duracao || ''} onChange={(v) => updateField('queixa', 'duracao', v)} />
                                        <FormField label="O que motivou a busca neste momento?" textArea value={formData.queixa?.motivacao_atual || ''} onChange={(v) => updateField('queixa', 'motivacao_atual', v)} />
                                        <FormField label="Expectativas em relação à terapia" textArea value={formData.queixa?.expectativas || ''} onChange={(v) => updateField('queixa', 'expectativas', v)} />
                                    </div>
                                )}

                                {activeSection === 'historia_problema' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">3. História do Problema Atual</h3>
                                        <FormField label="Início dos sintomas" value={formData.historia_problema?.inicio || ''} onChange={(v) => updateField('historia_problema', 'inicio', v)} />
                                        <FormField label="Evento(s) desencadeante(s)" textArea value={formData.historia_problema?.eventos || ''} onChange={(v) => updateField('historia_problema', 'eventos', v)} />
                                        <FormField label="Frequência dos sintomas" value={formData.historia_problema?.frequencia || ''} onChange={(v) => updateField('historia_problema', 'frequencia', v)} />
                                        <FormField label="Intensidade percebida" value={formData.historia_problema?.intensidade || ''} onChange={(v) => updateField('historia_problema', 'intensidade', v)} />
                                        <FormField label="Situações que agravam" textArea value={formData.historia_problema?.agravantes || ''} onChange={(v) => updateField('historia_problema', 'agravantes', v)} />
                                        <FormField label="Situações que aliviam" textArea value={formData.historia_problema?.aliviantes || ''} onChange={(v) => updateField('historia_problema', 'aliviantes', v)} />
                                        <FormField label="Impacto na vida (Pessoal, Social, Profissional)" textArea value={formData.historia_problema?.impacto || ''} onChange={(v) => updateField('historia_problema', 'impacto', v)} />
                                    </div>
                                )}

                                {activeSection === 'historico_psi' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">4. Histórico Psicológico e Psiquiátrico</h3>
                                        <FormField label="Já realizou psicoterapia anteriormente?" value={formData.historico_psi?.anterior || ''} onChange={(v) => updateField('historico_psi', 'anterior', v)} />
                                        <FormField label="Tempo e tipo de acompanhamento anterior" value={formData.historico_psi?.tipo_anterior || ''} onChange={(v) => updateField('historico_psi', 'tipo_anterior', v)} />
                                        <FormField label="Avaliação da experiência prévia" textArea value={formData.historico_psi?.avaliacao_anterior || ''} onChange={(v) => updateField('historico_psi', 'avaliacao_anterior', v)} />
                                        <FormField label="Acompanhamento psiquiátrico atual ou passado" value={formData.historico_psi?.psiquiatrico || ''} onChange={(v) => updateField('historico_psi', 'psiquiatrico', v)} />
                                        <FormField label="Uso atual de medicação psicotrópica" value={formData.historico_psi?.medicacao_atual || ''} onChange={(v) => updateField('historico_psi', 'medicacao_atual', v)} />
                                        <FormField label="Uso passado de medicação" value={formData.historico_psi?.medicacao_passada || ''} onChange={(v) => updateField('historico_psi', 'medicacao_passada', v)} />
                                        <FormField label="Internações psiquiátricas" value={formData.historico_psi?.internacoes || ''} onChange={(v) => updateField('historico_psi', 'internacoes', v)} />
                                    </div>
                                )}

                                {activeSection === 'historico_medico' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">5. Histórico Médico Geral</h3>
                                        <FormField label="Doenças crônicas" value={formData.historico_medico?.cronicas || ''} onChange={(v) => updateField('historico_medico', 'cronicas', v)} />
                                        <FormField label="Condições médicas relevantes" value={formData.historico_medico?.relevantes || ''} onChange={(v) => updateField('historico_medico', 'relevantes', v)} />
                                        <FormField label="Cirurgias importantes" value={formData.historico_medico?.cirurgias || ''} onChange={(v) => updateField('historico_medico', 'cirurgias', v)} />
                                        <FormField label="Uso contínuo de medicamentos" value={formData.historico_medico?.medicamentos_continuos || ''} onChange={(v) => updateField('historico_medico', 'medicamentos_continuos', v)} />
                                        <FormField label="Qualidade do sono" value={formData.historico_medico?.sono || ''} onChange={(v) => updateField('historico_medico', 'sono', v)} />
                                        <FormField label="Alimentação" value={formData.historico_medico?.alimentacao || ''} onChange={(v) => updateField('historico_medico', 'alimentacao', v)} />
                                        <FormField label="Prática de atividade física" value={formData.historico_medico?.exercicio || ''} onChange={(v) => updateField('historico_medico', 'exercicio', v)} />
                                    </div>
                                )}

                                {activeSection === 'substancias' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">6. Uso de Substâncias</h3>
                                        <FormField label="Consumo de álcool (frequência/quantidade)" value={formData.substancias?.alcool || ''} onChange={(v) => updateField('substancias', 'alcool', v)} />
                                        <FormField label="Uso de cigarro ou vape" value={formData.substancias?.cigarro || ''} onChange={(v) => updateField('substancias', 'cigarro', v)} />
                                        <FormField label="Uso de outras substâncias psicoativas" value={formData.substancias?.outras || ''} onChange={(v) => updateField('substancias', 'outras', v)} />
                                        <FormField label="Uso de medicamentos sem prescrição" value={formData.substancias?.sem_prescricao || ''} onChange={(v) => updateField('substancias', 'sem_prescricao', v)} />
                                    </div>
                                )}

                                {activeSection === 'familiar' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">7. Histórico Familiar</h3>
                                        <FormField label="Com quem mora atualmente" value={formData.familiar?.mora_com || ''} onChange={(v) => updateField('familiar', 'mora_com', v)} />
                                        <FormField label="Relação com pais" value={formData.familiar?.pais || ''} onChange={(v) => updateField('familiar', 'pais', v)} />
                                        <FormField label="Relação com irmãos" value={formData.familiar?.irmaos || ''} onChange={(v) => updateField('familiar', 'irmaos', v)} />
                                        <FormField label="Relação conjugal / afetiva" value={formData.familiar?.conjugal || ''} onChange={(v) => updateField('familiar', 'conjugal', v)} />
                                        <FormField label="Transtornos psicológicos na família" textArea value={formData.familiar?.transtornos_familia || ''} onChange={(v) => updateField('familiar', 'transtornos_familia', v)} />
                                        <FormField label="Eventos familiares significativos" textArea value={formData.familiar?.eventos_familia || ''} onChange={(v) => updateField('familiar', 'eventos_familia', v)} />
                                    </div>
                                )}

                                {activeSection === 'vida_desenvolvimento' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">8. Histórico de Vida e Desenvolvimento</h3>
                                        <FormField label="Aspectos relevantes da infância" textArea value={formData.vida_desenvolvimento?.infancia || ''} onChange={(v) => updateField('vida_desenvolvimento', 'infancia', v)} />
                                        <FormField label="Aspectos relevantes da adolescência" textArea value={formData.vida_desenvolvimento?.adolescencia || ''} onChange={(v) => updateField('vida_desenvolvimento', 'adolescencia', v)} />
                                        <FormField label="Experiências marcantes ao longo da vida" textArea value={formData.vida_desenvolvimento?.marcantes || ''} onChange={(v) => updateField('vida_desenvolvimento', 'marcantes', v)} />
                                        <FormField label="Vivências traumáticas" textArea value={formData.vida_desenvolvimento?.traumas || ''} onChange={(v) => updateField('vida_desenvolvimento', 'traumas', v)} />
                                    </div>
                                )}

                                {activeSection === 'funcionamento_atual' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">9. Funcionamento Atual</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField label="Humor predominante" value={formData.funcionamento_atual?.humor || ''} onChange={(v) => updateField('funcionamento_atual', 'humor', v)} />
                                            <FormField label="Nível de ansiedade percebido" value={formData.funcionamento_atual?.ansiedade || ''} onChange={(v) => updateField('funcionamento_atual', 'ansiedade', v)} />
                                            <FormField label="Energia e disposição" value={formData.funcionamento_atual?.energia || ''} onChange={(v) => updateField('funcionamento_atual', 'energia', v)} />
                                            <FormField label="Motivação" value={formData.funcionamento_atual?.motivacao || ''} onChange={(v) => updateField('funcionamento_atual', 'motivacao', v)} />
                                            <FormField label="Relações sociais" value={formData.funcionamento_atual?.sociais || ''} onChange={(v) => updateField('funcionamento_atual', 'sociais', v)} />
                                            <FormField label="Funcionamento no trabalho/estudos" value={formData.funcionamento_atual?.trabalho || ''} onChange={(v) => updateField('funcionamento_atual', 'trabalho', v)} />
                                        </div>
                                        <FormField label="Organização da rotina diária" textArea value={formData.funcionamento_atual?.rotina || ''} onChange={(v) => updateField('funcionamento_atual', 'rotina', v)} />
                                    </div>
                                )}

                                {activeSection === 'observacoes' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">10. Observações Clínicas do Psicólogo</h3>
                                        <FormField label="Comunicação verbal" value={formData.observacoes?.verbal || ''} onChange={(v) => updateField('observacoes', 'verbal', v)} />
                                        <FormField label="Comunicação não verbal" value={formData.observacoes?.nao_verbal || ''} onChange={(v) => updateField('observacoes', 'nao_verbal', v)} />
                                        <FormField label="Coerência e linearidade" value={formData.observacoes?.coerencia || ''} onChange={(v) => updateField('observacoes', 'coerencia', v)} />
                                        <FormField label="Afeto observado" value={formData.observacoes?.afeto || ''} onChange={(v) => updateField('observacoes', 'afeto', v)} />
                                        <FormField label="Nível de insight" value={formData.observacoes?.insight || ''} onChange={(v) => updateField('observacoes', 'insight', v)} />
                                        <FormField label="Postura e comportamento" textArea value={formData.observacoes?.postura || ''} onChange={(v) => updateField('observacoes', 'postura', v)} />
                                    </div>
                                )}

                                {activeSection === 'objetivos' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">11. Objetivos Terapêuticos Iniciais</h3>
                                        <FormField label="Demandas principais" textArea value={formData.objetivos?.demandas || ''} onChange={(v) => updateField('objetivos', 'demandas', v)} />
                                        <FormField label="Objetivos de curto prazo" textArea value={formData.objetivos?.curto_prazo || ''} onChange={(v) => updateField('objetivos', 'curto_prazo', v)} />
                                        <FormField label="Objetivos de médio prazo" textArea value={formData.objetivos?.medio_prazo || ''} onChange={(v) => updateField('objetivos', 'medio_prazo', v)} />
                                        <FormField label="Alinhamento de expectativas" textArea value={formData.objetivos?.alinhamento || ''} onChange={(v) => updateField('objetivos', 'alinhamento', v)} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                        Todas as alterações são salvas ao clicar em "Salvar Anamnese".
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={saving || loading}
                            onClick={handleSave}
                            className="px-8 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Salvar Anamnese
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FormField = ({ label, value, onChange, type = 'text', textArea = false }: any) => (
    <div className="space-y-1.5 flex-1 w-full">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
        {textArea ? (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
            />
        )}
    </div>
);
