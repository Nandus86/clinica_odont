import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Atendimento, Paciente, Doutor, View, UserRole } from '../../types';
import { CalendarIcon, UsersIcon, CheckCircleIcon, CurrencyDollarIcon } from '../IconComponents';
import { useTheme } from '../../App';

type NavItem = {
    view: View;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
};

interface DashboardOverviewProps {
    atendimentos: Atendimento[];
    pacientes: Paciente[];
    doutores: Doutor[];
    navItems: NavItem[];
    onNavigate: (view: View) => void;
}

// Helper function to check if a date is today
const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold text-brand-dark dark:text-dark-text-primary">{value}</p>
        </div>
    </div>
);

const QuickAccessLink: React.FC<{ item: NavItem, onNavigate: (view: View) => void }> = ({ item, onNavigate }) => (
    <button
        onClick={() => onNavigate(item.view)}
        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-dark-surface rounded-lg shadow-md hover:shadow-xl hover:bg-brand-light dark:hover:bg-gray-700 transition-all duration-200 text-center"
    >
        <div className="p-3 mb-2 bg-brand-primary rounded-full">
            <item.icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-brand-secondary dark:text-dark-text-primary">{item.label}</span>
    </button>
);

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ atendimentos, pacientes, doutores, navItems, onNavigate }) => {
    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? '#8B949E' : '#6b7280';
    const tooltipStyles = {
        backgroundColor: theme === 'dark' ? '#161B22' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#30363D' : '#ccc'}`
    };

    // --- Calculations for Stat Cards ---
    const atendimentosHoje = atendimentos.filter(at => isToday(at.startTime));
    const consultasConcluidasHoje = atendimentosHoje.filter(at => at.status === 'atendido');

    const faturamentoHoje = consultasConcluidasHoje.reduce((total, at) => {
        return total + (at.valorFinal || 0);
    }, 0);

    const totalPacientes = pacientes.length;

    // --- Calculations for Charts ---
    // Weekly Appointments
    const getWeekData = () => {
        const weekDayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        const weekData = weekDayLabels.map(day => ({ name: day, Agendamentos: 0 }));
        
        const today = new Date();
        const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const firstDayOfWeek = new Date(today);
        // Adjust to Monday
        firstDayOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        
        atendimentos
            .filter(at => at.startTime >= firstDayOfWeek && at.startTime <= lastDayOfWeek)
            .forEach(at => {
                const dayIndex = at.startTime.getDay(); // 0 for Sun
                const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 0 for Mon
                if(weekData[adjustedIndex]) {
                    weekData[adjustedIndex].Agendamentos++;
                }
            });
            
        return weekData;
    };
    const appointmentsWeekData = getWeekData();

    // Monthly History (last 6 months)
    const getMonthHistoryData = () => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const historyData: { month: string; Atendimentos: number }[] = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = months[d.getMonth()];
            const year = d.getFullYear();
            
            const count = atendimentos.filter(at => 
                at.startTime.getMonth() === d.getMonth() && at.startTime.getFullYear() === year
            ).length;

            historyData.push({ month: `${monthName}/${String(year).slice(2)}`, Atendimentos: count });
        }
        return historyData;
    };
    const attendanceHistoryData = getMonthHistoryData();

    return (
        <div className="space-y-8">
            {/* Quick Access Menu */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary mb-4">Acesso Rápido</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
                    {navItems.filter(item => item.view !== View.Dashboard).map(item => (
                        <QuickAccessLink key={item.view} item={item} onNavigate={onNavigate} />
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={CalendarIcon} title="Agendamentos Hoje" value={atendimentosHoje.length} color="bg-blue-500" />
                <StatCard icon={UsersIcon} title="Total de Pacientes" value={totalPacientes} color="bg-green-500" />
                <StatCard icon={CheckCircleIcon} title="Consultas Concluídas (Hoje)" value={consultasConcluidasHoje.length} color="bg-purple-500" />
                <StatCard icon={CurrencyDollarIcon} title="Faturamento (Hoje)" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoHoje)} color="bg-yellow-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-text-primary mb-4">Agendamentos da Semana</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={appointmentsWeekData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#30363D' : '#e0e0e0'} />
                            <XAxis dataKey="name" tick={{ fill: axisColor }} />
                            <YAxis tick={{ fill: axisColor }} />
                            <Tooltip contentStyle={tooltipStyles} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                            <Legend wrapperStyle={{ color: axisColor }}/>
                            <Bar dataKey="Agendamentos" fill="#00A8E8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-brand-secondary dark:text-dark-text-primary mb-4">Histórico de Atendimentos</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={attendanceHistoryData}>
                             <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#30363D' : '#e0e0e0'} />
                            <XAxis dataKey="month" tick={{ fill: axisColor }}/>
                            <YAxis tick={{ fill: axisColor }}/>
                            <Tooltip contentStyle={tooltipStyles} cursor={{ stroke: axisColor }}/>
                            <Legend wrapperStyle={{ color: axisColor }}/>
                            <Line type="monotone" dataKey="Atendimentos" stroke="#22C55E" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;