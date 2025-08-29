import React, { useState } from 'react';
import { Agente, UserRole } from '../../types';
import { ShieldCheckIcon, SyncIcon, UserAddIcon } from '../IconComponents';
import AgenteModal, { AgenteSubmitData } from '../modals/AgenteModal';

interface AgentesViewProps {
    agentes: Agente[];
    setAgentes: React.Dispatch<React.SetStateAction<Agente[]>>;
    onSync: () => void;
    n8nWebhookUrl?: string;
    selectedClinicaId: string | null;
}

const getStatusPill = (status: 'active' | 'inactive') => {
    return status === 'active' 
        ? <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 dark:bg-green-900 dark:text-green-200 rounded-full">Ativo</span>
        : <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full">Inativo</span>;
}

const AgentesView: React.FC<AgentesViewProps> = ({ agentes, setAgentes, onSync, n8nWebhookUrl, selectedClinicaId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgente, setEditingAgente] = useState<Agente | null>(null);

    const handleOpenModalForCreate = () => {
        setEditingAgente(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (agente: Agente) => {
        setEditingAgente(agente);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAgente(null);
    };

    const handleSaveAgente = async (data: AgenteSubmitData) => {
        if (!selectedClinicaId) {
            alert('Por favor, selecione uma clínica primeiro.');
            return;
        }

        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_agente' : 'novo_agente';

        if (n8nWebhookUrl) {
            try {
                const payload: any = {
                    tag,
                    nome_completo: data.fullName,
                    email: data.email,
                    role: data.role,
                    clinicaId: selectedClinicaId,
                };
                if (isUpdating) {
                    payload.id = data.id;
                }
                if (data.password) {
                    payload.password = data.password;
                }

                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Webhook retornou status ${response.status}`);
                alert(`Agente ${isUpdating ? 'atualizado' : 'criado'} com sucesso!`);
            } catch (error) {
                console.error(`Erro ao ${isUpdating ? 'atualizar' : 'criar'} agente via webhook:`, error);
                alert(`Ocorreu um erro ao salvar o agente. A alteração pode não ter sido salva.`);
                return;
            }
        } else {
            alert('Webhook do n8n não configurado. Salvo apenas localmente.');
        }

        if (isUpdating) {
            setAgentes(prev => prev.map(ag => ag.id === data.id ? { ...ag, ...data, clinicaId: selectedClinicaId } : ag ));
        } else {
            const newAgente: Agente = {
                id: String(Date.now()), // temp ID
                fullName: data.fullName,
                email: data.email,
                role: data.role,
                status: 'active', // Default to active
                clinicaId: selectedClinicaId,
            };
            setAgentes(prev => [newAgente, ...prev]);
        }
        
        handleCloseModal();
    };

    return (
        <>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary">Agentes do Sistema</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onSync}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Sincronizar agentes"
                        >
                            <SyncIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                        </button>
                        <button 
                            onClick={handleOpenModalForCreate}
                            className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <UserAddIcon className="w-5 h-5 mr-2" />
                            Novo Agente
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Nome Completo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Nível</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {agentes.map(agente => (
                                <tr key={agente.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">{agente.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">{agente.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary capitalize">{agente.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(agente.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenModalForEdit(agente)} className="text-brand-primary hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AgenteModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSaveAgente}
                agenteToEdit={editingAgente}
            />
        </>
    );
};

export default AgentesView;