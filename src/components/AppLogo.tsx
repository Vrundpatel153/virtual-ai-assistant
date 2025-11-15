import React, { useId } from "react";

interface AppLogoProps {
  size?: number;
  className?: string;
}

export const AppLogo = ({ size = 40, className }: AppLogoProps): JSX.Element => {
  const gradientId = `${useId()}-grad`;
  const glowId = `${useId()}-glow`;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="AI Assistant logo"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="12%" y1="12%" x2="88%" y2="88%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="45%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
      <rect width="64" height="64" rx="18" fill={`url(#${glowId})`} />

      <path
        d="M18 44.5L29.8 19h4.4L46 44.5h-5.2l-2.4-5.4H25.6l-2.4 5.4H18zm9.8-9.8h10.4L33 24.3h-0.2l-5 10.4z"
        fill="#fefefe"
        fillOpacity="0.94"
      />
      <path
        d="M48 19c-0.8 0-1.4 0.6-1.4 1.4v23.2c0 0.8 0.6 1.4 1.4 1.4h3.4c0.8 0 1.4-0.6 1.4-1.4V20.4c0-0.8-0.6-1.4-1.4-1.4H48z"
        fill="#c4b5fd"
        fillOpacity="0.9"
      />
      <circle cx="49.7" cy="16.5" r="3" fill="#f8fafc" fillOpacity="0.95" />
    </svg>
  );
};
