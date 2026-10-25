/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface TajLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const TajLogo: React.FC<TajLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <img
        src="icon-192.png"
        alt="NH POS Official Logo"
        className="w-full h-full object-contain rounded-full shadow-xs select-none"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.includes('1792729704800')) {
            target.src = 'assets/aistudio/1792729704800__1__bf19ca55.png';
          }
        }}
      />
    </div>
  );
};
