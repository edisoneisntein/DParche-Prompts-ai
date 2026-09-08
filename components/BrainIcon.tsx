import React from 'react';
import { Brain } from 'lucide-react';

export const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Brain className={`shrink-0 ${className || 'w-5 h-5'}`} />
);

