import React from 'react';
import { CheckCircleIcon, XCircleIcon, LinkIcon } from '../IconComponents';
import { Service } from '../Dashboard';

interface SettingsViewProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const N8NLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 256 256">
        <path fill="#FF4771" d="M117.333 0H0v117.333h117.333z" />
        <path fill="#1A82E2" d="M256 0h-94.667v117.333H256z" />
        <path fill="#7A56D3" d="M117.333 138.667H0V256h117.333z" />
    </svg>
);


interface ServiceCardProps {
    service: Service;
    onToggle: () => void;
    onWebhookChange: (url: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onToggle, onWebhookChange }) => {
    const isConnected = service.status === 'connected';
    return (
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md flex flex-col items-start transition-all hover:shadow-xl">
            <div className="w-full flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                    {service.name === 'n8n' && <N8NLogo />}
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-brand-secondary dark:text-dark-text-primary">{service.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{service.description}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {isConnected ? (
                        <div className="flex items-center text-status-success">
                            <CheckCircleIcon className="w-5 h-5 mr-1"/>
                            <span className="text-sm font-semibold">Conectado</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-status-danger">
                            <XCircleIcon className="w-5 h-5 mr-1"/>
                            <span className="text-sm font-semibold">Desconectado</span>
                        </div>
                    )}
                    <button 
                        onClick={onToggle}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center transition-colors ${
                            isConnected 
                            ? 'bg-red-100 text-status-danger hover:bg-red-200' 
                            : 'bg-green-100 text-status-success hover:bg-green-200'
                        }`}
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {isConnected ? 'Desconectar' : 'Conectar'}
                    </button>
                </div>
            </div>
            {service.name === 'n8n' && isConnected && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border w-full">
                  <label htmlFor="n8n-webhook" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Webhook URL</label>
                  <input
                    type="text"
                    id="n8n-webhook"
                    value={service.webhookUrl || ''}
                    onChange={(e) => onWebhookChange(e.target.value)}
                    className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-dark-surface dark:text-dark-text-primary"
                    placeholder="Cole a URL do webhook do n8n aqui..."
                    aria-label="URL do Webhook do n8n"
                  />
                </div>
              )}
        </div>
    );
};

const SettingsView: React.FC<SettingsViewProps> = ({ services, setServices }) => {

    const toggleServiceStatus = (serviceName: string) => {
        setServices(services.map(s => 
            s.name === serviceName
                ? { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' }
                : s
        ));
    };

    const handleWebhookChange = (serviceName: string, url: string) => {
        setServices(prevServices => prevServices.map(s =>
            s.name === serviceName ? { ...s, webhookUrl: url } : s
        ));
    };

    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md">
                 <h2 className="text-xl font-semibold text-brand-secondary dark:text-dark-text-primary mb-1">Configuração de Integração</h2>
                 <p className="text-gray-600 dark:text-dark-text-secondary mb-6">Conecte o n8n para automatizar o fluxo de agendamento da sua clínica.</p>
                <div className="space-y-4">
                    {services.map(service => (
                        <ServiceCard 
                            key={service.name} 
                            service={service} 
                            onToggle={() => toggleServiceStatus(service.name)}
                            onWebhookChange={(url) => handleWebhookChange(service.name, url)}
                        />
                    ))}
                </div>
             </div>
        </div>
    );
};

export default SettingsView;