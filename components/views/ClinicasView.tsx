import React, { useState } from 'react';
import { Clinica } from '../../types';
import { SyncIcon, BuildingOfficeIcon } from '../IconComponents';
import ClinicaModal, { ClinicaSubmitData } from '../modals/ClinicaModal';

interface ClinicasViewProps {
    clinicas: Clinica[];
    setClinicas: React.Dispatch<React.SetStateAction<Clinica[]>>;
    onSync: () => void;
    n8nWebhookUrl?: string;
}

const ClinicasView: React.FC<ClinicasViewProps> = ({ clinicas, setClinicas, onSync, n8nWebhookUrl }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClinica, setEditingClinica] = useState<Clinica | null>(null);

    const handleOpenModalForCreate = () => {
        setEditingClinica(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (clinica: Clinica) => {
        setEditingClinica(clinica);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClinica(null);
    };

    const handleSaveClinica = async (data: ClinicaSubmitData) => {
        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_clinica' : 'nova_clinica';

        if (n8nWebhookUrl) {
            try {
                const payload = { tag, ...data };
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Webhook retornou status ${response.status}`);
                alert(`Clínica ${isUpdating ? 'atualizada' : 'criada'} com sucesso!`);
            } catch (error) {
                console.error(`Erro ao salvar clínica via webhook:`, error);
                alert('Ocorreu um erro ao salvar a clínica. A alteração pode não ter sido salva.');
                return;
            }
        } else {
            alert('Webhook do n8n não configurado. Salvo apenas localmente.');
        }

        if (isUpdating) {
            setClinicas(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
        } else {
            const newClinica: Clinica = {
                id: String(Date.now()), // temp ID
                ...data,
            };
            setClinicas(prev => [newClinica, ...prev]);
        }
        
        handleCloseModal();
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-brand-secondary">Gestão de Clínicas</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onSync}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                            title="Sincronizar clínicas"
                        >
                            <SyncIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        <button 
                            onClick={handleOpenModalForCreate}
                            className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                            Nova Clínica
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clinicas.map(clinica => (
                                <tr key={clinica.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{clinica.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clinica.cnpj}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clinica.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenModalForEdit(clinica)} className="text-brand-primary hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ClinicaModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSaveClinica}
                clinicaToEdit={editingClinica}
            />
        </>
    );
};

export default ClinicasView;