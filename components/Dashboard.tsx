import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
// FIX: Import UserRole to be used in NavItem type definition.
import { View, Paciente, Doutor, Procedimento, User, Atendimento, Clinica, Especialidade, Agente, UserRole, Transacao } from '../types';
import DashboardOverview from './views/DashboardOverview';
import AtendimentosView from './views/AppointmentsView';
import PacientesView from './views/PatientsView';
import SettingsView from './views/SettingsView';
import DoutoresView from './views/DoctorsView';
import ProcedimentosView from './views/ProceduresView';
import EspecialidadesView from './views/EspecialidadesView';
import AgentesView from './views/AgentesView';
import ClinicasView from './views/ClinicasView';
import Header from './Header';
import AIIAChatView from './views/AIIAChatView';
import AIIAIAView from './views/AIIAIAView';
import FinanceiroView from './views/FinanceiroView';
import { 
    DashboardIcon, 
    CalendarIcon, 
    UsersIcon, 
    SettingsIcon, 
    StethoscopeIcon, 
    ClipboardListIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    ShieldCheckIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    SparklesIcon,
    BanknotesIcon
} from './IconComponents';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export interface Service {
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  webhookUrl?: string;
}

// --- MOCK DATA ---
const initialClinicas: Clinica[] = [
    { id: 'cli1', name: 'Odonto+ Matriz', cnpj: '12.345.678/0001-99', address: 'Av. Principal, 500, Centro', phone: '(11) 5555-1234' },
    { id: 'cli2', name: 'Odonto+ Filial Sul', cnpj: '12.345.678/0002-80', address: 'Rua das Palmeiras, 10, Bairro Sul', phone: '(11) 5555-5678' }
];

const initialEspecialidades: Especialidade[] = [
    { id: 'esp1', name: 'Ortodontia', description: 'Correção da posição dos dentes e dos ossos maxilares.', clinicaId: 'cli1' },
    { id: 'esp2', name: 'Clínica Geral', description: 'Tratamentos de rotina, limpezas e pequenas restaurações.', clinicaId: 'cli1' },
    { id: 'esp3', name: 'Clínica Geral', description: 'Tratamentos de rotina, limpezas e pequenas restaurações.', clinicaId: 'cli2' },
];

const initialProcedimentos: Procedimento[] = [
    { id: 'proc1', name: 'Limpeza e Profilaxia', description: 'Remoção de tártaro e placa bacteriana.', especialidadeId: 'esp2', clinicaId: 'cli1'},
    { id: 'proc2', name: 'Clareamento Dental', description: 'Procedimento estético para clarear os dentes.', especialidadeId: 'esp2', clinicaId: 'cli1'},
    { id: 'proc3', name: 'Manutenção de Aparelho', description: 'Ajuste e manutenção de aparelho ortodôntico.', especialidadeId: 'esp1', clinicaId: 'cli1'},
    { id: 'proc4', name: 'Avaliação Ortodôntica', description: 'Avaliação para uso de aparelho.', especialidadeId: 'esp1', clinicaId: 'cli1'},
    { id: 'proc5', name: 'Limpeza e Profilaxia', description: 'Remoção de tártaro e placa bacteriana.', especialidadeId: 'esp3', clinicaId: 'cli2' },
];

const initialDoutores: Doutor[] = [
    { id: 'doc1', name: 'Dr. Ana Silva', especialidade: initialEspecialidades[0], procedimentos: [{procedimentoId: 'proc3', valor: 150.00, orcar: false}, {procedimentoId: 'proc4', orcar: true}], avatarUrl: 'https://i.pravatar.cc/100?u=ana', clinicaId: 'cli1' },
    { id: 'doc2', name: 'Dr. Carlos Souza', especialidade: initialEspecialidades[1], procedimentos: [{procedimentoId: 'proc1', valor: 200.00, orcar: false}, {procedimentoId: 'proc2', valor: 500.00, orcar: false}], avatarUrl: 'https://i.pravatar.cc/100?u=carlos', clinicaId: 'cli1' },
    { id: 'doc3', name: 'Dr. Joana Lima', especialidade: initialEspecialidades[2], procedimentos: [{procedimentoId: 'proc5', valor: 220.00, orcar: false}], avatarUrl: 'https://i.pravatar.cc/100?u=joana', clinicaId: 'cli2' },
];

const initialPacientes: Paciente[] = [
    { id: 'pat1', name: 'João Pereira', phone: '(11) 98765-4321', lastVisit: '20/06/2024', cpf: '123.456.789-00', address: 'Rua das Flores, 123, São Paulo, SP', clinicaId: 'cli1' },
    { id: 'pat2', name: 'Maria Oliveira', phone: '(21) 91234-5678', lastVisit: '15/06/2024', clinicaId: 'cli1' },
    { id: 'pat3', name: 'Pedro Costa', phone: '(31) 99999-8888', lastVisit: '01/06/2024', clinicaId: 'cli2' },
];

const today = new Date();
const initialAtendimentos: Atendimento[] = [
    { id: 'at1', patient: initialPacientes[0], doctor: initialDoutores[0], procedures: [{ procedimentoId: 'proc3', valorFinal: 150.00 }], startTime: new Date(new Date().setHours(9, 0, 0, 0)), endTime: new Date(new Date().setHours(10, 0, 0, 0)), status: 'confirmado', valorFinal: 150.00, clinicaId: 'cli1' },
    { id: 'at2', patient: initialPacientes[1], doctor: initialDoutores[1], procedures: [{ procedimentoId: 'proc1', valorFinal: 200.00 }], startTime: new Date(new Date().setHours(10, 30, 0, 0)), endTime: new Date(new Date().setHours(11, 0, 0, 0)), status: 'agendado', valorFinal: 200.00, clinicaId: 'cli1' },
    { id: 'at3', patient: initialPacientes[2], doctor: initialDoutores[2], procedures: [{ procedimentoId: 'proc5', valorFinal: 220.00 }], startTime: new Date(new Date(today.setDate(today.getDate() - 1)).setHours(14, 0, 0, 0)), endTime: new Date(new Date(today.setDate(today.getDate() - 1)).setHours(15, 0, 0, 0)), status: 'atendido', valorFinal: 220.00, clinicaId: 'cli2' },
    { id: 'at4', patient: initialPacientes[1], doctor: initialDoutores[0], procedures: [{ procedimentoId: 'proc3', valorFinal: 150.00 }], startTime: new Date(new Date(today.setDate(today.getDate() - 2)).setHours(11, 0, 0, 0)), endTime: new Date(new Date(today.setDate(today.getDate() - 2)).setHours(12, 0, 0, 0)), status: 'faltou', valorFinal: 150.00, clinicaId: 'cli1' },
    { id: 'at5', patient: initialPacientes[0], doctor: initialDoutores[1], procedures: [{ procedimentoId: 'proc1', valorFinal: 200.00 }, { procedimentoId: 'proc2', valorFinal: 500.00 }], startTime: new Date(new Date().setHours(14, 0, 0, 0)), endTime: new Date(new Date().setHours(14, 30, 0, 0)), status: 'atendido', valorFinal: 700.00, clinicaId: 'cli1' },
];


const initialAgentes: Agente[] = [
    { id: 'age1', fullName: 'Admin Matriz', email: 'admin@odonto.com', role: 'admin', status: 'active', clinicaId: 'cli1' },
    { id: 'age2', fullName: 'Secretária Matriz', email: 'user@odonto.com', role: 'user', status: 'active', clinicaId: 'cli1' },
    { id: 'age3', fullName: 'Admin Filial Sul', email: 'admin.sul@odonto.com', role: 'admin', status: 'active', clinicaId: 'cli2' },
];

const initialTransacoesManuais: Transacao[] = [
    { id: 't1', descricao: 'Aluguel do Consultório', valor: 2500, tipo: 'despesa', data: new Date(new Date().setDate(1)), categoria: 'Custos Fixos', clinicaId: 'cli1' },
    { id: 't2', descricao: 'Compra de Material', valor: 850, tipo: 'despesa', data: new Date(new Date().setDate(5)), categoria: 'Material de Consumo', clinicaId: 'cli1' },
    { id: 't3', descricao: 'Salários', valor: 8000, tipo: 'despesa', data: new Date(new Date().setDate(5)), categoria: 'Recursos Humanos', clinicaId: 'cli1' },
];


// --- DATA PARSING & LINKING UTILS ---

const unknownEspecialidade: Especialidade = { id: 'unknown-esp', name: 'Especialidade desconhecida', description: '', clinicaId: '' };
const unknownPaciente: Paciente = { id: 'unknown-pat', name: 'Paciente desconhecido', phone: '-', lastVisit: '-', clinicaId: '' };
const unknownDoutor: Doutor = {
    id: 'unknown-doc',
    name: 'Doutor desconhecido',
    especialidade: unknownEspecialidade,
    procedimentos: [],
    avatarUrl: '',
    clinicaId: '',
};

const parseAtendimentos = (atendimentos: Atendimento[], pacientes: Paciente[], doutores: Doutor[]): Atendimento[] => {
    return atendimentos.map(at => ({
        ...at,
        patient: pacientes.find(p => p.id === at.patient.id) || { ...unknownPaciente, id: at.patient.id, name: at.patient.name },
        doctor: doutores.find(d => d.id === at.doctor.id) || { ...unknownDoutor, id: at.doctor.id, name: at.doctor.name },
    }));
};

// --- COMPONENT ---

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<View>(View.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [clinicas, setClinicas] = useState<Clinica[]>(initialClinicas);
  const [selectedClinicaId, setSelectedClinicaId] = useState<string | null>(clinicas.length > 0 ? clinicas[0].id : null);
  
  const [pacientes, setPacientes] = useState<Paciente[]>(initialPacientes);
  const [doutores, setDoutores] = useState<Doutor[]>(initialDoutores);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>(initialProcedimentos);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>(initialEspecialidades);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(() => parseAtendimentos(initialAtendimentos, pacientes, doutores));
  const [agentes, setAgentes] = useState<Agente[]>(initialAgentes);
  const [transacoesManuais, setTransacoesManuais] = useState<Transacao[]>(initialTransacoesManuais);
  
  const [services, setServices] = useState<Service[]>([
      { name: 'n8n', description: 'Automatize fluxos com n8n.', status: 'disconnected', webhookUrl: 'https://brain.nandus.com.br/webhook/clinica-odonto' }
  ]);
  const n8nService = services.find(s => s.name === 'n8n' && s.status === 'connected');

  const handleSelectClinica = (id: string) => {
    setSelectedClinicaId(id);
    setActiveView(View.Dashboard); // Reset view to dashboard on clinica change for simplicity
  };
  
  // Filtered data based on selected clinica
  const { 
    filteredPacientes, 
    filteredDoutores, 
    filteredProcedimentos, 
    filteredEspecialidades,
    filteredAtendimentos,
    filteredAgentes,
    filteredTransacoesManuais,
  } = useMemo(() => {
    if (!selectedClinicaId) {
      return { 
        filteredPacientes: [], 
        filteredDoutores: [], 
        filteredProcedimentos: [], 
        filteredEspecialidades: [],
        filteredAtendimentos: [],
        filteredAgentes: [],
        filteredTransacoesManuais: [],
      };
    }
    const filteredEspecialidades = especialidades.filter(e => e.clinicaId === selectedClinicaId);
    const filteredProcedimentos = procedimentos.filter(p => p.clinicaId === selectedClinicaId);
    const filteredDoutores = doutores.filter(d => d.clinicaId === selectedClinicaId);
    const filteredPacientes = pacientes.filter(p => p.clinicaId === selectedClinicaId);
    const filteredAtendimentos = atendimentos.filter(a => a.clinicaId === selectedClinicaId);
    const filteredAgentes = agentes.filter(a => a.clinicaId === selectedClinicaId);
    const filteredTransacoesManuais = transacoesManuais.filter(t => t.clinicaId === selectedClinicaId);

    return { 
      filteredPacientes, 
      filteredDoutores, 
      filteredProcedimentos, 
      filteredEspecialidades, 
      filteredAtendimentos,
      filteredAgentes,
      filteredTransacoesManuais,
    };
  }, [selectedClinicaId, pacientes, doutores, procedimentos, especialidades, atendimentos, agentes, transacoesManuais]);

  type NavItem = {
      view: View;
      label: string;
      icon: React.ElementType;
      roles: UserRole[];
  };

// FIX: Extracted the navigation items to a strongly-typed constant `allNavItems`
// to ensure TypeScript correctly infers the `roles` property as `UserRole[]` instead of `string[]`, resolving the type error.
  const allNavItems: NavItem[] = [
      { view: View.Dashboard, label: 'Início', icon: DashboardIcon, roles: ['user', 'admin', 'superadmin'] },
      { view: View.Atendimentos, label: 'Atendimentos', icon: CalendarIcon, roles: ['user', 'admin', 'superadmin'] },
      { view: View.Pacientes, label: 'Pacientes', icon: UsersIcon, roles: ['user', 'admin', 'superadmin'] },
      { view: View.AIIAChat, label: 'AIIA Chat', icon: ChatBubbleOvalLeftEllipsisIcon, roles: ['user', 'admin', 'superadmin']},
      { view: View.AIIAIA, label: 'AIIA IA', icon: SparklesIcon, roles: ['user', 'admin', 'superadmin']},
      { view: View.Financeiro, label: 'Financeiro', icon: BanknotesIcon, roles: ['admin', 'superadmin']},
      { view: View.Doutores, label: 'Doutores', icon: StethoscopeIcon, roles: ['admin', 'superadmin'] },
      { view: View.Procedimentos, label: 'Procedimentos', icon: ClipboardListIcon, roles: ['admin', 'superadmin'] },
      { view: View.Especialidades, label: 'Especialidades', icon: AcademicCapIcon, roles: ['admin', 'superadmin'] },
      { view: View.Agentes, label: 'Agentes', icon: ShieldCheckIcon, roles: ['admin', 'superadmin'] },
      { view: View.Clinica, label: 'Clínicas', icon: BuildingOfficeIcon, roles: ['superadmin'] },
      { view: View.Settings, label: 'Configurações', icon: SettingsIcon, roles: ['superadmin'] },
  ];

  const navItems: NavItem[] = useMemo(() => 
    allNavItems.filter(item => item.roles.includes(user.role)), 
    [user.role]
  );

  const renderView = () => {
    if (!selectedClinicaId && user.role !== 'superadmin') {
      return <div className="text-center p-8">Por favor, selecione uma clínica para começar.</div>;
    }

    switch (activeView) {
      case View.Dashboard:
        return <DashboardOverview atendimentos={filteredAtendimentos} pacientes={filteredPacientes} doutores={filteredDoutores} navItems={navItems} onNavigate={setActiveView} />;
      case View.Atendimentos:
        return <AtendimentosView 
          atendimentos={filteredAtendimentos} 
          setAtendimentos={setAtendimentos}
          doutores={filteredDoutores}
          procedimentos={filteredProcedimentos}
          pacientes={filteredPacientes}
          setPacientes={setPacientes}
          n8nWebhookUrl={n8nService?.webhookUrl}
          onSync={() => alert('Sincronização iniciada...')}
          selectedClinicaId={selectedClinicaId}
        />;
      case View.Pacientes:
        return <PacientesView pacientes={filteredPacientes} setPacientes={setPacientes} n8nWebhookUrl={n8nService?.webhookUrl} onSync={() => alert('Sincronização iniciada...')} selectedClinicaId={selectedClinicaId} />;
      case View.Doutores:
        return <DoutoresView doutores={filteredDoutores} setDoutores={setDoutores} n8nWebhookUrl={n8nService?.webhookUrl} onSync={() => alert('Sincronização iniciada...')} especialidades={filteredEspecialidades} procedimentos={filteredProcedimentos} selectedClinicaId={selectedClinicaId}/>;
      case View.Procedimentos:
        return <ProcedimentosView procedimentos={filteredProcedimentos} setProcedimentos={setProcedimentos} n8nWebhookUrl={n8nService?.webhookUrl} onSync={() => alert('Sincronização iniciada...')} especialidades={filteredEspecialidades} selectedClinicaId={selectedClinicaId}/>;
      case View.Especialidades:
        return <EspecialidadesView especialidades={filteredEspecialidades} setEspecialidades={setEspecialidades} n8nWebhookUrl={n8nService?.webhookUrl} onSync={() => alert('Sincronização iniciada...')} selectedClinicaId={selectedClinicaId}/>;
      case View.Agentes:
        return <AgentesView agentes={filteredAgentes} setAgentes={setAgentes} onSync={() => alert('Sincronização iniciada...')} n8nWebhookUrl={n8nService?.webhookUrl} selectedClinicaId={selectedClinicaId}/>;
      case View.Clinica:
        return <ClinicasView clinicas={clinicas} setClinicas={setClinicas} onSync={() => alert('Sincronização iniciada...')} n8nWebhookUrl={n8nService?.webhookUrl} />;
      case View.Financeiro:
        return <FinanceiroView atendimentos={filteredAtendimentos} transacoesManuais={filteredTransacoesManuais} setTransacoesManuais={setTransacoesManuais} selectedClinicaId={selectedClinicaId} procedimentos={filteredProcedimentos} />;
      case View.Settings:
        return <SettingsView services={services} setServices={setServices} />;
      case View.AIIAChat:
        return <AIIAChatView />;
      case View.AIIAIA:
        return <AIIAIAView n8nWebhookUrl={n8nService?.webhookUrl} />;
      default:
        return <DashboardOverview atendimentos={filteredAtendimentos} pacientes={filteredPacientes} doutores={filteredDoutores} navItems={navItems} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-bg font-sans transition-colors duration-300">
      <Sidebar activeView={activeView} setActiveView={setActiveView} navItems={navItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeView={activeView}
          onLogout={onLogout}
          user={user}
          clinicas={clinicas}
          selectedClinicaId={selectedClinicaId}
          onSelectClinica={handleSelectClinica}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-dark-bg p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;