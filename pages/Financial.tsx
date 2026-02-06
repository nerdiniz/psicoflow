import React from 'react';
import { Wallet, Timer, Sparkles } from 'lucide-react';

export const Financial: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                <Wallet className="text-primary-600 dark:text-primary-400" size={48} />
            </div>

            <div className="max-w-md space-y-4">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-3">
                    Financeiro <Sparkles className="text-yellow-400" size={32} />
                </h1>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-black uppercase tracking-widest">
                    <Timer size={16} />
                    Em Desenvolvimento
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                    Estamos preparando uma experiência completa para gestão de faturamento, recibos e fluxo de caixa. Estará disponível em breve!
                </p>

                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-1">Recibos Automáticos</p>
                        <p className="text-xs text-gray-500">Gere PDF para seus pacientes com um clique.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-1">Fluxo de Caixa</p>
                        <p className="text-xs text-gray-500">Controle suas entradas e saídas mensais.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
