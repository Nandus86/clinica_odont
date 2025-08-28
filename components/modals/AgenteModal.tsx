import React, { useState, useEffect } from 'react';
import { UserRole, Agente } from '../../types';
import { hashStringSHA256 } from '../../utils/crypto';

export interface AgenteSubmitData {
    id?: string;
    fullName: string;
    email: string;
    role: UserRole;
    password_hash?: string;
}

interface AgenteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AgenteSubmitData) => void;
    agenteToEdit: Agente | null;
}

const AgenteModal: React.FC<AgenteModalProps> = ({ isOpen, onClose, onSubmit, agenteToEdit }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('user');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const isEditing = !!agenteToEdit;
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-dark-text-primary";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-dark-text-secondary";

    useEffect(() => {
        if (isOpen) {
            if (agenteToEdit) {
                setFullName(agenteToEdit.fullName);
                setEmail(agenteToEdit.email);
                setRole(agenteToEdit.role);
            } else {
                setFullName('');
                setEmail('');
                setRole('user');
            }
            // Always reset password fields when modal opens/changes mode
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen, agenteToEdit]);


    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fullName || !email) {
            setError('Nome completo e e-mail são obrigatórios.');
            return;
        }

        let password_hash: string | undefined = undefined;

        if (password) {
            if (password.length < 8) {
                setError("A senha deve ter no mínimo 8 caracteres.");
                return;
            }
            if (password !== confirmPassword) {
                setError("As senhas não coincidem.");
                return;
            }
            try {
                password_hash = await hashStringSHA256(password);
            } catch (err) {
                console.error("Erro ao gerar hash da senha:", err);
                setError("Ocorreu um erro interno. Tente novamente.");
                return;
            }
        } else if (!isEditing) {
            setError('A senha é obrigatória para novos agentes.');
            return;
        }

        onSubmit({
            id: agenteToEdit?.id,
            fullName,
            email,
            role,
            password_hash,
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-text-primary">{isEditing ? 'Editar Agente' : 'Novo Agente'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className={labelClasses}>Nome Completo <span className="text-red-500">*</span></label>
                            <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="email" className={labelClasses}>Email <span className="text-red-500">*</span></label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="role" className={labelClasses}>Nível de Acesso</label>
                            <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} className={inputClasses} required>
                                <option value="user">Usuário</option>
                                <option value="admin">Administrador</option>
                                <option value="superadmin">Super Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="password" className={labelClasses}>{isEditing ? 'Nova Senha (opcional)' : 'Senha'}</label>
                            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} placeholder={isEditing ? 'Deixe em branco para não alterar' : 'Mín. 8 caracteres'} />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className={labelClasses}>Confirmar Senha</label>
                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                    {error && <p className="text-sm text-status-danger text-center mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-600">{isEditing ? 'Atualizar Agente' : 'Salvar Agente'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgenteModal;