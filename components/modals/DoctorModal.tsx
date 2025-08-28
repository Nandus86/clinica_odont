import React, { useState, useEffect, useMemo } from 'react';
import { Doutor, Especialidade, Procedimento, DoutorProcedimento } from '../../types';

export interface DoutorSubmitData {
    id?: string;
    name: string;
    avatarUrl: string;
    especialidadeId: string;
    procedimentos: DoutorProcedimento[];
}

interface DoutorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DoutorSubmitData) => void;
    doutorToEdit: Doutor | null;
    especialidades: Especialidade[];
    procedimentos: Procedimento[];
}

const DoutorModal: React.FC<DoutorModalProps> = ({ isOpen, onClose, onSubmit, doutorToEdit, especialidades, procedimentos }) => {
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [especialidadeId, setEspecialidadeId] = useState<string>(especialidades.length > 0 ? especialidades[0].id : '');
    const [procState, setProcState] = useState<Record<string, { selected: boolean; valor: string; orcar: boolean }>>({});
    const [error, setError] = useState('');

    const isEditing = !!doutorToEdit;
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-dark-text-primary";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-dark-text-secondary";


    const filteredProcedures = useMemo(() => {
        if (!especialidadeId) return [];
        return procedimentos.filter(proc => proc.especialidadeId === especialidadeId);
    }, [procedimentos, especialidadeId]);

    useEffect(() => {
        if (isOpen) {
            const firstEspecialidadeId = especialidades.length > 0 ? especialidades[0].id : '';
            const initialEspecialidadeId = isEditing ? doutorToEdit.especialidade.id : firstEspecialidadeId;
            setEspecialidadeId(initialEspecialidadeId);

            if (isEditing) {
                setName(doutorToEdit.name);
                setAvatarUrl(doutorToEdit.avatarUrl);
            } else {
                setName('');
                setAvatarUrl('');
            }
            
            const initialProcState = procedimentos.reduce((acc, proc) => {
                const existingProc = isEditing ? doutorToEdit.procedimentos.find(p => p.procedimentoId === proc.id) : null;
                acc[proc.id] = {
                    selected: !!existingProc,
                    valor: existingProc && !existingProc.orcar ? String(existingProc.valor) : '',
                    orcar: existingProc ? existingProc.orcar : false,
                };
                return acc;
            }, {} as Record<string, { selected: boolean; valor: string; orcar: boolean }>);
            setProcState(initialProcState);
            
            setError('');
        }
    }, [isOpen, doutorToEdit, especialidades, procedimentos]);
    
    if (!isOpen) return null;

    const handleProcedureChange = (procId: string, field: 'selected' | 'valor' | 'orcar', value: boolean | string) => {
        setProcState(prev => {
            const newState = { ...prev };
            newState[procId] = { ...newState[procId], [field]: value };
            // If 'orcar' is checked, clear the value
            if (field === 'orcar' && value === true) {
                newState[procId].valor = '';
            }
            return newState;
        });
    };

    const handleEspecialidadeChange = (newEspecialidadeId: string) => {
        setEspecialidadeId(newEspecialidadeId);
        // Reset procedures when specialty changes, unless it's the original specialty of the doctor being edited.
        const isOriginalEspecialidade = isEditing && newEspecialidadeId === doutorToEdit.especialidade.id;
        const newProcState = procedimentos.reduce((acc, proc) => {
            const existingProc = isOriginalEspecialidade ? doutorToEdit.procedimentos.find(p => p.procedimentoId === proc.id) : null;
             acc[proc.id] = {
                selected: !!existingProc,
                valor: existingProc && !existingProc.orcar ? String(existingProc.valor) : '',
                orcar: existingProc ? existingProc.orcar : false,
            };
            return acc;
        }, {} as Record<string, { selected: boolean; valor: string; orcar: boolean }>);
        setProcState(newProcState);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !especialidadeId) {
            setError('Nome e especialidade são obrigatórios.');
            return;
        }

        const selectedProcedures: DoutorProcedimento[] = Object.entries(procState)
            .filter(([, data]) => data.selected)
            .map(([procId, data]) => {
                if (data.orcar) {
                    return { procedimentoId: procId, orcar: true };
                }
                const valor = parseFloat(data.valor);
                if (isNaN(valor) || valor <= 0) {
                     throw new Error(`O valor para o procedimento selecionado deve ser um número positivo.`);
                }
                return { procedimentoId: procId, orcar: false, valor };
            });

        try {
            onSubmit({
                id: doutorToEdit?.id,
                name,
                avatarUrl,
                especialidadeId,
                procedimentos: selectedProcedures,
            });
        } catch (e) {
            if (e instanceof Error) setError(e.message);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 md:p-8 w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-text-primary">{isEditing ? 'Editar Doutor(a)' : 'Novo Doutor(a)'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Nome Completo <span className="text-red-500">*</span></label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label className={labelClasses}>URL do Avatar</label>
                            <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                        </div>
                        <div>
                            <label className={labelClasses}>Especialidade <span className="text-red-500">*</span></label>
                            <select value={especialidadeId} onChange={e => handleEspecialidadeChange(e.target.value)} className={inputClasses} required>
                               {especialidades.map(esp => <option key={esp.id} value={esp.id}>{esp.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`${labelClasses} mb-2`}>Procedimentos Realizados</label>
                            <div className="space-y-3 max-h-48 overflow-y-auto border dark:border-dark-border p-3 rounded-md">
                               {filteredProcedures.length > 0 ? (
                                   filteredProcedures.map(proc => (
                                       <div key={proc.id} className="grid grid-cols-3 items-center gap-4">
                                           <div className="col-span-1 flex items-center">
                                                <input type="checkbox" id={`proc-select-${proc.id}`} checked={procState[proc.id]?.selected || false} onChange={(e) => handleProcedureChange(proc.id, 'selected', e.target.checked)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"/>
                                                <label htmlFor={`proc-select-${proc.id}`} className="ml-2 text-sm text-gray-700 dark:text-dark-text-secondary">{proc.name}</label>
                                           </div>
                                            {procState[proc.id]?.selected && (
                                                <>
                                                <div className="col-span-1 flex items-center">
                                                    <input type="checkbox" id={`proc-orcar-${proc.id}`} checked={procState[proc.id]?.orcar || false} onChange={(e) => handleProcedureChange(proc.id, 'orcar', e.target.checked)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"/>
                                                    <label htmlFor={`proc-orcar-${proc.id}`} className="ml-2 text-sm text-gray-700 dark:text-dark-text-secondary">Orçar</label>
                                                </div>
                                                <div className="col-span-1 relative">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 dark:text-dark-text-secondary">R$</span>
                                                    <input type="number" value={procState[proc.id]?.valor || ''} onChange={(e) => handleProcedureChange(proc.id, 'valor', e.target.value)}
                                                        className="w-full block pl-9 pr-2 py-1 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-gray-700 dark:text-dark-text-primary disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                                        placeholder="Valor"
                                                        disabled={procState[proc.id]?.orcar}
                                                        required={!procState[proc.id]?.orcar}
                                                    />
                                                </div>
                                                </>
                                            )}
                                       </div>
                                   ))
                               ) : (
                                   <p className="text-sm text-gray-500 dark:text-dark-text-secondary text-center">Nenhum procedimento para esta especialidade.</p>
                               )}
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-sm text-status-danger text-center mt-4">{error}</p>}
                </form>
                <div className="mt-6 flex justify-end space-x-3 flex-shrink-0 pt-4 border-t dark:border-dark-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-600">{isEditing ? 'Atualizar Doutor(a)' : 'Salvar Doutor(a)'}</button>
                </div>
            </div>
        </div>
    );
};

export default DoutorModal;