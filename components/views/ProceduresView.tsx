import React, { useState } from 'react';
import { Procedimento, Especialidade } from '../../types';
import { ClipboardListIcon, SyncIcon } from '../IconComponents';
import ProcedureModal from '../modals/ProcedureModal';


interface ProcedimentosViewProps {
    procedimentos: Procedimento[];
    setProcedimentos: React.Dispatch<React.SetStateAction<Procedimento[]>>;
    n8nWebhookUrl?: string;
    onSync: () => void;
    especialidades: Especialidade[];
    selectedClinicaId: string | null;
}

const ProcedimentosView: React.FC<ProcedimentosViewProps> = ({ procedimentos, setProcedimentos, n8nWebhookUrl, onSync, especialidades, selectedClinicaId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcedure, setEditingProcedure] = useState<Procedimento | null>(null);

    const handleOpenModalForCreate = () => {
        setEditingProcedure(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (proc: Procedimento) => {
        setEditingProcedure(proc);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProcedure(null);
    };

    const handleSaveProcedure = async (data: { id?:string, name: string, description: string, especialidadeId: string }) => {
        if (!selectedClinicaId) {
            alert('Nenhuma clínica selecionada. Não é possível salvar.');
            return;
        }
        
        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_procedimento' : 'novo_procedimento';

        if (n8nWebhookUrl) {
           try {
               const payload = {
                   tag,
                   ...data,
                   clinicaId: selectedClinicaId,
               };
               const response = await fetch(n8nWebhookUrl, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(payload)
               });

               if (!response.ok) {
                   throw new Error(`Webhook retornou status ${response.status}`);
               }
               alert(`Procedimento ${isUpdating ? 'atualizado' : 'criado'} com sucesso!`);
           } catch (error) {
               console.error("Erro ao enviar para webhook:", error);
               alert(`Ocorreu um erro ao ${isUpdating ? 'atualizar' : 'criar'} o procedimento. Verifique o console.`);
               return;
           }
       } else {
           alert('Webhook do n8n não configurado. Salvo apenas localmente.');
       }

       if(isUpdating) {
           setProcedimentos(prev => prev.map(p => p.id === data.id ? { ...p, ...data, clinicaId: selectedClinicaId } : p));
       } else {
            const newProcedure: Procedimento = {
               id: String(Date.now()),
               name: data.name,
               description: data.description,
               especialidadeId: data.especialidadeId,
               clinicaId: selectedClinicaId,
            };
            setProcedimentos(prev => [newProcedure, ...prev]);
       }

       handleCloseModal();
    }

    const getEspecialidadeName = (id: string) => {
        return especialidades.find(e => e.id === id)?.name || 'N/A';
    }

    return (
        <>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary">Procedimentos da Clínica</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onSync}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Sincronizar procedimentos"
                        >
                            <SyncIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                        </button>
                        <button 
                            onClick={handleOpenModalForCreate}
                            className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <ClipboardListIcon className="w-5 h-5 mr-2" />
                            Novo Procedimento
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Descrição</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Especialidade</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {procedimentos.map(proc => (
                                <tr key={proc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">{proc.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">{proc.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">{getEspecialidadeName(proc.especialidadeId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenModalForEdit(proc)} className="text-brand-primary hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ProcedureModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSaveProcedure}
                procedimentoToEdit={editingProcedure}
                especialidades={especialidades}
            />
        </>
    );
};

export default ProcedimentosView;