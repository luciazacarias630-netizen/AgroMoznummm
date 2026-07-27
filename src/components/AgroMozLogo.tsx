import React from "react";

interface AgroMozLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "dark" | "white" | "auto";
  className?: string;
}

export const AgroMozLogo: React.FC<AgroMozLogoProps> = ({
  size = "md",
  showText = true,
  textColor = "auto",
  className = "",
}) => {
  // Dimensions
  const containerSizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-11 h-11 rounded-2xl",
    lg: "w-16 h-16 rounded-3xl",
    xl: "w-24 h-24 rounded-[2rem]",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const textColorClass =
    textColor === "white"
      ? "text-white"
      : textColor === "dark"
      ? "text-slate-900"
      : "text-slate-900";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* WHITE ROUNDED SQUIRCLE ICON CONTAINER */}
      <div
        className={`${containerSizes[size]} bg-white p-1.5 shadow-md shadow-slate-950/10 border border-slate-200/80 flex flex-col items-center justify-between shrink-0 select-none overflow-hidden`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* CIRCULAR DOTTED TECH NETWORK RING */}
          <circle
            cx="50"
            cy="42"
            r="28"
            stroke="#15803d"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          {/* NETWORK NODES ON CIRCLE */}
          <circle cx="50" cy="14" r="3" fill="#166534" />
          <circle cx="78" cy="42" r="3" fill="#166534" />
          <circle cx="50" cy="70" r="3" fill="#166534" />
          <circle cx="22" cy="42" r="3" fill="#166534" />
          <circle cx="30" cy="22" r="2.5" fill="#166534" />
          <circle cx="70" cy="22" r="2.5" fill="#166534" />
          <circle cx="70" cy="62" r="2.5" fill="#166534" />
          <circle cx="30" cy="62" r="2.5" fill="#166534" />

          {/* GREEN LEAVES AT THE BASE */}
          <path
            d="M50 56 C40 50 30 52 24 60 C32 68 45 66 50 56 Z"
            fill="#15803d"
          />
          <path
            d="M50 56 C60 50 70 52 76 60 C68 68 55 66 50 56 Z"
            fill="#16a34a"
          />

          {/* GOLDEN WHEAT STALK / EAR */}
          {/* Central Stem */}
          <path
            d="M50 18 L50 62"
            stroke="#d97706"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Wheat Grains / Kernels Left & Right */}
          {/* Top Kernel */}
          <path
            d="M50 18 C46 14 50 10 50 10 C50 10 54 14 50 18 Z"
            fill="#eab308"
          />

          {/* Pair 1 */}
          <ellipse cx="44" cy="24" rx="5" ry="3.5" transform="rotate(-30 44 24)" fill="#eab308" />
          <ellipse cx="56" cy="24" rx="5" ry="3.5" transform="rotate(30 56 24)" fill="#eab308" />

          {/* Pair 2 */}
          <ellipse cx="43" cy="31" rx="5.5" ry="4" transform="rotate(-30 43 31)" fill="#ca8a04" />
          <ellipse cx="57" cy="31" rx="5.5" ry="4" transform="rotate(30 57 31)" fill="#ca8a04" />

          {/* Pair 3 */}
          <ellipse cx="42" cy="38" rx="6" ry="4" transform="rotate(-30 42 38)" fill="#eab308" />
          <ellipse cx="58" cy="38" rx="6" ry="4" transform="rotate(30 58 38)" fill="#eab308" />

          {/* Pair 4 */}
          <ellipse cx="42" cy="45" rx="6" ry="4" transform="rotate(-30 42 45)" fill="#ca8a04" />
          <ellipse cx="58" cy="45" rx="6" ry="4" transform="rotate(30 58 45)" fill="#ca8a04" />

          {/* Pair 5 */}
          <ellipse cx="43" cy="52" rx="5.5" ry="3.5" transform="rotate(-30 43 52)" fill="#eab308" />
          <ellipse cx="57" cy="52" rx="5.5" ry="3.5" transform="rotate(30 57 52)" fill="#eab308" />

          {/* AGROMOZ TEXT INSIDE LOGO BOX */}
          <text
            x="50"
            y="90"
            textAnchor="middle"
            fontSize="18"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            <tspan fill="#15803d">Agro</tspan>
            <tspan fill="#ca8a04">Moz</tspan>
          </text>
        </svg>
      </div>

      {/* AGROMOZ BRAND NAME TEXT BESIDE LOGO (IF REQUESTED) */}
      {showText && (
        <span className={`${textSizes[size]} font-extrabold tracking-tight ${textColorClass}`}>
          <span className="text-emerald-800">Agro</span>
          <span className="text-amber-500">Moz</span>
        </span>
      )}
    </div>
  );
};
