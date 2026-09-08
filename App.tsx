import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { PromptOutput } from './components/PromptOutput';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ExampleIdeas } from './components/ExampleIdeas';
import { GlitchOverlay } from './components/GlitchOverlay';
import { ExpertModeSelector } from './components/ExpertModeSelector';
import { generateExpertPromptStream, ExpertMode, AugmentationType } from './services/geminiService';
import { AuditModal } from './components/AuditModal';
import { PromptAugmenters, augmentationRules } from './components/PromptAugmenters';
import { DocumentUpload, UploadedDocument } from './components/DocumentUpload';
import { PromptChainer } from './components/PromptChainer';
import { VoiceChatModal } from './components/VoiceChatModal';
import { Mic, Sparkles } from 'lucide-react';

// Type to represent the state of each augmentation
export type Augmentation = {
    result: string;
    isLoading: boolean;
};

const App: React.FC = () => {
    const [idea, setIdea] = useState<string>('');
    const [expertPrompt, setExpertPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [expertMode, setExpertMode] = useState<ExpertMode>('general');
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    
    const [augmentations, setAugmentations] = useState<Record<string, Augmentation>>({});

    const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
    const [isAuditing, setIsAuditing] = useState<boolean>(false);
    const [auditReport, setAuditReport] = useState<string>('');

    const [chainedPrompt, setChainedPrompt] = useState<string>('');
    const [isChainingLoading, setIsChainingLoading] = useState<boolean>(false);

    const [isVoiceChatOpen, setIsVoiceChatOpen] = useState<boolean>(false);

    // Local Storage cache management
    const [isCached, setIsCached] = useState<boolean>(false);
    const [cacheCount, setCacheCount] = useState<number>(() => {
        let count = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('expert_prompt_cache_')) {
                    count++;
                }
            }
        } catch (_) {}
        return count;
    });

    const updateCacheCount = () => {
        try {
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('expert_prompt_cache_')) {
                    count++;
                }
            }
            setCacheCount(count);
        } catch (_) {}
    };

    const handleClearCache = () => {
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('expert_prompt_cache_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            setCacheCount(0);
            setIsCached(false);
        } catch (_) {}
    };

    const resetState = () => {
        setError(null);
        setExpertPrompt('');
        setAugmentations({});
        setChainedPrompt('');
        setIsCached(false);
    };

    const handleGeneratePrompt = useCallback(async (currentIdea: string, mode: ExpertMode, docsList: UploadedDocument[] = documents) => {
        if (!currentIdea.trim()) {
            setError('Por favor, ingresa una idea para comenzar.');
            return;
        }

        setIsLoading(true);
        resetState();

        try {
            await generateExpertPromptStream(currentIdea, mode, (chunk) => {
                setExpertPrompt((prev) => prev + chunk);
            }, docsList, (hit) => {
                setIsCached(hit);
            });
            // Update counts if a new prompt got generated and cached
            updateCacheCount();
        } catch (err) {
            console.error("Error generating expert prompt:", err);
            const msg = err instanceof Error ? err.message : 'Hubo un error al generar el prompt. Por favor, inténtalo de nuevo más tarde.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [documents]);
    
    const handleAugmentPrompt = useCallback(async (augType: AugmentationType) => {
        if (!expertPrompt) return;

        setAugmentations(prev => ({
            ...prev,
            [augType]: { result: '', isLoading: true }
        }));
        setError(null);

        const rule = augmentationRules[augType];
        const augmentationRequest = `Modification Rule: ${rule}\n\nBase Prompt: "${expertPrompt}"`;

        try {
            await generateExpertPromptStream(augmentationRequest, 'prompt_augmenter', (chunk) => {
                 setAugmentations(prev => ({
                    ...prev,
                    [augType]: { ...prev[augType], result: prev[augType].result + chunk }
                }));
            });
        } catch (err) {
            console.error(`Error augmenting prompt with ${augType}:`, err);
            const msg = err instanceof Error ? err.message : `Hubo un error al aplicar el potenciador: ${augType}.`;
            setError(msg);
        } finally {
            setAugmentations(prev => ({
                ...prev,
                [augType]: { ...prev[augType], isLoading: false }
            }));
        }

    }, [expertPrompt]);

    const handleExampleSelect = (exampleIdea: string, mode: ExpertMode) => {
        setIdea(exampleIdea);
        setExpertMode(mode);
        handleGeneratePrompt(exampleIdea, mode, []);
    };

    const handleRunAudit = useCallback(async () => {
        setIsAuditing(true);
        setAuditReport('');
        setIsAuditModalOpen(true);
        setError(null);

        try {
            // Fetch live, up-to-date workspace sources from our custom server API
            const response = await fetch('/api/sources');
            if (!response.ok) {
                throw new Error('No se pudo obtener el código fuente actualizado del servidor.');
            }
            const liveSources = await response.json();

            const allCode = Object.entries(liveSources)
                .map(([path, content]) => `// --- START OF FILE ${path} ---\n\n${content}\n\n// --- END OF FILE ${path} ---\n`)
                .join('\n');
            
            const auditRequest = `Por favor, audita el siguiente código fuente de una aplicación de software en desarrollo (React, TypeScript y TailwindCSS), que está completo y actualizado al instante actual:\n\n${allCode}`;

            await generateExpertPromptStream(auditRequest, 'app_auditor', (chunk) => {
                setAuditReport((prev) => prev + chunk);
            });
        } catch (err) {
            console.error("Error during application audit:", err);
            const errorMessage = err instanceof Error ? err.message : 'Hubo un error al realizar la auditoría. Por favor, inténtalo de nuevo más tarde.';
            setAuditReport(errorMessage);
            setError(errorMessage);
        } finally {
            setIsAuditing(false);
        }
    }, []);

    const handleGenerateChainedPrompt = useCallback(async (chainedContext: string) => {
        if (!chainedContext.trim()) {
            setError('Falta el contexto para encadenar el prompt.');
            return;
        }

        setIsChainingLoading(true);
        setChainedPrompt('');
        setError(null);

        try {
            await generateExpertPromptStream(chainedContext, 'prompt_chainer', (chunk) => {
                setChainedPrompt((prev) => prev + chunk);
            });
        } catch (err) {
            console.error("Error generating chained prompt:", err);
            const msg = err instanceof Error ? err.message : 'Hubo un error al generar el prompt de seguimiento. Por favor, inténtalo de nuevo.';
            setError(msg);
        } finally {
            setIsChainingLoading(false);
        }
    }, []);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-start py-8 px-4 sm:p-6 lg:p-8 font-sans transition-filter duration-300 ${isLoading ? 'glitching-background' : ''}`}>
            <GlitchOverlay isActive={isLoading || isAuditing} />
            <div className="w-full max-w-4xl mx-auto float-animation">
                <Header onOpenVoiceChat={() => setIsVoiceChatOpen(true)} />
                <main className="mt-8 bg-black/20 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-glow-xl transition-all duration-300 p-6 sm:p-8">
                    <PromptInput
                        value={idea}
                        onChange={(e) => {
                            setIdea(e.target.value);
                            if (expertPrompt) { // Clear results if user types new idea
                                setExpertPrompt('');
                                setAugmentations({});
                            }
                        }}
                        onSubmit={() => handleGeneratePrompt(idea, expertMode)}
                        isLoading={isLoading}
                    />

                    <DocumentUpload
                        documents={documents}
                        onDocumentsChange={setDocuments}
                        isLoading={isLoading}
                    />

                    <ExpertModeSelector 
                        currentMode={expertMode}
                        onModeChange={setExpertMode}
                        isLoading={isLoading}
                    />

                    <ExampleIdeas onSelect={handleExampleSelect} isLoading={isLoading} />

                    {error && <ErrorDisplay message={error} />}
                    
                    <PromptOutput prompt={expertPrompt} isLoading={isLoading} isCached={isCached} />
                    
                    <PromptAugmenters
                        basePrompt={expertPrompt}
                        augmentations={augmentations}
                        onAugment={handleAugmentPrompt}
                        isLoadingBase={isLoading}
                    />

                    <PromptChainer
                        defaultPreviousPrompt={expertPrompt}
                        onGenerate={handleGenerateChainedPrompt}
                        isLoading={isChainingLoading}
                        chainedResult={chainedPrompt}
                    />

                </main>
                <footer className="w-full max-w-4xl text-center mt-8 text-aura-subtext text-sm opacity-70 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>Diseño inspirado en AURA OS · Creado con la API de Gemini.</p>
                    <div className="flex items-center gap-3">
                        {cacheCount > 0 && (
                            <button
                                onClick={handleClearCache}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-full transition-all duration-200 border border-red-500/20 hover:border-red-500/40 active:scale-95 hover:shadow-sm"
                            >
                                Limpiar Caché ({cacheCount})
                            </button>
                        )}
                        <button
                            onClick={handleRunAudit}
                            disabled={isAuditing}
                            className="bg-black/20 backdrop-blur-sm text-aura-text text-sm font-medium py-2 px-4 rounded-full transition-all duration-200 border border-white/20 hover:border-aura-glow hover:bg-black/30 hover:text-aura-glow hover:shadow-glow-sm active:scale-95 disabled:bg-aura-mid/50 disabled:border-transparent disabled:text-aura-subtext disabled:cursor-not-allowed"
                        >
                            {isAuditing ? 'Auditando...' : 'Auditar Aplicación'}
                        </button>
                    </div>
                </footer>
            </div>

            {/* Floating Voice Chat Trigger Button */}
            <button
                type="button"
                onClick={() => setIsVoiceChatOpen(true)}
                className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400/40 shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                title="Abrir Chat de Voz AURA"
            >
                <div className="relative flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                </div>
                <span className="hidden md:inline font-bold text-xs tracking-wide pr-1">
                    Chat de Voz IA
                </span>
            </button>

            {/* Modals */}
            <AuditModal 
                isOpen={isAuditModalOpen}
                onClose={() => setIsAuditModalOpen(false)}
                isLoading={isAuditing}
                report={auditReport}
            />

            <VoiceChatModal
                isOpen={isVoiceChatOpen}
                onClose={() => setIsVoiceChatOpen(false)}
                currentMode={expertMode}
                onModeChange={setExpertMode}
                documents={documents}
                onInjectPromptToApp={(promptText) => {
                    setExpertPrompt(promptText);
                }}
            />
        </div>
    );
};

export default App;
