import React from 'react';
import { MagicWandIcon } from './MagicWandIcon';
import { Mic, Sparkles } from 'lucide-react';

interface HeaderProps {
    onOpenVoiceChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVoiceChat }) => {
    return (
        <header className="text-center">
            <div className="inline-flex items-center justify-center bg-white/10 text-aura-glow p-3 rounded-full mb-4 border border-white/20 shadow-glow-md">
                <MagicWandIcon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                Constructor de Prompts Expertos
            </h1>
            <p className="mt-4 text-lg text-aura-text max-w-2xl mx-auto">
                Transforma tus ideas simples en prompts de alta calidad para cualquier modelo de IA.
            </p>

            {onOpenVoiceChat && (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={onOpenVoiceChat}
                        className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-all">
                            <Mic className="w-4 h-4 text-white animate-pulse" />
                        </div>
                        <span>Chat de Voz AURA (Memoria Ilimitada)</span>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                    </button>
                </div>
            )}
        </header>
    );
};