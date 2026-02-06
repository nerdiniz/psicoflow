import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Save, Loader2, MapPin, Phone, User as UserIcon, Award, AlignLeft } from 'lucide-react';

export const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        crp: '',
        address: '',
        phone: '',
        avatar_url: '',
        description: '',
        approach: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    async function fetchProfile() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    name: data.name || '',
                    crp: data.crp || '',
                    address: data.address || '',
                    phone: formatPhone(data.phone || ''),
                    avatar_url: data.avatar_url || '',
                    description: data.description || '',
                    approach: data.approach || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatPhone = (v: string) => {
        const numbers = v.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers
                .replace(/^(\2)(\d)/g, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .substring(0, 15);
        }
        return v.substring(0, 15);
    };

    const handlePhoneChange = (v: string) => {
        let value = v.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length <= 10) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        setProfile(prev => ({ ...prev, phone: value }));
    };

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

            // Also update immediately in DB to sync header
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

            alert('Foto atualizada!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Erro ao carregar imagem.');
        } finally {
            setSaving(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profile,
                    phone: profile.phone.replace(/\D/g, ''), // Save only numbers
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar perfil.');
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-500" size={40} />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil Profissional</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Complete seu cadastro para transmitir confiança aos seus pacientes.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                        <div className="relative inline-block group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-50 dark:border-primary-900 shadow-inner bg-gray-100 dark:bg-gray-700 capitalize flex items-center justify-center text-4xl text-gray-400 font-bold">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profile.name.charAt(0) || <UserIcon size={48} />
                                )}
                            </div>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleUpload}
                            />
                            <button
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                className="absolute bottom-1 right-1 bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full shadow-lg transition-transform group-hover:scale-110"
                            >
                                <Camera size={18} />
                            </button>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{profile.name || 'Seu Nome'}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Psicólogo Clínico</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                            <Award size={16} /> Dica de Especialista
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-2 leading-relaxed">
                            Um perfil completo com foto profissional e descrição clara aumenta em até 60% a retenção de novos pacientes no primeiro contato.
                        </p>
                    </div>
                </div>

                {/* Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                                        placeholder="Ex: Dra. Ana Silva"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CRP (Registro Profissional)</label>
                                <div className="relative">
                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={profile.crp}
                                        onChange={e => {
                                            let v = e.target.value.toUpperCase();
                                            if (!v.startsWith('CRP-')) v = 'CRP-' + v.replace('CRP-', '');
                                            setProfile({ ...profile, crp: v });
                                        }}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                                        placeholder="Ex: 06/123456"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Telefone de Contato</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={e => handlePhoneChange(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Endereço da Clínica</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={profile.address}
                                        onChange={e => setProfile({ ...profile, address: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                                        placeholder="Rua Exemplo, 123 - Sala 4"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Abordagem Psicológica</label>
                            <select
                                value={profile.approach}
                                onChange={e => setProfile({ ...profile, approach: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none"
                            >
                                <option value="">Selecione sua abordagem</option>
                                <option value="TCC">Terapia Cognitivo-Comportamental (TCC)</option>
                                <option value="Psicanálise">Psicanálise</option>
                                <option value="Fenomenologia">Fenomenologia</option>
                                <option value="Gestalt">Gestalt-terapia</option>
                                <option value="Humanismo">Humanismo</option>
                                <option value="Sistêmica">Terapia Sistêmica</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Breve Descrição Profissional (Bio)</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-4 text-gray-400" size={18} />
                                <textarea
                                    value={profile.description}
                                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                                    rows={6}
                                    maxLength={500}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm leading-relaxed"
                                    placeholder="Fale um pouco sobre sua trajetória e especialidades..."
                                />
                                <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-medium">
                                    {profile.description.length}/500 caracteres
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="group-hover:rotate-12 transition-transform" />}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
