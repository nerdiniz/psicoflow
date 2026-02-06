import React from 'react';
import { Save, User, Megaphone, ScrollText, Eye } from 'lucide-react';

export const Anamnese: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <nav className="flex text-sm font-medium text-gray-500 mb-2">
            <a href="#" className="hover:text-primary-600 transition-colors">Pacientes</a>
            <span className="mx-2">/</span>
            <a href="#" className="hover:text-primary-600 transition-colors">Cadastro</a>
            <span className="mx-2">/</span>
            <span className="text-primary-600">Anamnese Inicial</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Nova Anamnese</h1>
          <p className="mt-2 text-gray-500">Preencha os dados iniciais do paciente para dar início ao tratamento terapêutico.</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors flex items-center gap-2">
            <Save size={18} />
            Salvar Rascunho
        </button>
      </div>

      {/* Section 1: Identificação */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <User size={20} className="text-primary-500" /> Identificação
            </h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Obrigatório</span>
        </div>
        <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div className="mt-1">
                    <input type="text" className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" placeholder="Ex: Maria Oliveira Silva" />
                </div>
            </div>
            <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nome Social (se houver)</label>
                <div className="mt-1">
                    <input type="text" className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" />
                </div>
            </div>

            <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <div className="mt-1">
                    <input type="date" className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-500" />
                </div>
            </div>
            <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Gênero</label>
                <div className="mt-1">
                    <select className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border">
                        <option>Selecione...</option>
                        <option>Feminino</option>
                        <option>Masculino</option>
                        <option>Não-binário</option>
                        <option>Outro</option>
                    </select>
                </div>
            </div>
             <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                <div className="mt-1">
                    <select className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border">
                        <option>Solteiro(a)</option>
                        <option>Casado(a)</option>
                        <option>Divorciado(a)</option>
                    </select>
                </div>
            </div>

            <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Profissão / Ocupação</label>
                <div className="mt-1">
                    <input type="text" className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" />
                </div>
            </div>
             <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Escolaridade</label>
                <div className="mt-1">
                    <select className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border">
                        <option>Ensino Fundamental</option>
                        <option>Ensino Médio</option>
                        <option>Ensino Superior</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

       {/* Section 2: Queixa */}
       <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <Megaphone size={20} className="text-primary-500" /> Queixa Principal
            </h3>
            <p className="mt-1 text-sm text-gray-500">Motivo da consulta nas palavras do paciente.</p>
        </div>
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Descrição da Demanda</label>
                <div className="mt-1">
                    <textarea rows={4} className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" placeholder="Descreva aqui o motivo que trouxe o paciente à terapia..."></textarea>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Início dos Sintomas</label>
                    <div className="mt-1">
                        <input type="text" className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" placeholder="Ex: Há 6 meses, após..." />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Frequência / Intensidade</label>
                    <div className="mt-1">
                        <input type="text" className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" placeholder="Ex: Diário, intensidade alta" />
                    </div>
                </div>
            </div>
        </div>
       </div>

        {/* Section 3: Histórico */}
       <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <ScrollText size={20} className="text-primary-500" /> Histórico Clínico e Familiar
            </h3>
        </div>
        <div className="p-6">
             <div className="h-24 flex items-center justify-center text-gray-400 italic bg-gray-50 rounded border border-dashed border-gray-300">
                Conteúdo do histórico simplificado para visualização...
             </div>
        </div>
       </div>

    </div>
  );
};