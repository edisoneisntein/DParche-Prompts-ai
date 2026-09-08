import React from 'react';
import { Spinner } from './Spinner';

interface PromptInputProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, onSubmit, isLoading }) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            onSubmit();
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <label htmlFor="idea-input" className="text-lg font-semibold text-aura-text">
                1. Ingresa tu idea en lenguaje natural
            </label>
            <div className="relative">
                <textarea
                    id="idea-input"
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: Explica cómo funciona la fotosíntesis..."
                    rows={4}
                    className="w-full bg-black/20 backdrop-blur-sm rounded-lg p-4 text-aura-text border border-white/20 focus:outline-none focus:border-aura-glow focus:ring-2 focus:ring-aura-glow/50 transition-all duration-300 resize-none placeholder-aura-subtext"
                    disabled={isLoading}
                />
            </div>
            <button
                onClick={onSubmit}
                disabled={isLoading || !value.trim()}
                className={`w-full flex items-center justify-center bg-gradient-to-r from-indigo-600/80 to-fuchsia-600/80 backdrop-blur-sm border border-white/20 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 active:scale-95 disabled:text-aura-subtext disabled:cursor-not-allowed ${
                    isLoading 
                    ? 'animate-pulse shadow-glow-lg' 
                    : 'shadow-glow-md hover:shadow-glow-lg hover:border-white/30 disabled:bg-aura-light/50 disabled:from-aura-light/50 disabled:to-aura-mid/50 disabled:border-transparent disabled:shadow-none'
                }`}
            >
                {isLoading ? (
                    <>
                        <Spinner className="w-5 h-5 mr-2" />
                        Generando...
                    </>
                ) : (
                    'Generar Prompt Experto (Ctrl+Enter)'
                )}
            </button>
        </div>
    );
};