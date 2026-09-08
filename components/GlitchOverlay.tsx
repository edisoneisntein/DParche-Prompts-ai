import React from 'react';

interface GlitchOverlayProps {
    isActive: boolean;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ isActive }) => {
    if (!isActive) {
        return null;
    }

    return <div className="glitch-overlay"></div>;
};
