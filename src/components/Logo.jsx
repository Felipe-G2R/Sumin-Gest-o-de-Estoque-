import React from 'react';

export default function Logo({ size = 32, showText = true, light = false }) {
  const color = light ? '#FFFFFF' : 'var(--brand-500)';
  const textColor = light ? '#FFFFFF' : 'var(--neutral-900)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      {/* Símbolo Geométrico Sumin (S estilizado com white space) */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path 
          d="M24 8V12H12C10.8954 12 10 12.8954 10 14V14C10 15.1046 10.8954 16 12 16H20C23.3137 16 26 18.6863 26 22V22C26 25.3137 23.3137 28 20 28H8V24H20C21.1046 24 22 23.1046 22 22V22C22 20.8954 21.1046 20 20 20H12C8.68629 20 6 17.3137 6 14V14C6 10.6863 8.68629 8 12 8H24Z" 
          fill={color} 
        />
        {/* Detalhe do Pixel/Lote no centro negativo */}
        <rect x="14" y="14" width="4" height="4" fill="white" fillOpacity="0.3" />
      </svg>

      {showText && (
        <span style={{ 
          fontSize: size * 0.65, 
          fontWeight: 800, 
          letterSpacing: '-0.04em', 
          color: textColor,
          fontFamily: 'var(--font-family)',
          lineHeight: 1
        }}>
          Sumin
        </span>
      )}
    </div>
  );
}
