import React, { useEffect } from 'react';
import { Spinner } from './Spinner';
import { MarkdownVisualizer } from './MarkdownVisualizer';

interface AuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    report: string;
}

const LoadingMessages = [
    "Recopilando código fuente...",
    "Contactando al arquitecto de software IA...",
    "Analizando la arquitectura de la aplicación...",
    "Buscando vulnerabilidades de seguridad...",
    "Evaluando la experiencia de usuario (UX)...",
    "Optimizando el rendimiento...",
    "Generando informe de auditoría...",
    "Pulido final del informe...",
];

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, isLoading, report }) => {
    const [loadingMessage, setLoadingMessage] = React.useState(LoadingMessages[0]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    useEffect(() => {
        // FIX: Corrected the type of 'interval' to be compatible with the return value of `setInterval`.
        // In environments with mixed browser and Node.js types, `setInterval` can return a `Timeout` object
        // instead of a `number`, causing a type error. `ReturnType<typeof setInterval>` dynamically
        // resolves to the correct type.
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isLoading) {
            let i = 0;
            setLoadingMessage(LoadingMessages[0]); // Reset on open
            interval = setInterval(() => {
                i = (i + 1) % LoadingMessages.length;
                setLoadingMessage(LoadingMessages[i]);
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading]);

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fade-in_0.3s_ease-in-out]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
        >
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            <div 
                className="bg-aura-dark border border-aura-accent shadow-glow-xl rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animated-border"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
                    <h2 id="audit-modal-title" className="text-xl font-bold text-aura-glow">Informe de Auditoría de la Aplicación</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-aura-subtext hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto flex-grow">
                    {isLoading && !report ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Spinner className="w-12 h-12 text-aura-accent" />
                            <p className="mt-4 text-lg font-semibold text-aura-text transition-opacity duration-500">{loadingMessage}</p>
                            <p className="mt-2 text-sm text-aura-subtext">Esto puede tardar unos momentos. Por favor, ten paciencia.</p>
                        </div>
                    ) : (
                        <div className="text-aura-text">
                            <MarkdownVisualizer content={report} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};