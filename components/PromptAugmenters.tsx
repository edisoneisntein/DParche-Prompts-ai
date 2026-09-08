import React from 'react';
import { AugmentationType } from '../services/geminiService';
import type { Augmentation } from '../App';
import { CopyIcon } from './CopyIcon';
import { BrainIcon } from './BrainIcon';
import { SparklesIcon } from './SparklesIcon';
import { TheaterIcon } from './TheaterIcon';
import { RotateCw } from 'lucide-react';

interface PromptAugmentersProps {
    basePrompt: string;
    isLoadingBase: boolean;
    augmentations: Record<string, Augmentation>;
    onAugment: (type: AugmentationType) => void;
}

export const augmentationRules: Record<AugmentationType, string> = {
    critical_perspective: 'Añade una sección o instrucción que obligue a la IA a considerar perspectivas opuestas, contraargumentos o posibles debilidades en su propia respuesta.',
    creative_analogy: 'Modifica el prompt para que la IA deba usar una analogía creativa e inesperada para explicar el concepto principal.',
    unexpected_role: 'Cambia el rol asignado a la IA por uno completamente inesperado pero secretamente relevante para la tarea. Por ejemplo, si el tema es astronomía, el rol podría ser "un poeta antiguo".',
    loop_refinement: 'Re-estructura e inyecta una arquitectura de Ingeniería de Loops (Loop Engineering Framework) con bucles de generación inicial, auditoría crítica de brechas, refinamiento recursivo y criterios estrictos de salida.'
};

const AUGMENTERS: {
    type: AugmentationType;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
}[] = [
    {
        type: 'critical_perspective',
        label: 'Perspectiva Crítica',
        description: 'Añade escepticismo y contraargumentos.',
        icon: BrainIcon,
    },
    {
        type: 'creative_analogy',
        label: 'Analogía Creativa',
        description: 'Solicita una explicación memorable y original.',
        icon: SparklesIcon,
    },
    {
        type: 'unexpected_role',
        label: 'Rol Inesperado',
        description: 'Cambia el punto de vista para obtener ideas nuevas.',
        icon: TheaterIcon,
    },
    {
        type: 'loop_refinement',
        label: 'Bucle Iterativo 🔄',
        description: 'Inyecta bucles de auto-evaluación y refinamiento.',
        icon: ({ className }) => <RotateCw className={`w-5 h-5 ${className || ''}`} />,
    }
];

const AugmentationOutput: React.FC<{ title: string; prompt: string; isLoading: boolean;}> = ({ title, prompt, isLoading }) => {
    const [copyText, setCopyText] = React.useState('Copiar');

    const handleCopy = () => {
        if (!prompt || isLoading) return;
        navigator.clipboard.writeText(prompt);
        setCopyText('¡Copiado!');
        setTimeout(() => setCopyText('Copiar'), 2000);
    };

    return (
        <div className="bg-black/30 p-4 rounded-xl border border-white/10 mt-4 shadow-md">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-aura-glow text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-aura-glow inline-block"></span>
                    {title}
                </h4>
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={isLoading || !prompt}
                    className="bg-black/40 backdrop-blur-md text-aura-text font-semibold py-1 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all border border-white/20 hover:bg-black/60 hover:border-white/30 hover:shadow-glow-sm disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Copy augmented prompt to clipboard"
                >
                    <CopyIcon className="w-3.5 h-3.5" />
                    {copyText}
                </button>
            </div>
            <textarea
                readOnly
                value={isLoading && !prompt ? "Potenciando el prompt con IA..." : prompt}
                rows={6}
                className="w-full bg-black/40 rounded-lg p-3 text-aura-subtext border border-white/10 resize-none transition-opacity duration-300 focus:outline-none placeholder-aura-subtext text-xs sm:text-sm font-mono leading-relaxed"
            />
        </div>
    );
};

export const PromptAugmenters: React.FC<PromptAugmentersProps> = ({ basePrompt, augmentations, onAugment, isLoadingBase }) => {
    if (!basePrompt || isLoadingBase) {
        return null;
    }

    const anyLoading = Object.values(augmentations).some(a => (a as any).isLoading);

    return (
        <div className="mt-8 border-t border-white/10 pt-8">
            <h3 className="text-lg font-semibold text-aura-text text-center">
                4. Potenciadores de Prompt
            </h3>
            <p className="text-center text-aura-subtext text-sm mb-6">
                Refina tu prompt con transformaciones expertas de un solo clic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AUGMENTERS.map(({ type, label, description, icon: Icon }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onAugment(type)}
                        disabled={anyLoading}
                        className="flex flex-col items-center text-center p-4 rounded-xl border border-white/15 bg-black/30 hover:bg-black/50 hover:border-aura-glow/80 hover:shadow-glow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                    >
                        <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl border border-white/15 mb-3 group-hover:text-aura-glow group-hover:bg-indigo-500/20 group-hover:border-indigo-400/30 transition-all shrink-0">
                            <Icon className="w-5 h-5 text-aura-glow" />
                        </div>
                        <p className="font-bold text-white text-sm">{label}</p>
                        <p className="text-xs text-aura-subtext mt-1 leading-snug">{description}</p>
                    </button>
                ))}
            </div>
            <div className="mt-4 space-y-4">
                {Object.entries(augmentations).map(([key, aug]) => {
                    const augmenter = AUGMENTERS.find(a => a.type === key);
                    if (!augmenter) return null;
                    return (
                        <AugmentationOutput
                            key={key}
                            title={augmenter.label}
                            prompt={(aug as any).result}
                            isLoading={(aug as any).isLoading}
                        />
                    );
                })}
            </div>
        </div>
    );
};

