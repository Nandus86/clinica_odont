import React, { useState } from 'react';
import { Paciente } from '../../types';
import { PhoneIcon, UserAddIcon, SyncIcon } from '../IconComponents';
import PatientModal from '../modals/PatientModal';

interface PacientesViewProps {
    pacientes: Paciente[];
    setPacientes: React.Dispatch<React.SetStateAction<Paciente[]>>;
    n8nWebhookUrl?: string;
    onSync: () => void;
    selectedClinicaId: string | null;
}

const PacientesView: React.FC<PacientesViewProps> = ({ pacientes, setPacientes, n8nWebhookUrl, onSync, selectedClinicaId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);

    const filteredPacientes = pacientes.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleOpenModalForCreate = () => {
        setEditingPaciente(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (paciente: Paciente) => {
        setEditingPaciente(paciente);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPaciente(null);
    };

    const handleSavePatient = async (data: { id?: string; name: string; phone: string; cpf?: string; address?: string }) => {
        if (!selectedClinicaId) {
            alert('Nenhuma clínica selecionada. Não é possível salvar o paciente.');
            return;
        }

        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_paciente' : 'paciente';

         if (n8nWebhookUrl) {
            try {
                const payload: any = {
                    tag,
                    nome_paciente: data.name,
                    telefone_paciente: data.phone,
                    cpf: data.cpf,
                    endereco: data.address,
                    clinicaId: selectedClinicaId,
                };
                if(isUpdating){
                    payload.paciente_id = data.id;
                }
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`Webhook retornou status ${response.status}`);
                }
                alert(`Paciente ${isUpdating ? 'atualizado' : 'criado'} com sucesso!`);
            } catch (error) {
                console.error("Erro ao salvar paciente via webhook:", error);
                alert(`Ocorreu um erro ao salvar o paciente. A alteração pode não ter sido salva.`);
                return;
            }
        } else {
            alert('Webhook do n8n não configurado. Salvo apenas localmente.');
        }

        if (isUpdating) {
            setPacientes(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
        } else {
            const newPatient: Paciente = {
                id: String(Date.now()),
                ...data,
                lastVisit: new Date().toLocaleDateString('pt-BR'),
                clinicaId: selectedClinicaId,
            };
            setPacientes(prev => [newPatient, ...prev]);
        }

        handleCloseModal();
    }

    return (
        <>
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary">Pacientes Cadastrados</h2>
                    <div className="w-full md:w-auto flex items-center gap-2">
                         <button 
                            onClick={onSync}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Sincronizar pacientes"
                        >
                            <SyncIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                        </button>
                        <input 
                            type="text" 
                            placeholder="Buscar paciente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 px-4 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-dark-surface dark:text-dark-text-primary"
                        />
                        <button 
                            onClick={handleOpenModalForCreate}
                            className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <UserAddIcon className="w-5 h-5 mr-2" />
                            Novo Paciente
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Telefone</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Última Visita</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                            {filteredPacientes.map(patient => (
                                <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">{patient.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                                      <div className="flex items-center">
                                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                        {patient.phone}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">{patient.lastVisit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleOpenModalForEdit(patient)} className="text-brand-primary hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <PatientModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSavePatient}
                pacienteToEdit={editingPaciente}
            />
        </>
    );
};

export default PacientesView;