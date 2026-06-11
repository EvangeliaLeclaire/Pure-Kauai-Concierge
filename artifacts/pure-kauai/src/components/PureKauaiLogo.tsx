interface PureKauaiLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const widthMap = {
  sm:  100,
  md:  140,
  lg:  180,
  xl:  240,
};

export function PureKauaiLogo({ variant = "light", size = "md", className = "" }: PureKauaiLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Pure Kauai"
      width={widthMap[size]}
      draggable={false}
      className={`block ${className}`}
      style={{
        filter: variant === "light" ? "brightness(0) invert(1)" : "none",
        height: "auto",
      }}
    />
  );
}
