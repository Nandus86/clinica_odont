import React, { useMemo, useState } from 'react';
import { Atendimento, Transacao, Procedimento } from '../../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BanknotesIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, CalendarIcon } from '../IconComponents';
import TransacaoModal, { TransacaoSubmitData } from '../modals/TransacaoModal';
import { useTheme } from '../../App';

interface FinanceiroViewProps {
    atendimentos: Atendimento[];
    transacoesManuais: Transacao[];
    setTransacoesManuais: React.Dispatch<React.SetStateAction<Transacao[]>>;
    selectedClinicaId: string | null;
    procedimentos: Procedimento[];
}

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string; color: string; bgColor: string }> = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`w-8 h-8 ${color}`} />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold text-brand-dark dark:text-dark-text-primary">{value}</p>
        </div>
    </div>
);

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const FinanceiroView: React.FC<FinanceiroViewProps> = ({ atendimentos, transacoesManuais, setTransacoesManuais, selectedClinicaId, procedimentos }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? '#8B949E' : '#6b7280';
    const tooltipStyles = {
        backgroundColor: theme === 'dark' ? '#161B22' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#30363D' : '#ccc'}`
    };


    const receitaDeAtendimentos = useMemo((): Transacao[] => {
        return atendimentos
            .filter(at => at.status === 'atendido' && at.valorFinal > 0)
            .map(at => {
                // FIX: Property 'procedure' does not exist on type 'Atendimento'. Changed to use 'procedures' array to get procedure names.
                const procedureNames = at.procedures
                    .map(p => procedimentos.find(proc => proc.id === p.procedimentoId)?.name || 'Desconhecido')
                    .join(', ');
                return {
                    id: `at-${at.id}`,
                    descricao: `Atendimento: ${procedureNames} - ${at.patient.name}`,
                    valor: at.valorFinal,
                    tipo: 'receita',
                    data: at.endTime,
                    categoria: 'Atendimento Odontológico',
                    atendimentoId: at.id,
                    clinicaId: at.clinicaId
                };
            });
    }, [atendimentos, procedimentos]);

    const todasTransacoes = useMemo(() => {
        return [...receitaDeAtendimentos, ...transacoesManuais].sort((a, b) => b.data.getTime() - a.data.getTime());
    }, [receitaDeAtendimentos, transacoesManuais]);
    
    const { totalReceitas, totalDespesas, saldo } = useMemo(() => {
        return todasTransacoes.reduce((acc, transacao) => {
            if (transacao.tipo === 'receita') {
                acc.totalReceitas += transacao.valor;
            } else {
                acc.totalDespesas += transacao.valor;
            }
            acc.saldo = acc.totalReceitas - acc.totalDespesas;
            return acc;
        }, { totalReceitas: 0, totalDespesas: 0, saldo: 0 });
    }, [todasTransacoes]);
    
    const monthlyData = useMemo(() => {
        const dataMap = new Map<string, { month: string, Receitas: number, Despesas: number }>();
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        todasTransacoes.forEach(t => {
            const monthKey = `${t.data.getFullYear()}-${t.data.getMonth()}`;
            if (!dataMap.has(monthKey)) {
                dataMap.set(monthKey, {
                    month: `${months[t.data.getMonth()]}/${String(t.data.getFullYear()).slice(2)}`,
                    Receitas: 0,
                    Despesas: 0
                });
            }
            const entry = dataMap.get(monthKey)!;
            if (t.tipo === 'receita') entry.Receitas += t.valor;
            else entry.Despesas += t.valor;
        });

        return Array.from(dataMap.values()).sort((a,b) => {
            const [aMonth, aYear] = a.month.split('/');
            const [bMonth, bYear] = b.month.split('/');
            if(aYear !== bYear) return Number(aYear) - Number(bYear);
            return months.indexOf(aMonth) - months.indexOf(bMonth);
        }).slice(-6); // Last 6 months
    }, [todasTransacoes]);
    
    const handleOpenModalForCreate = () => {
        setEditingTransacao(null);
        setIsModalOpen(true);
    };

    const handleSaveTransacao = (data: TransacaoSubmitData) => {
        if (!selectedClinicaId) {
            alert('Nenhuma clínica selecionada.');
            return;
        }

        if (data.id) { // Editing
             setTransacoesManuais(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
        } else { // Creating
            const newTransacao: Transacao = {
                id: `manual-${Date.now()}`,
                ...data,
                clinicaId: selectedClinicaId,
            };
            setTransacoesManuais(prev => [newTransacao, ...prev]);
        }
        setIsModalOpen(false);
    };


    return (
         <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-secondary dark:text-dark-text-primary">Visão Geral Financeira</h2>
                <button onClick={handleOpenModalForCreate} className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    <BanknotesIcon className="w-5 h-5 mr-2" />
                    Nova Transação Manual
                </button>
            </div>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={ArrowUpCircleIcon} title="Total de Receitas" value={formatCurrency(totalReceitas)} color="text-status-success" bgColor="bg-green-100 dark:bg-green-900"/>
                <StatCard icon={ArrowDownCircleIcon} title="Total de Despesas" value={formatCurrency(totalDespesas)} color="text-status-danger" bgColor="bg-red-100 dark:bg-red-900" />
                <StatCard icon={BanknotesIcon} title="Saldo Atual" value={formatCurrency(saldo)} color="text-brand-primary" bgColor="bg-blue-100 dark:bg-blue-900"/>
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-text-primary mb-4">Fluxo de Caixa (Últimos 6 Meses)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#30363D' : '#e0e0e0'}/>
                        <XAxis dataKey="month" tick={{ fill: axisColor }} />
                        <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: axisColor }}/>
                        <Tooltip contentStyle={tooltipStyles} formatter={(value) => formatCurrency(value as number)} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                        <Legend wrapperStyle={{ color: axisColor }} />
                        <Bar dataKey="Receitas" fill="#22C55E" />
                        <Bar dataKey="Despesas" fill="#EF4444" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                 <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-text-primary mb-4">Histórico de Transações</h3>
                 <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase">Descrição</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase">Categoria</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                           {todasTransacoes.map(t => (
                               <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">{t.data.toLocaleDateString()}</td>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-dark-text-primary">{t.descricao}</td>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">{t.categoria}</td>
                                   <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${t.tipo === 'receita' ? 'text-status-success' : 'text-status-danger'}`}>
                                       {t.tipo === 'despesa' && '- '}{formatCurrency(t.valor)}
                                    </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            
            <TransacaoModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveTransacao}
                transacaoToEdit={editingTransacao}
            />
        </div>
    );
};

export default FinanceiroView;