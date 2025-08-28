import React, { useState, useMemo, useCallback } from 'react';
import { Atendimento, AtendimentoStatus, Doutor, Procedimento, Paciente } from '../../types';
import { CalendarIcon, ClockIcon, SyncIcon, ViewBoardsIcon, TableCellsIcon, CalendarDaysIcon, CurrencyDollarIcon } from '../IconComponents';
import AppointmentModal, { AppointmentSubmitData } from '../modals/AppointmentModal';

interface AtendimentosViewProps {
  atendimentos: Atendimento[];
  setAtendimentos: React.Dispatch<React.SetStateAction<Atendimento[]>>;
  doutores: Doutor[];
  procedimentos: Procedimento[];
  pacientes: Paciente[];
  setPacientes: React.Dispatch<React.SetStateAction<Paciente[]>>;
  n8nWebhookUrl?: string;
  onSync: () => void;
  selectedClinicaId: string | null;
}

type ViewMode = 'kanban' | 'table' | 'calendar';

export const statusConfig: Record<AtendimentoStatus, { title: string; color: string; bgColor: string, darkBgColor: string }> = {
    agendado: { title: 'Agendado', color: 'text-blue-800', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-900' },
    confirmado: { title: 'Confirmado', color: 'text-yellow-800', bgColor: 'bg-yellow-100', darkBgColor: 'dark:bg-yellow-900' },
    compareceu: { title: 'Compareceu', color: 'text-teal-800', bgColor: 'bg-teal-100', darkBgColor: 'dark:bg-teal-900' },
    atendido: { title: 'Atendido', color: 'text-green-800', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-900' },
    faltou: { title: 'Faltou', color: 'text-orange-800', bgColor: 'bg-orange-100', darkBgColor: 'dark:bg-orange-900' },
    'não atendido': { title: 'Não Atendido', color: 'text-red-800', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-900' },
    'falta justificada': { title: 'Falta Justificada', color: 'text-gray-800', bgColor: 'bg-gray-100', darkBgColor: 'dark:bg-gray-700' },
};


const AtendimentosView: React.FC<AtendimentosViewProps> = (props) => {
    const { atendimentos, setAtendimentos, n8nWebhookUrl, onSync, selectedClinicaId, setPacientes } = props;
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAtendimento, setEditingAtendimento] = useState<Atendimento | null>(null);

    const handleStatusChange = async (id: string, newStatus: AtendimentoStatus) => {
        const originalAtendimentos = atendimentos;
        setAtendimentos(prev => prev.map(at => at.id === id ? { ...at, status: newStatus } : at));
        
        if (n8nWebhookUrl) {
            try {
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tag: 'atualizar_status_atendimento', atendimento_id: id, novo_status: newStatus })
                });
                if (!response.ok) throw new Error('Falha ao atualizar status no servidor.');
            } catch (error) {
                console.error("Erro ao atualizar status via webhook:", error);
                alert('Ocorreu um erro ao atualizar o status. Revertendo alteração.');
                setAtendimentos(originalAtendimentos);
            }
        }
    };

    const handleSaveAtendimento = async (data: AppointmentSubmitData) => {
        if (!selectedClinicaId) {
            alert('Nenhuma clínica selecionada. Não é possível salvar.');
            return;
        }

        const isUpdating = !!data.id;
        const tag = isUpdating ? 'atualizar_atendimento' : 'novo_atendimento';
        
        const patient = props.pacientes.find(p => p.id === data.patientId);
        if(!patient) {
            alert('Paciente selecionado é inválido.');
            return;
        }

        const doctor = props.doutores.find(d => d.id === data.doctorId);
        if(!doctor) {
            alert('Doutor inválido.');
            return;
        }

        const valorFinalTotal = data.procedures.reduce((sum, p) => sum + p.valorFinal, 0);
        
        const atendimentoData: Omit<Atendimento, 'id'> = {
            patient,
            doctor,
            procedures: data.procedures,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            valorFinal: valorFinalTotal,
            clinicaId: selectedClinicaId,
        };

        if (n8nWebhookUrl) {
            try {
                const payload = { tag, id: data.id, ...data, valorFinal: valorFinalTotal, clinicaId: selectedClinicaId };
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                 if (!response.ok) throw new Error(`Webhook retornou status ${response.status}`);
                 alert(`Atendimento ${isUpdating ? 'atualizado' : 'criado'} com sucesso!`);
            } catch (error) {
                console.error("Erro ao enviar para webhook:", error);
                alert(`Ocorreu um erro ao salvar o atendimento. Verifique o console.`);
                return;
            }
        }

        if (isUpdating) {
            setAtendimentos(prev => prev.map(at => at.id === data.id ? { id: data.id!, ...atendimentoData } : at));
        } else {
            setAtendimentos(prev => [{ id: `at-${Date.now()}`, ...atendimentoData }, ...prev]);
        }
        
        handleCloseModal();
    };
    
    const handleOpenModalForCreate = () => {
        setEditingAtendimento(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (atendimento: Atendimento) => {
        setEditingAtendimento(atendimento);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAtendimento(null);
    };

    const filteredAtendimentos = useMemo(() => {
        return atendimentos.filter(at => {
            const searchTermLower = searchTerm.toLowerCase();
            const procedureNames = at.procedures.map(p => props.procedimentos.find(proc => proc.id === p.procedimentoId)?.name || '').join(' ').toLowerCase();

            return at.patient.name.toLowerCase().includes(searchTermLower) ||
                   at.doctor.name.toLowerCase().includes(searchTermLower) ||
                   procedureNames.includes(searchTermLower);
        });
    }, [atendimentos, searchTerm, props.procedimentos]);


    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full md:w-auto flex-grow">
                    <input 
                        type="text" 
                        placeholder="Buscar por paciente, doutor ou procedimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 px-4 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-dark-surface dark:text-dark-text-primary"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-dark-surface p-1 rounded-lg shadow-sm border dark:border-dark-border">
                        <ViewModeButton icon={ViewBoardsIcon} current={viewMode} mode="kanban" setViewMode={setViewMode} />
                        <ViewModeButton icon={TableCellsIcon} current={viewMode} mode="table" setViewMode={setViewMode} />
                        <ViewModeButton icon={CalendarDaysIcon} current={viewMode} mode="calendar" setViewMode={setViewMode} />
                    </div>
                     <button onClick={onSync} className="p-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Sincronizar">
                        <SyncIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                    </button>
                    <button onClick={handleOpenModalForCreate} className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        Novo Atendimento
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow">
                {viewMode === 'kanban' && <KanbanView atendimentos={filteredAtendimentos} onStatusChange={handleStatusChange} onEdit={handleOpenModalForEdit} procedimentos={props.procedimentos} />}
                {viewMode === 'table' && <TableView atendimentos={filteredAtendimentos} onEdit={handleOpenModalForEdit} onStatusChange={handleStatusChange} procedimentos={props.procedimentos}/>}
                {viewMode === 'calendar' && <CalendarView atendimentos={filteredAtendimentos} onEdit={handleOpenModalForEdit} procedimentos={props.procedimentos}/>}
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSaveAtendimento}
                atendimentoToEdit={editingAtendimento}
                doctors={props.doutores}
                procedures={props.procedimentos}
                pacientes={props.pacientes}
                setPacientes={setPacientes}
                selectedClinicaId={selectedClinicaId}
            />
        </div>
    );
};

// --- View Mode Components ---

const ViewModeButton: React.FC<{icon: React.ElementType; current: ViewMode; mode: ViewMode; setViewMode: (mode: ViewMode) => void;}> = ({ icon: Icon, current, mode, setViewMode}) => (
    <button onClick={() => setViewMode(mode)} className={`p-1.5 rounded-md transition-colors ${current === mode ? 'bg-brand-primary text-white' : 'text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
        <Icon className="w-5 h-5"/>
    </button>
)

const KanbanView: React.FC<{atendimentos: Atendimento[], onStatusChange: (id: string, newStatus: AtendimentoStatus) => void, onEdit: (at: Atendimento) => void, procedimentos: Procedimento[]}> = ({ atendimentos, onStatusChange, onEdit, procedimentos }) => {
     const columns = Object.keys(statusConfig) as AtendimentoStatus[];
     const [draggedOverStatus, setDraggedOverStatus] = useState<AtendimentoStatus | null>(null);
     
     const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: AtendimentoStatus) => {
        e.preventDefault();
        const atendimentoId = e.dataTransfer.getData("atendimentoId");
        if (atendimentoId) {
            const currentAtendimento = atendimentos.find(at => at.id === atendimentoId);
            if(currentAtendimento && currentAtendimento.status !== newStatus) {
                onStatusChange(atendimentoId, newStatus);
            }
        }
        setDraggedOverStatus(null);
     };

     const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: AtendimentoStatus) => {
        e.preventDefault();
        setDraggedOverStatus(status);
     };

     const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggedOverStatus(null);
     };
     
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-full">
            {columns.map(status => (
                <div 
                    key={status} 
                    className={`bg-gray-50 dark:bg-dark-bg rounded-lg p-3 flex flex-col transition-colors duration-300 ${draggedOverStatus === status ? 'bg-brand-light dark:bg-gray-700' : ''}`}
                    onDrop={(e) => handleDrop(e, status)}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h3 className={`text-xs font-bold px-2 py-0.5 rounded-md dark:text-dark-text-primary ${statusConfig[status].bgColor} ${statusConfig[status].color} ${statusConfig[status].darkBgColor}`}>
                            {statusConfig[status].title}
                        </h3>
                        <span className="text-sm font-bold text-gray-500 dark:text-dark-text-secondary">
                            {atendimentos.filter(at => at.status === status).length}
                        </span>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-1">
                        {atendimentos
                            .filter(at => at.status === status)
                            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                            .map(atendimento => (
                                <KanbanCard key={atendimento.id} atendimento={atendimento} onEdit={onEdit} procedimentos={procedimentos} />
                            ))
                        }
                    </div>
                </div>
            ))}
        </div>
     )
}

const KanbanCard: React.FC<{ atendimento: Atendimento, onEdit: (at: Atendimento) => void, procedimentos: Procedimento[] }> = ({ atendimento, onEdit, procedimentos }) => {
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("atendimentoId", atendimento.id);
        e.dataTransfer.effectAllowed = "move";
    };

    const getProcedureNames = (limit: number = 1) => {
        if (!atendimento.procedures || atendimento.procedures.length === 0) return 'Nenhum procedimento';
        
        const names = atendimento.procedures.map(p => procedimentos.find(proc => proc.id === p.procedimentoId)?.name || 'Desconhecido');

        if (names.length > limit) {
            return `${names.slice(0, limit).join(', ')} +${names.length - limit} outro(s)`;
        }
        return names.join(', ');
    };

    const allProcedureNames = atendimento.procedures.map(p => procedimentos.find(proc => proc.id === p.procedimentoId)?.name || 'Desconhecido').join(', ');

    return (
        <div 
            draggable="true"
            onDragStart={handleDragStart}
            onClick={() => onEdit(atendimento)}
            className="bg-white dark:bg-dark-surface p-3 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border mb-3 cursor-grab active:cursor-grabbing transform transition-all hover:scale-105"
        >
            <h4 className="font-bold text-gray-800 dark:text-dark-text-primary text-sm">{atendimento.patient.name}</h4>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1 truncate" title={allProcedureNames}>
                {getProcedureNames()}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{atendimento.doctor.name}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-text-secondary mt-2">
                 <div className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {atendimento.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
                 <div className="flex items-center font-semibold text-green-600">
                    <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                    {atendimento.valorFinal.toFixed(2)}
                 </div>
            </div>
        </div>
    );
}


const TableView: React.FC<{atendimentos: Atendimento[], onEdit: (at: Atendimento) => void, onStatusChange: (id: string, newStatus: AtendimentoStatus) => void, procedimentos: Procedimento[]}> = ({ atendimentos, onEdit, onStatusChange, procedimentos }) => {
    const sortedAtendimentos = [...atendimentos].sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
    
    const getProcedureNames = (at: Atendimento) => {
        return at.procedures.map(p => procedimentos.find(proc => proc.id === p.procedimentoId)?.name || 'N/A').join(', ');
    };

    return (
         <div className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-md overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Paciente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Data & Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Doutor(a)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Procedimento(s)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Valor (R$)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                    {sortedAtendimentos.map(at => (
                        <tr key={at.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">{at.patient.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">
                                {at.startTime.toLocaleDateString()} {at.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">{at.doctor.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary truncate max-w-xs">{getProcedureNames(at)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-dark-text-primary">{at.valorFinal.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <select value={at.status} onChange={(e) => onStatusChange(at.id, e.target.value as AtendimentoStatus)}
                                    className={`p-1 rounded text-xs border-0 focus:ring-0 dark:text-dark-text-primary dark:bg-gray-700 ${statusConfig[at.status].bgColor} ${statusConfig[at.status].color}`}>
                                     {Object.entries(statusConfig).map(([key, value]) => 
                                        <option key={key} value={key}>{value.title}</option>
                                     )}
                                </select>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => onEdit(at)} className="text-brand-primary hover:text-blue-700">Editar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const CalendarView: React.FC<{atendimentos: Atendimento[], onEdit: (at: Atendimento) => void, procedimentos: Procedimento[]}> = ({ atendimentos, onEdit, procedimentos }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -1 : 1); // week starts on Monday
        return new Date(d.setDate(diff));
    }, [currentDate]);

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    }), [startOfWeek]);

    const timeSlots = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`);
    
    const getProcedureNames = (at: Atendimento) => {
        return at.procedures.map(p => procedimentos.find(proc => proc.id === p.procedimentoId)?.name || 'N/A').join(', ');
    };

    const changeWeek = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + amount * 7);
            return newDate;
        });
    }

    const getEventStyle = (at: Atendimento) => {
        const startHour = at.startTime.getHours() + at.startTime.getMinutes() / 60;
        const endHour = at.endTime.getHours() + at.endTime.getMinutes() / 60;
        const duration = endHour - startHour;
        return {
            top: `${startHour * 4}rem`, // 4rem per hour
            height: `${duration * 4}rem`,
        }
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md flex flex-col h-full">
            <div className="p-4 border-b dark:border-dark-border flex justify-between items-center">
                <button onClick={() => changeWeek(-1)}>&lt; Anterior</button>
                <h3 className="font-semibold">{startOfWeek.toLocaleDateString()} - {weekDays[6].toLocaleDateString()}</h3>
                <button onClick={() => changeWeek(1)}>Próxima &gt;</button>
            </div>
            <div className="flex-grow overflow-auto">
                <div className="grid grid-cols-8 min-w-[1200px]">
                    <div className="col-span-1 border-r dark:border-dark-border">{/* Time column */}
                        {timeSlots.map(time => <div key={time} className="h-16 border-b dark:border-dark-border text-center text-xs pt-1">{time}</div>)}
                    </div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className="col-span-1 border-r dark:border-dark-border relative">
                             <div className="text-center py-2 border-b dark:border-dark-border sticky top-0 bg-white dark:bg-dark-surface z-10">
                                <p className="font-semibold">{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                                <p className="text-2xl">{day.getDate()}</p>
                            </div>
                            <div className="relative">
                                {timeSlots.map(time => <div key={time} className="h-16 border-b dark:border-dark-border"></div>)}
                                {atendimentos
                                    .filter(at => at.startTime.toDateString() === day.toDateString())
                                    .map(at => (
                                        <div key={at.id} style={getEventStyle(at)} onClick={() => onEdit(at)}
                                            className={`absolute left-2 right-2 p-2 rounded-lg text-white text-xs cursor-pointer ${statusConfig[at.status].bgColor.replace('100', '500')} `}>
                                            <p className="font-bold">{at.patient.name}</p>
                                            <p className="truncate" title={getProcedureNames(at)}>{getProcedureNames(at)}</p>
                                            <p className="text-xs">{at.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AtendimentosView;