import React from 'react';
import { Clapperboard } from 'lucide-react';

export const TheaterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Clapperboard className={`shrink-0 ${className || 'w-5 h-5'}`} />
);

