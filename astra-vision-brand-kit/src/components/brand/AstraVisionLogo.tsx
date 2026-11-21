import React from "react";

export interface AstraVisionLogoProps {
  variant?: "dark" | "light";
  iconOnly?: boolean;
  className?: string;
  height?: number;
}

/**
 * Astra Vision Interlocking AV Monogram & Lockup
 * - Dark mode (default): Pure White (#FFFFFF) 'A' + Electric Indigo (#4F46E5) 'V'
 * - Light mode:          Deep Obsidian (#07080D) 'A' + Electric Indigo (#4F46E5) 'V'
 */
export function AstraVisionLogo({
  variant = "dark",
  iconOnly = false,
  className = "",
  height = 28,
}: AstraVisionLogoProps) {
  const aInk = variant === "dark" ? "#FFFFFF" : "#07080D";
  const vIndigo = "#4F46E5";

  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        height={height}
        width={height}
        fill="none"
        className={className}
        aria-label="Astra Vision"
      >
        <polygon points="39.0,0.0 63.2,46.0 47.8,46.0 39.0,29.2 15.0,76.0 0.0,76.0" fill={aInk} />
        <polygon points="22.0,76.0 34.0,52.6 46.0,76.0" fill={aInk} />
        <polygon points="61.0,100.0 36.8,54.0 52.2,54.0 61.0,70.8 85.0,24.0 100.0,24.0" fill={vIndigo} />
        <polygon points="78.0,24.0 66.0,47.4 54.0,24.0" fill={vIndigo} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 490 100"
      height={height}
      width={Math.round(height * 4.9)}
      fill="none"
      className={className}
      aria-label="Astra Vision"
    >
      <polygon points="39.0,0.0 63.2,46.0 47.8,46.0 39.0,29.2 15.0,76.0 0.0,76.0" fill={aInk} />
      <polygon points="22.0,76.0 34.0,52.6 46.0,76.0" fill={aInk} />
      <polygon points="61.0,100.0 36.8,54.0 52.2,54.0 61.0,70.8 85.0,24.0 100.0,24.0" fill={vIndigo} />
      <polygon points="78.0,24.0 66.0,47.4 54.0,24.0" fill={vIndigo} />
      <text
        x="122"
        y="70"
        fontFamily="Inter, 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="56"
        fontWeight="600"
        letterSpacing="-0.025em"
        fill={aInk}
      >
        Astra Vision
      </text>
    </svg>
  );
}

export default AstraVisionLogo;
