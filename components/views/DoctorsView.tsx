import React, { useState } from 'react';
import { Doutor, Especialidade, Procedimento, DoutorProcedimento } from '../../types';
import { StethoscopeIcon, UserAddIcon, SyncIcon } from '../IconComponents';
import DoutorModal, { DoutorSubmitData } from '../modals/DoctorModal';


interface DoutoresViewProps {
    doutores: Doutor[];
    setDoutores: React.Dispatch<React.SetStateAction<Doutor[]>>;
    n8nWebhookUrl?: string;
    onSync: () => void;
    especialidades: Especialidade[];
    procedimentos: Procedimento[];
    selectedClinicaId: string | null;
}

const DoutoresView: React.FC<DoutoresViewProps> = ({ doutores, setDoutores, n8nWebhookUrl, onSync, especialidades, procedimentos, selectedClinicaId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoutor, setEditingDoutor] = useState<Doutor | null>(null);

    const handleOpenModalForCreate = () => {
        setEditingDoutor(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (doutor: Doutor) => {
        setEditingDoutor(doutor);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDoutor(null);
    };

    const handleSaveDoutor = async (data: DoutorSubmitData) => {
        if (!selectedClinicaId) {
            alert('Por favor, selecione uma clínica primeiro.');
            return;
        }
        const especialidade = especialidades.find(e => e.id === data.especialidadeId);
        if (!especialidade) {
            alert('Especialidade selecionada é inválida.');
            return;
        }

        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_doutor' : 'novo_doutor';

        if (n8nWebhookUrl) {
            try {
                const payload = { tag, ...data, clinicaId: selectedClinicaId };
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Webhook retornou status ${response.status}`);
                alert(`Doutor(a) ${isUpdating ? 'atualizado(a)' : 'criado(a)'} com sucesso!`);
            } catch (error) {
                console.error(`Erro ao salvar doutor(a) via webhook:`, error);
                alert('Ocorreu um erro ao salvar o doutor(a). A alteração pode não ter sido salva.');
                return;
            }
        } else {
            alert('Webhook do n8n não configurado. Salvo apenas localmente.');
        }

        const doutorData: Omit<Doutor, 'id'> = {
            name: data.name,
            avatarUrl: data.avatarUrl,
            especialidade: especialidade,
            procedimentos: data.procedimentos,
            clinicaId: selectedClinicaId,
        };

        if (isUpdating) {
            setDoutores(prev => prev.map(doc => doc.id === data.id ? { id: data.id!, ...doutorData } : doc ));
        } else {
            const newDoutor: Doutor = {
                id: String(Date.now()), // temp ID
                ...doutorData,
            };
            setDoutores(prev => [newDoutor, ...prev]);
        }
        
        handleCloseModal();
    };

    return (
        <>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary">Doutores da Clínica</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onSync}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Sincronizar doutores"
                        >
                            <SyncIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                        </button>
                        <button 
                            onClick={handleOpenModalForCreate}
                            className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <UserAddIcon className="w-5 h-5 mr-2" />
                            Novo Doutor(a)
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Especialidade</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {doutores.map(doctor => (
                                <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full" src={doctor.avatarUrl} alt={doctor.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{doctor.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                                      <div className="flex items-center">
                                        <StethoscopeIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                        {doctor.especialidade.name}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenModalForEdit(doctor)} className="text-brand-primary hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <DoutorModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSaveDoutor}
                doutorToEdit={editingDoutor}
                especialidades={especialidades}
                procedimentos={procedimentos}
            />
        </>
    );
};

export default DoutoresView;