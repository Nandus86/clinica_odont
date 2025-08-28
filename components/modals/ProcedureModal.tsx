import React, { useState, useEffect } from 'react';
import { Procedimento, Especialidade } from '../../types';

interface ProcedureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { id?: string; name: string; description: string; especialidadeId: string; }) => void;
    procedimentoToEdit: Procedimento | null;
    especialidades: Especialidade[];
}

const ProcedureModal: React.FC<ProcedureModalProps> = ({ isOpen, onClose, onSubmit, procedimentoToEdit, especialidades }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [especialidadeId, setEspecialidadeId] = useState<string>(especialidades.length > 0 ? especialidades[0].id : '');
    const [error, setError] = useState('');

    const isEditing = !!procedimentoToEdit;
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-dark-text-primary";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-dark-text-secondary";

    useEffect(() => {
        if (isOpen) {
            if (procedimentoToEdit) {
                setName(procedimentoToEdit.name);
                setDescription(procedimentoToEdit.description);
                setEspecialidadeId(procedimentoToEdit.especialidadeId);
            } else {
                setName('');
                setDescription('');
                setEspecialidadeId(especialidades.length > 0 ? especialidades[0].id : '');
            }
            setError('');
        }
    }, [isOpen, procedimentoToEdit, especialidades]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !especialidadeId) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        onSubmit({ id: procedimentoToEdit?.id, name, description, especialidadeId });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-text-primary">{isEditing ? 'Editar Procedimento' : 'Novo Procedimento'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="procedureName" className={labelClasses}>Nome do Procedimento</label>
                            <input type="text" id="procedureName" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="especialidade" className={labelClasses}>Especialidade</label>
                            <select 
                                id="especialidade" 
                                value={especialidadeId} 
                                onChange={e => setEspecialidadeId(e.target.value)} 
                                className={inputClasses}
                                required
                            >
                                <option value="" disabled>Selecione uma especialidade</option>
                                {especialidades.map(esp => (
                                    <option key={esp.id} value={esp.id}>{esp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="procedureDescription" className={labelClasses}>Descrição</label>
                            <textarea id="procedureDescription" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} required />
                        </div>
                    </div>
                    {error && <p className="text-sm text-status-danger text-center mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-600">{isEditing ? 'Atualizar Procedimento' : 'Salvar Procedimento'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProcedureModal;