import React, { useState, useEffect, useMemo } from 'react';
import { Doutor, Procedimento, Paciente, Atendimento, AtendimentoStatus, ProcedimentoAtendimento } from '../../types';
import { statusConfig } from '../views/AppointmentsView';
import PatientModal from './PatientModal';
import { PlusCircleIcon, ClockIcon, CalendarDaysIcon } from '../IconComponents';

export interface AppointmentSubmitData {
    id?: string;
    patientId: string;
    doctorId: string;
    procedures: ProcedimentoAtendimento[];
    startTime: Date;
    endTime: Date;
    status: AtendimentoStatus;
}

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AppointmentSubmitData) => void;
    atendimentoToEdit: Atendimento | null;
    doctors: Doutor[];
    procedures: Procedimento[];
    pacientes: Paciente[];
    setPacientes: React.Dispatch<React.SetStateAction<Paciente[]>>;
    selectedClinicaId: string | null;
}

// Internal state type for managing selected procedures with their full details
type SelectedProcedureState = ProcedimentoAtendimento & {
    name: string;
    orcar: boolean;
    valorFixo?: number;
};

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSubmit, atendimentoToEdit, doctors, procedures, pacientes, setPacientes, selectedClinicaId }) => {
    const [patientId, setPatientId] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
    const [doctorId, setDoctorId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [status, setStatus] = useState<AtendimentoStatus>('agendado');
    const [selectedProcedures, setSelectedProcedures] = useState<SelectedProcedureState[]>([]);
    const [procedureToAdd, setProcedureToAdd] = useState('');
    const [error, setError] = useState('');
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

    const isEditing = !!atendimentoToEdit;

    const availableProceduresForDoctor = useMemo(() => {
        if (!doctorId) return [];
        const selectedDoctor = doctors.find(doc => doc.id === doctorId);
        if (!selectedDoctor) return [];

        const selectedProcedureIds = new Set(selectedProcedures.map(p => p.procedimentoId));

        return selectedDoctor.procedimentos
            .map(docProc => procedures.find(p => p.id === docProc.procedimentoId))
            .filter((p): p is Procedimento => !!p && !selectedProcedureIds.has(p.id));
    }, [doctorId, doctors, procedures, selectedProcedures]);

    const totalValorFinal = useMemo(() => {
        return selectedProcedures.reduce((sum, proc) => sum + proc.valorFinal, 0);
    }, [selectedProcedures]);

    const filteredPacientes = useMemo(() => {
        if (!patientSearch) {
            return [];
        }
        // Do not show dropdown if an exact match is already selected
        if (pacientes.find(p => p.id === patientId && p.name === patientSearch)) {
            return [];
        }
        return pacientes.filter(p =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase())
        );
    }, [patientSearch, pacientes, patientId]);

    useEffect(() => {
        if (isOpen) {
            if (atendimentoToEdit) {
                setPatientId(atendimentoToEdit.patient.id);
                setPatientSearch(atendimentoToEdit.patient.name);
                setDoctorId(atendimentoToEdit.doctor.id);
                
                // Correctly format local date and time from the Date object
                const startTime = atendimentoToEdit.startTime;
                const yyyy = startTime.getFullYear();
                const mm = String(startTime.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                const dd = String(startTime.getDate()).padStart(2, '0');
                setDate(`${yyyy}-${mm}-${dd}`);

                const hh = String(startTime.getHours()).padStart(2, '0');
                const min = String(startTime.getMinutes()).padStart(2, '0');
                setTime(`${hh}:${min}`);
                
                setStatus(atendimentoToEdit.status);
                
                const doctorProcedures = doctors.find(d => d.id === atendimentoToEdit.doctor.id)?.procedimentos || [];
                const populatedProcedures = atendimentoToEdit.procedures.map(p => {
                    const procedureInfo = procedures.find(proc => proc.id === p.procedimentoId);
                    const doctorProcInfo = doctorProcedures.find(dp => dp.procedimentoId === p.procedimentoId);
                    return {
                        ...p,
                        name: procedureInfo?.name || 'Desconhecido',
                        orcar: doctorProcInfo?.orcar || false,
                        valorFixo: doctorProcInfo?.valor
                    };
                });
                setSelectedProcedures(populatedProcedures);
            } else {
                setPatientId('');
                setPatientSearch('');
                const firstDoctorId = doctors.length > 0 ? doctors[0].id : '';
                setDoctorId(firstDoctorId);
                
                // Default to today's date, correctly formatted
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                setDate(`${yyyy}-${mm}-${dd}`);
                
                setTime('09:00');
                setStatus('agendado');
                setSelectedProcedures([]);
            }
            setProcedureToAdd('');
            setError('');
        }
    }, [isOpen, atendimentoToEdit, doctors, procedures, pacientes]);

    if (!isOpen) return null;

    const handleAddProcedure = () => {
        if (!procedureToAdd) return;
        const selectedDoctor = doctors.find(doc => doc.id === doctorId);
        const procedureInfo = procedures.find(p => p.id === procedureToAdd);
        const doctorProcInfo = selectedDoctor?.procedimentos.find(p => p.procedimentoId === procedureToAdd);

        if (procedureInfo && doctorProcInfo) {
            const newProcedure: SelectedProcedureState = {
                procedimentoId: procedureInfo.id,
                name: procedureInfo.name,
                orcar: doctorProcInfo.orcar,
                valorFixo: doctorProcInfo.valor,
                valorFinal: doctorProcInfo.orcar ? 0 : (doctorProcInfo.valor || 0),
            };
            setSelectedProcedures(prev => [...prev, newProcedure]);
            setProcedureToAdd('');
        }
    };

    const handleRemoveProcedure = (procedimentoId: string) => {
        setSelectedProcedures(prev => prev.filter(p => p.procedimentoId !== procedimentoId));
    };

    const handleProcedureValueChange = (procedimentoId: string, newValue: string) => {
        const value = parseFloat(newValue);
        setSelectedProcedures(prev => prev.map(p => 
            p.procedimentoId === procedimentoId ? { ...p, valorFinal: isNaN(value) ? 0 : value } : p
        ));
    };

    const handleAddNewPatient = (data: { name: string; phone: string; cpf?: string; address?: string; }) => {
        if (!selectedClinicaId) {
             alert("Nenhuma clínica está selecionada. Não é possível criar um novo paciente.");
             return;
        }
        const newPatient: Paciente = {
            id: `temp-pat-${Date.now()}`,
            name: data.name,
            phone: data.phone,
            cpf: data.cpf,
            address: data.address,
            lastVisit: new Date().toLocaleDateString('pt-BR'),
            clinicaId: selectedClinicaId,
        };
        // NOTE: We don't call the webhook here as PatientModal handles it.
        // This just updates the UI state for this flow.
        setPacientes(prev => [newPatient, ...prev]);
        setPatientId(newPatient.id); // auto-select the new patient
        setPatientSearch(newPatient.name); // also update the search input
        setIsPatientModalOpen(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!patientId || !doctorId || !date || !time) {
            setError('Por favor, selecione um paciente da lista ou cadastre um novo.');
            return;
        }
        if (selectedProcedures.length === 0) {
            setError('Adicione pelo menos um procedimento ao atendimento.');
            return;
        }
        if (selectedProcedures.some(p => isNaN(p.valorFinal) || p.valorFinal < 0)) {
            setError('Todos os procedimentos devem ter um valor final válido e positivo.');
            return;
        }

        // Correctly create Date object from local date and time inputs
        const startTime = new Date(`${date}T${time}:00`);
        if (isNaN(startTime.getTime())) {
            setError('A data ou hora fornecida é inválida.');
            return;
        }
        const endTime = new Date(startTime.getTime() + 30 * 60000); // Default 30 min duration

        onSubmit({
            id: atendimentoToEdit?.id,
            patientId,
            doctorId,
            procedures: selectedProcedures.map(({ procedimentoId, valorFinal }) => ({ procedimentoId, valorFinal })),
            startTime,
            endTime,
            status,
        });
    };

    const inputClasses = "block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-dark-text-primary";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-dark-text-secondary";

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 md:p-8 w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h2 className="text-xl font-bold text-brand-secondary dark:text-dark-text-primary">{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                        <div>
                            <label htmlFor="patientSearch" className={labelClasses}>Paciente</label>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="relative flex-grow">
                                     <input
                                        type="text"
                                        id="patientSearch"
                                        className={inputClasses}
                                        value={patientSearch}
                                        onChange={e => {
                                            setPatientSearch(e.target.value);
                                            setPatientId(''); // Clear selection if user types again
                                            setIsPatientDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsPatientDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsPatientDropdownOpen(false), 200)} // delay to allow click on dropdown
                                        placeholder="Digite para buscar..."
                                        autoComplete="off"
                                        required
                                    />
                                    {isPatientDropdownOpen && filteredPacientes.length > 0 && (
                                        <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-dark-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                            {filteredPacientes.map(p => (
                                                <li
                                                    key={p.id}
                                                    className="px-4 py-2 cursor-pointer hover:bg-brand-light dark:hover:bg-gray-700"
                                                    onMouseDown={() => { // use onMouseDown to fire before onBlur
                                                        setPatientId(p.id);
                                                        setPatientSearch(p.name);
                                                        setIsPatientDropdownOpen(false);
                                                    }}
                                                >
                                                    {p.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button type="button" onClick={() => setIsPatientModalOpen(true)} className="p-2 text-brand-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Adicionar novo paciente">
                                    <PlusCircleIcon className="w-6 h-6"/>
                                </button>
                             </div>
                        </div>
                        <div>
                            <label htmlFor="doctor" className={labelClasses}>Doutor(a)</label>
                            <select id="doctor" value={doctorId} onChange={e => setDoctorId(e.target.value)} className={`mt-1 ${inputClasses}`} required>
                                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name} - {doc.especialidade.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className={labelClasses}>Data</label>
                                <div className="relative mt-1">
                                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={`${inputClasses} pr-10`} required />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <CalendarDaysIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="time" className={labelClasses}>Horário</label>
                                <div className="relative mt-1">
                                    <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className={`${inputClasses} pr-10`} required />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <ClockIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Procedimentos Section */}
                        <div className="border-t dark:border-dark-border pt-4">
                            <label className={labelClasses}>Procedimentos</label>
                            <div className="flex items-center gap-2 mt-1">
                                <select value={procedureToAdd} onChange={e => setProcedureToAdd(e.target.value)} className={`flex-grow ${inputClasses}`} disabled={!doctorId}>
                                    <option value="" disabled>Selecione um procedimento...</option>
                                    {availableProceduresForDoctor.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button type="button" onClick={handleAddProcedure} disabled={!procedureToAdd} className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-md hover:bg-brand-dark disabled:bg-gray-400 dark:disabled:bg-gray-600">Adicionar</button>
                            </div>
                            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                                {selectedProcedures.map(p => (
                                    <div key={p.procedimentoId} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                        <div className="col-span-6 text-sm font-medium text-gray-800 dark:text-dark-text-primary">{p.name}</div>
                                        <div className="col-span-5 relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 dark:text-dark-text-secondary">R$</span>
                                            <input 
                                                type="number" 
                                                value={p.valorFinal}
                                                onChange={(e) => handleProcedureValueChange(p.procedimentoId, e.target.value)}
                                                min="0"
                                                step="0.01"
                                                disabled={!p.orcar}
                                                className="w-full block pl-9 pr-2 py-1 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-gray-700 dark:text-dark-text-primary disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button type="button" onClick={() => handleRemoveProcedure(p.procedimentoId)} className="text-red-500 hover:text-red-700">&times;</button>
                                        </div>
                                    </div>
                                ))}
                                {selectedProcedures.length === 0 && <p className="text-sm text-gray-500 dark:text-dark-text-secondary text-center py-4">Nenhum procedimento adicionado.</p>}
                            </div>
                            <div className="text-right font-bold text-lg mt-2 text-brand-dark dark:text-dark-text-primary">
                                Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValorFinal)}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="status" className={labelClasses}>Status</label>
                            <select id="status" value={status} onChange={e => setStatus(e.target.value as AtendimentoStatus)} className={`mt-1 ${inputClasses}`} required>
                                {Object.entries(statusConfig).map(([key, value]) => <option key={key} value={key}>{value.title}</option>)}
                            </select>
                        </div>
                    </form>
                    <div className="flex-shrink-0 pt-6 border-t dark:border-dark-border mt-4">
                        {error && <p className="text-sm text-status-danger text-center mb-4">{error}</p>}
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                            <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-blue-600">{isEditing ? 'Atualizar Atendimento' : 'Salvar Agendamento'}</button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Patient creation modal, rendered on top of the appointment modal */}
            <PatientModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                onSubmit={handleAddNewPatient}
                pacienteToEdit={null}
                initialName={patientId ? '' : patientSearch}
            />
        </>
    );
};

export default AppointmentModal;