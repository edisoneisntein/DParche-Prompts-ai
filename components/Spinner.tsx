
import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
    <Loader2 className={`animate-spin shrink-0 ${className || 'w-5 h-5'}`} />
);

