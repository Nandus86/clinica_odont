import React from 'react';
import { View, UserRole } from '../types';
import { 
    ToothIcon, 
} from './IconComponents';

type NavItem = {
    view: View;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
};

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  navItems: NavItem[];
}


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, navItems }) => {

  return (
    <div className="w-64 bg-brand-secondary text-white flex-col hidden md:flex">
      <div className="flex items-center justify-center h-16 border-b border-brand-dark dark:border-gray-700">
        <ToothIcon className="h-8 w-8 mr-2 text-brand-primary" />
        <span className="text-xl font-bold">Clínica Odonto</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
              activeView === item.view
                ? 'bg-brand-primary text-white'
                : 'text-gray-300 hover:bg-brand-dark hover:text-white dark:hover:bg-gray-700'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;