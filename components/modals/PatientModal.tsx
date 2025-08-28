import React, { useState, useEffect } from 'react';
import { Paciente } from '../../types';

interface PacienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { id?: string; name: string; phone: string; cpf?: string; address?: string; }) => void;
    pacienteToEdit: Paciente | null;
    initialName?: string;
}

const PacienteModal: React.FC<PacienteModalProps> = ({ isOpen, onClose, onSubmit, pacienteToEdit, initialName }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');

    const isEditing = !!pacienteToEdit;
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-dark-text-primary";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-dark-text-secondary";

    useEffect(() => {
        if (isOpen) {
            if (pacienteToEdit) {
                setName(pacienteToEdit.name);
                setPhone(pacienteToEdit.phone);
                setCpf(pacienteToEdit.cpf || '');
                setAddress(pacienteToEdit.address || '');
            } else {
                setName(initialName || '');
                setPhone('');
                setCpf('');
                setAddress('');
            }
            setError('');
        }
    }, [isOpen, pacienteToEdit, initialName]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) {
            setError('Nome e telefone são obrigatórios.');
            return;
        }
        onSubmit({ id: pacienteToEdit?.id, name, phone, cpf, address });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-text-primary">{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="patientName" className={labelClasses}>Nome Completo <span className="text-red-500">*</span></label>
                            <input type="text" id="patientName" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="patientPhone" className={labelClasses}>Telefone (com DDD) <span className="text-red-500">*</span></label>
                            <input type="tel" id="patientPhone" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} placeholder="(11) 98765-4321" required />
                        </div>
                         <div>
                            <label htmlFor="patientCpf" className={labelClasses}>CPF (Opcional)</label>
                            <input type="text" id="patientCpf" value={cpf} onChange={e => setCpf(e.target.value)} className={inputClasses} placeholder="000.000.000-00" />
                        </div>
                         <div>
                            <label htmlFor="patientAddress" className={labelClasses}>Endereço Completo (Opcional)</label>
                            <input type="text" id="patientAddress" value={address} onChange={e => setAddress(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                    {error && <p className="text-sm text-status-danger text-center mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-600">{isEditing ? 'Atualizar Paciente' : 'Salvar Paciente'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PacienteModal;