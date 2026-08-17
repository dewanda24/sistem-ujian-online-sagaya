import React from "react";

type SagayaLogoProps = {
  variant?: "full" | "icon";
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function SagayaLogo({
  variant = "full",
  theme = "light",
  size = "md",
  className = "",
}: SagayaLogoProps) {
  const isDark = theme === "dark";

  // Size mapping for the hexagon icon
  const iconSizes = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
    xl: "size-20",
  };

  const titleSizes = {
    sm: "text-base leading-tight",
    md: "text-xl leading-tight",
    lg: "text-2xl leading-tight",
    xl: "text-3xl leading-tight",
  };

  const subtitleSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      {/* Hexagonal Stylized "S" Emblem */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-md"
        >
          <defs>
            {/* Hexagon Gradients */}
            <linearGradient id="sagayaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="sagayaGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="sagayaHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer Isometric Hexagon Body */}
          <path
            d="M 50 4 L 90 27 L 90 73 L 50 96 L 10 73 L 10 27 Z"
            fill={isDark ? "url(#sagayaGradDark)" : "url(#sagayaGrad1)"}
            rx="6"
          />

          {/* Subtle 3D Top Facet */}
          <path
            d="M 50 4 L 90 27 L 50 48 L 10 27 Z"
            fill="url(#sagayaHighlight)"
          />

          {/* Stylized Modern "S" Ribbon */}
          <path
            d="M 68 28 C 74 28 78 32 78 37 C 78 44 70 48 58 51 L 42 55 C 32 58 26 62 26 69 C 26 77 34 82 48 82 C 60 82 70 78 74 74 L 68 66 C 64 69 56 72 48 72 C 38 72 36 68 36 65 C 36 61 42 58 52 55 L 66 51 C 78 47 86 42 86 33 C 86 24 76 18 62 18 C 50 18 40 22 34 26 L 40 34 C 46 30 54 28 62 28 Z"
            fill="#FFFFFF"
          />

          {/* Inner Accent Dot / Diamond */}
          <circle cx="50" cy="50" r="3" fill="#93C5FD" opacity="0.8" />
        </svg>
      </div>

      {/* Typography for Full Variant */}
      {variant === "full" && (
        <div className="mt-2 text-center">
          <div className="flex flex-col items-center">
            <span
              className={`font-black tracking-wider uppercase ${titleSizes[size]} ${
                isDark ? "text-white" : "text-[#1E3A8A]"
              }`}
              style={{ letterSpacing: "0.08em" }}
            >
              SAGAYA
            </span>
            <span
              className={`font-extrabold tracking-wide uppercase ${titleSizes[size]} ${
                isDark ? "text-blue-300" : "text-[#2563EB]"
              }`}
              style={{ letterSpacing: "0.05em" }}
            >
              DIGITAL EXAM
            </span>
          </div>
          <p
            className={`font-medium tracking-tight ${subtitleSizes[size]} ${
              isDark ? "text-blue-200/70" : "text-[#64748B]"
            } mt-0.5`}
          >
            Digital Examination Platform
          </p>
        </div>
      )}
    </div>
  );
}
