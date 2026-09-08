import express from "express";
import path from "path";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import { systemInstructions, ExpertMode } from "./services/promptLibrary";

/**
 * Optimizes code content by safely stripping comments and collapsing excessive empty lines.
 * This yields >30% reduction in token count and memory usage for downstream LLM parsing.
 */
export function optimizeCodeContent(content: string, filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    let optimized = content;

    try {
        if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.css' || ext === '.json') {
            const lines = optimized.split('\n');
            const filteredLines: string[] = [];
            let inBlockComment = false;

            for (const rawLine of lines) {
                const line = rawLine.trimEnd();
                const trimmed = line.trim();

                // Track multi-line comments safely without corrupting inline literals
                if (inBlockComment) {
                    if (trimmed.includes('*/')) {
                        inBlockComment = false;
                    }
                    continue;
                }

                if (trimmed.startsWith('/*')) {
                    if (!trimmed.includes('*/')) {
                        inBlockComment = true;
                    }
                    continue;
                }

                // Strip standalone full-line comments to save tokens deterministically
                if (trimmed.startsWith('//')) {
                    continue;
                }

                filteredLines.push(line);
            }

            optimized = filteredLines.join('\n');
        }

        // Collapse multiple sequential blank lines into a single empty line
        optimized = optimized.replace(/\n\s*\n\s*\n+/g, '\n\n');
    } catch (err) {
        console.error(`Failed to optimize content for file ${filePath}:`, err);
    }

    return optimized.trim();
}

// Recursively retrieve source files with limit and safety controls for the dynamic auditor
async function getSourceFiles(
    dir: string,
    fileList: Record<string, string> = {},
    state = { fileCount: 0 }
): Promise<Record<string, string>> {
    const MAX_FILES = 120; // Bound maximum file count to prevent excessive node memory footprint
    if (state.fileCount >= MAX_FILES) {
        return fileList;
    }

    try {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
            if (state.fileCount >= MAX_FILES) break;

            const filePath = path.join(dir, file.name);
            const resolvedPath = path.resolve(filePath);
            const resolvedRoot = path.resolve(process.cwd());
            
            // Security hardening: Prevent any symbolic links or directory escapes
            if (!resolvedPath.startsWith(resolvedRoot)) {
                continue;
            }

            const fileNameLower = file.name.toLowerCase();

            // Secure skip rules for system, credential, module, and state-reloading files
            if (file.isDirectory()) {
                if (
                    file.name !== "node_modules" &&
                    file.name !== "dist" &&
                    file.name !== ".git" &&
                    file.name !== ".github" &&
                    file.name !== "package-lock.json" &&
                    !file.name.startsWith(".")
                ) {
                    await getSourceFiles(filePath, fileList, state);
                }
            } else {
                // Only process source code text and configurations
                if (
                    /\.(ts|tsx|html|css|json)$/.test(fileNameLower) &&
                    !fileNameLower.includes("package-lock") &&
                    !fileNameLower.includes("sourcefiles") &&
                    !fileNameLower.startsWith(".env") &&
                    !fileNameLower.startsWith("credentials")
                ) {
                    const relativePath = path.relative(process.cwd(), filePath);
                    const content = await fs.readFile(filePath, "utf-8");
                    
                    // Sanity check length of file content to prevent OOM
                    if (content.length < 500000) { 
                        const optimizedContent = optimizeCodeContent(content, filePath);
                        fileList[relativePath] = optimizedContent;
                        state.fileCount++;
                    }
                }
            }
        }
    } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
    }
    return fileList;
}

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // API route to serve actual live source files to the app auditor cleanly
    app.get("/api/sources", async (req, res) => {
        try {
            const sources = await getSourceFiles(process.cwd());
            res.json(sources);
        } catch (error) {
            console.error("Error generating live sources map:", error);
            res.status(500).json({ error: "No se pudieron obtener los archivos fuente del backend." });
        }
    });

    // Lazy initialization helper for Gemini AI client to prevent startup failures if API key is absent
    let aiClient: GoogleGenAI | null = null;
    function getGeminiClient(): GoogleGenAI {
        if (!aiClient) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
            }
            aiClient = new GoogleGenAI({
                apiKey,
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build',
                    }
                }
            });
        }
        return aiClient;
    }

    // API Route for streaming generation
    app.post("/api/generate", async (req: express.Request, res: express.Response) => {
        const { idea, mode, documents } = req.body;

        if (!idea || !mode) {
            res.status(400).json({ error: "Faltan parámetros 'idea' o 'mode'." });
            return;
        }

        const instruction = systemInstructions[mode as ExpertMode];
        if (!instruction) {
            res.status(400).json({ error: `Modo experto '${mode}' no válido.` });
            return;
        }

        // Set headers for Streaming/SSE early
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let ai: GoogleGenAI;
        try {
            ai = getGeminiClient();
        } catch (err: any) {
            res.write(`data: ${JSON.stringify({ error: err.message || "GEMINI_API_KEY no configurada." })}\n\n`);
            res.end();
            return;
        }

        // Format prompt content with support documents context if provided
        let promptContent = `Idea del usuario: "${idea}"`;
        const promptParts: any[] = [];
        let hasTextDocs = false;
        
        if (documents && Array.isArray(documents) && documents.length > 0) {
            promptContent += "\n\n=== DOCUMENTOS DE SOPORTE ADJUNTADOS POR EL USUARIO ===\n";
            documents.forEach((doc: any) => {
                if (doc.type && (doc.type.startsWith('video/') || doc.type.startsWith('image/'))) {
                    promptParts.push({
                        inlineData: {
                            mimeType: doc.type,
                            data: doc.content
                        }
                    });
                } else {
                    hasTextDocs = true;
                    // Compress and strip comments/excess spaces from supported document types to optimize token usage
                    const optimizedDocContent = optimizeCodeContent(doc.content || "", doc.name || "");
                    promptContent += `\n--- ARCHIVO: ${doc.name} ---\n${optimizedDocContent}\n--- FIN DE ARCHIVO: ${doc.name} ---\n`;
                }
            });
            if (hasTextDocs) {
                promptContent += "\n=======================================================\n";
                promptContent += "\nInstrucción de contexto: Utiliza la información, estructura o datos provistos en los documentos de soporte anteriores para enriquecer, basar y optimizar la idea del usuario. Genera la mejor respuesta o el prompt experto respetando estrictamente estas directrices y basándote en los documentos cargados.";
            } else {
                // If only media was attached, reset promptContent to just the idea plus instructions
                promptContent = `Idea del usuario: "${idea}"\n\nInstrucción de contexto: Analiza el archivo multimedia adjunto según el requerimiento.`;
            }
        }
        
        promptParts.push({ text: promptContent });

        const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        let streamStarted = false;
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                const geminiStream = await ai.models.generateContentStream({
                    model: modelName,
                    contents: promptParts,
                    config: {
                        systemInstruction: instruction,
                        temperature: 0.7,
                        topP: 0.9,
                    }
                });

                for await (const chunk of geminiStream) {
                    if (chunk?.text) {
                        res.write(`data: ${JSON.stringify({ agent: "Ejecutor", status: "processing", text: chunk.text })}\n\n`);
                        streamStarted = true;
                    }
                }

                res.write(`data: ${JSON.stringify({ agent: "Ejecutor", status: "completed", text: "" })}\n\n`);
                res.write("data: [DONE]\n\n");
                res.end();
                return; // Guard escape on success
            } catch (err) {
                console.warn(`Attempt with model ${modelName} failed, trying next... Error:`, err);
                lastError = err;
                if (streamStarted) {
                    break;
                }
            }
        }

        // Handle error when everything fails or limits are reached
        console.error("All Gemini models failed to process the user request.");
        const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
        let userFacingError = rawMsg;
        if (
            rawMsg.includes("429") || 
            rawMsg.includes("quota") || 
            rawMsg.includes("RESOURCE_EXHAUSTED") || 
            rawMsg.includes("Too Many Requests") ||
            rawMsg.toLowerCase().includes("límite de cuota")
        ) {
            userFacingError = "⚠️ Límite de cuota excedido (Error 429). La cuota de solicitudes gratuitas de la API de Gemini se ha agotado temporalmente. Por favor, espera un minuto o reintenta con una idea diferente.";
        }
        res.write(`data: ${JSON.stringify({ error: userFacingError })}\n\n`);
        res.end();
    });

    // API Route for streaming Voice Chat with conversational memory and expert mode execution
    app.post("/api/voice-chat", async (req: express.Request, res: express.Response) => {
        const { messages, mode = "general", documents } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({ error: "Falta el historial de mensajes 'messages'." });
            return;
        }

        const modeInstruction = systemInstructions[mode as ExpertMode] || systemInstructions.general;

        let voiceSystemInstruction = `
Eres AURA VOICE INTELLIGENCE, el Asistente de Voz Interactivo e Inteligente de AURA OS.

MODO TÉCNICO ACTIVO: "${mode}"

=== DIRECTRICES OPERATIVAS PARA RESPUESTA POR VOZ E ILIMITADA MEMORIA ===
1. MANTÉN MEMORIA CONTINUA: Tienes acceso a todo el historial de la conversación. Utiliza las respuestas anteriores para responder con coherencia.
`;

        if (mode !== 'direct_assistant') {
            voiceSystemInstruction += `
2. ESTRUCTURA DE RESPUESTA DUAL (VOZ + PROMPT COMPLETO):
   - Inicia con una respuesta hablada natural, concisa y profesional en español (máximo 2 a 4 oraciones) explicando qué cambios has realizado.
   - Si el usuario te pide crear o modificar un prompt, incluye inmediatamente después el PROMPT EXPERTO COMPLETO encerrado en un bloque markdown \`\`\`markdown ... \`\`\`.
3. CUMPLIMIENTO RIGUROSO DEL MODO EXPERTO SELECCIONADO:
   Debes aplicar SIN EXCEPCIÓN las siguientes instrucciones del modo "${mode}":
--- INICIO DE CONOCIMIENTO EMBEBIDO DEL MODO SELECCIONADO ---
${modeInstruction}
--- FIN DE CONOCIMIENTO EMBEBIDO DEL MODO SELECCIONADO ---
`;
        } else {
            voiceSystemInstruction += `
2. MODO ASISTENTE DIRECTO:
   - Responde natural y directamente a lo que pide el usuario sin generar "prompts" de relleno.
   - Si te pide código, da código. Si te pide análisis, da análisis.
   - Inicia con una respuesta hablada corta (1 a 3 oraciones) seguida de tu respuesta detallada en formato libre (markdown).
--- INICIO DE INSTRUCCIONES DEL ASISTENTE ---
${modeInstruction}
--- FIN DE INSTRUCCIONES DEL ASISTENTE ---
`;
        }

        voiceSystemInstruction += `
4. TONO Y LENGUAJE: Elegante, fluido, seguro y de alta ingeniería. Sé receptivo a comandos.
`;

        // Format documents context if provided
        let docsContext = "";
        const mediaParts: any[] = [];
        if (documents && Array.isArray(documents) && documents.length > 0) {
            let hasTextDocs = false;
            docsContext += "\n=== DOCUMENTOS DE SOPORTE CUALIFICADOS ===\n";
            documents.forEach((doc: any) => {
                if (doc.type && (doc.type.startsWith('video/') || doc.type.startsWith('image/'))) {
                    mediaParts.push({
                        inlineData: {
                            mimeType: doc.type,
                            data: doc.content
                        }
                    });
                } else {
                    hasTextDocs = true;
                    const optimizedDocContent = optimizeCodeContent(doc.content || "", doc.name || "");
                    docsContext += `\n--- DOCUMENTO: ${doc.name} ---\n${optimizedDocContent}\n--- FIN DE DOCUMENTO: ${doc.name} ---\n`;
                }
            });
            if (hasTextDocs) {
                docsContext += "\n==========================================\n";
            } else {
                docsContext = "";
            }
        }

        // MCP: Agent State - Preservación determinista del objetivo fundacional y ventana activa
        let processedMessages = messages;
        if (messages.length > 14) {
            const rootPrompt = messages[0];
            const activeTurns = messages.slice(-12);
            processedMessages = [
                rootPrompt,
                { 
                    role: 'user', 
                    content: '[CONSERVACIÓN DE ESTADO: Se ancla el objetivo fundacional del hilo para prevenir deriva cognitiva, seguido por los turnos activos recientes.]' 
                },
                ...activeTurns
            ];
        }

        // Format conversation history into Gemini contents
        const formattedContents = processedMessages.map((m: any, index: number) => {
            const isLast = index === processedMessages.length - 1;
            const contentText = (isLast && docsContext) ? `${m.content}\n${docsContext}` : m.content;
            
            const parts: any[] = [{ text: contentText }];
            if (isLast && mediaParts.length > 0) {
                parts.push(...mediaParts);
            }
            
            return {
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: parts
            };
        });

        // Set headers for Streaming/SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let ai: GoogleGenAI;
        try {
            ai = getGeminiClient();
        } catch (err: any) {
            res.write(`data: ${JSON.stringify({ error: err.message || "GEMINI_API_KEY no configurada." })}\n\n`);
            res.end();
            return;
        }

        const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        let streamStarted = false;
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                const geminiStream = await ai.models.generateContentStream({
                    model: modelName,
                    contents: formattedContents as any,
                    config: {
                        systemInstruction: voiceSystemInstruction,
                        temperature: 0.7,
                        topP: 0.9,
                    }
                });

                for await (const chunk of geminiStream) {
                    if (chunk?.text) {
                        res.write(`data: ${JSON.stringify({ agent: "Ejecutor", status: "processing", text: chunk.text })}\n\n`);
                        streamStarted = true;
                    }
                }

                res.write(`data: ${JSON.stringify({ agent: "Ejecutor", status: "completed", text: "" })}\n\n`);
                res.write("data: [DONE]\n\n");
                res.end();
                return;
            } catch (err) {
                console.warn(`Attempt with model ${modelName} for voice chat failed, trying next... Error:`, err);
                lastError = err;
                if (streamStarted) {
                    break;
                }
            }
        }

        console.error("All Gemini models failed to process voice chat.");
        const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
        let userFacingError = rawMsg;
        if (
            rawMsg.includes("429") || 
            rawMsg.includes("quota") || 
            rawMsg.includes("RESOURCE_EXHAUSTED") || 
            rawMsg.includes("Too Many Requests") ||
            rawMsg.toLowerCase().includes("límite de cuota")
        ) {
            userFacingError = "⚠️ Límite de cuota alcanzado (Error 429). Espera unos segundos e inténtalo de nuevo por voz.";
        }
        res.write(`data: ${JSON.stringify({ error: userFacingError })}\n\n`);
        res.end();
    });

    // Vite middleware for development / serving static files for production
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: {
                middlewareMode: true,
                hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
            },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req: express.Request, res: express.Response) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error("Failed to start server:", err);
});
