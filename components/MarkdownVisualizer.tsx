import React, { useState } from 'react';

interface MarkdownVisualizerProps {
    content: string;
}

interface CodeBlockProps {
    language: string;
    codeText: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, codeText }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeText.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 rounded-xl border border-white/10 bg-black/60 overflow-hidden shadow-glow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-mono text-aura-subtext">
                <span>{language.toUpperCase() || 'CODE'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 hover:text-white transition-all border border-white/10 active:scale-95"
                >
                    {copied ? (
                        <span className="text-emerald-400 font-medium">¡Copiado!</span>
                    ) : (
                        <span>Copiar código</span>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-indigo-300 whitespace-pre scrollbar-thin">
                <code>{codeText.trim()}</code>
            </pre>
        </div>
    );
};

export const MarkdownVisualizer: React.FC<MarkdownVisualizerProps> = ({ content }) => {
    if (!content) return null;

    // A lightweight yet highly effective markdown parser that splits the content into blocks
    // and renders them with React components.
    const renderMarkdown = (text: string) => {
        // Split text by code block delimiters: ```
        const parts = text.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                // Code block block of code
                const match = part.match(/```(\w*)\n([\s\S]*?)```/);
                const language = match ? match[1] : '';
                const codeText = match ? match[2] : part.slice(3, -3);

                return (
                    <CodeBlock key={index} language={language} codeText={codeText} />
                );
            } else {
                // General text parsing (headers, lists, bold)
                const lines = part.split('\n');
                let inList = false;
                const elements: React.ReactNode[] = [];
                let currentListItems: React.ReactNode[] = [];

                const pushListIfActive = (key: string | number) => {
                    if (inList && currentListItems.length > 0) {
                        elements.push(
                            <ul key={`list-${key}`} className="list-disc pl-6 my-3 space-y-2 text-aura-text">
                                {currentListItems}
                            </ul>
                        );
                        currentListItems = [];
                        inList = false;
                    }
                };

                lines.forEach((line, lineIdx) => {
                    const trimmedLine = line.trim();

                    // Headers
                    if (trimmedLine.startsWith('### ')) {
                        pushListIfActive(lineIdx);
                        const headingText = trimmedLine.slice(4);
                        elements.push(
                            <h4 key={lineIdx} className="text-base sm:text-lg font-bold text-aura-glow mt-5 mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-aura-glow"></span>
                                {parseInlineMarkdown(headingText)}
                            </h4>
                        );
                    } else if (trimmedLine.startsWith('## ')) {
                        pushListIfActive(lineIdx);
                        const headingText = trimmedLine.slice(3);
                        elements.push(
                            <h3 key={lineIdx} className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300 mt-6 mb-3">
                                {parseInlineMarkdown(headingText)}
                            </h3>
                        );
                    } else if (trimmedLine.startsWith('# ')) {
                        pushListIfActive(lineIdx);
                        const headingText = trimmedLine.slice(2);
                        elements.push(
                            <h2 key={lineIdx} className="text-xl sm:text-2xl font-extrabold text-white mt-8 mb-4 border-b border-white/10 pb-2">
                                {parseInlineMarkdown(headingText)}
                            </h2>
                        );
                    }
                    // Bullet styles: * or -
                    else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                        inList = true;
                        const itemText = trimmedLine.slice(2);
                        currentListItems.push(
                            <li key={lineIdx} className="text-sm sm:text-base text-aura-text">
                                {parseInlineMarkdown(itemText)}
                            </li>
                        );
                    }
                    // Blockquotes: > 
                    else if (trimmedLine.startsWith('> ')) {
                        pushListIfActive(lineIdx);
                        const quoteText = trimmedLine.slice(2);
                        elements.push(
                            <blockquote key={lineIdx} className="my-4 pl-4 border-l-4 border-fuchsia-400 bg-white/5 py-2.5 pr-3 rounded-r-lg italic text-sm text-indigo-200">
                                {parseInlineMarkdown(quoteText)}
                            </blockquote>
                        );
                    }
                    // Horizontal rules: --- or ***
                    else if (trimmedLine === '---' || trimmedLine === '***') {
                        pushListIfActive(lineIdx);
                        elements.push(
                            <hr key={lineIdx} className="my-6 border-t border-white/10" />
                        );
                    }
                    // Empty lines
                    else if (!trimmedLine) {
                        pushListIfActive(lineIdx);
                    }
                    // Normal text
                    else {
                        pushListIfActive(lineIdx);
                        elements.push(
                            <p key={lineIdx} className="text-sm sm:text-base text-aura-text leading-relaxed mb-3">
                                {parseInlineMarkdown(trimmedLine)}
                            </p>
                        );
                    }
                });

                pushListIfActive('end');
                return <div key={index}>{elements}</div>;
            }
        });
    };

    // Helper to evaluate basic regex for bold (**text**) and inline code (`code`)
    const parseInlineMarkdown = (text: string) => {
        // Split by bold patterns or inline code: **word** or `code`
        const boldRegex = /(\*\*.*?\*\*|`.*?`)/g;
        const parts = text.split(boldRegex);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={index} className="font-semibold text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            } else if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code key={index} className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono text-fuchsia-300">
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return part;
        });
    };

    return <div className="space-y-1">{renderMarkdown(content)}</div>;
};
