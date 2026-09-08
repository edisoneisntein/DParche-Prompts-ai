
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
    message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
    return (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3.5 rounded-xl backdrop-blur-md animate-fade-in shadow-lg flex items-start gap-3" role="alert">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
                <p className="font-bold text-red-300">Aviso del Sistema</p>
                <p className="text-red-200/90 leading-relaxed">{message}</p>
            </div>
        </div>
    );
};

