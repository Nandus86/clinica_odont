import React from 'react';
import { View, User, Clinica } from '../types';
import { LogoutIcon, UserCircleIcon, BuildingOfficeIcon, SunIcon, MoonIcon, MenuIcon } from './IconComponents';
import { useTheme } from '../App';

interface HeaderProps {
  activeView: View;
  onLogout: () => void;
  user: User;
  clinicas: Clinica[];
  selectedClinicaId: string | null;
  onSelectClinica: (id: string) => void;
  onMenuClick: () => void;
}

const viewTitles: { [key in View]: string } = {
  [View.Dashboard]: 'Início',
  [View.Atendimentos]: 'Kanban de Atendimentos',
  [View.Pacientes]: 'Lista de Pacientes',
  [View.AIIAChat]: 'AIIA - Central de Atendimento',
  [View.AIIAIA]: 'AIIA - Inteligência Artificial',
  [View.Doutores]: 'Gestão de Doutores',
  [View.Procedimentos]: 'Gestão de Procedimentos',
  [View.Especialidades]: 'Gestão de Especialidades',
  [View.Financeiro]: 'Gestão Financeira',
  [View.Agentes]: 'Gestão de Agentes',
  [View.Clinica]: 'Gestão de Clínicas',
  [View.Settings]: 'Configurações e Integrações',
};

const Header: React.FC<HeaderProps> = ({ activeView, onLogout, user, clinicas, selectedClinicaId, onSelectClinica, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border transition-colors duration-300 flex-shrink-0">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="md:hidden mr-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Abrir menu">
            <MenuIcon className="w-6 h-6 text-gray-600 dark:text-dark-text-secondary" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-brand-secondary dark:text-dark-text-primary">{viewTitles[activeView]}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        
        {user.role !== 'user' && clinicas.length > 1 && (
            <div className="hidden sm:flex items-center space-x-2">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary" />
                <select
                    value={selectedClinicaId || ''}
                    onChange={(e) => onSelectClinica(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                    {clinicas.map(clinica => (
                        <option key={clinica.id} value={clinica.id}>{clinica.name}</option>
                    ))}
                </select>
            </div>
        )}

        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Alternar tema">
          {theme === 'light' ? (
              <MoonIcon className="w-6 h-6 text-gray-600" />
          ) : (
              <SunIcon className="w-6 h-6 text-yellow-400" />
          )}
        </button>

        <div className="hidden sm:flex items-center text-right">
            <div className='mr-3'>
                <p className="text-sm font-medium text-gray-800 dark:text-dark-text-primary capitalize">{user.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary capitalize">{user.role}</p>
            </div>
            <UserCircleIcon className="w-10 h-10 text-gray-500 dark:text-dark-text-secondary"/>
        </div>
        <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Sair">
          <LogoutIcon className="w-6 h-6 text-gray-600 dark:text-dark-text-secondary" />
        </button>
      </div>
    </header>
  );
};

export default Header;