import type { SVGProps } from "react";

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 180 50"
    width="180"
    height="50"
    {...props}
  >
    {/* Shadow Layer */}
    <text
      x="91"
      y="37"
      fontFamily="'PT Sans', sans-serif"
      fontSize="38"
      fontWeight="bold"
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      opacity="0.5"
    >
      <tspan>EYIR</tspan>
      <tspan dx="5">POS</tspan>
    </text>
    {/* Main Text Layer */}
    <text
      x="90"
      y="35"
      fontFamily="'PT Sans', sans-serif"
      fontSize="38"
      fontWeight="bold"
      textAnchor="middle"
    >
      <tspan fill="hsl(var(--primary))">EYIR</tspan>
      <tspan fill="hsl(var(--accent))" dx="5">POS</tspan>
    </text>
  </svg>
);

export default Logo;
