import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, User, Calendar, TrendingUp, MoreVertical, MessageSquare, Mail, Calendar as CalendarIcon, X, Loader2, ClipboardList, Trash2, FileText, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import { generateAnamnesisPDF } from '../lib/pdfGenerator';
import { AnamnesisModal } from '../components/AnamnesisModal';
import { Plan } from '../types';

export const Patients: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    payment_type: 'particular' as 'particular' | 'plano',
    plan_id: '',
    custom_price: '',
    modality: 'presencial' as 'online' | 'presencial'
  });
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState<{ name: string; crp: string } | null>(null);

  const lastHandledId = useRef<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchProfile();
      fetchPlans();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, crp')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }

  useEffect(() => {
    if (patientId && patients.length > 0 && lastHandledId.current !== patientId) {
      const p = patients.find(p => p.id === patientId);
      if (p) {
        setSelectedPatient(p);
        setIsAnamnesisOpen(true);
        lastHandledId.current = patientId;
      }
    }
  }, [patientId, patients]);

  async function fetchPatients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          anamnesis (id),
          plans (name)
        `)
        .order('name');
      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePatient(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este paciente? Todos os dados dele serão perdidos definitivamente.')) return;
    try {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      fetchPatients();
    } catch (err) {
      console.error('Error deleting patient:', err);
    }
  }

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      setIsSubmitting(true);

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        user_id: user.id,
        payment_type: formData.payment_type,
        status: 'ativo',
        modality: formData.modality
      };

      if (formData.payment_type === 'particular') {
        payload.custom_price = formData.custom_price ? parseFloat(formData.custom_price.replace(',', '.')) : null;
        payload.plan_id = null;
      } else {
        payload.plan_id = formData.plan_id || null;
        payload.custom_price = null;
      }

      const { error } = await supabase.from('patients').insert([payload]);
      if (error) throw error;

      setFormData({ name: '', email: '', phone: '', payment_type: 'particular', plan_id: '', custom_price: '', modality: 'presencial' });
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error('Error creating patient:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const newPatientsCount = patients.filter(p => {
    const date = new Date(p.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm transition-shadow"
            placeholder="Buscar por nome ou email..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium shadow-sm">
            <Filter size={18} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button
            onClick={() => generateAnamnesisPDF({
              patientName: '',
              data: {},
              isBlank: true,
              psychologistName: profile?.name || user?.user_metadata?.name,
              crp: profile?.crp
            })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium shadow-sm"
          >
            <FileText size={18} />
            <span className="truncate">Anamnese em Branco</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg text-sm font-bold"
          >
            <Plus size={18} />
            Novo Paciente
          </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MiniStat label="Total de Pacientes" value={patients.length.toString()} icon={<User size={20} />} color="blue" />
        <MiniStat label="Novos este Mês" value={newPatientsCount.toString()} icon={<TrendingUp size={20} />} color="green" />
      </div>

      {/* List Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {isMobile ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary-500 mx-auto" size={32} /></div>
            ) : patients.length === 0 ? (
              <p className="col-span-full text-center py-10 text-gray-500">Nenhum paciente cadastrado</p>
            ) : (
              patients
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(patient => (
                  <div key={patient.id} className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center font-black text-lg shadow-sm">{patient.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{patient.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${patient.modality === 'online' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                              {patient.modality || 'presencial'}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase bg-primary-50 text-primary-600 dark:bg-primary-900/30`}>
                              {patient.payment_type === 'particular' ? 'Particular' : (patient.plans?.name || 'Convênio')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${patient.status === 'ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {patient.status}
                      </span>
                    </div>

                    <div className="space-y-2 py-3 border-y border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Mail size={14} className="text-gray-300" />
                        <span className="truncate">{patient.email || 'Nenhum email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <MessageSquare size={14} className="text-gray-300" />
                        <span>{patient.phone || 'Nenhum WhatsApp'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedPatient(patient); setIsAnamnesisOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl font-bold text-xs"
                      >
                        <ClipboardList size={16} /> Anamnese
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Paciente</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tipo/Plano</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Contato</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="animate-spin text-primary-500 mx-auto" size={32} /></td></tr>
                ) : patients.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center font-bold text-gray-500">Nenhum paciente cadastrado</td></tr>
                ) : (
                  patients
                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(patient => (
                      <PatientRow
                        key={patient.id}
                        patient={patient}
                        initials={patient.name.charAt(0).toUpperCase()}
                        initialsColor="bg-primary-100 text-primary-600"
                        onOpenAnamnesis={() => { setSelectedPatient(patient); setIsAnamnesisOpen(true); }}
                        onDelete={() => handleDeletePatient(patient.id)}
                      />
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedPatient && (
        <AnamnesisModal
          isOpen={isAnamnesisOpen}
          onClose={() => { setIsAnamnesisOpen(false); fetchPatients(); }}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Paciente</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modalidade de Atendimento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modality: 'presencial' })}
                    className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${formData.modality === 'presencial' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, modality: 'online' })}
                    className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${formData.modality === 'online' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    Online
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Pagamento</label>
                  <select
                    value={formData.payment_type}
                    onChange={e => setFormData({ ...formData, payment_type: e.target.value as 'particular' | 'plano' })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="particular">Particular</option>
                    <option value="plano">Plano de Saúde</option>
                  </select>
                </div>

                {formData.payment_type === 'particular' ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor da Sessão</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.custom_price}
                        onChange={e => setFormData({ ...formData, custom_price: e.target.value })}
                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Plano</label>
                    <select
                      value={formData.plan_id}
                      onChange={e => setFormData({ ...formData, plan_id: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Selecione...</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value, icon, color }: any) => {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600'
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColors[color]}`}>{icon}</div>
    </div>
  );
};

const PatientRow = ({ patient, initials, initialsColor, onOpenAnamnesis, onDelete }: any) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${initialsColor}`}>{initials}</div>
        <div className="ml-4">
          <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">{patient.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${patient.modality === 'online' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
              {patient.modality || 'presencial'}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Desde {new Date(patient.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="text-sm text-gray-900 dark:text-white font-medium capitalize flex items-center gap-2">
        {patient.payment_type === 'plano' && <CreditCard size={14} className="text-primary-500" />}
        {patient.payment_type === 'particular' ? 'Particular' : (patient.plans?.name || 'Convênio')}
      </div>
      {patient.payment_type === 'particular' && patient.custom_price && (
        <div className="text-xs text-gray-500">R$ {patient.custom_price}</div>
      )}
    </td>
    <td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${patient.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{patient.status}</span></td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        {patient.phone && <a href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-500"><MessageSquare size={18} /></a>}
        {patient.email && <a href={`mailto:${patient.email}`} className="text-gray-400 hover:text-blue-500"><Mail size={18} /></a>}
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-2">
        <button onClick={onOpenAnamnesis} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-100" title="Anamnese">
          <ClipboardList size={18} />
        </button>
        <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);