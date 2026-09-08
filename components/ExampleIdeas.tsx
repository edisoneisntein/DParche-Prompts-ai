import React from 'react';
import { ExpertMode } from '../services/geminiService';

const examples: { label: string; prompt: string; mode: ExpertMode }[] = [
    {
        label: 'Plan de marketing',
        prompt: 'Crear un plan de marketing para una nueva cafetería',
        mode: 'general'
    },
    {
        label: 'Explicar tema complejo',
        prompt: 'Explicar la computación cuántica a un niño de 10 años',
        mode: 'general'
    },
    {
        label: 'Componente de login',
        prompt: 'Crear un componente de formulario de login con React, TypeScript y TailwindCSS, incluyendo campos para email y contraseña, y validación básica.',
        mode: 'creator'
    },
    {
        label: 'Auditar inyecciones SQL',
        prompt: 'Auditar una base de código para encontrar vulnerabilidades de inyección SQL y proponer soluciones.',
        mode: 'auditor_elite'
    },
    {
        label: 'Plan de Acción V3 (Enterprise)',
        prompt: 'Remediación técnica de vulnerabilidades críticas, fugas de secretos y condiciones de carrera (race conditions) en una plataforma de trading financiero de alta frecuencia.',
        mode: 'architect_v3'
    },
    {
        label: 'Bucle de Calidad 🔄',
        prompt: 'Diseñar un sistema de recomendación que ejecute bucles iterativos de auto-evaluación, detección de sesgos y refinamiento continuo.',
        mode: 'loop_engineer'
    },
    {
        label: 'Inducción Mantenimiento 🔄',
        prompt: 'Diseñar un protocolo de inducción para mantenimiento de aplicaciones (App Maintenance Onboarding) con checklist de acceso, arquitectura, flujos de despliegue, SLAs y bucle de crítica y refinamiento.',
        mode: 'loop_engineer'
    }
];

interface ExampleIdeasProps {
    onSelect: (idea: string, mode: ExpertMode) => void;
    isLoading: boolean;
}

export const ExampleIdeas: React.FC<ExampleIdeasProps> = ({ onSelect, isLoading }) => {
    return (
        <div className="mt-6">
            <h3 className="text-sm font-semibold text-aura-subtext text-center mb-3">¿No sabes por dónde empezar? Prueba con un ejemplo:</h3>
            <div className="flex flex-wrap justify-center gap-3">
                {examples.map((example, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(example.prompt, example.mode)}
                        disabled={isLoading}
                        className="bg-black/20 backdrop-blur-sm text-aura-text text-sm font-medium py-2 px-4 rounded-full transition-all duration-200 border border-white/20 hover:border-white/30 hover:bg-black/30 hover:text-white hover:shadow-glow-sm active:scale-95 disabled:bg-aura-mid/50 disabled:border-transparent disabled:text-aura-subtext disabled:cursor-not-allowed"
                    >
                        {example.label}
                    </button>
                ))}
            </div>
        </div>
    );
};