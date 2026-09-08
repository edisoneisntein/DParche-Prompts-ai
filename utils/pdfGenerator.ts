import { jsPDF } from 'jspdf';

interface GeneratePDFOptions {
    title?: string;
    modeName?: string;
}

/**
 * Parses markdown-like prompt content and renders a highly polished PDF document.
 * Includes page overflow protection, header/footer styling, code-block background blocks,
 * and elegant typography.
 */
export function generatePromptPDF(markdownText: string, options: GeneratePDFOptions = {}): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2); // 170mm

    let y = 25; // current vertical cursor position in mm
    let pageNum = 1;

    // Helper: Draw header on the current page
    const drawPageHeader = () => {
        doc.saveGraphicsState();
        // Thin elegant top accent bar
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(0, 0, pageWidth, 4, 'F');

        // Small running header text
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('CONSTRUCTOR DE PROMPTS EXPERTOS · AURA OS', margin, 12);
        
        if (options.modeName) {
            doc.text(`MODO: ${options.modeName.toUpperCase()}`, pageWidth - margin, 12, { align: 'right' });
        }

        // Horizontal separator line
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.2);
        doc.line(margin, 14, pageWidth - margin, 14);
        doc.restoreGraphicsState();
    };

    // Helper: Draw footer on the current page
    const drawPageFooter = (currentPage: number) => {
        doc.saveGraphicsState();
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        doc.text(`Exportado el ${dateStr}`, margin, pageHeight - 10);
        doc.text(`Página ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.restoreGraphicsState();
    };

    // Helper: Manage page breaks with headers and footers
    const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
            drawPageFooter(pageNum);
            doc.addPage();
            pageNum++;
            y = 25;
            drawPageHeader();
        }
    };

    // Initial page setup
    drawPageHeader();

    // Render Title Area
    ensureSpace(20);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    const docTitle = options.title || 'Prompt Experto Optimizado';
    const splitTitle = doc.splitTextToSize(docTitle, contentWidth);
    doc.text(splitTitle, margin, y);
    y += (splitTitle.length * 8) + 4;

    // Subtitle / Metadata
    ensureSpace(12);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Fecha de creación: ${new Date().toLocaleDateString('es-ES')}`, margin, y);
    y += 10;

    // Parse the markdown text into sections and lines
    const rawLines = markdownText.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        const trimmed = line.trim();

        // 1. Handle code blocks
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block - render collected lines in a beautiful box
                inCodeBlock = false;
                
                // Set to monospace font for measuring
                doc.setFont('Courier', 'normal');
                doc.setFontSize(8.5);
                
                // Group code into printable sub-blocks if it overflows
                const wrappedCodeLines: string[] = [];
                codeLines.forEach(cl => {
                    const splitCl = doc.splitTextToSize(cl, contentWidth - 8);
                    splitCl.forEach((scl: string) => wrappedCodeLines.push(scl));
                });

                if (wrappedCodeLines.length > 0) {
                    const blockLineHeight = 4.2;
                    const padding = 5;
                    const blockHeight = (wrappedCodeLines.length * blockLineHeight) + (padding * 2);

                    // Check space. If it is a very long codeblock, we will break it down incrementally
                    let currentCodeLineIndex = 0;
                    while (currentCodeLineIndex < wrappedCodeLines.length) {
                        ensureSpace(15); // minimum block size
                        const linesLeftOnPage = Math.floor((pageHeight - 20 - y - (padding * 2)) / blockLineHeight);
                        const linesToPrint = Math.max(2, Math.min(linesLeftOnPage, wrappedCodeLines.length - currentCodeLineIndex));
                        
                        const subBlockHeight = (linesToPrint * blockLineHeight) + (padding * 2);
                        
                        // Draw light slate background box
                        doc.saveGraphicsState();
                        doc.setFillColor(248, 250, 252); // slate-50
                        doc.setDrawColor(226, 232, 240); // slate-200
                        doc.setLineWidth(0.2);
                        doc.roundedRect(margin, y, contentWidth, subBlockHeight, 1.5, 1.5, 'FD');
                        
                        // Draw vertical indicator line
                        doc.setFillColor(99, 102, 241); // indigo-500 accent
                        doc.rect(margin, y, 1.5, subBlockHeight, 'F');
                        
                        // Print code lines
                        doc.setFont('Courier', 'normal');
                        doc.setFontSize(8.5);
                        doc.setTextColor(51, 65, 85); // slate-700
                        
                        let currentY = y + padding + 3;
                        for (let j = 0; j < linesToPrint; j++) {
                            const clText = wrappedCodeLines[currentCodeLineIndex + j];
                            doc.text(clText, margin + 4, currentY);
                            currentY += blockLineHeight;
                        }
                        doc.restoreGraphicsState();

                        y += subBlockHeight + 4;
                        currentCodeLineIndex += linesToPrint;
                    }
                }
                codeLines = [];
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            continue;
        }

        // Skip completely empty lines, but add a small spacing if we just had content
        if (trimmed === '') {
            y += 2.5;
            continue;
        }

        // 2. Handle Headings
        if (trimmed.startsWith('#')) {
            const level = (trimmed.match(/^#+/) || ['#'])[0].length;
            const text = trimmed.replace(/^#+\s*/, '');
            
            // Clean up inline markdown formatting like bold/italic in headings
            const cleanText = text.replace(/\*\*|__/g, '');

            if (level === 1) {
                ensureSpace(16);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(30, 41, 59); // slate-800
                
                const splitH = doc.splitTextToSize(cleanText.toUpperCase(), contentWidth);
                doc.text(splitH, margin, y);
                y += (splitH.length * 5) + 2;

                // Simple thin colored accent line under H1
                doc.saveGraphicsState();
                doc.setDrawColor(129, 140, 248); // indigo-300
                doc.setLineWidth(0.4);
                doc.line(margin, y, margin + 30, y);
                doc.restoreGraphicsState();
                y += 4;
            } else if (level === 2) {
                ensureSpace(12);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(11.5);
                doc.setTextColor(79, 70, 229); // indigo-600
                
                const splitH = doc.splitTextToSize(cleanText, contentWidth);
                doc.text(splitH, margin, y);
                y += (splitH.length * 4.5) + 3;
            } else {
                ensureSpace(10);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(15, 23, 42); // slate-900
                
                const splitH = doc.splitTextToSize(cleanText, contentWidth);
                doc.text(splitH, margin, y);
                y += (splitH.length * 4) + 2;
            }
            continue;
        }

        // 3. Handle Tables
        if (trimmed.startsWith('|')) {
            // Check if it is a separator row like `|---|---|`
            if (trimmed.includes('---')) {
                continue;
            }
            
            ensureSpace(8);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105); // slate-600

            // Split columns and render cleanly
            const cols = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (cols.length > 0) {
                const colWidth = contentWidth / cols.length;
                doc.saveGraphicsState();
                // Alternating row styling or simple frame border
                doc.setDrawColor(241, 245, 249); // very light slate
                doc.setLineWidth(0.15);
                
                cols.forEach((colText, idx) => {
                    const truncatedCol = doc.splitTextToSize(colText, colWidth - 4);
                    doc.text(truncatedCol, margin + (idx * colWidth) + 2, y);
                });
                doc.restoreGraphicsState();
                y += 5.5;
            }
            continue;
        }

        // 4. Handle List Items
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
            ensureSpace(8);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(51, 65, 85); // slate-700

            let isNumbered = false;
            let listContent = trimmed;
            let prefix = '•';

            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                listContent = trimmed.substring(1).trim();
            } else {
                const match = trimmed.match(/^(\d+\.)/);
                if (match) {
                    prefix = match[1];
                    listContent = trimmed.substring(prefix.length).trim();
                    isNumbered = true;
                }
            }

            // Parse inline bold stars inside list items safely
            const cleanListContent = listContent.replace(/\*\*|__/g, '');
            const indentSize = isNumbered ? 8 : 6;
            const splitText = doc.splitTextToSize(cleanListContent, contentWidth - indentSize);

            // Draw bullet/number prefix
            doc.setFont('Helvetica', 'bold');
            doc.text(prefix, margin + 2, y);
            
            // Draw bullet content
            doc.setFont('Helvetica', 'normal');
            doc.text(splitText, margin + indentSize, y);
            y += (splitText.length * 4.5) + 1.5;
            continue;
        }

        // 5. Handle standard paragraphs
        ensureSpace(8);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85); // slate-700

        // Parse inline formatting: strip ** bold tags for neat output
        const cleanParagraph = trimmed.replace(/\*\*|__/g, '');
        const splitParagraph = doc.splitTextToSize(cleanParagraph, contentWidth);
        
        doc.text(splitParagraph, margin, y);
        y += (splitParagraph.length * 4.5) + 3;
    }

    // Finalize the last page's footer
    drawPageFooter(pageNum);

    // Save/Download the PDF safely with formatted name
    const sanitizedTitle = docTitle
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .substring(0, 30);
    
    doc.save(`prompt_experto_${sanitizedTitle || 'aura'}.pdf`);
}
