
import React from 'react';
import { Wand2 } from 'lucide-react';

export const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Wand2 className={`shrink-0 ${className || 'w-6 h-6'}`} />
);

