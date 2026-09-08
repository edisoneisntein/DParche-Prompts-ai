/**
 * @file Servicio para interactuar con la API de Gemini (Proxy de Cliente a Servidor).
 * Realiza peticiones a nuestro backend de Node/Express para mantener la API key segura y oculta.
 */

import { ExpertMode } from './promptLibrary';
import { UploadedDocument } from '../components/DocumentUpload';

// Helper function to generate a fast, deterministic hash string
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// Function to generate the cache key
function getCacheKey(idea: string, mode: string, documents?: UploadedDocument[]): string {
    const docSummary = documents?.map(doc => ({
        name: doc.name,
        content: doc.content || ""
    })) || [];
    const inputObj = {
        idea: idea.trim().toLowerCase(),
        mode,
        documents: docSummary
    };
    return `expert_prompt_cache_${mode}_${hashString(JSON.stringify(inputObj))}`;
}

/**
 * Genera un prompt experto en modo streaming conectándose a nuestro backend Node.js.
 * @param idea - La idea del usuario en lenguaje natural.
 * @param mode - El modo experto a utilizar ('general', 'creator', etc.).
 * @param onStream - Callback que se ejecuta con cada trozo (chunk) de texto recibido.
 * @param documents - Opcional. Documentos de soporte adjuntados por el usuario.
 * @param onCacheHit - Callback opcional para notificar si se usó la caché.
 */
export async function generateExpertPromptStream(
    idea: string,
    mode: ExpertMode,
    onStream: (chunk: string) => void,
    documents?: UploadedDocument[],
    onCacheHit?: (hit: boolean) => void
): Promise<void> {
    const cacheKey = getCacheKey(idea, mode, documents);
    
    // Attempt to load from localStorage cache first
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            onCacheHit?.(true);
            
            // Stream the cached response back in smooth, rapid chunks to maintain UI consistency
            const chunkSize = 40;
            let index = 0;
            while (index < cached.length) {
                const chunk = cached.substring(index, index + chunkSize);
                onStream(chunk);
                index += chunkSize;
                await new Promise(resolve => setTimeout(resolve, 8));
            }
            return;
        }
    } catch (err) {
        console.warn('Fallo al leer de localStorage:', err);
    }

    // Cache miss, notify caller
    onCacheHit?.(false);

    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea, mode, documents }),
    });

    if (!response.ok) {
        let errMsg = 'Hubo un problema al procesar la solicitud en el servidor.';
        try {
            const errJson = await response.json();
            if (errJson?.error) errMsg = errJson.error;
        } catch (_) {}
        throw new Error(errMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Streaming no soportado en este navegador.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // El último elemento puede ser una línea incompleta, la dejamos en el buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine.startsWith('data: ')) {
                const dataStr = cleanLine.substring(6);
                if (dataStr === '[DONE]') {
                    break;
                }
                let parsed;
                try {
                    parsed = JSON.parse(dataStr);
                } catch (e) {
                    console.error('Error parseando línea de SSE:', e);
                    continue;
                }

                if (parsed.error) {
                    throw new Error(parsed.error);
                }
                if (parsed.text) {
                    onStream(parsed.text);
                    accumulatedText += parsed.text;
                }
            }
        }
    }

    // Write successfully received stream to cache
    if (accumulatedText.trim()) {
        try {
            localStorage.setItem(cacheKey, accumulatedText);
        } catch (e) {
            console.warn('Fallo al guardar en localStorage (límite excedido):', e);
        }
    }
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

/**
 * Canal de comunicación interactivo por voz y texto con memoria continuada e ilimitada.
 */
export async function generateVoiceChatStream(
    messages: ChatMessage[],
    mode: ExpertMode,
    onStream: (chunk: string) => void,
    documents?: UploadedDocument[]
): Promise<void> {
    const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, mode, documents }),
    });

    if (!response.ok) {
        let errMsg = 'Error de conexión con el Asistente de Voz AURA.';
        try {
            const errJson = await response.json();
            if (errJson?.error) errMsg = errJson.error;
        } catch (_) {}
        throw new Error(errMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Streaming no soportado.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine.startsWith('data: ')) {
                const dataStr = cleanLine.substring(6);
                if (dataStr === '[DONE]') {
                    break;
                }
                let parsed;
                try {
                    parsed = JSON.parse(dataStr);
                } catch (e) {
                    continue;
                }

                if (parsed.error) {
                    throw new Error(parsed.error);
                }
                if (parsed.text) {
                    onStream(parsed.text);
                }
            }
        }
    }
}

export type { ExpertMode, AugmentationType } from './promptLibrary';

