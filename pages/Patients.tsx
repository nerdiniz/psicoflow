import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, User, Calendar, TrendingUp, MoreVertical, MessageSquare, Mail, Calendar as CalendarIcon, X, Loader2, ClipboardList, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import { generateAnamnesisPDF } from '../lib/pdfGenerator';
import { AnamnesisModal } from '../components/AnamnesisModal';

export const Patients: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState<{ name: string; crp: string } | null>(null);

  const lastHandledId = useRef<string | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchProfile();
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
          anamnesis (id)
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
      const { error } = await supabase.from('patients').insert([{ ...formData, user_id: user.id }]);
      if (error) throw error;
      setFormData({ name: '', email: '', phone: '' });
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error('Error creating patient:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative w-full md:w-96">
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
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium shadow-sm">
            <Filter size={18} />
            Filtros
          </button>
          <button
            onClick={() => generateAnamnesisPDF({
              patientName: '',
              data: {},
              isBlank: true,
              psychologistName: profile?.name || user?.user_metadata?.name,
              crp: profile?.crp
            })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium shadow-sm"
          >
            <FileText size={18} />
            Anamnese em Branco
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg text-sm font-medium"
          >
            <Plus size={18} />
            Novo Paciente
          </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MiniStat label="Total de Pacientes" value={patients.length.toString()} icon={<User size={20} />} color="blue" />
        <MiniStat label="Sessões na Semana" value="0" icon={<Calendar size={20} />} color="purple" />
        <MiniStat label="Novos este Mês" value="0" icon={<TrendingUp size={20} />} color="green" />
      </div>

      {/* List Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden flex-1">
        {isMobile ? (
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin text-primary-500 mx-auto" size={32} /></div>
            ) : patients.length === 0 ? (
              <p className="text-center py-10 text-gray-500">Nenhum paciente cadastrado</p>
            ) : (
              patients
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(patient => (
                  <div key={patient.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-black">{patient.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase">{patient.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{patient.email || patient.phone || 'Sem contato'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] font-black uppercase text-gray-400">Ativo</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedPatient(patient); setIsAnamnesisOpen(true); }} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-100"><ClipboardList size={18} /></button>
                        <button onClick={() => handleDeletePatient(patient.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors border border-red-100"><Trash2 size={18} /></button>
                      </div>
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
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Última Sessão</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
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
                        name={patient.name}
                        initials={patient.name.charAt(0).toUpperCase()}
                        initialsColor="bg-primary-100 text-primary-600"
                        therapy="Terapia Individual"
                        date="Sem consultas"
                        status="Ativo"
                        statusColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        phone={patient.phone}
                        email={patient.email}
                        hasAnamnesis={patient.anamnesis && patient.anamnesis.length > 0}
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

const PatientRow = ({ name, initials, initialsColor, therapy, date, status, statusColor, phone, email, hasAnamnesis, onOpenAnamnesis, onDelete }: any) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${initialsColor}`}>{initials}</div>
        <div className="ml-4">
          <div className="text-sm font-bold text-gray-900 dark:text-white">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{therapy}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="flex items-center text-sm text-gray-700 dark:text-gray-300"><CalendarIcon size={16} className="mr-2 text-gray-400" />{date}</div></td>
    <td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{status}</span></td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {phone && <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-500"><MessageSquare size={18} /></a>}
          {email && <a href={`mailto:${email}`} className="text-gray-400 hover:text-blue-500"><Mail size={18} /></a>}
        </div>
        <button onClick={onOpenAnamnesis} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${hasAnamnesis ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-primary-50 text-primary-600 border-primary-200'}`}>
          <ClipboardList size={14} />{hasAnamnesis ? 'Ver Pronto' : 'Anamnese'}
        </button>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-2">
        <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1.5"><Trash2 size={18} /></button>
        <button className="text-gray-400 hover:text-primary-500 p-1.5"><MoreVertical size={18} /></button>
      </div>
    </td>
  </tr>
);