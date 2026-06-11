interface PureKauaiLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PureKauaiLogo({ variant = "light", size = "md", className = "" }: PureKauaiLogoProps) {
  const textColor = variant === "light" ? "#EBE2E0" : "#053E50";
  const waveColor = variant === "light" ? "rgba(235,226,224,0.55)" : "rgba(147,124,102,0.5)";

  const sizeMap = {
    sm:  { text: "0.75rem",  wave: 36, tracking: "0.28em", gap: 4  },
    md:  { text: "0.95rem",  wave: 48, tracking: "0.30em", gap: 5  },
    lg:  { text: "1.25rem",  wave: 64, tracking: "0.32em", gap: 7  },
    xl:  { text: "1.65rem",  wave: 80, tracking: "0.34em", gap: 9  },
  };
  const s = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center ${className}`} style={{ gap: s.gap }}>
      <span
        style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontWeight: 300,
          fontSize: s.text,
          letterSpacing: s.tracking,
          textTransform: "uppercase",
          color: textColor,
          lineHeight: 1,
        }}
      >
        Pure Kauai
      </span>
      <svg width={s.wave} height={Math.round(s.wave * 0.14)} viewBox="0 0 48 7" fill="none" aria-hidden="true">
        <path
          d="M0 3.5 C4 1, 8 1, 12 3.5 C16 6, 20 6, 24 3.5 C28 1, 32 1, 36 3.5 C40 6, 44 6, 48 3.5"
          stroke={waveColor}
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
