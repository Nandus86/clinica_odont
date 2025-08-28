import React, { useState } from 'react';
import { Especialidade } from '../../types';
import { AcademicCapIcon, SyncIcon } from '../IconComponents';
import EspecialidadeModal from '../modals/EspecialidadeModal';

interface EspecialidadesViewProps {
    especialidades: Especialidade[];
    setEspecialidades: React.Dispatch<React.SetStateAction<Especialidade[]>>;
    n8nWebhookUrl?: string;
    onSync: () => void;
    selectedClinicaId: string | null;
}

const EspecialidadesView: React.FC<EspecialidadesViewProps> = ({ especialidades, setEspecialidades, n8nWebhookUrl, onSync, selectedClinicaId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEspecialidade, setEditingEspecialidade] = useState<Especialidade | null>(null);

    const handleOpenModalForCreate = () => {
        setEditingEspecialidade(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (especialidade: Especialidade) => {
        setEditingEspecialidade(especialidade);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEspecialidade(null);
    };

    const handleSaveEspecialidade = async (data: { id?: string, name: string, description: string }) => {
        if (!selectedClinicaId) {
            alert('Nenhuma clínica selecionada. Não é possível salvar.');
            return;
        }

        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_especialidade' : 'nova_especialidade';

        if (n8nWebhookUrl) {
            try {
                const payload = { tag, ...data, clinicaId: selectedClinicaId };
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                 if (!response.ok) throw new Error(`Webhook retornou status ${response.status}`);
                 alert(`Especialidade ${isUpdating ? 'atualizada' : 'criada'} com sucesso!`);
            } catch (error) {
                console.error("Erro ao enviar para webhook:", error);
                alert(`Ocorreu um erro ao salvar a especialidade. A alteração pode não ter sido salva.`);
                return; // Don't update UI if webhook fails
            }
        } else {
            alert('Webhook do n8n não configurado. Salvo apenas localmente.');
        }

        if (isUpdating) {
            setEspecialidades(prev => prev.map(esp => esp.id === data.id ? { ...esp, ...data } : esp));
        } else {
            const newEspecialidade: Especialidade = {
               id: String(Date.now()),
               name: data.name,
               description: data.description,
               clinicaId: selectedClinicaId,
            };
            setEspecialidades(prev => [newEspecialidade, ...prev]);
        }
       
       handleCloseModal();
    }

    return (
        <>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary">Especialidades da Clínica</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onSync}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Sincronizar especialidades"
                        >
                            <SyncIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                        </button>
                        <button 
                            onClick={handleOpenModalForCreate}
                            className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <AcademicCapIcon className="w-5 h-5 mr-2" />
                            Nova Especialidade
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Descrição</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {especialidades.map(esp => (
                                <tr key={esp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">{esp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">{esp.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenModalForEdit(esp)} className="text-brand-primary hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <EspecialidadeModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSubmit={handleSaveEspecialidade} 
                especialidadeToEdit={editingEspecialidade}
            />
        </>
    );
};

export default EspecialidadesView;