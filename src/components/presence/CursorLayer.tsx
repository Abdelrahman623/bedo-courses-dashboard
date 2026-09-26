import React, { useEffect, useRef } from 'react';
import { usePresenceStore } from '../../store/presenceStore';

interface CursorLayerProps {
  /** The SVG element ref from RoadmapGraph — used to translate screen → canvas coords */
  svgRef: React.RefObject<SVGSVGElement | null>;
}

/** Stale cursors are hidden after 4s of no updates */
const STALE_MS = 4000;

// ── Single cursor renderer ────────────────────────────────────────────────────
// We render in SVG so coordinates are in the same space as the D3 canvas.
// The overlay <svg> has the same dimensions and is absolutely positioned on top.

const CursorArrow: React.FC<{
  x: number;
  y: number;
  color: string;
  name: string;
  stale: boolean;
}> = ({ x, y, color, name, stale }) => (
  <g
    transform={`translate(${x}, ${y})`}
    style={{
      opacity: stale ? 0 : 1,
      transition: 'opacity 0.5s ease, transform 0.08s linear',
      pointerEvents: 'none',
    }}
  >
    {/* Arrow pointer */}
    <path
      d="M0 0 L0 18 L5 13 L9 20 L11 19 L7 12 L13 12 Z"
      fill={color}
      stroke="rgba(0,0,0,0.5)"
      strokeWidth={0.8}
      strokeLinejoin="round"
    />
    {/* Name label bubble */}
    <g transform="translate(14, 2)">
      <rect
        x={0}
        y={0}
        width={Math.max(name.length * 6.2 + 10, 40)}
        height={17}
        rx={4}
        fill={color}
        opacity={0.92}
      />
      <text
        x={5}
        y={12}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="10"
        fontWeight="600"
        fill="rgba(0,0,0,0.85)"
      >
        {name.length > 16 ? name.slice(0, 14) + '…' : name}
      </text>
    </g>
  </g>
);

// ── Layer component ───────────────────────────────────────────────────────────
export const CursorLayer: React.FC<CursorLayerProps> = ({ svgRef: _svgRef }) => {
  const { cursors } = usePresenceStore();
  const nowRef = useRef(Date.now());

  // Update "now" every second to drive stale detection without full re-render
  useEffect(() => {
    const id = setInterval(() => { nowRef.current = Date.now(); }, 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();

  if (cursors.size === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      {Array.from(cursors.values()).map(cursor => (
        <CursorArrow
          key={cursor.userId}
          x={cursor.x}
          y={cursor.y}
          color={cursor.color}
          name={cursor.name}
          stale={now - cursor.updatedAt > STALE_MS}
        />
      ))}
    </svg>
  );
};
