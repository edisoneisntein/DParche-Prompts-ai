import React from 'react';
import { Sparkles } from 'lucide-react';

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Sparkles className={`shrink-0 ${className || 'w-5 h-5'}`} />
);

