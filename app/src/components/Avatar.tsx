import React, { useMemo } from "react";

interface AvatarProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

const SIZE = 80;

// Helper: Get initials from name
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getHash = (str: string) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
};

const getSeedValue = (hash: number, index: number, max: number) => {
  return (hash >> index) % max;
};

const generateProperties = (name: string) => {
  const hash = getHash(name);
  const baseHue = hash % 360;
  const baseSat = 45 + (hash % 25);
  const baseLum = 45 + (hash % 20);

  const palette = [
    `hsl(${baseHue}, ${baseSat}%, ${baseLum}%)`,
    `hsl(${(baseHue + 30) % 360}, ${baseSat + 5}%, ${baseLum - 10}%)`,
    `hsl(${(baseHue + 60) % 360}, ${baseSat - 5}%, ${baseLum + 10}%)`,
  ];

  return [
    { color: palette[0] },
    {
      color: palette[1],
      translateX: getSeedValue(hash, 1, 20) - 10,
      translateY: getSeedValue(hash, 2, 20) - 10,
      rotate: getSeedValue(hash, 3, 360),
      scale: 1.1 + getSeedValue(hash, 4, 10) / 20,
    },
    {
      color: palette[2],
      translateX: getSeedValue(hash, 5, 20) - 10,
      translateY: getSeedValue(hash, 6, 20) - 10,
      rotate: getSeedValue(hash, 7, 360),
      scale: 1.1 + getSeedValue(hash, 8, 10) / 20,
    },
  ];
};

export const Avatar = ({ name, className = "", children }: AvatarProps) => {
  const properties = useMemo(() => generateProperties(name), [name]);
  const idHash = useMemo(() => getHash(name).toString(36), [name]);

  const maskId = `mask-${idHash}`;
  const filterId = `filter-${idHash}`;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center font-bold ${className}`}
    >
      {/* Background SVG */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>{name}</title>
        <defs>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="6" result="effect1_foregroundBlur" />
          </filter>
        </defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={SIZE}
          height={SIZE}
        >
          <rect width={SIZE} height={SIZE} fill="white" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect width={SIZE} height={SIZE} fill={properties[0].color} />
          <path
            filter={`url(#${filterId})`}
            style={{ mixBlendMode: "overlay" }}
            d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
            fill={properties[1].color}
            transform={`translate(${properties[1].translateX} ${properties[1].translateY}) rotate(${properties[1].rotate} ${SIZE / 2} ${SIZE / 2}) scale(${properties[1].scale})`}
          />
          <path
            filter={`url(#${filterId})`}
            d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
            fill={properties[2].color}
            transform={`translate(${properties[2].translateX} ${properties[2].translateY}) rotate(${properties[2].rotate} ${SIZE / 2} ${SIZE / 2}) scale(${properties[2].scale})`}
          />
        </g>
      </svg>

      <span className="relative z-10">{children || getInitials(name)}</span>
    </div>
  );
};

export default Avatar;
