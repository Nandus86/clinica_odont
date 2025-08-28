// types.ts

export interface Clinica {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
}

export interface Procedimento {
  id: string;
  name: string;
  description: string;
  especialidadeId: string;
  clinicaId: string;
}

export interface Especialidade {
  id: string;
  name: string;
  description: string;
  clinicaId: string;
}

export interface DoutorProcedimento {
  procedimentoId: string;
  valor?: number; // Optional, used if orcar is false
  orcar: boolean;  // If true, value is set on appointment
}

export interface Doutor {
  id: string;
  name: string;
  especialidade: Especialidade;
  procedimentos: DoutorProcedimento[];
  avatarUrl: string;
  clinicaId: string;
}

export interface Paciente {
  id: string;
  name: string; // required
  phone: string; // required
  cpf?: string; // optional
  address?: string; // optional
  lastVisit: string;
  clinicaId: string;
}

export type AtendimentoStatus = 'agendado' | 'confirmado' | 'compareceu' | 'atendido' | 'faltou' | 'não atendido' | 'falta justificada';

export interface ProcedimentoAtendimento {
  procedimentoId: string;
  valorFinal: number;
}

export interface Atendimento {
  id: string;
  patient: Paciente;
  doctor: Doutor;
  procedures: ProcedimentoAtendimento[];
  startTime: Date;
  endTime: Date;
  status: AtendimentoStatus;
  valorFinal: number; // Final TOTAL value for the appointment
  clinicaId: string;
}

export type UserRole = 'superadmin' | 'admin' | 'user';

// Representa um usuário do sistema (agente)
export interface Agente {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  clinicaId: string;
}

// Representa o usuário logado
export interface User {
  email: string;
  role: UserRole;
}

export type TipoTransacao = 'receita' | 'despesa';

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  data: Date;
  categoria: string;
  atendimentoId?: string; // Link to appointment if it's revenue
  clinicaId: string;
}


export enum View {
  Dashboard = 'DASHBOARD',
  Atendimentos = 'ATENDIMENTOS',
  Pacientes = 'PACIENTES',
  Doutores = 'DOUTORES',
  Procedimentos = 'PROCEDIMENTOS',
  Especialidades = 'ESPECIALIDADES',
  Financeiro = 'FINANCEIRO',
  Agentes = 'AGENTES',
  Clinica = 'CLINICA',
  Settings = 'SETTINGS',
  AIIAChat = 'AIIA_CHAT',
  AIIAIA = 'AIIA_IA',
}