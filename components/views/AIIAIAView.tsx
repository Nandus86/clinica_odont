import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, PaperAirplaneIcon, UserCircleIcon } from '../IconComponents';

interface AIIAIAViewProps {
    n8nWebhookUrl?: string;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

const AIIAIAView: React.FC<AIIAIAViewProps> = ({ n8nWebhookUrl }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Olá! Sou a AIIA, sua assistente de inteligência artificial. Como posso ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (!n8nWebhookUrl) {
            const errorMessage: Message = { role: 'ai', content: 'Desculpe, a conexão com a IA não está configurada. Verifique as configurações.' };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tag: 'aiia_ia',
                    prompt: input,
                }),
            });

            if (!response.ok) {
                throw new Error(`O servidor respondeu com o status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.output) {
                const aiMessage: Message = { role: 'ai', content: result.output };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error("A resposta da IA não continha o campo 'output'.");
            }

        } catch (error) {
            console.error('Erro ao comunicar com a AIIA IA:', error);
            const errorMessageContent = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            const errorMessage: Message = { role: 'ai', content: `Desculpe, ocorreu um erro: ${errorMessageContent}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md h-full flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
            <header className="p-4 border-b flex items-center">
                <SparklesIcon className="w-6 h-6 text-brand-primary mr-3"/>
                <h2 className="text-xl font-semibold text-brand-secondary">Converse com a AIIA</h2>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && <div className="w-8 h-8 flex-shrink-0 bg-brand-light rounded-full flex items-center justify-center"><SparklesIcon className="w-5 h-5 text-brand-primary"/></div>}
                        <div className={`max-w-md lg:max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        </div>
                         {msg.role === 'user' && <div className="w-8 h-8 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center"><UserCircleIcon className="w-6 h-6 text-gray-600"/></div>}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 flex-shrink-0 bg-brand-light rounded-full flex items-center justify-center"><SparklesIcon className="w-5 h-5 text-brand-primary"/></div>
                        <div className="max-w-md p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-brand-primary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            
            <footer className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta aqui..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 flex items-center justify-center bg-brand-primary text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Enviar mensagem"
                    >
                        <PaperAirplaneIcon className="w-5 h-5"/>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AIIAIAView;
