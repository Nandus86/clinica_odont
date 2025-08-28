import React, { useState, useEffect } from 'react';
import { Transacao, TipoTransacao } from '../../types';

export interface TransacaoSubmitData {
    id?: string;
    descricao: string;
    valor: number;
    tipo: TipoTransacao;
    data: Date;
    categoria: string;
}

interface TransacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TransacaoSubmitData) => void;
    transacaoToEdit: Transacao | null;
}

const TransacaoModal: React.FC<TransacaoModalProps> = ({ isOpen, onClose, onSubmit, transacaoToEdit }) => {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipo, setTipo] = useState<TipoTransacao>('despesa');
    const [data, setData] = useState('');
    const [categoria, setCategoria] = useState('');
    const [error, setError] = useState('');
    
    const isEditing = !!transacaoToEdit;
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-dark-text-primary";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-dark-text-secondary";


    useEffect(() => {
        if (isOpen) {
            if (transacaoToEdit) {
                setDescricao(transacaoToEdit.descricao);
                setValor(String(transacaoToEdit.valor));
                setTipo(transacaoToEdit.tipo);
                setData(new Date(transacaoToEdit.data.getTime() - (transacaoToEdit.data.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
                setCategoria(transacaoToEdit.categoria);
            } else {
                setDescricao('');
                setValor('');
                setTipo('despesa');
                setData(new Date().toISOString().split('T')[0]);
                setCategoria('');
            }
            setError('');
        }
    }, [isOpen, transacaoToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valorNumerico = parseFloat(valor);
        if (!descricao || !valor || isNaN(valorNumerico) || valorNumerico <= 0 || !data || !categoria) {
            setError('Todos os campos são obrigatórios e o valor deve ser positivo.');
            return;
        }
        
        const [year, month, day] = data.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));

        onSubmit({
            id: transacaoToEdit?.id,
            descricao,
            valor: valorNumerico,
            tipo,
            data: dateObj,
            categoria
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md m-4 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-text-primary">{isEditing ? 'Editar Transação' : 'Nova Transação'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tipo" className={labelClasses}>Tipo</label>
                            <select id="tipo" value={tipo} onChange={e => setTipo(e.target.value as TipoTransacao)} className={inputClasses} required>
                                <option value="despesa">Despesa</option>
                                <option value="receita">Receita (Manual)</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="descricao" className={labelClasses}>Descrição</label>
                            <input type="text" id="descricao" value={descricao} onChange={e => setDescricao(e.target.value)} className={inputClasses} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="valor" className={labelClasses}>Valor (R$)</label>
                                <input type="number" id="valor" value={valor} onChange={e => setValor(e.target.value)} min="0.01" step="0.01" className={inputClasses} required />
                            </div>
                            <div>
                                <label htmlFor="data" className={labelClasses}>Data</label>
                                <input type="date" id="data" value={data} onChange={e => setData(e.target.value)} className={inputClasses} required />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="categoria" className={labelClasses}>Categoria</label>
                            <input type="text" id="categoria" value={categoria} onChange={e => setCategoria(e.target.value)} className={inputClasses} placeholder="Ex: Salários, Aluguel, Material de consumo" required />
                        </div>
                    </div>
                    {error && <p className="text-sm text-status-danger text-center mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-600">{isEditing ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransacaoModal;