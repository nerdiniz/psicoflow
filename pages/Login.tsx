import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IMAGES } from '../types';
import { Lock, Mail, ArrowRight, Loader2, Brain } from 'lucide-react';

export const Login = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: email.split('@')[0],
                    }
                }
            });
            if (error) {
                setError(error.message);
            } else {
                setSuccess('Conta criada! Verifique seu e-mail ou tente entrar.');
                setIsSignUp(false);
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setError(error.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_#ecfdf5_0%,_#f8fafc_100%)]">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
                <div className="p-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shadow-lg border-2 border-white flex-shrink-0">
                            <Brain className="text-emerald-600 dark:text-emerald-400" size={32} />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {isSignUp ? 'Criar sua conta' : 'Bem-vindo ao PsicoFlow'}
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            {isSignUp
                                ? 'Cadastre-se para começar a gerenciar sua clínica.'
                                : 'Entre com suas credenciais para gerenciar sua clínica.'
                            }
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 animate-fade-in">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 text-green-600 rounded-xl text-xs font-medium border border-green-100 animate-fade-in">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${isSignUp ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' : 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/25'} active:transform active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group`}
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Finalizar Cadastro' : 'Entrar na Plataforma'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="text-sm text-gray-500 hover:text-primary-600 font-semibold transition-colors"
                    >
                        {isSignUp
                            ? 'Já tem uma conta? Voltar para o login'
                            : 'Não tem uma conta? Criar acesso gratuito'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};
