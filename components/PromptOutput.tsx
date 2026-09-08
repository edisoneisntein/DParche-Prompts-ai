import React, { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';
import { CopyIcon } from './CopyIcon';
import { MarkdownVisualizer } from './MarkdownVisualizer';
import { generatePromptPDF } from '../utils/pdfGenerator';

interface PromptOutputProps {
    prompt: string;
    isLoading: boolean;
    isCached?: boolean;
}

const LoadingIndicator: React.FC = () => (
    <div className="absolute inset-0 rounded-lg border-2 border-aura-accent animated-border pointer-events-none"></div>
);

export const PromptOutput: React.FC<PromptOutputProps> = ({ prompt, isLoading, isCached }) => {
    const [copyText, setCopyText] = useState('Copiar');
    const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

    const handleDownloadPDF = () => {
        if (!prompt || isLoading) return;
        // Extract first markdown header as title, or fall back to standard text
        const titleMatch = prompt.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : 'Prompt Experto Optimizado';
        generatePromptPDF(prompt, {
            title,
            modeName: isCached ? 'Cargado de caché' : 'Gemini AI',
        });
    };

    useEffect(() => {
        if (!prompt) {
            setCopyText('Copiar');
        }
    }, [prompt]);

    // Automatically switch to 'raw' if loading starts so they can see the plain stream
    useEffect(() => {
        if (isLoading) {
            setActiveTab('raw');
        } else if (prompt) {
            setActiveTab('preview');
        }
    }, [isLoading]);

    const handleCopy = () => {
        if (!prompt || isLoading) return;
        navigator.clipboard.writeText(prompt);
        setCopyText('¡Copiado!');
        setTimeout(() => setCopyText('Copiar'), 2000);
    };

    if (!prompt && !isLoading) {
        return null;
    }

    return (
        <div className="mt-8 animate-[fade-in_0.3s_ease-in-out]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-lg font-semibold text-aura-text">
                        3. Prompt Experto Generado
                    </label>
                    {isCached && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            ⚡ Recuperado de caché local
                        </span>
                    )}
                </div>

                {prompt && !isLoading && (
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs text-aura-subtext">
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    activeTab === 'preview'
                                        ? 'bg-indigo-600/30 text-white border border-aura-accent/50 shadow-glow-sm'
                                        : 'hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                Vista Formateada
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('raw')}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    activeTab === 'raw'
                                        ? 'bg-indigo-600/30 text-white border border-aura-accent/50 shadow-glow-sm'
                                        : 'hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                Texto Puro
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleDownloadPDF}
                                disabled={isLoading || !prompt}
                                className="bg-indigo-600/85 hover:bg-indigo-600 backdrop-blur-md text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all border border-indigo-500/35 hover:border-indigo-400 hover:shadow-glow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Descargar prompt en formato PDF"
                            >
                                <FileDown className="w-3.5 h-3.5 shrink-0" />
                                <span>PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleCopy}
                                disabled={isLoading || !prompt}
                                className="bg-black/70 backdrop-blur-md text-aura-text font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all border border-white/20 hover:bg-black/90 hover:border-white/40 hover:shadow-glow-sm active:scale-95 disabled:bg-gray-700/50 disabled:cursor-wait cursor-pointer"
                                aria-label="Copy prompt to clipboard"
                            >
                                <CopyIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{copyText}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative group">
                {activeTab === 'raw' || (isLoading && !prompt) ? (
                    <textarea
                        readOnly
                        value={isLoading && !prompt ? "Generando el prompt perfecto para ti..." : prompt}
                        rows={10}
                        className="w-full bg-black/35 backdrop-blur-sm rounded-xl p-4 text-aura-text border border-white/20 resize-none transition-all duration-300 focus:outline-none placeholder-aura-subtext font-mono text-sm leading-relaxed"
                    />
                ) : (
                    <div className="w-full min-h-[220px] max-h-[550px] overflow-y-auto bg-black/35 backdrop-blur-sm rounded-xl p-5 text-aura-text border border-white/20 scrollbar-thin">
                        <MarkdownVisualizer content={prompt} />
                    </div>
                )}

                {isLoading && !prompt && <LoadingIndicator />}
            </div>

            {prompt && !isLoading && (
                <div className="flex flex-wrap items-center gap-6 mt-3 px-1 text-xs text-aura-subtext font-mono">
                    <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-bold">●</span>
                        <span>Caracteres: <strong className="text-white">{prompt.length.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-fuchsia-400 font-bold">●</span>
                        <span>Palabras: <strong className="text-white">{prompt.trim().split(/\s+/).filter(Boolean).length.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400 font-bold">●</span>
                        <span>Tokens Estimados: <strong className="text-white">{Math.round(prompt.length / 4).toLocaleString()}</strong></span>
                    </div>
                </div>
            )}
        </div>
    );
};
