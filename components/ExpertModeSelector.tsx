import React from 'react';
import { ExpertMode } from '../services/geminiService';

interface ExpertModeSelectorProps {
    currentMode: ExpertMode;
    onModeChange: (mode: ExpertMode) => void;
    isLoading: boolean;
}

const modes: { id: ExpertMode; label: string; description: string }[] = [
    { id: 'general', label: 'Experto General', description: 'Para cualquier tipo de idea' },
    { id: 'direct_assistant', label: 'Asistente Directo ✨', description: 'Interactúa y responde directamente, sin crear plantillas de prompts' },
    { id: 'adversarial_architect', label: 'Arquitecto Adversarial V3 ⚡', description: 'Auditoría destructiva de prompts y reconstrucción de misión crítica' },
    { id: 'architect_v3', label: 'Arquitecto Industrial V3 🏆', description: 'Prompts ultra-estructurados con reglas empresariales' },
    { id: 'creator', label: 'Creador de Software', description: 'Para generar código desde una idea' },
    { id: 'auditor_elite', label: 'Auditor de Élite', description: 'Para análisis de código y sistemas' },
    { id: 'loop_engineer', label: 'Ingeniero de Loops 🔄', description: 'Prompts con bucles iterativos de auto-evaluación y refinamiento' },
    { id: 'media_analyzer', label: 'Analizador Multimedia 🎥', description: 'Para analizar rigurosamente imágenes, audio y video' }
];

export const ExpertModeSelector: React.FC<ExpertModeSelectorProps> = ({ currentMode, onModeChange, isLoading }) => {
    return (
        <div className="my-6">
            <h2 className="text-lg font-semibold text-aura-text text-center mb-4">
                2. Selecciona un Modo Experto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        disabled={isLoading}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                            currentMode === mode.id
                                ? 'bg-indigo-600/30 border-aura-accent shadow-glow-md'
                                : 'bg-black/20 border-white/20 hover:bg-black/40 hover:border-white/30'
                        }`}
                    >
                        <p className="font-bold text-white">{mode.label}</p>
                        <p className="text-sm text-aura-subtext mt-1">{mode.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};