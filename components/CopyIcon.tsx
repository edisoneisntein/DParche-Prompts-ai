
import React from 'react';
import { Copy } from 'lucide-react';

export const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Copy className={`shrink-0 ${className || 'w-4 h-4'}`} />
);

