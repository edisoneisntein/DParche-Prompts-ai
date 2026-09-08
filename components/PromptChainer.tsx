import React, { useState, useEffect } from 'react';
import { GitCommit, Sparkles, Copy, RefreshCw, FileText, Bot, HelpCircle, Check, HelpCircle as HelpIcon } from 'lucide-react';
import { MarkdownVisualizer } from './MarkdownVisualizer';

interface PromptChainerProps {
    defaultPreviousPrompt?: string;
    onGenerate: (context: string) => void;
    isLoading: boolean;
    chainedResult: string;
}

export const PromptChainer: React.FC<PromptChainerProps> = ({
    defaultPreviousPrompt = '',
    onGenerate,
    isLoading,
    chainedResult,
}) => {
    const [previousPrompt, setPreviousPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [nextInstruction, setNextInstruction] = useState('');
    const [copyStatus, setCopyStatus] = useState('Copiar');
    const [isExpanded, setIsExpanded] = useState(false);

    // Sync with the latest generated expert prompt if available
    useEffect(() => {
        if (defaultPreviousPrompt) {
            setPreviousPrompt(defaultPreviousPrompt);
        }
    }, [defaultPreviousPrompt]);

    const handleAutoFill = () => {
        if (defaultPreviousPrompt) {
            setPreviousPrompt(defaultPreviousPrompt);
        }
    };

    const handleClear = () => {
        setAiResponse('');
        setNextInstruction('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!previousPrompt.trim() || !aiResponse.trim() || !nextInstruction.trim()) return;

        // Compile a structured block of context that prompt_chainer will consume
        const promptContext = `
=== PROMPT ORIGINAL ANTERIOR ===
${previousPrompt.trim()}
================================

=== RESPUESTA OBTENIDA DE LA IA ===
${aiResponse.trim()}
===================================

=== NUEVOS REQUERIMIENTOS Y SOLICITUD DE CONTINUIDAD ===
${nextInstruction.trim()}
========================================================
        `;

        onGenerate(promptContext);
    };

    const handleCopy = () => {
        if (!chainedResult) return;
        navigator.clipboard.writeText(chainedResult);
        setCopyStatus('¡Copiado!');
        setTimeout(() => setCopyStatus('Copiar'), 2000);
    };

    const hasActiveInput = previousPrompt.trim() || aiResponse.trim() || nextInstruction.trim();

    return (
        <div id="prompt-chainer-section" className="mt-8 border border-white/10 bg-black/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-indigo-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                        <GitCommit className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-md sm:text-lg font-semibold text-white flex items-center gap-2">
                            Encadenador de Continuidad (Prompt Chaining)
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">VIP</span>
                        </h3>
                        <p className="text-xs text-aura-subtext">Diseña el siguiente prompt experto basado en la respuesta que te dio la IA.</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 px-3.5 py-1.5 rounded-lg border border-indigo-500/25 transition-all active:scale-95"
                >
                    {isExpanded ? 'Ocultar Encadenador' : 'Configurar Continuidad de Hilo'}
                </button>
            </div>

            {isExpanded && (
                <form onSubmit={handleSubmit} className="space-y-5 animate-[fade-in_0.2s_ease-in-out]">
                    <div className="grid grid-cols-1 gap-5">
                        {/* Box 1: Previous Prompt */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs sm:text-sm font-semibold text-aura-text flex items-center gap-1.5">
                                    <span className="text-indigo-400 font-mono font-bold">A.</span> Prompt Original Anterior
                                </label>
                                {defaultPreviousPrompt && previousPrompt !== defaultPreviousPrompt && (
                                    <button
                                        type="button"
                                        onClick={handleAutoFill}
                                        className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 transition-all"
                                    >
                                        Importar último prompt generado
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={previousPrompt}
                                onChange={(e) => setPreviousPrompt(e.target.value)}
                                placeholder="Pega aquí el prompt experto de origen que enviaste a la IA..."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 font-mono"
                                required
                            />
                        </div>

                        {/* Box 2: IA Response */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-aura-text flex items-center gap-1.5">
                                <span className="text-indigo-400 font-mono font-bold">B.</span> Respuesta Obtenida de la IA (Pega aquí la respuesta del LLM)
                            </label>
                            <textarea
                                value={aiResponse}
                                onChange={(e) => setAiResponse(e.target.value)}
                                placeholder="Pega aquí el resultado o respuesta que te devolvió tu Inteligencia Artificial para poder analizarla..."
                                rows={5}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 font-mono scrollbar-thin"
                                required
                            />
                        </div>

                        {/* Box 3: Next Instructions */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-aura-text flex items-center gap-1.5">
                                <span className="text-indigo-400 font-mono font-bold">C.</span> ¿Qué deseas solicitar o preguntar adicionalmente?
                            </label>
                            <textarea
                                value={nextInstruction}
                                onChange={(e) => setNextInstruction(e.target.value)}
                                placeholder="Ej: 'Ahora traduce el código a Go', 'Amplía la sección de manejo de errores de base de datos', 'Genera un plan de rollback paso a paso basado en lo anterior'..."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 font-sans"
                                required
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                        <div className="flex items-center gap-2">
                            {hasActiveInput && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="text-xs text-aura-subtext hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
                                >
                                    Limpiar campos
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !previousPrompt.trim() || !aiResponse.trim() || !nextInstruction.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2 px-5 rounded-xl transition-all duration-200 border border-indigo-400/35 hover:shadow-glow-sm flex items-center gap-2 active:scale-95 disabled:bg-indigo-600/40 disabled:border-transparent disabled:text-indigo-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Generando Hilo de Continuidad...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                                    Compilar Prompt de Seguimiento V3
                                </>
                            )}
                        </button>
                    </div>

                    {/* Chained Prompt Output Result */}
                    {chainedResult && (
                        <div className="mt-6 border-t border-white/10 pt-5 space-y-3 animate-[fade-in_0.3s_ease-in-out]">
                            <div className="flex items-center justify-between">
                                <label className="text-xs sm:text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                    Siguiente Prompt Experto Generado (Obligatorio Cumplimiento)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="text-xs bg-black/60 hover:bg-black/80 text-white font-semibold py-1.5 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                                >
                                    {copyStatus === '¡Copiado!' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copyStatus}
                                </button>
                            </div>

                            <div className="relative">
                                <div className="w-full max-h-[350px] overflow-y-auto bg-black/45 rounded-xl p-4 border border-indigo-500/20 text-xs sm:text-sm text-white scrollbar-thin">
                                    <MarkdownVisualizer content={chainedResult} />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 px-1 text-[11px] text-aura-subtext font-mono">
                                <div className="flex items-center gap-1">
                                    <span className="text-indigo-400 font-bold">●</span>
                                    <span>Caracteres: <strong>{chainedResult.length}</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-fuchsia-400 font-bold">●</span>
                                    <span>Tokens Estimados: <strong>{Math.round(chainedResult.length / 4)}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
};
