import React from 'react';
import { FileText, Download, FileBarChart, Clock } from 'lucide-react';

export const Reports: React.FC = () => {
    const templates = [
        { title: 'Evolução Semanal', description: 'Template para acompanhamento de progresso.', icon: <Clock /> },
        { title: 'Laudo Psicológico', description: 'Modelo oficial para emissão de laudos.', icon: <FileText /> },
        { title: 'Atestado de Comparecimento', description: 'Documento simples para o paciente.', icon: <Download /> },
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
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center mb-4 text-2xl">
                            {template.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{template.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                    </div>
                ))}
            </div>

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
