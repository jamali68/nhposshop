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
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold Gradient */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="25%" stopColor="#E5B94E" />
            <stop offset="50%" stopColor="#FAF1B5" />
            <stop offset="75%" stopColor="#C99726" />
            <stop offset="100%" stopColor="#8C6212" />
          </linearGradient>

          {/* Deep Navy Radial */}
          <radialGradient id="navyBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1B2A4A" />
            <stop offset="70%" stopColor="#0E192E" />
            <stop offset="100%" stopColor="#080F1D" />
          </radialGradient>

          {/* Shimmer Filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Dark Circular Base */}
        <circle cx="100" cy="100" r="95" fill="url(#navyBg)" stroke="url(#goldGradient)" strokeWidth="4" />

        {/* Intricate Golden Outer Ring with dashed border */}
        <circle cx="100" cy="100" r="88" stroke="url(#goldGradient)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
        <circle cx="100" cy="100" r="84" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.6" />

        {/* Crown at top */}
        <g id="crown" transform="translate(68, 20)">
          {/* Crown Base */}
          <path
            d="M5 28 L59 28 L54 12 L43 21 L32 6 L21 21 L10 12 Z"
            fill="url(#goldGradient)"
            stroke="#8C6212"
            strokeWidth="1"
          />
          {/* Crown jewels */}
          <circle cx="32" cy="5" r="2.5" fill="#FFF" />
          <circle cx="10" cy="11" r="2" fill="#FFF" />
          <circle cx="54" cy="11" r="2" fill="#FFF" />
          <circle cx="32" cy="18" r="2" fill="#C99726" />
          <circle cx="21" cy="23" r="1.5" fill="#C99726" />
          <circle cx="43" cy="23" r="1.5" fill="#C99726" />
          <rect x="7" y="27" width="50" height="3" rx="1.5" fill="url(#goldGradient)" />
        </g>

        {/* Inner Frame */}
        <rect
          x="35"
          y="58"
          width="130"
          height="80"
          rx="14"
          fill="rgba(14, 25, 46, 0.7)"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
        />

        {/* English Brand - NH POS SHOP */}
        <g transform="translate(100, 102)" textAnchor="middle">
          <text
            x="0"
            y="0"
            fill="url(#goldGradient)"
            fontFamily="'Poppins', 'Montserrat', 'Segoe UI', sans-serif"
            fontSize="18"
            fontWeight="900"
            letterSpacing="1"
            style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}
          >
            NH POS SHOP
          </text>
        </g>

        {/* Golden Banner for "RETAIL & CLOUD" */}
        <g transform="translate(30, 116)">
          {/* Ribbon shape */}
          <path
            d="M10 12 L130 12 L138 24 L130 36 L10 36 L2 24 Z"
            fill="url(#goldGradient)"
            stroke="#7C5209"
            strokeWidth="1"
            filter="url(#softGlow)"
          />
          <text
            x="70"
            y="27"
            fill="#0E192E"
            textAnchor="middle"
            fontFamily="'Poppins', 'Segoe UI', Tahoma, sans-serif"
            fontSize="9"
            fontWeight="800"
            letterSpacing="1"
          >
            RETAIL & CLOUD
          </text>
        </g>

        {/* Bottom Icons: Grocery Basket & Smartphone */}
        {showSubtitle && (
          <g transform="translate(80, 158)" fill="url(#goldGradient)" stroke="url(#goldGradient)">
            {/* Shopping Basket */}
            <g transform="scale(0.85)">
              <path d="M0 6 L18 6 L15 16 L3 16 Z" fill="none" strokeWidth="1.5" />
              <path d="M3 6 L9 0 L15 6" fill="none" strokeWidth="1.5" />
              <line x1="6" y1="9" x2="12" y2="9" strokeWidth="1" />
              <line x1="5" y1="12" x2="13" y2="12" strokeWidth="1" />
            </g>

            {/* Mobile Phone */}
            <g transform="translate(24, -2) scale(0.85)">
              <rect x="0" y="0" width="12" height="19" rx="2" fill="none" strokeWidth="1.5" />
              <circle cx="6" cy="16" r="0.8" fill="url(#goldGradient)" />
              <line x1="4" y1="2" x2="8" y2="2" strokeWidth="1" />
              {/* Wi-Fi / Signal waves */}
              <path d="M14 4 A4 4 0 0 1 14 10" fill="none" strokeWidth="1" strokeLinecap="round" />
              <path d="M16 2 A7 7 0 0 1 16 12" fill="none" strokeWidth="1" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
