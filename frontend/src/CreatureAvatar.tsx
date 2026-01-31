type AvatarProps = {
  genomeHex: string;
  seedHex?: string;
  level?: number;
  stage?: number;
  size?: number;
  label?: string;
};

function hexToBytes(hex: string): number[] {
  const clean = hex.trim().replace(/^0x/, "");
  if (!clean) return [];
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    out.push(parseInt(clean.slice(i, i + 2).padEnd(2, "0"), 16));
  }
  return out;
}

function byteAt(bytes: number[], idx: number, fallback: number) {
  if (bytes.length === 0) return fallback;
  return bytes[idx % bytes.length];
}

function toColor(h: number, s: number, l: number) {
  return `hsl(${h} ${s}% ${l}%)`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function CreatureAvatar({
  genomeHex,
  seedHex,
  level = 1,
  stage = 0,
  size = 96,
  label,
}: AvatarProps) {
  const bytes = [...hexToBytes(genomeHex), ...hexToBytes(seedHex ?? "")];
  const b0 = byteAt(bytes, 0, 90);
  const b1 = byteAt(bytes, 1, 140);
  const b2 = byteAt(bytes, 2, 200);
  const b3 = byteAt(bytes, 3, 30);
  const b4 = byteAt(bytes, 4, 220);
  const b5 = byteAt(bytes, 5, 60);
  const b6 = byteAt(bytes, 6, 180);
  const b7 = byteAt(bytes, 7, 40);
  const b8 = byteAt(bytes, 8, 210);
  const b9 = byteAt(bytes, 9, 120);
  const b10 = byteAt(bytes, 10, 15);

  const paletteShift = (b9 % 60) - 30;
  const hue = (b0 * 3 + paletteShift) % 360;
  const hue2 = (hue + 90 + b1 + level * 7) % 360;
  const hue3 = (hue + 180 + b2 + stage * 19) % 360;
  const eye = clamp((b3 % 10) + 4, 4, 12);
  const core = clamp((b4 % 18) + 10 + level * 0.6, 10, 26);
  const spikes = 7 + (b5 % 9) + stage;
  const twist = (b6 % 30) - 15 + stage * 3;
  const wobble = (b7 % 14) + 6;
  const aura = clamp(18 + (b8 % 30), 18, 42);
  const variant = (b10 + level + stage) % 3;

  const center = size / 2;
  const radius = size * 0.38;
  const points: string[] = [];
  for (let i = 0; i < spikes; i++) {
    const angle = (Math.PI * 2 * i) / spikes;
    const wave = Math.sin((angle + twist * 0.01) * wobble) * 0.18;
    const r = radius * (0.82 + wave);
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    points.push(`${x},${y}`);
  }

  const gradientId = `grad-${genomeHex}-${size}`.replace(/[^a-zA-Z0-9-_]/g, "");
  const glowId = `glow-${genomeHex}-${size}`.replace(/[^a-zA-Z0-9-_]/g, "");
  const shellId = `shell-${genomeHex}-${size}`.replace(/[^a-zA-Z0-9-_]/g, "");

  return (
    <div className="avatar">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={gradientId} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={toColor(hue2, 70, 65)} />
            <stop offset="60%" stopColor={toColor(hue, 60, 45)} />
            <stop offset="100%" stopColor={toColor(hue3, 60, 25)} />
          </radialGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={toColor(hue2, 85, 75)} stopOpacity="0.7" />
            <stop offset="100%" stopColor={toColor(hue3, 60, 30)} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={shellId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={toColor(hue2, 55, 55)} />
            <stop offset="100%" stopColor={toColor(hue3, 45, 25)} />
          </linearGradient>
        </defs>
        {variant === 0 ? (
          <g opacity="0.7">
            {[...Array(6)].map((_, i) => {
              const angle = (Math.PI * 2 * i) / 6;
              const r1 = radius * 0.4;
              const r2 = radius * 1.05;
              const x1 = center + Math.cos(angle) * r1;
              const y1 = center + Math.sin(angle) * r1;
              const x2 = center + Math.cos(angle) * r2;
              const y2 = center + Math.sin(angle) * r2;
              const ctrl = radius * (1.15 + (b7 % 5) * 0.05);
              const cx = center + Math.cos(angle) * ctrl;
              const cy = center + Math.sin(angle) * ctrl;
              return (
                <path
                  key={`tentacle-${i}`}
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  stroke={toColor(hue2, 60, 50)}
                  strokeWidth={3}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </g>
        ) : null}

        {variant === 1 ? (
          <g opacity="0.8">
            <path
              d={`M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 1} ${
                center - radius
              }`}
              stroke={`url(#${shellId})`}
              strokeWidth={8}
              fill="none"
            />
            <path
              d={`M ${center} ${center - radius * 0.65} A ${radius * 0.65} ${
                radius * 0.65
              } 0 1 1 ${center - 1} ${center - radius * 0.65}`}
              stroke={toColor(hue, 35, 35)}
              strokeWidth={5}
              fill="none"
            />
          </g>
        ) : null}

        {variant === 2 ? (
          <g opacity="0.9">
            <polygon
              points={`${center - radius * 0.35},${center - radius * 0.15} ${
                center - radius * 0.95
              },${center - radius * 0.9} ${center - radius * 0.2},${
                center - radius * 0.4
              }`}
              fill={toColor(hue3, 55, 30)}
            />
            <polygon
              points={`${center + radius * 0.35},${center - radius * 0.15} ${
                center + radius * 0.95
              },${center - radius * 0.9} ${center + radius * 0.2},${
                center - radius * 0.4
              }`}
              fill={toColor(hue3, 55, 30)}
            />
            <path
              d={`M ${center + radius * 0.8} ${center + radius * 0.6} Q ${
                center + radius * 1.2
              } ${center + radius * 1.1} ${center + radius * 0.4} ${
                center + radius * 1.1
              }`}
              stroke={toColor(hue2, 60, 45)}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ) : null}

        <circle cx={center} cy={center} r={radius + aura * 0.15} fill={`url(#${glowId})`} />
        <polygon points={points.join(" ")} fill={toColor(hue3, 38, 22)} opacity="0.65" />
        <circle cx={center} cy={center} r={radius * 0.92} fill={`url(#${gradientId})`} />
        <circle cx={center} cy={center} r={core} fill={toColor(hue2, 80, 70)} />
        <circle cx={center - eye} cy={center - eye / 2} r={eye / 2} fill="#0e1016" />
        <circle cx={center + eye} cy={center - eye / 2} r={eye / 2} fill="#0e1016" />
      </svg>
      {label ? <div className="avatar-label">{label}</div> : null}
    </div>
  );
}
