import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import * as mammoth from 'mammoth';

export interface UploadedDocument {
    name: string;
    content: string;
    size: number;
    type: string;
}

interface DocumentUploadProps {
    documents: UploadedDocument[];
    onDocumentsChange: (docs: UploadedDocument[]) => void;
    isLoading: boolean;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ documents, onDocumentsChange, isLoading }) => {
    const [isDragActive, setIsDragActive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList) => {
        setError(null);
        const textMimeRegex = /\.(txt|md|json|csv|xml|html|css|js|jsx|ts|tsx|py|sql|yaml|yml)$/i;
        const docxRegex = /\.docx$/i;
        const videoMimeRegex = /\.(mp4|webm|mov|ogg)$/i;
        
        let hasVideo = documents.some(d => d.type.startsWith('video/'));
        const newDocuments = [...documents];

        Array.from(files).forEach((file) => {
            const isVideo = videoMimeRegex.test(file.name) || file.type.startsWith('video/');

            // Check file size (limit to 2MB for text, 10MB for video)
            const maxSize = isVideo ? 10 * 1024 * 1024 : 2 * 1024 * 1024;
            if (file.size > maxSize) {
                setError(`El archivo "${file.name}" supera el límite de ${isVideo ? '10 MB' : '2 MB'}.`);
                return;
            }

            // Check if file is already added
            if (newDocuments.some((d) => d.name === file.name)) {
                setError(`El archivo "${file.name}" ya ha sido cargado.`);
                return;
            }

            const isDocx = docxRegex.test(file.name) || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            // Check if file seems supported
            if (!isDocx && !isVideo && !textMimeRegex.test(file.name) && !file.type.startsWith('text/')) {
                setError(`El formato de "${file.name}" no está soportado. Sube archivos de texto, código, markdown, JSON, CSV, Word (.docx) o Video.`);
                return;
            }

            if (isVideo) {
                if (hasVideo) {
                    setError(`Solo se permite subir 1 archivo de video. Omitiendo "${file.name}".`);
                    return;
                }
                hasVideo = true;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    if (dataUrl) {
                        const base64Data = dataUrl.split(',')[1];
                        const newDoc: UploadedDocument = {
                            name: file.name,
                            content: base64Data, // Store base64 data
                            size: file.size,
                            type: file.type || 'video/mp4',
                        };
                        newDocuments.push(newDoc);
                        onDocumentsChange([...newDocuments]);
                    }
                };
                reader.onerror = () => {
                    setError(`No se pudo leer el archivo de video "${file.name}".`);
                };
                reader.readAsDataURL(file);
            } else if (isDocx) {
                // Read .docx using FileReader with ArrayBuffer, then parse with mammoth
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target?.result;
                    if (arrayBuffer instanceof ArrayBuffer) {
                        try {
                            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                            const textContent = result.value;
                            
                            const newDoc: UploadedDocument = {
                                name: file.name,
                                content: textContent,
                                size: file.size,
                                type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            };

                            newDocuments.push(newDoc);
                            onDocumentsChange([...newDocuments]);
                        } catch (err) {
                            console.error("Error parsing docx file with mammoth:", err);
                            setError(`No se pudo extraer el texto del archivo Word "${file.name}".`);
                        }
                    }
                };
                reader.onerror = () => {
                    setError(`No se pudo leer el archivo Word "${file.name}".`);
                };
                reader.readAsArrayBuffer(file);
            } else {
                // Standard text file
                const reader = new FileReader();
                reader.onload = (e) => {
                    const textContent = e.target?.result;
                    if (typeof textContent === 'string') {
                        const newDoc: UploadedDocument = {
                            name: file.name,
                            content: textContent,
                            size: file.size,
                            type: file.type || 'text/plain',
                        };

                        newDocuments.push(newDoc);
                        onDocumentsChange([...newDocuments]);
                    }
                };
                reader.onerror = () => {
                    setError(`No se pudo leer el archivo "${file.name}".`);
                };
                reader.readAsText(file);
            }
        });
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const removeDocument = (name: string) => {
        onDocumentsChange(documents.filter((doc) => doc.name !== name));
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 1;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col gap-4 mt-6">
            <div className="flex justify-between items-center">
                <label className="text-md font-semibold text-aura-text flex items-center gap-2">
                    <span>Cargar documentos de soporte</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded-full border border-indigo-500/30">Opcional</span>
                </label>
                {documents.length > 0 && (
                    <button
                        onClick={() => onDocumentsChange([])}
                        className="text-xs text-red-400 hover:text-red-300 transition-all active:scale-95 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 py-1 px-2.5 rounded-lg"
                        disabled={isLoading}
                    >
                        Limpiar todo
                    </button>
                )}
            </div>

            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`w-full py-6 px-4 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                    isDragActive
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-glow-md scale-[1.01]'
                        : 'border-white/15 bg-black/10 hover:border-indigo-500/40 hover:bg-indigo-500/5'
                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={onButtonClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleChange}
                    accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.sql,.yaml,.yml,.docx,video/*,.mp4,.webm,.mov,.ogg"
                    disabled={isLoading}
                />
                
                <UploadIcon className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? 'text-fuchsia-400' : 'text-indigo-400'}`} />
                
                <div className="text-sm font-medium text-aura-text">
                    Arrastra y suelta tu archivo aquí, o <span className="text-indigo-400 font-semibold underline decoration-2 decoration-indigo-400/30 hover:text-indigo-300 transition-colors">búscalo en tu equipo</span>
                </div>
                <p className="text-xs text-aura-subtext">
                    Soporta TXT, MD, JSON, CSV, código, Word y Video (.mp4, .webm). Máx 1 video de 10 MB. Textos máx. 2 MB.
                </p>
            </div>

            {error && (
                <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg flex items-center gap-2 animate-fade-in">
                    <span className="font-bold text-red-400">⚠️ Error:</span>
                    <span>{error}</span>
                </div>
            )}

            {documents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {documents.map((doc) => {
                        const wordCount = doc.content.trim().split(/\s+/).filter(Boolean).length;
                        return (
                            <div
                                key={doc.name}
                                className="flex items-start justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all hover:shadow-glow-sm"
                            >
                                <div className="flex gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                                        <FileIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-white truncate" title={doc.name}>
                                            {doc.name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-aura-subtext font-mono">
                                            <span>{formatBytes(doc.size)}</span>
                                            <span className="text-white/20">•</span>
                                            <span>{wordCount.toLocaleString()} pal.</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeDocument(doc.name);
                                    }}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-aura-subtext hover:text-white transition-all border border-white/10 hover:border-white/20 active:scale-95 shrink-0"
                                    disabled={isLoading}
                                    title="Quitar documento"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
