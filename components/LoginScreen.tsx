import React, { useState } from 'react';
import { ToothIcon } from './IconComponents';
import { User, UserRole } from '../types';
import { hashStringSHA256 } from '../utils/crypto';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const N8N_AUTH_WEBHOOK_URL = process.env.N8N_AUTH_WEBHOOK_URL;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // States for both forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [releaseCode, setReleaseCode] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetFormStates = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setReleaseCode('');
    setRole('user');
    setError('');
    setSuccessMessage('');
  };

  const handleSwitchView = (newView: 'login' | 'register') => {
    resetFormStates();
    setView(newView);
  }

  const handleLoginAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
        if (!N8N_AUTH_WEBHOOK_URL) {
            throw new Error("A URL de autenticação do n8n (N8N_AUTH_WEBHOOK_URL) não está configurada no ambiente.");
        }

        const hashedPassword = await hashStringSHA256(password);
        
        const response = await fetch(N8N_AUTH_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag: 'solicitando_acesso',
                email,
                password_hash: hashedPassword,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro na rede ou no servidor: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status === 'user_accept' && result.role) {
            onLogin({ email, role: result.role as UserRole });
        } else {
            throw new Error(result.message || 'Credenciais inválidas ou resposta inesperada do webhook.');
        }

    } catch (err) {
        console.error('Falha no login:', err);
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegisterAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
        setError("A senha deve ter no mínimo 8 caracteres.");
        return;
    }
    if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
        if (!N8N_AUTH_WEBHOOK_URL) {
            throw new Error("A URL de autenticação do n8n (N8N_AUTH_WEBHOOK_URL) não está configurada no ambiente.");
        }

        const hashedPassword = await hashStringSHA256(password);
        
        const response = await fetch(N8N_AUTH_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag: 'solicitando_cadastro',
                nome_completo: fullName,
                email,
                password_hash: hashedPassword,
                codigo_liberacao: releaseCode,
                role: role,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro na rede ou no servidor: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'user_created') {
            setSuccessMessage('Usuário criado com sucesso! Você já pode fazer o login.');
            handleSwitchView('login');
        } else {
            throw new Error(result.message || 'Não foi possível criar o usuário. Verifique o código de liberação.');
        }

    } catch (err) {
        console.error('Falha no cadastro:', err);
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-primary to-blue-600">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-dark-surface rounded-2xl shadow-2xl transform transition-all hover:scale-105">
        <div className="text-center">
            <div className="flex justify-center mb-4">
                <ToothIcon className="w-16 h-16 text-brand-primary" />
            </div>
          <h2 className="text-3xl font-extrabold text-brand-dark dark:text-dark-text-primary">
            {view === 'login' ? 'Painel de Gestão Odonto' : 'Criar Nova Conta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
            {view === 'login' ? 'Acesse para gerenciar sua clínica' : 'Preencha os dados para se cadastrar'}
          </p>
        </div>
        
        {/* LOGIN FORM */}
        {view === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleLoginAttempt}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-t-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-b-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            {error && <p className="text-sm text-status-danger text-center">{error}</p>}
            {successMessage && <p className="text-sm text-status-success text-center">{successMessage}</p>}
            <div>
              <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                Não tem uma conta?{' '}
                <button type="button" onClick={() => handleSwitchView('register')} className="font-medium text-brand-primary hover:text-blue-700">
                    Cadastre-se
                </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {view === 'register' && (
          <form className="mt-8 space-y-4" onSubmit={handleRegisterAttempt}>
            <div className="rounded-md shadow-sm space-y-3">
               <input name="fullName" type="text" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Nome Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
               <input name="email" type="email" autoComplete="email" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
               <input name="password" type="password" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Senha (mín. 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
               <input name="confirmPassword" type="password" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Repetir Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
               <input name="releaseCode" type="text" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Código de Liberação" value={releaseCode} onChange={(e) => setReleaseCode(e.target.value)} disabled={isLoading} />
               <select
                 name="role"
                 required
                 className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-secondary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                 value={role}
                 onChange={(e) => setRole(e.target.value as UserRole)}
                 disabled={isLoading}
               >
                 <option value="user">Nível: Usuário (Agendamentos)</option>
                 <option value="admin">Nível: Administrador (Gestão)</option>
                 <option value="superadmin">Nível: Super Administrador (Total)</option>
               </select>
            </div>
             {error && <p className="text-sm text-status-danger text-center">{error}</p>}
            <div>
              <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
             <p className="text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                Já tem uma conta?{' '}
                <button type="button" onClick={() => handleSwitchView('login')} className="font-medium text-brand-primary hover:text-blue-700">
                    Entrar
                </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
