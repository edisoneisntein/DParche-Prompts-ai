import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Trash2, X, Sparkles, Copy, FileDown, ExternalLink, Play, Square, Settings2 } from 'lucide-react';
import { generateVoiceChatStream, ChatMessage, ExpertMode } from '../services/geminiService';
import { UploadedDocument } from './DocumentUpload';
import { MarkdownVisualizer } from './MarkdownVisualizer';
import { generatePromptPDF } from '../utils/pdfGenerator';

interface VoiceChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMode: ExpertMode;
    onModeChange: (mode: ExpertMode) => void;
    documents: UploadedDocument[];
    onInjectPromptToApp: (promptText: string) => void;
}

const EXPERT_MODES_LIST: { id: ExpertMode; name: string; description: string }[] = [
    { id: 'general', name: 'Ingeniero de Prompts General', description: 'Transformación balanceada para cualquier IA' },
    { id: 'creator', name: 'Creador de Software (SOLID/TS)', description: 'Generación de código industrial completo' },
    { id: 'auditor_elite', name: 'Auditor Élite V3 (Seguridad/SRE)', description: 'Inspección microscópica y zero-trust' },
    { id: 'app_auditor', name: 'Auditor de Aplicaciones', description: 'Evaluación directiva de producción' },
    { id: 'architect_v3', name: 'Arquitecto Industrial V3 (PART/PAE)', description: 'Matriz industrial e inflexibilidad física' },
    { id: 'loop_engineer', name: 'Ingeniero de Loops (Loop Eng.) 🔄', description: 'Bucles iterativos de auto-evaluación y refinamiento' },
    { id: 'prompt_augmenter', name: 'Potenciador Meta-Prompt', description: 'Inyección profunda de reglas' },
    { id: 'prompt_chainer', name: 'Encadenador de Hilo', description: 'Continuidad conversacional avanzada' },
];

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
    isOpen,
    onClose,
    currentMode,
    onModeChange,
    documents,
    onInjectPromptToApp,
}) => {
    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem('aura_voice_chat_history');
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return [
            {
                role: 'assistant',
                content: '¡Hola! Soy **AURA Voice Intelligence**. Estoy listo para escuchar tus ideas por voz y generar o refinar prompts expertos de máxima calidad. ¿Sobre qué sistema o idea deseas trabajar?',
                timestamp: Date.now()
            }
        ];
    });

    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [speechRate, setSpeechRate] = useState<number>(1.1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const recognitionRef = useRef<any>(null);

    // Save history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('aura_voice_chat_history', JSON.stringify(messages));
        } catch (e) {
            console.warn('Fallo al guardar historial de voz:', e);
        }
    }, [messages]);

    // Auto-scroll chat
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isLoading]);

    // Initialize Web Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = true;
            rec.lang = 'es-ES';

            rec.onstart = () => {
                setIsListening(true);
                setTranscript('');
            };

            rec.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            rec.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: '⚠️ El acceso al micrófono fue denegado o no está configurado. Por favor, asegúrate de otorgar los permisos.',
                        timestamp: Date.now()
                    }]);
                }
            };

            rec.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = rec;
        }
    }, []);

    // Handle speech synthesis text playback
    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel(); // Stop any previous speech

        // Extract spoken part: clean up markdown code blocks so voice stays clean & pleasant
        let cleanSpokenText = text.replace(/```[\s\S]*?```/g, ' [Prompt experto generado a continuación] ');
        cleanSpokenText = cleanSpokenText.replace(/[*_#`~]/g, '');

        if (!cleanSpokenText.trim()) return;

        const utterance = new SpeechSynthesisUtterance(cleanSpokenText.substring(0, 450)); // smooth length limit for audio
        utterance.lang = 'es-ES';
        utterance.rate = speechRate;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    // Toggle Mic Listening
    const toggleListening = () => {
        if (!recognitionRef.current) {
            const errorMsg: ChatMessage = {
                role: 'assistant',
                content: '⚠️ Tu navegador no soporta reconocimiento de voz nativo en este entorno. Por favor, usa Chrome, Edge o Safari, o intenta escribir tu instrucción en la barra inferior.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            if (transcript.trim()) {
                handleSendMessage(transcript);
                setTranscript('');
            }
        } else {
            stopSpeech();
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.warn('Failed to start speech recognition:', err);
            }
        }
    };

    // Auto-submit voice transcript when user stops speaking after a short pause
    useEffect(() => {
        if (!isListening && transcript.trim() && transcript.length > 3) {
            handleSendMessage(transcript);
            setTranscript('');
        }
    }, [isListening]);

    // Send Message handler
    const handleSendMessage = async (textToSend: string) => {
        const query = textToSend.trim();
        if (!query || isLoading) return;

        stopSpeech();
        setInputText('');
        setTranscript('');

        const userMsg: ChatMessage = {
            role: 'user',
            content: query,
            timestamp: Date.now()
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setIsLoading(true);

        const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, assistantMsg]);

        let fullStreamedResponse = '';

        try {
            await generateVoiceChatStream(
                newHistory,
                currentMode,
                (chunk) => {
                    fullStreamedResponse += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: fullStreamedResponse
                        };
                        return updated;
                    });
                },
                documents
            );

            // Auto speak assistant response if enabled
            if (autoSpeak) {
                speakText(fullStreamedResponse);
            }
        } catch (err: any) {
            console.error('Error in voice chat:', err);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: `⚠️ Hubo un inconveniente al procesar tu instrucción por voz: ${err.message || 'Inténtalo de nuevo.'}`
                };
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        stopSpeech();
        const initialMsg: ChatMessage = {
            role: 'assistant',
            content: '¡Conversación reiniciada! Estoy listo para procesar tus nuevas instrucciones o ideas por voz.',
            timestamp: Date.now()
        };
        setMessages([initialMsg]);
        try {
            localStorage.removeItem('aura_voice_chat_history');
        } catch (_) {}
    };

    // Helper to extract code block/prompt from markdown message content
    const extractPromptFromMessage = (content: string): string | null => {
        const match = content.match(/```(?:markdown|text)?\n([\s\S]*?)```/);
        if (match && match[1].trim()) {
            return match[1].trim();
        }
        if (content.includes('# ROL') || content.includes('# OBJETIVO') || content.includes('Actúa como')) {
            return content;
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
            <div className="relative w-full max-w-4xl h-[92vh] sm:h-[88vh] bg-[#0a0c14] border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.25)] flex flex-col overflow-hidden text-aura-text">
                
                {/* Header Bar */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-950/80 via-purple-950/40 to-slate-950/80 border-b border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 shadow-glow-sm">
                            <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
                            {isSpeaking && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                                    Chat de Voz AURA
                                </h2>
                                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                                    Memoria Ilimitada
                                </span>
                            </div>
                            <p className="text-xs text-indigo-200/70 hidden sm:block">
                                Interactúa por voz con todo el conocimiento de ingeniería de prompts integrado
                            </p>
                        </div>
                    </div>

                    {/* Mode Selector Dropdown & Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <select
                                value={currentMode}
                                onChange={(e) => onModeChange(e.target.value as ExpertMode)}
                                className="bg-black/60 border border-white/20 text-xs text-aura-text rounded-lg px-2.5 py-1.5 focus:border-indigo-400 outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
                                title="Seleccionar Calidad / Modo Experto"
                            >
                                {EXPERT_MODES_LIST.map((m) => (
                                    <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                                autoSpeak 
                                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200' 
                                    : 'bg-black/40 border-white/10 text-aura-subtext hover:text-white'
                            }`}
                            title={autoSpeak ? 'Respuesta hablada activada' : 'Respuesta hablada desactivada'}
                        >
                            {autoSpeak ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={handleClearHistory}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                            title="Reiniciar chat de voz"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                stopSpeech();
                                onClose();
                            }}
                            className="p-2 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-aura-subtext hover:text-white transition-all"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Scrollable Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-indigo-900/50">
                    {messages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        const extractedPrompt = !isUser ? extractPromptFromMessage(msg.content) : null;

                        return (
                            <div
                                key={index}
                                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-[fade-in_0.2s_ease-out]`}
                            >
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className="text-[11px] font-semibold text-aura-subtext uppercase tracking-wider">
                                        {isUser ? 'Tú (Instrucción por Voz)' : 'AURA Voice Architect'}
                                    </span>
                                </div>

                                <div
                                    className={`relative max-w-[95%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-lg border ${
                                        isUser
                                            ? 'bg-indigo-600/20 border-indigo-500/40 text-white rounded-tr-none'
                                            : 'bg-black/50 border-white/10 text-aura-text rounded-tl-none backdrop-blur-sm'
                                    }`}
                                >
                                    {/* Markdown Content */}
                                    <MarkdownVisualizer content={msg.content} />

                                    {/* Audio Playback Control for Assistant Messages */}
                                    {!isUser && msg.content && (
                                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => speakText(msg.content)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                                                >
                                                    <Play className="w-3.5 h-3.5" />
                                                    <span>Escuchar respuesta</span>
                                                </button>
                                                {isSpeaking && (
                                                    <button
                                                        type="button"
                                                        onClick={stopSpeech}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-300 border border-red-500/30"
                                                    >
                                                        <Square className="w-3 h-3" />
                                                        <span>Detener</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Action tools if message contains a prompt */}
                                            {extractedPrompt && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onInjectPromptToApp(extractedPrompt);
                                                            onClose();
                                                        }}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all font-medium"
                                                        title="Cargar este prompt directamente en la pantalla principal de la app"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        <span>Usar en App</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            generatePromptPDF(extractedPrompt, {
                                                                title: 'Prompt Generado por Voz AURA',
                                                                modeName: currentMode,
                                                            });
                                                        }}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-white border border-indigo-400/30 transition-all"
                                                    >
                                                        <FileDown className="w-3.5 h-3.5" />
                                                        <span>Descargar PDF</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(extractedPrompt);
                                                            setCopiedIndex(index);
                                                            setTimeout(() => setCopiedIndex(null), 2000);
                                                        }}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 hover:bg-white/10 text-aura-subtext border border-white/10"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                        <span>{copiedIndex === index ? '¡Copiado!' : 'Copiar'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex items-center gap-3 p-4 bg-black/40 border border-indigo-500/20 rounded-2xl w-fit animate-pulse">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"></div>
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-3 h-3 rounded-full bg-fuchsia-500 animate-bounce [animation-delay:0.4s]"></div>
                            <span className="text-xs text-indigo-200">Procesando y generando respuesta por voz...</span>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Audio Voice Input Wave Visualizer & Status */}
                {isListening && (
                    <div className="px-6 py-2 bg-indigo-950/50 border-t border-indigo-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-red-300 tracking-wide animate-pulse">
                                ESCUCHANDO TU VOZ EN TIEMPO REAL...
                            </span>
                        </div>
                        {transcript && (
                            <p className="text-xs text-indigo-200 italic max-w-md truncate">
                                "{transcript}"
                            </p>
                        )}
                    </div>
                )}

                {/* Footer Controls & Input Bar */}
                <div className="p-3 sm:p-4 bg-black/80 border-t border-white/10 flex flex-col gap-3">
                    
                    {/* Quick Voice Suggestions */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                        <span className="text-[11px] text-aura-subtext whitespace-nowrap font-medium">Comandos rápidos:</span>
                        {[
                            'Crea un prompt para un microservicio en Go',
                            'Optimiza el prompt anterior para auditoría de seguridad zero-trust',
                            'Hazlo con el formato de Arquitecto Industrial PART/PAE',
                            'Añade pruebas de estrés y tolerancias de error'
                        ].map((promptText, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSendMessage(promptText)}
                                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400/40 text-aura-subtext hover:text-white transition-all text-xs"
                            >
                                {promptText}
                            </button>
                        ))}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputText);
                        }}
                        className="flex items-center gap-2"
                    >
                        {/* Big Voice Mic Button */}
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`relative p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-center shrink-0 ${
                                isListening
                                    ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                                    : 'bg-indigo-600/80 hover:bg-indigo-600 border-indigo-400 text-white shadow-glow-sm hover:scale-105 active:scale-95'
                            }`}
                            title={isListening ? 'Haga clic para enviar voz' : 'Haga clic para hablar por micrófono'}
                        >
                            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        {/* Text input fallback */}
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isListening ? "Escuchando tu voz..." : "Escribe una instrucción o habla por micrófono..."}
                            disabled={isLoading}
                            className="flex-1 bg-black/60 border border-white/15 focus:border-indigo-500 text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-500"
                        />

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={!inputText.trim() || isLoading}
                            className="p-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all border border-indigo-400/30 flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
